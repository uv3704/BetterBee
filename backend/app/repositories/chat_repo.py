"""
BetterBee — Chat Repository.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.chat import ChatSession, Message
from app.repositories.base import BaseRepository


class ChatSessionRepository(BaseRepository[ChatSession]):
    """Repository handling database access for ChatSession ORM model."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, ChatSession)

    async def get_session_with_messages(self, session_id: uuid.UUID) -> ChatSession | None:
        """Fetch a chat session and eagerly load its messages."""
        query = (
            select(ChatSession)
            .where(ChatSession.id == session_id)
            .options(selectinload(ChatSession.messages))
        )
        result = await self._session.execute(query)
        return result.scalar_one_or_none()

    async def list_by_workspace_and_user(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> list[ChatSession]:
        """List all chat sessions within a workspace for a specific user, sorted by recency/pin."""
        query = (
            select(ChatSession)
            .where(
                ChatSession.workspace_id == workspace_id,
                ChatSession.user_id == user_id,
            )
            .order_by(ChatSession.is_pinned.desc(), ChatSession.updated_at.desc())
        )
        result = await self._session.execute(query)
        return list(result.scalars().all())


class MessageRepository(BaseRepository[Message]):
    """Repository handling database access for Message ORM model."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Message)

    async def get_by_session(self, session_id: uuid.UUID) -> list[Message]:
        """Fetch all messages in a session chronologically."""
        query = (
            select(Message)
            .where(Message.session_id == session_id)
            .order_by(Message.created_at.asc())
        )
        result = await self._session.execute(query)
        return list(result.scalars().all())
