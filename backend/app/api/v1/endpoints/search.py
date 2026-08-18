import uuid

import structlog
from fastapi import APIRouter, Query, status

from app.core.deps import CurrentUser, SearchServiceDep, WorkspaceServiceDep
from app.core.exceptions import ForbiddenError, NotFoundError
from app.schemas.search import SearchResponse

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get("", response_model=SearchResponse, status_code=status.HTTP_200_OK)
async def search_workspace_documents(
    workspace_id: uuid.UUID,
    current_user: CurrentUser,
    workspace_service: WorkspaceServiceDep,
    search_service: SearchServiceDep,
    q: str = Query(..., min_length=1, description="Search query string"),
    type: str = Query("semantic", description="semantic | keyword"),
    limit: int = Query(20, ge=1, le=100),
) -> SearchResponse:
    """
    Search document contents in a workspace.
    Supports semantic vector search and keyword literal SQL matching.
    """
    # 1. Enforce workspace ownership check
    workspace = await workspace_service.get_workspace_by_id(workspace_id)
    if not workspace:
        raise NotFoundError("Workspace", str(workspace_id))
    if workspace.owner_id != current_user.id:
        raise ForbiddenError("You do not have access to this workspace")

    # 2. Execute search
    return await search_service.search(
        query=q,
        workspace_id=workspace_id,
        search_type=type,
        limit=limit,
    )
