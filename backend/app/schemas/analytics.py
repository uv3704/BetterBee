from datetime import datetime

from pydantic import BaseModel


class DocumentStatusCount(BaseModel):
    status: str
    count: int

class RecentQuery(BaseModel):
    id: str
    workspace_name: str
    workspace_id: str
    query: str
    created_at: datetime
    latency_ms: int

class RecentUpload(BaseModel):
    id: str
    workspace_name: str
    workspace_id: str
    filename: str
    file_size: int
    created_at: datetime
    status: str

class RAGAnalyticsResponse(BaseModel):
    total_workspaces: int
    total_documents: int
    total_chunks: int
    total_storage_bytes: int
    total_queries: int
    total_tokens: int
    avg_latency_ms: float
    document_statuses: list[DocumentStatusCount]
    recent_queries: list[RecentQuery]
    recent_uploads: list[RecentUpload]
