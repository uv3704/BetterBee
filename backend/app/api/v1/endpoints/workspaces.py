"""
BetterBee — Workspace API Endpoints.
"""

import uuid

import structlog
from fastapi import APIRouter, status

from app.core.deps import CurrentUser, WorkspaceServiceDep
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceResponse,
    WorkspaceUpdate,
)

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.post(
    "",
    response_model=WorkspaceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_workspace(
    body: WorkspaceCreate,
    current_user: CurrentUser,
    workspace_service: WorkspaceServiceDep,
) -> WorkspaceResponse:
    """Create a new workspace for the authenticated user."""
    workspace = await workspace_service.create_workspace(
        user_id=current_user.id,
        name=body.name,
        description=body.description,
        icon=body.icon,
    )
    return WorkspaceResponse.model_validate(workspace)


@router.get("", response_model=list[WorkspaceResponse])
async def list_workspaces(
    current_user: CurrentUser,
    workspace_service: WorkspaceServiceDep,
    offset: int = 0,
    limit: int = 50,
) -> list[WorkspaceResponse]:
    """List all workspaces owned by the authenticated user."""
    workspaces, _ = await workspace_service.list_workspaces_for_user(
        user_id=current_user.id,
        offset=offset,
        limit=limit,
    )
    return [WorkspaceResponse.model_validate(w) for w in workspaces]


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: uuid.UUID,
    current_user: CurrentUser,
    workspace_service: WorkspaceServiceDep,
) -> WorkspaceResponse:
    """Retrieve details of a specific workspace."""
    workspace = await workspace_service.get_workspace_by_id(workspace_id)
    # Check ownership
    from app.core.exceptions import ForbiddenError
    if workspace.owner_id != current_user.id:
        raise ForbiddenError("You do not have access to this workspace")
    return WorkspaceResponse.model_validate(workspace)


@router.patch("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: uuid.UUID,
    body: WorkspaceUpdate,
    current_user: CurrentUser,
    workspace_service: WorkspaceServiceDep,
) -> WorkspaceResponse:
    """Update details of a specific workspace. Enforces ownership."""
    workspace = await workspace_service.update_workspace(
        workspace_id=workspace_id,
        user_id=current_user.id,
        **body.model_dump(exclude_unset=True),
    )
    return WorkspaceResponse.model_validate(workspace)


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(
    workspace_id: uuid.UUID,
    current_user: CurrentUser,
    workspace_service: WorkspaceServiceDep,
) -> None:
    """Delete a specific workspace. Enforces ownership."""
    await workspace_service.delete_workspace(
        workspace_id=workspace_id,
        user_id=current_user.id,
    )
