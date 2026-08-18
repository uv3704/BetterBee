"""
BetterBee — Document Repository.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document
from app.repositories.base import BaseRepository


class DocumentRepository(BaseRepository[Document]):
    """Repository handling database access for Document ORM model."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Document)

    async def get_by_s3_key(self, s3_key: str) -> Document | None:
        """Fetch a document by its storage key."""
        query = select(Document).where(Document.s3_key == s3_key)
        result = await self._session.execute(query)
        return result.scalar_one_or_none()

    async def list_by_workspace(
        self,
        workspace_id: uuid.UUID,
        *,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[Document], int]:
        """List documents in a specific workspace with pagination."""
        return await self.list(
            offset=offset,
            limit=limit,
            filters=[
                Document.workspace_id == workspace_id,
                Document.deleted_at.is_(None),
            ],
            order_by="-created_at",
        )
