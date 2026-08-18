import asyncio

import structlog
from fastapi import APIRouter
from sqlalchemy import func, select

from app.core.deps import CurrentUser, DbSession
from app.models.chat import ChatSession, Message
from app.models.document import Document
from app.models.workspace import Workspace
from app.schemas.analytics import (
    DocumentStatusCount,
    RAGAnalyticsResponse,
    RecentQuery,
    RecentUpload,
)

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get("", response_model=RAGAnalyticsResponse)
async def get_rag_analytics(
    current_user: CurrentUser,
    db: DbSession,
) -> RAGAnalyticsResponse:
    """Fetch aggregated RAG usage, document processing statistics, and recent activity log."""
    user_id = current_user.id

    # 1. Total Workspaces
    workspaces_query = select(func.count(Workspace.id)).where(Workspace.owner_id == user_id)

    # 2. Document Metrics (Total count, total size, total chunks)
    docs_query = (
        select(
            func.count(Document.id),
            func.sum(Document.file_size),
            func.sum(Document.chunk_count),
        )
        .join(Workspace)
        .where(
            Workspace.owner_id == user_id,
            Document.deleted_at.is_(None),
        )
    )

    # 3. Document Statuses Breakdown
    status_query = (
        select(Document.status, func.count(Document.id))
        .join(Workspace)
        .where(
            Workspace.owner_id == user_id,
            Document.deleted_at.is_(None),
        )
        .group_by(Document.status)
    )

    # 4. Total Queries (Count of messages where role == 'user')
    queries_query = (
        select(func.count(Message.id))
        .join(ChatSession)
        .where(ChatSession.user_id == user_id)
        .where(Message.role == "user")
    )

    # 5. Total Tokens (Sum of message tokens)
    tokens_query = (
        select(func.sum(Message.token_count))
        .join(ChatSession)
        .where(ChatSession.user_id == user_id)
    )

    # 6. Average Latency (from AI responses where role == 'assistant')
    latency_query = (
        select(func.avg(Message.latency_ms))
        .join(ChatSession)
        .where(ChatSession.user_id == user_id)
        .where(Message.role == "assistant")
        .where(Message.latency_ms > 0)
    )

    # 7. Recent Queries (last 5 user messages)
    recent_queries_query = (
        select(
            Message.id,
            Workspace.name.label("workspace_name"),
            Workspace.id.label("workspace_id"),
            Message.content,
            Message.created_at,
            Message.latency_ms,
        )
        .join(ChatSession, Message.session_id == ChatSession.id)
        .join(Workspace, ChatSession.workspace_id == Workspace.id)
        .where(ChatSession.user_id == user_id)
        .where(Message.role == "user")
        .order_by(Message.created_at.desc())
        .limit(5)
    )

    # 8. Recent Uploads (last 5 uploaded documents)
    recent_uploads_query = (
        select(
            Document.id,
            Workspace.name.label("workspace_name"),
            Workspace.id.label("workspace_id"),
            Document.filename,
            Document.file_size,
            Document.created_at,
            Document.status,
        )
        .join(Workspace)
        .where(
            Workspace.owner_id == user_id,
            Document.deleted_at.is_(None),
        )
        .order_by(Document.created_at.desc())
        .limit(5)
    )

    # Execute all 8 analytics queries concurrently
    (
        workspaces_result,
        docs_result,
        status_result,
        queries_result,
        tokens_result,
        latency_result,
        recent_queries_result,
        recent_uploads_result,
    ) = await asyncio.gather(
        db.execute(workspaces_query),
        db.execute(docs_query),
        db.execute(status_query),
        db.execute(queries_query),
        db.execute(tokens_query),
        db.execute(latency_query),
        db.execute(recent_queries_query),
        db.execute(recent_uploads_query),
    )

    total_workspaces = workspaces_result.scalar_one_or_none() or 0
    total_docs, total_size, total_chunks = docs_result.first() or (0, 0, 0)
    total_docs = total_docs or 0
    total_size = total_size or 0
    total_chunks = total_chunks or 0

    document_statuses = [
        DocumentStatusCount(status=status, count=count)
        for status, count in status_result.all()
    ]

    total_queries = queries_result.scalar_one_or_none() or 0
    total_tokens = tokens_result.scalar_one_or_none() or 0
    avg_latency = float(latency_result.scalar_one_or_none() or 0.0)

    recent_queries = [
        RecentQuery(
            id=str(row.id),
            workspace_name=row.workspace_name,
            workspace_id=str(row.workspace_id),
            query=row.content,
            created_at=row.created_at,
            latency_ms=row.latency_ms,
        )
        for row in recent_queries_result.all()
    ]

    recent_uploads = [
        RecentUpload(
            id=str(row.id),
            workspace_name=row.workspace_name,
            workspace_id=str(row.workspace_id),
            filename=row.filename,
            file_size=row.file_size,
            created_at=row.created_at,
            status=row.status,
        )
        for row in recent_uploads_result.all()
    ]

    return RAGAnalyticsResponse(
        total_workspaces=total_workspaces,
        total_documents=total_docs,
        total_chunks=total_chunks,
        total_storage_bytes=total_size,
        total_queries=total_queries,
        total_tokens=total_tokens,
        avg_latency_ms=avg_latency,
        document_statuses=document_statuses,
        recent_queries=recent_queries,
        recent_uploads=recent_uploads,
    )
