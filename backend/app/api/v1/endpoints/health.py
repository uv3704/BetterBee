"""
BetterBee — Health Check Endpoint.

Provides system health status for monitoring and load balancer probes.
Checks connectivity to all critical services: Database, Redis, ChromaDB, AI providers.
"""

import time
from datetime import UTC, datetime

import structlog
from fastapi import APIRouter, status
from pydantic import BaseModel

from app.core.config import get_settings

router = APIRouter(tags=["Health"])
logger = structlog.get_logger(__name__)

# Track application start time for uptime calculation
_start_time = time.time()


class ServiceStatus(BaseModel):
    """Health status for an individual service."""

    status: str  # "connected" | "unavailable" | "error"
    latency_ms: float | None = None
    error: str | None = None


class HealthResponse(BaseModel):
    """Aggregated health check response."""

    status: str  # "healthy" | "degraded" | "unhealthy"
    version: str
    environment: str
    uptime_seconds: int
    timestamp: str
    services: dict[str, ServiceStatus]


async def _check_database() -> ServiceStatus:
    """Check PostgreSQL connectivity."""
    try:
        start = time.perf_counter()
        from sqlalchemy import text

        from app.db.engine import engine

        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        latency = (time.perf_counter() - start) * 1000
        return ServiceStatus(status="connected", latency_ms=round(latency, 2))
    except Exception as e:
        logger.error("Database health check failed", error=str(e))
        return ServiceStatus(status="unavailable", error=str(e))


async def _check_redis() -> ServiceStatus:
    """Check Redis connectivity."""
    try:
        start = time.perf_counter()
        import redis.asyncio as aioredis

        settings = get_settings()
        r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        await r.ping()
        await r.aclose()
        latency = (time.perf_counter() - start) * 1000
        return ServiceStatus(status="connected", latency_ms=round(latency, 2))
    except Exception as e:
        logger.error("Redis health check failed", error=str(e))
        return ServiceStatus(status="unavailable", error=str(e))


async def _check_chromadb() -> ServiceStatus:
    """Check ChromaDB persistent client."""
    try:
        start = time.perf_counter()
        import chromadb

        settings = get_settings()
        client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        client.heartbeat()
        latency = (time.perf_counter() - start) * 1000
        return ServiceStatus(status="ready", latency_ms=round(latency, 2))
    except Exception as e:
        logger.error("ChromaDB health check failed", error=str(e))
        return ServiceStatus(status="unavailable", error=str(e))


async def _check_ollama() -> ServiceStatus:
    """Check Ollama local server (if configured as provider)."""
    settings = get_settings()
    if settings.LLM_PROVIDER != "ollama" and settings.EMBEDDING_PROVIDER != "ollama":
        return ServiceStatus(status="not_configured")

    try:
        start = time.perf_counter()
        import httpx

        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            resp.raise_for_status()
        latency = (time.perf_counter() - start) * 1000
        return ServiceStatus(status="running", latency_ms=round(latency, 2))
    except Exception as e:
        logger.warning("Ollama health check failed", error=str(e))
        return ServiceStatus(status="unavailable", error=str(e))


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="System Health Check",
    description="Returns health status of all services. Used by load balancers and monitoring.",
)
async def health_check() -> HealthResponse:
    """Check health of all dependent services."""
    settings = get_settings()

    services = {
        "database": await _check_database(),
        "redis": await _check_redis(),
        "chromadb": await _check_chromadb(),
        "ollama": await _check_ollama(),
    }

    # Determine overall status
    statuses = [s.status for s in services.values() if s.status != "not_configured"]
    if all(s in ("connected", "ready", "running") for s in statuses):
        overall = "healthy"
    elif any(s == "unavailable" for s in statuses):
        overall = "degraded"
    else:
        overall = "unhealthy"

    return HealthResponse(
        status=overall,
        version=settings.APP_VERSION,
        environment="development" if settings.DEBUG else "production",
        uptime_seconds=int(time.time() - _start_time),
        timestamp=datetime.now(UTC).isoformat(),
        services=services,
    )
