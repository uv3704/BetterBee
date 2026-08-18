"""
BetterBee — Celery Async Document Processing Task.
"""

import asyncio
import uuid

import structlog

from app.workers.celery_app import celery_app

logger = structlog.get_logger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def process_document(self, document_id: str) -> None:
    """
    Celery background worker task to process a confirmed document upload.
    Downloads the document, parses it, chunks it, generates embeddings,
    and inserts it into PostgreSQL and ChromaDB.
    """
    log = logger.bind(document_id=document_id)
    log.info("Celery document ingestion task triggered")

    from app.db.engine import async_session_factory
    from app.repositories.document_repo import DocumentRepository
    from app.repositories.workspace_repo import WorkspaceRepository
    from app.services.document_service import DocumentService
    from app.services.storage_service import get_storage_provider

    async def _async_ingest():
        async with async_session_factory() as session:
            try:
                storage_provider = get_storage_provider()
                document_repo = DocumentRepository(session)
                workspace_repo = WorkspaceRepository(session)
                document_service = DocumentService(
                    document_repo,
                    workspace_repo,
                    storage_provider,
                )

                await document_service.ingest_document(uuid.UUID(document_id))
                await session.commit()
            except Exception as e:
                # Rollback on database errors
                await session.rollback()
                log.error("Celery async database session error during ingestion", error=str(e))
                raise

    try:
        # Run the async ingestion loop inside Celery's sync execution environment
        asyncio.run(_async_ingest())
    except Exception as exc:
        log.error("Ingestion task failed, attempting retry", error=str(exc))
        try:
            self.retry(exc=exc)
        except Exception:
            log.critical("Celery task retries exhausted for document")
            raise
