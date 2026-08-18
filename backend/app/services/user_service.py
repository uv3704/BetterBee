"""
BetterBee — User Service.
"""

import uuid

import structlog

from app.models.user import User
from app.repositories.user_repo import UserRepository

logger = structlog.get_logger(__name__)


class UserService:
    """Service layer handling business logic for Users."""

    def __init__(self, user_repo: UserRepository) -> None:
        self._user_repo = user_repo

    async def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        """Retrieve a user by their database UUID."""
        return await self._user_repo.get_by_id(user_id)

    async def get_user_by_clerk_id(self, clerk_id: str) -> User | None:
        """Retrieve a user by their Clerk ID."""
        return await self._user_repo.get_by_clerk_id(clerk_id)

    async def sync_user(
        self,
        clerk_id: str,
        email: str,
        full_name: str | None = None,
        avatar_url: str | None = None,
    ) -> User:
        """
        Synchronize a Clerk user with the local PostgreSQL database.
        Upserts the user record.
        """
        log = logger.bind(clerk_id=clerk_id, email=email)
        existing_user = await self._user_repo.get_by_clerk_id(clerk_id)

        if existing_user:
            log.debug("Syncing existing user")
            # Update fields if changed
            updated_fields = {}
            if existing_user.email != email:
                updated_fields["email"] = email
            if existing_user.full_name != full_name:
                updated_fields["full_name"] = full_name
            if existing_user.avatar_url != avatar_url:
                updated_fields["avatar_url"] = avatar_url

            if updated_fields:
                existing_user = await self._user_repo.update(
                    existing_user,
                    **updated_fields,
                )
            return existing_user

        # Create new user
        log.info("Creating new user on sync")
        return await self._user_repo.create(
            clerk_id=clerk_id,
            email=email,
            full_name=full_name,
            avatar_url=avatar_url,
            role="member",  # Default role
            is_active=True,
        )
