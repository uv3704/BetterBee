"""
BetterBee — Workspace Service.
"""

import uuid

import structlog
from slugify import slugify

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.workspace import Workspace
from app.repositories.workspace_repo import WorkspaceRepository

logger = structlog.get_logger(__name__)


class WorkspaceService:
    """Service layer handling business logic for Workspaces."""

    def __init__(self, workspace_repo: WorkspaceRepository) -> None:
        self._workspace_repo = workspace_repo

    async def get_workspace_by_id(self, workspace_id: uuid.UUID) -> Workspace:
        """Fetch workspace by UUID, raise NotFoundError if missing."""
        workspace = await self._workspace_repo.get_by_id(workspace_id)
        if not workspace:
            raise NotFoundError("Workspace", str(workspace_id))
        return workspace

    async def get_workspace_by_slug(self, slug: str) -> Workspace:
        """Fetch workspace by slug, raise NotFoundError if missing."""
        workspace = await self._workspace_repo.get_by_slug(slug)
        if not workspace:
            raise NotFoundError("Workspace slug", slug)
        return workspace

    async def list_workspaces_for_user(
        self,
        user_id: uuid.UUID,
        *,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[Workspace], int]:
        """List workspaces belonging to a user with pagination."""
        return await self._workspace_repo.list_by_owner(
            user_id,
            offset=offset,
            limit=limit,
        )

    async def create_workspace(
        self,
        user_id: uuid.UUID,
        name: str,
        description: str | None = None,
        icon: str | None = None,
    ) -> Workspace:
        """Create a new workspace with a unique slug."""
        base_slug = slugify(name)
        if not base_slug:
            base_slug = "workspace"

        # Ensure slug is unique by appending counter if needed
        slug = base_slug
        counter = 1
        while True:
            existing = await self._workspace_repo.get_by_slug(slug)
            if not existing:
                break
            slug = f"{base_slug}-{counter}"
            counter += 1

        logger.info("Creating workspace", name=name, slug=slug, owner_id=user_id)
        return await self._workspace_repo.create(
            name=name,
            slug=slug,
            description=description,
            icon=icon,
            owner_id=user_id,
        )

    async def update_workspace(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        **kwargs,
    ) -> Workspace:
        """Update workspace details. Enforces ownership check."""
        workspace = await self.get_workspace_by_id(workspace_id)

        if workspace.owner_id != user_id:
            logger.warning(
                "Unauthorized workspace update attempt",
                workspace_id=workspace_id,
                user_id=user_id,
            )
            raise ForbiddenError("You do not own this workspace")

        # If name is updated, regenerate slug
        if "name" in kwargs and kwargs["name"] and kwargs["name"] != workspace.name:
            base_slug = slugify(kwargs["name"])
            slug = base_slug
            counter = 1
            while True:
                existing = await self._workspace_repo.get_by_slug(slug)
                if not existing or existing.id == workspace_id:
                    break
                slug = f"{base_slug}-{counter}"
                counter += 1
            kwargs["slug"] = slug

        return await self._workspace_repo.update(workspace, **kwargs)

    async def delete_workspace(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        """Delete a workspace. Enforces ownership check."""
        workspace = await self.get_workspace_by_id(workspace_id)

        if workspace.owner_id != user_id:
            logger.warning(
                "Unauthorized workspace deletion attempt",
                workspace_id=workspace_id,
                user_id=user_id,
            )
            raise ForbiddenError("You do not own this workspace")

        logger.info("Deleting workspace", workspace_id=workspace_id, owner_id=user_id)
        await self._workspace_repo.delete(workspace)

        # 1. Clean up S3 storage files under this workspace
        try:
            from app.services.storage_service import get_storage_provider
            storage_provider = get_storage_provider()
            await storage_provider.delete_prefix(f"workspaces/{workspace_id}/")
            logger.info("Deleted workspace documents from S3 storage", workspace_id=str(workspace_id))
        except Exception as e:
            logger.warning("Could not delete S3 files on workspace delete", error=str(e))

        # 2. Clean up vector database collection for this workspace
        try:
            from app.rag.factory import get_vector_store
            vector_store = get_vector_store()
            await vector_store.delete_collection(str(workspace_id))
        except Exception as e:
            logger.warning("Could not delete vector store collection on workspace delete", error=str(e))
