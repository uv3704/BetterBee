"""
BetterBee — Chat & RAG Streaming API Endpoints.
"""

import json
import uuid

import structlog
from fastapi import APIRouter, status
from fastapi.responses import StreamingResponse

from app.core.deps import ChatServiceDep, CurrentUser, RAGPipelineDep
from app.schemas.chat import (
    ChatRequest,
    ChatSessionCreate,
    ChatSessionDetailResponse,
    ChatSessionResponse,
    ChatSessionUpdate,
)

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.post("", status_code=status.HTTP_200_OK)
async def send_chat_message(
    workspace_id: uuid.UUID,
    body: ChatRequest,
    current_user: CurrentUser,
    chat_service: ChatServiceDep,
    rag_pipeline: RAGPipelineDep,
) -> StreamingResponse:
    """
    Send a message within a workspace. Streams the response using Server-Sent Events (SSE).
    If session_id is omitted, a new chat session is automatically created.
    """
    session_id = body.session_id
    is_new = False
    if not session_id:
        session = await chat_service.create_session(
            workspace_id=workspace_id,
            user_id=current_user.id,
            title="New Conversation",
        )
        session_id = session.id
        is_new = True

    async def event_generator():
        if is_new:
            # Yield the session_id first so the client can navigate to the new session
            yield f"data: {json.dumps({'type': 'session_id', 'content': str(session_id)})}\n\n"

        async for event in chat_service.send_message(
            session_id=session_id,
            user_id=current_user.id,
            message_content=body.message,
            rag_pipeline=rag_pipeline,
        ):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_chat_session(
    workspace_id: uuid.UUID,
    body: ChatSessionCreate,
    current_user: CurrentUser,
    chat_service: ChatServiceDep,
) -> ChatSessionResponse:
    """Create a new empty chat session."""
    session = await chat_service.create_session(
        workspace_id=workspace_id,
        user_id=current_user.id,
        title=body.title,
    )
    return ChatSessionResponse.model_validate(session)


@router.get("/sessions", response_model=list[ChatSessionResponse])
async def list_sessions(
    workspace_id: uuid.UUID,
    current_user: CurrentUser,
    chat_service: ChatServiceDep,
) -> list[ChatSessionResponse]:
    """List all chat sessions within a workspace for the authenticated user."""
    sessions = await chat_service.list_sessions_for_workspace(
        workspace_id=workspace_id,
        user_id=current_user.id,
    )
    return [ChatSessionResponse.model_validate(s) for s in sessions]


@router.get("/sessions/{session_id}", response_model=ChatSessionDetailResponse)
async def get_session(
    workspace_id: uuid.UUID,
    session_id: uuid.UUID,
    current_user: CurrentUser,
    chat_service: ChatServiceDep,
) -> ChatSessionDetailResponse:
    """Retrieve details of a specific chat session including its messages."""
    session = await chat_service.get_session_by_id(
        session_id=session_id,
        user_id=current_user.id,
    )
    return ChatSessionDetailResponse.model_validate(session)


@router.patch("/sessions/{session_id}", response_model=ChatSessionResponse)
async def update_session(
    workspace_id: uuid.UUID,
    session_id: uuid.UUID,
    body: ChatSessionUpdate,
    current_user: CurrentUser,
    chat_service: ChatServiceDep,
) -> ChatSessionResponse:
    """Update details (title, pin status) of a specific chat session."""
    session = await chat_service.update_session(
        session_id=session_id,
        user_id=current_user.id,
        **body.model_dump(exclude_unset=True),
    )
    return ChatSessionResponse.model_validate(session)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    workspace_id: uuid.UUID,
    session_id: uuid.UUID,
    current_user: CurrentUser,
    chat_service: ChatServiceDep,
) -> None:
    """Delete a specific chat session."""
    await chat_service.delete_session(
        session_id=session_id,
        user_id=current_user.id,
    )


@router.get("/sessions/{session_id}/messages/{message_id}/explain", response_model=dict)
async def get_message_explainability(
    workspace_id: uuid.UUID,
    session_id: uuid.UUID,
    message_id: uuid.UUID,
    current_user: CurrentUser,
    chat_service: ChatServiceDep,
) -> dict:
    """Retrieve explainability details for a specific assistant message."""
    session = await chat_service.get_session_by_id(
        session_id=session_id,
        user_id=current_user.id,
    )
    # Find the message in session
    message = None
    for msg in session.messages:
        if msg.id == message_id:
            message = msg
            break

    if not message:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Message", str(message_id))

    return message.explainability_data
