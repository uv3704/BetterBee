"""
BetterBee — Chat Service.

Orchestrates conversation threads, messages retrieval, and SSE streaming RAG query generation.
"""

import uuid
from collections.abc import AsyncGenerator
from typing import Any

import structlog

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.chat import ChatSession
from app.prompts.title import build_title_prompt
from app.rag.factory import LLMFactory
from app.rag.pipeline import RAGPipeline
from app.repositories.chat_repo import ChatSessionRepository, MessageRepository
from app.repositories.workspace_repo import WorkspaceRepository

logger = structlog.get_logger(__name__)


class ChatService:
    """Service layer handling business logic for workspaces conversations and RAG sessions."""

    def __init__(
        self,
        session_repo: ChatSessionRepository,
        message_repo: MessageRepository,
        workspace_repo: WorkspaceRepository,
    ) -> None:
        self._session_repo = session_repo
        self._message_repo = message_repo
        self._workspace_repo = workspace_repo

    async def _verify_workspace_access(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> None:
        """Verify that the user owns or has access to the workspace."""
        workspace = await self._workspace_repo.get_by_id(workspace_id)
        if not workspace:
            raise NotFoundError("Workspace", str(workspace_id))
        if workspace.owner_id != user_id:
            raise ForbiddenError("You do not have access to this workspace")

    async def get_session_by_id(self, session_id: uuid.UUID, user_id: uuid.UUID) -> ChatSession:
        """Fetch a conversation thread, validating user access."""
        session = await self._session_repo.get_session_with_messages(session_id)
        if not session:
            raise NotFoundError("Chat session", str(session_id))
        if session.user_id != user_id:
            raise ForbiddenError("You do not have access to this conversation")
        return session

    async def list_sessions_for_workspace(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> list[ChatSession]:
        """List all conversations within a workspace for the user."""
        await self._verify_workspace_access(workspace_id, user_id)
        return await self._session_repo.list_by_workspace_and_user(workspace_id, user_id)

    async def create_session(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        title: str | None = None,
    ) -> ChatSession:
        """Create a new chat conversation thread."""
        await self._verify_workspace_access(workspace_id, user_id)

        session = await self._session_repo.create(
            workspace_id=workspace_id,
            user_id=user_id,
            title=title or "New Conversation",
            is_pinned=False,
        )
        logger.info("Created chat session", session_id=session.id, workspace_id=workspace_id)
        return session

    async def update_session(
        self,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
        **kwargs: Any,
    ) -> ChatSession:
        """Update session details (rename, pin). Enforces ownership."""
        session = await self.get_session_by_id(session_id, user_id)
        return await self._session_repo.update(session, **kwargs)

    async def delete_session(self, session_id: uuid.UUID, user_id: uuid.UUID) -> None:
        """Delete a chat conversation thread cascade. Enforces ownership."""
        session = await self.get_session_by_id(session_id, user_id)
        logger.info("Deleting chat session", session_id=session_id)
        await self._session_repo.delete(session)

    async def send_message(
        self,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
        message_content: str,
        rag_pipeline: RAGPipeline,
    ) -> AsyncGenerator[dict[str, Any], None]:
        """
        Send a user message, run the RAG query pipeline, and stream the response.
        Saves user and assistant messages in database.
        
        Yields streaming event dicts:
        - {"type": "token", "content": str}
        - {"type": "citations", "content": list}
        - {"type": "explain", "content": dict}
        - {"type": "message_id", "content": str}
        """
        log = logger.bind(session_id=str(session_id), user_id=str(user_id))

        # 1. Verify session exists and belongs to the user
        session = await self.get_session_by_id(session_id, user_id)

        # 2. Save user message to database
        user_msg = await self._message_repo.create(
            session_id=session_id,
            role="user",
            content=message_content,
            citations=[],
            explainability_data={},
            token_count=len(message_content.split()),
            latency_ms=0,
        )

        # Invalidate update timestamp of session
        await self._session_repo.update(session)

        # 3. Load chat history (past 6 turns)
        history_msgs = await self._message_repo.get_by_session(session_id)

        # Exclude the latest user message we just saved
        chat_history = []
        for msg in history_msgs[:-1]:
            chat_history.append({
                "role": msg.role,
                "content": msg.content,
            })

        # 4. Invoke RAG pipeline
        accumulated_answer = []
        citations = []
        explain_report = {}

        # Resolve workspace name for console logging
        workspace_name = "Unknown"
        try:
            workspace_obj = await self._workspace_repo.get_by_id(session.workspace_id)
            if workspace_obj:
                workspace_name = workspace_obj.name
        except Exception:
            pass

        try:
            async for event in rag_pipeline.answer(
                query=message_content,
                workspace_id=session.workspace_id,
                chat_history=chat_history,
                workspace_name=workspace_name,
            ):
                if event["type"] == "token":
                    accumulated_answer.append(event["content"])
                    yield event
                elif event["type"] == "citations":
                    citations = event["content"]
                    yield event
                elif event["type"] == "explain":
                    explain_report = event["content"]
                    yield event

            # 5. Save assistant response message to database
            full_answer = "".join(accumulated_answer)
            latencies = explain_report.get("latencies", {})
            model_info = explain_report.get("model_info", {})

            assistant_msg = await self._message_repo.create(
                session_id=session_id,
                role="assistant",
                content=full_answer,
                citations=citations,
                explainability_data=explain_report,
                token_count=len(full_answer.split()),  # Simple word count approximation
                model=model_info.get("model_name"),
                provider=model_info.get("provider"),
                latency_ms=int(latencies.get("total_ms", 0)),
            )

            # Invalidate session updated_at again so it sorts correctly
            await self._session_repo.update(session)

            # Yield message ID so frontend can map the citation actions
            yield {"type": "message_id", "content": str(assistant_msg.id)}

            # 6. Auto-generate title if this is the first assistant message in session
            # (e.g. we only have 2 messages in session: 1 user, 1 assistant)
            if len(history_msgs) <= 1:
                try:
                    await self._auto_generate_title(session_id, message_content, full_answer)
                except Exception as title_err:
                    log.warning("Failed to auto-generate chat title", error=str(title_err))

        except Exception as e:
            log.error("RAG pipeline streaming execution failed", error=str(e))
            # Save error response so conversation history is not broken
            err_msg = "An error occurred while generating the response. Please try again."
            await self._message_repo.create(
                session_id=session_id,
                role="assistant",
                content=err_msg,
                citations=[],
                explainability_data={},
                token_count=len(err_msg.split()),
                latency_ms=0,
            )
            yield {"type": "token", "content": f"\n\n[System Error: {e!s}]"}

    async def _auto_generate_title(
        self,
        session_id: uuid.UUID,
        query: str,
        answer: str,
    ) -> None:
        """Asynchronously generate a title for the session using LLM and update it."""
        llm = LLMFactory.create()
        prompt_messages = build_title_prompt(query, answer)

        # Generate title
        title = await llm.generate(prompt_messages)
        title = title.strip().strip('"').strip("'")

        if title:
            # Fetch session in a new query or use session repo
            # Since this runs in same async loop/transaction context of current session,
            # we can directly update it
            session = await self._session_repo.get_by_id(session_id)
            if session:
                await self._session_repo.update(session, title=title[:255])
                logger.info("Auto-renamed chat session", session_id=session_id, title=title)
