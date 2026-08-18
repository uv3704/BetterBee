"""
BetterBee — Workspace Repository.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workspace import Workspace
from app.repositories.base import BaseRepository


class WorkspaceRepository(BaseRepository[Workspace]):
    """Repository handling database access for Workspace ORM model."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Workspace)

    async def get_by_slug(self, slug: str) -> Workspace | None:
        """Fetch a workspace by its unique URL slug."""
        query = select(Workspace).where(Workspace.slug == slug)
        result = await self._session.execute(query)
        return result.scalar_one_or_none()

    async def list_by_owner(
        self,
        owner_id: uuid.UUID,
        *,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[Workspace], int]:
        """List workspaces owned by a specific user with pagination."""
        return await self.list(
            offset=offset,
            limit=limit,
            filters=[Workspace.owner_id == owner_id],
            order_by="name",
        )
