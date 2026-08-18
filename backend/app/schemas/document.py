"""
BetterBee — Document Schemas.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict


class DocumentUploadInitiateRequest(BaseModel):
    filename: str = Field(..., max_length=255)
    file_size: int = Field(..., gt=0)  # bytes
    file_type: str = Field(..., max_length=50)  # pdf, docx, md, txt, xlsx, pptx


class DocumentUploadInitiateResponse(BaseModel):
    document_id: uuid.UUID
    upload_url: str
    s3_key: str


class DocumentConfirmRequest(BaseModel):
    document_id: uuid.UUID


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    filename: str
    file_type: str
    file_size: int
    s3_key: str
    status: str
    chunk_count: int
    error_message: str | None = None
    uploaded_by: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime


class DocumentStatusResponse(BaseModel):
    id: uuid.UUID
    status: str
    chunk_count: int
    error_message: str | None = None
