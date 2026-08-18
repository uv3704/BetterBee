import uuid

from pydantic import BaseModel, Field


class SearchChunkMatch(BaseModel):
    chunk_id: str = Field(..., description="Unique chunk identifier")
    content: str = Field(..., description="Text content of the chunk")
    score: float = Field(..., description="Relevance score from retriever or similarity matching")
    page_number: int | None = None
    sheet_name: str | None = None
    slide_number: int | None = None
    chunk_index: int | None = None

class SearchDocumentResult(BaseModel):
    document_id: uuid.UUID
    filename: str
    file_type: str
    file_size: int
    s3_key: str
    matches: list[SearchChunkMatch] = []

class SearchResponse(BaseModel):
    query: str
    search_type: str = Field(..., description="semantic | keyword")
    results: list[SearchDocumentResult] = []
