"""
BetterBee — API v1 Router.

Aggregates all endpoint routers into a single v1 API router.
New feature routers are registered here.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    analytics,
    auth,
    chat,
    documents,
    health,
    search,
    storage,
    workspaces,
)

api_router = APIRouter()

# --- Core Endpoints ---
api_router.include_router(health.router)
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["Workspaces"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(storage.router, prefix="/storage", tags=["Storage"])
api_router.include_router(
    documents.router,
    prefix="/workspaces/{workspace_id}/documents",
    tags=["Documents"],
)
api_router.include_router(
    chat.router,
    prefix="/workspaces/{workspace_id}/chat",
    tags=["Chat"],
)
api_router.include_router(
    search.router,
    prefix="/workspaces/{workspace_id}/search",
    tags=["Search"],
)


