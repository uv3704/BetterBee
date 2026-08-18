"""
BetterBee — Dependency Injection.

All injectable dependencies for FastAPI route handlers.
Dependencies point inward: API → Service → Repository → DB.
AI providers are resolved via factories based on config.
"""

from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.db.engine import async_session_factory
from app.models.user import User
from app.rag.pipeline import RAGPipeline
from app.services.chat_service import ChatService
from app.services.document_service import DocumentService
from app.services.search_service import SearchService
from app.services.storage_service import StorageProvider, get_storage_provider
from app.services.user_service import UserService
from app.services.workspace_service import WorkspaceService


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Provide a transactional async database session.

    Yields an AsyncSession that is automatically closed after the request.
    Use this as a dependency in route handlers and services.
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_current_user_id(request: Request) -> str:
    """Extract the authenticated user's Clerk ID from the request.

    The actual JWT verification happens in the auth middleware.
    This dependency reads the verified clerk_id from request state.

    Returns:
        The Clerk user ID string.

    Raises:
        AuthenticationError: If no authenticated user is found.
    """
    from app.core.exceptions import AuthenticationError

    clerk_id = getattr(request.state, "clerk_id", None)
    if not clerk_id:
        raise AuthenticationError("Authentication required")
    return clerk_id


# Type aliases for cleaner dependency injection signatures
SettingsDep = Annotated[Settings, Depends(get_settings)]
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUserId = Annotated[str, Depends(get_current_user_id)]


async def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    """Inject a UserService instance."""
    from app.repositories.user_repo import UserRepository

    return UserService(UserRepository(db))


UserServiceDep = Annotated[UserService, Depends(get_user_service)]


async def get_current_user(
    clerk_id: CurrentUserId,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Fetch the full User model of the currently authenticated user."""
    from app.core.exceptions import AuthenticationError
    from app.repositories.user_repo import UserRepository

    user_repo = UserRepository(db)
    user = await user_repo.get_by_clerk_id(clerk_id)
    if not user:
        raise AuthenticationError("User profile has not been synchronized yet")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_workspace_service(db: AsyncSession = Depends(get_db)) -> WorkspaceService:
    """Inject a WorkspaceService instance."""
    from app.repositories.workspace_repo import WorkspaceRepository

    return WorkspaceService(WorkspaceRepository(db))


WorkspaceServiceDep = Annotated[WorkspaceService, Depends(get_workspace_service)]


async def get_storage_provider_dep() -> StorageProvider:
    """Inject the configured StorageProvider."""
    return get_storage_provider()


StorageProviderDep = Annotated[StorageProvider, Depends(get_storage_provider_dep)]


async def get_document_service(
    db: AsyncSession = Depends(get_db),
    storage_provider: StorageProvider = Depends(get_storage_provider_dep),
) -> DocumentService:
    """Inject a DocumentService instance."""
    from app.repositories.document_repo import DocumentRepository
    from app.repositories.workspace_repo import WorkspaceRepository

    return DocumentService(
        DocumentRepository(db),
        WorkspaceRepository(db),
        storage_provider,
    )


DocumentServiceDep = Annotated[DocumentService, Depends(get_document_service)]


async def get_rag_pipeline(
    db: AsyncSession = Depends(get_db),
    storage_provider: StorageProvider = Depends(get_storage_provider_dep),
) -> RAGPipeline:
    """Inject a configured RAGPipeline instance."""
    from app.rag.factory import EmbeddingFactory, LLMFactory, RerankerFactory, VectorStoreFactory
    from app.rag.retriever import WorkspaceRetriever

    llm = LLMFactory.create()
    embedding = EmbeddingFactory.create()
    vector_store = VectorStoreFactory.create()
    reranker = RerankerFactory.create()

    retriever = WorkspaceRetriever(embedding, vector_store)
    return RAGPipeline(retriever, reranker, llm)


RAGPipelineDep = Annotated[RAGPipeline, Depends(get_rag_pipeline)]


async def get_chat_service(db: AsyncSession = Depends(get_db)) -> ChatService:
    """Inject a ChatService instance."""
    from app.repositories.chat_repo import ChatSessionRepository, MessageRepository
    from app.repositories.workspace_repo import WorkspaceRepository

    return ChatService(
        session_repo=ChatSessionRepository(db),
        message_repo=MessageRepository(db),
        workspace_repo=WorkspaceRepository(db),
    )


ChatServiceDep = Annotated[ChatService, Depends(get_chat_service)]


async def get_search_service(
    db: AsyncSession = Depends(get_db),
    rag_pipeline: RAGPipeline = Depends(get_rag_pipeline),
) -> SearchService:
    return SearchService(db, rag_pipeline.retriever)


SearchServiceDep = Annotated[SearchService, Depends(get_search_service)]

