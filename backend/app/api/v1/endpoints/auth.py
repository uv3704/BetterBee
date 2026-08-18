"""
BetterBee — Authentication & Sync Endpoints.
"""

import structlog
from fastapi import APIRouter

from app.core.deps import CurrentUserId, UserServiceDep
from app.core.exceptions import AuthenticationError, NotFoundError
from app.schemas.user import UserResponse, UserSyncRequest

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.post("/sync", response_model=UserResponse)
async def sync_user(
    body: UserSyncRequest,
    current_user_id: CurrentUserId,
    user_service: UserServiceDep,
) -> UserResponse:
    """
    Sync Clerk authenticated user metadata with the local database.
    Requires matching the token's Clerk ID with the payload Clerk ID.
    """
    if body.clerk_id != current_user_id:
        logger.warning(
            "User tried to sync metadata with mismatching Clerk ID",
            token_clerk_id=current_user_id,
            body_clerk_id=body.clerk_id,
        )
        raise AuthenticationError(
            "Access denied: sync ID mismatch"
        )

    user = await user_service.sync_user(
        clerk_id=body.clerk_id,
        email=body.email,
        full_name=body.full_name,
        avatar_url=body.avatar_url,
    )
    return UserResponse.model_validate(user)


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user_id: CurrentUserId,
    user_service: UserServiceDep,
) -> UserResponse:
    """Get profile details of the currently authenticated user."""
    user = await user_service.get_user_by_clerk_id(current_user_id)
    if not user:
        # Fallback sync if user token is verified but not synced yet
        logger.warning(
            "Authenticated user profile not found in local database",
            clerk_id=current_user_id,
        )
        raise NotFoundError("User profile", current_user_id)
    return UserResponse.model_validate(user)
