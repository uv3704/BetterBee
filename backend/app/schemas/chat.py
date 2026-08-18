"""
BetterBee — Chat Schemas.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MessageBase(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str = Field(..., min_length=1)


class MessageCreate(MessageBase):
    pass


class MessageResponse(MessageBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    session_id: uuid.UUID
    citations: list = []
    explainability_data: dict = {}
    token_count: int
    model: str | None = None
    provider: str | None = None
    latency_ms: int
    created_at: datetime


class ChatSessionBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    is_pinned: bool = False


class ChatSessionCreate(BaseModel):
    title: str | None = Field(None, max_length=255)


class ChatSessionUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    is_pinned: bool | None = None


class ChatSessionResponse(ChatSessionBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ChatSessionDetailResponse(ChatSessionResponse):
    messages: list[MessageResponse] = []


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    session_id: uuid.UUID | None = None  # If null, creates a new session
