import uuid

import structlog
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.chunk import Chunk
from app.models.document import Document
from app.rag.retriever import WorkspaceRetriever
from app.schemas.search import SearchChunkMatch, SearchDocumentResult, SearchResponse

logger = structlog.get_logger(__name__)


class SearchService:
    """Service layer orchestrating document content and metadata search across workspaces."""

    def __init__(
        self,
        db: AsyncSession,
        retriever: WorkspaceRetriever,
    ) -> None:
        self._db = db
        self._retriever = retriever

    async def search(
        self,
        query: str,
        workspace_id: uuid.UUID,
        search_type: str = "semantic",
        limit: int = 20,
    ) -> SearchResponse:
        """
        Main entry point for searching document content.
        Supports both vector 'semantic' search and SQL-based 'keyword' pattern matching.
        """
        log = logger.bind(workspace_id=str(workspace_id), query=query, type=search_type)
        log.info("Executing workspace search")

        if search_type == "semantic":
            return await self._semantic_search(query, workspace_id, limit)
        else:
            return await self._keyword_search(query, workspace_id, limit)

    async def _semantic_search(
        self,
        query: str,
        workspace_id: uuid.UUID,
        limit: int,
    ) -> SearchResponse:
        """Runs vector embedding search and groups matches under parent documents."""
        # 1. Retrieve raw matches from vector store
        vector_results = await self._retriever.retrieve(
            query=query,
            workspace_id=workspace_id,
            top_k=limit,
        )

        if not vector_results:
            return SearchResponse(query=query, search_type="semantic", results=[])

        # 2. Extract unique document IDs from matches
        doc_ids = set()
        for r in vector_results:
            doc_id_str = r.metadata.get("document_id")
            if doc_id_str:
                try:
                    doc_ids.add(uuid.UUID(doc_id_str))
                except ValueError:
                    pass

        # 3. Retrieve parent document models
        documents_dict = {}
        if doc_ids:
            stmt = select(Document).where(Document.id.in_(doc_ids))
            db_res = await self._db.execute(stmt)
            for doc in db_res.scalars().all():
                documents_dict[doc.id] = doc

        # 4. Group matches by document
        grouped_results: dict[uuid.UUID, list[SearchChunkMatch]] = {}
        for r in vector_results:
            doc_id_str = r.metadata.get("document_id")
            if not doc_id_str:
                continue
            try:
                doc_id = uuid.UUID(doc_id_str)
            except ValueError:
                continue

            if doc_id not in grouped_results:
                grouped_results[doc_id] = []

            # Deduplicate or add chunks
            grouped_results[doc_id].append(
                SearchChunkMatch(
                    chunk_id=str(r.id) if r.id else str(uuid.uuid4()),
                    content=r.document,
                    score=float(r.score),
                    page_number=r.metadata.get("page_number"),
                    sheet_name=r.metadata.get("sheet_name"),
                    slide_number=r.metadata.get("slide_number"),
                    chunk_index=r.metadata.get("chunk_index"),
                )
            )

        # 5. Assemble final response
        results = []
        for doc_id, matches in grouped_results.items():
            doc = documents_dict.get(doc_id)
            if not doc:
                continue

            results.append(
                SearchDocumentResult(
                    document_id=doc.id,
                    filename=doc.filename,
                    file_type=doc.file_type,
                    file_size=doc.file_size,
                    s3_key=doc.s3_key,
                    matches=matches,
                )
            )

        return SearchResponse(query=query, search_type="semantic", results=results)

    async def _keyword_search(
        self,
        query: str,
        workspace_id: uuid.UUID,
        limit: int,
    ) -> SearchResponse:
        """Runs standard SQL text matching and groups matches under parent documents."""
        # Find chunks containing query pattern
        query_pattern = f"%{query}%"
        stmt = (
            select(Chunk)
            .join(Document)
            .where(
                Document.workspace_id == workspace_id,
                Document.deleted_at.is_(None),
                or_(
                    Chunk.content.ilike(query_pattern),
                    Document.filename.ilike(query_pattern)
                )
            )
            .options(selectinload(Chunk.document))
            .limit(limit)
        )

        db_res = await self._db.execute(stmt)
        chunks = db_res.scalars().all()

        # Group matches by document
        grouped_docs: dict[uuid.UUID, Document] = {}
        grouped_matches: dict[uuid.UUID, list[SearchChunkMatch]] = {}

        for chunk in chunks:
            doc = chunk.document
            if doc.id not in grouped_docs:
                grouped_docs[doc.id] = doc
                grouped_matches[doc.id] = []

            # For SQL matches, we assign a placeholder score of 1.0 (or similar)
            grouped_matches[doc.id].append(
                SearchChunkMatch(
                    chunk_id=str(chunk.id),
                    content=chunk.content,
                    score=1.0,
                    page_number=chunk.metadata_.get("page_number"),
                    sheet_name=chunk.metadata_.get("sheet_name"),
                    slide_number=chunk.metadata_.get("slide_number"),
                    chunk_index=chunk.chunk_index,
                )
            )

        results = []
        for doc_id, doc in grouped_docs.items():
            results.append(
                SearchDocumentResult(
                    document_id=doc.id,
                    filename=doc.filename,
                    file_type=doc.file_type,
                    file_size=doc.file_size,
                    s3_key=doc.s3_key,
                    matches=grouped_matches[doc_id],
                )
            )

        return SearchResponse(query=query, search_type="keyword", results=results)
