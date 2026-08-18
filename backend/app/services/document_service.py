"""
BetterBee — Document Service.
"""

import os
import uuid
from datetime import UTC, datetime
from typing import Any

import structlog

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.document import Document
from app.repositories.document_repo import DocumentRepository
from app.repositories.workspace_repo import WorkspaceRepository
from app.services.storage_service import StorageProvider

logger = structlog.get_logger(__name__)


class DocumentService:
    """Service layer handling business logic for Documents and file ingestion."""

    def __init__(
        self,
        document_repo: DocumentRepository,
        workspace_repo: WorkspaceRepository,
        storage_provider: StorageProvider,
    ) -> None:
        self._document_repo = document_repo
        self._workspace_repo = workspace_repo
        self._storage_provider = storage_provider

    async def _verify_workspace_access(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> None:
        """Verify that the user owns or has access to the workspace."""
        workspace = await self._workspace_repo.get_by_id(workspace_id)
        if not workspace:
            raise NotFoundError("Workspace", str(workspace_id))
        if workspace.owner_id != user_id:
            raise ForbiddenError("You do not have access to this workspace")

    async def initiate_upload(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        filename: str,
        file_size: int,
        file_type: str,
        base_url: str | None = None,
    ) -> tuple[Document, str]:
        """
        Initiate document upload. Records metadata and returns a pre-signed upload URL.
        """
        await self._verify_workspace_access(workspace_id, user_id)

        # Generate a unique storage key
        document_uuid = uuid.uuid4()
        extension = os.path.splitext(filename)[1]
        s3_key = f"workspaces/{workspace_id}/documents/{document_uuid}{extension}"

        # Generate upload URL
        upload_url = await self._storage_provider.generate_upload_url(s3_key, base_url=base_url)

        # Save document placeholder in DB
        document = await self._document_repo.create(
            id=document_uuid,
            workspace_id=workspace_id,
            filename=filename,
            file_type=file_type,
            file_size=file_size,
            s3_key=s3_key,
            status="uploaded",  # Transitions to processing upon confirmation
            chunk_count=0,
            uploaded_by=user_id,
        )

        workspace_obj = await self._workspace_repo.get_by_id(workspace_id)
        workspace_name = workspace_obj.name if workspace_obj else "Unknown"
        size_mb = file_size / (1024 * 1024)
        size_str = f"{size_mb:.1f} MB" if size_mb >= 0.1 else f"{file_size / 1024:.1f} KB"
        print(f"\n📄 Upload\n"
              f"────────────────────────────\n"
              f"File      {filename}\n"
              f"Size      {size_str}\n"
              f"Workspace {workspace_name}")

        logger.info(
            "Document upload initiated",
            document_id=document.id,
            filename=filename,
            s3_key=s3_key,
        )
        return document, upload_url

    async def confirm_upload(
        self,
        document_id: uuid.UUID,
        user_id: uuid.UUID,
        background_tasks: Any = None,
    ) -> Document:
        """
        Confirm that a document has been successfully uploaded to storage.
        Triggers async background processing based on ASYNC_MODE.
        """
        document = await self._document_repo.get_by_id(document_id)
        if not document:
            raise NotFoundError("Document", str(document_id))

        await self._verify_workspace_access(document.workspace_id, user_id)

        logger.info("Document upload confirmed", document_id=document_id)

        from app.core.config import get_settings
        settings = get_settings()

        if settings.ASYNC_MODE == "celery":
            from app.workers.tasks.process_document import process_document
            # Trigger Celery async task
            process_document.delay(str(document_id))
            document = await self._document_repo.update(document, status="uploaded")
        else:
            # Use FastAPI BackgroundTasks with an independent async DB session
            if background_tasks:
                background_tasks.add_task(_run_background_ingestion, document_id)
                document = await self._document_repo.update(document, status="uploaded")
            else:
                # Synchronous fallback if run outside web request
                logger.warning("Running ingestion synchronously (no background task context)")
                await self.ingest_document(document_id)
                await self._document_repo._session.refresh(document)

        return document

    async def ingest_document(self, document_id: uuid.UUID) -> None:
        """
        Ingestion pipeline: Downloads, parses, chunks, embeds, and saves vectors.
        """
        log = logger.bind(document_id=str(document_id))

        document = await self._document_repo.get_by_id(document_id)
        if not document:
            log.error("Document not found for ingestion")
            return

        try:
            # Update status to processing
            document = await self._document_repo.update(document, status="processing")
            log.info("Starting document ingestion processing", filename=document.filename)

            # 1. Download file bytes
            content_bytes = await self._storage_provider.get_object(document.s3_key)

            # 2. Parse file bytes
            from app.rag.parser import ParserFactory
            parser = ParserFactory.get_parser(document.file_type)
            raw_text, page_metadata = parser.parse(content_bytes)

            if not raw_text.strip():
                raise ValueError("No text could be extracted from this document")

            # 3. Chunk text
            from app.rag.chunker import Chunker
            chunker = Chunker()
            chunks = chunker.split_text(raw_text, page_metadata)

            if not chunks:
                raise ValueError("Document split yielded 0 chunks")

            pages = len(page_metadata) if page_metadata else 1
            chunks_count = len(chunks)
            print(f"✂ Parsing\n"
                  f"────────────────────────────\n"
                  f"Pages     {pages}\n"
                  f"Chunks    {chunks_count}")

            # 4. Generate embeddings
            from app.rag.factory import EmbeddingFactory
            embedding_provider = EmbeddingFactory.create()

            chunk_texts = [c["content"] for c in chunks]

            import time
            start_embed = time.perf_counter()
            embeddings = await embedding_provider.embed_batch(chunk_texts)
            embed_time = time.perf_counter() - start_embed
            embed_time_ms = int(embed_time * 1000)

            embed_model_name = getattr(embedding_provider, 'model', 'BAAI/bge-small-en-v1.5')
            if hasattr(embedding_provider, 'model_name') and isinstance(embedding_provider.model_name, str):
                embed_model_name = embedding_provider.model_name
            if "/" in embed_model_name:
                embed_model_name = embed_model_name.split("/")[-1]

            print(f"🧠 Embeddings\n"
                  f"────────────────────────────\n"
                  f"Model     {embed_model_name}\n"
                  f"Vectors   {chunks_count}\n"
                  f"Time      {embed_time_ms} ms")

            # 5. Save chunks to DB & ChromaDB
            from app.rag.factory import VectorStoreFactory
            from app.repositories.chunk_repo import ChunkRepository

            chunk_repo = ChunkRepository(self._document_repo._session)
            vector_store = VectorStoreFactory.create()

            chroma_ids = []
            chroma_documents = []
            chroma_metadatas = []
            chroma_embeddings = []

            for idx, chunk_data in enumerate(chunks):
                chunk_uuid = uuid.uuid4()
                chroma_id = f"chunk_{document_id}_{idx}"

                # Save metadata to Postgres
                await chunk_repo.create(
                    id=chunk_uuid,
                    document_id=document_id,
                    chunk_index=chunk_data["chunk_index"],
                    content=chunk_data["content"],
                    token_count=chunk_data["token_count"],
                    metadata_=chunk_data["metadata"],
                    chroma_id=chroma_id,
                )

                # Collect for ChromaDB
                chroma_ids.append(chroma_id)
                chroma_documents.append(chunk_data["content"])

                # Flat metadata for ChromaDB
                flat_meta = {
                    "document_id": str(document_id),
                    "workspace_id": str(document.workspace_id),
                    "chunk_index": chunk_data["chunk_index"],
                    "filename": document.filename,
                }
                for k, v in chunk_data["metadata"].items():
                    if isinstance(v, (str, int, float, bool)):
                        flat_meta[k] = v

                chroma_metadatas.append(flat_meta)
                chroma_embeddings.append(embeddings[idx])

            # Batch insert vectors to ChromaDB workspace collection
            collection_name = str(document.workspace_id)
            await vector_store.add_documents(
                collection_name=collection_name,
                ids=chroma_ids,
                documents=chroma_documents,
                embeddings=chroma_embeddings,
                metadatas=chroma_metadatas,
            )

            workspace_obj = await self._workspace_repo.get_by_id(document.workspace_id)
            workspace_slug = workspace_obj.slug if workspace_obj else collection_name
            print(f"🗂 Index\n"
                  f"────────────────────────────\n"
                  f"Collection workspace_{workspace_slug}\n"
                  f"Status     Success\n")

            # Update document status to ready
            await self._document_repo.update(
                document,
                status="ready",
                chunk_count=len(chunks),
                error_message=None,
            )
            log.info("Document ingestion successful", chunks=len(chunks))

        except Exception as e:
            log.error("Document ingestion pipeline failed", error=str(e))
            await self._document_repo.update(
                document,
                status="failed",
                error_message=str(e)[:1024],
            )


    async def list_documents_for_workspace(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        *,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[Document], int]:
        """List all documents uploaded to a workspace."""
        await self._verify_workspace_access(workspace_id, user_id)
        return await self._document_repo.list_by_workspace(
            workspace_id,
            offset=offset,
            limit=limit,
        )

    async def get_document_by_id(self, document_id: uuid.UUID, user_id: uuid.UUID) -> Document:
        """Retrieve a specific document, validating user access."""
        document = await self._document_repo.get_by_id(document_id)
        if not document or document.deleted_at is not None:
            raise NotFoundError("Document", str(document_id))

        await self._verify_workspace_access(document.workspace_id, user_id)
        return document

    async def get_document_download_url(
        self,
        document_id: uuid.UUID,
        user_id: uuid.UUID,
        base_url: str | None = None,
    ) -> str:
        """Generate a pre-signed download URL for a document."""
        document = await self.get_document_by_id(document_id, user_id)
        return await self._storage_provider.generate_download_url(document.s3_key, base_url=base_url)

    async def delete_document(self, document_id: uuid.UUID, user_id: uuid.UUID) -> None:
        """Soft delete a document from the workspace, delete its file from S3 storage, and delete its vectors from ChromaDB."""
        document = await self.get_document_by_id(document_id, user_id)

        # 1. Delete raw file from S3 / storage provider
        try:
            if document.s3_key:
                await self._storage_provider.delete_object(document.s3_key)
                logger.info("Deleted document file from S3 storage", s3_key=document.s3_key, document_id=str(document_id))
        except Exception as e:
            logger.warning("Failed to delete object from storage during document deletion", error=str(e), s3_key=document.s3_key)

        # 2. Delete vectors from ChromaDB collection
        try:
            from app.rag.factory import VectorStoreFactory
            vector_store = VectorStoreFactory.create()
            await vector_store.delete(
                collection_name=str(document.workspace_id),
                document_id=str(document.id),
            )
            logger.info("Deleted document vectors from vector store", document_id=str(document_id))
        except Exception as e:
            logger.warning("Failed to delete vectors from vector store during document deletion", error=str(e))

        # 3. Soft delete in database
        logger.info("Soft-deleting document in database", document_id=document_id)
        await self._document_repo.update(
            document,
            deleted_at=datetime.now(UTC),
        )


async def _run_background_ingestion(document_id: uuid.UUID) -> None:
    """Independent background runner that creates its own session to prevent closed-session errors."""
    from app.db.engine import async_session_factory
    from app.services.storage_service import get_storage_provider

    async with async_session_factory() as session:
        try:
            document_repo = DocumentRepository(session)
            workspace_repo = WorkspaceRepository(session)
            storage_provider = get_storage_provider()
            service = DocumentService(document_repo, workspace_repo, storage_provider)
            await service.ingest_document(document_id)
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error("Background ingestion runner failed", document_id=str(document_id), error=str(e))

