"""
BetterBee — FastAPI Application Factory.

Entry point for the backend application.
Configures middleware, exception handlers, CORS, and mounts the API router.
Uses lifespan for clean startup/shutdown of database and ChromaDB connections.
"""

import time
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exceptions import BetterBeeError
from app.core.logging import setup_logging
from app.core.middleware import AuthMiddleware, LatencyMiddleware, RequestIDMiddleware

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager.

    Handles startup and shutdown events:
    - Startup: Initialize logging, verify connections, print beautiful status dashboard
    - Shutdown: Dispose database engine
    """
    settings = get_settings()
    setup_logging(debug=settings.DEBUG)

    start_total = time.perf_counter()

    db_connected = False
    db_latency = 0
    # 1. Verify Database
    t0 = time.perf_counter()
    try:
        from sqlalchemy import text

        from app.db.engine import engine

        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_connected = True
        db_latency = int((time.perf_counter() - t0) * 1000)
    except Exception as e:
        logger.error("Database connection check failed", error=str(e))

    redis_connected = False
    redis_latency = 0
    # 2. Verify Redis
    t0 = time.perf_counter()
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        await r.ping()
        await r.aclose()
        redis_connected = True
        redis_latency = int((time.perf_counter() - t0) * 1000)
    except Exception as e:
        logger.error("Redis connection check failed", error=str(e))

    chroma_ready = False
    chroma_latency = 0
    # 3. Verify ChromaDB
    t0 = time.perf_counter()
    try:
        import chromadb
        client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        client.heartbeat()
        chroma_ready = True
        chroma_latency = int((time.perf_counter() - t0) * 1000)
    except Exception as e:
        logger.warning("ChromaDB connection check failed", error=str(e))

    s3_connected = False
    s3_latency = 0
    # 4. Verify S3 Storage or Local Storage
    t0 = time.perf_counter()
    if settings.STORAGE_PROVIDER == "s3":
        try:
            import boto3
            # Simple check: instantiate S3 resource/client
            boto3.client("s3")
            s3_connected = True
            s3_latency = int((time.perf_counter() - t0) * 1000)
        except Exception:
            pass
    else:
        s3_connected = True
        s3_latency = int((time.perf_counter() - t0) * 1000)

    # 5. Pre-warm Clerk Auth JWKS
    try:
        from app.core.auth import prefetch_jwks
        await prefetch_jwks()
    except Exception:
        pass

    # 5. Check AI Models loading individually (Skip in production to avoid memory overhead)
    llm_ok = False
    llm_latency = 0
    llm_info = f"{settings.LLM_PROVIDER.capitalize()} ({settings.LLM_MODEL})"

    embeddings_ok = False
    embeddings_latency = 0
    embedding_info = f"{settings.EMBEDDING_PROVIDER.capitalize()} ({settings.EMBEDDING_MODEL})"

    reranker_ok = False
    reranker_latency = 0
    reranker_info = f"{settings.RERANKER_PROVIDER.capitalize()}" if settings.RERANKER_PROVIDER != "cross-encoder" else "cross-encoder/ms-marco-MiniLM-L-6-v2"

    if settings.DEBUG:
        # LLM
        t0 = time.perf_counter()
        try:
            from app.rag.factory import LLMFactory
            llm = LLMFactory.create()
            llm_ok = True
            llm_latency = int((time.perf_counter() - t0) * 1000)
            if hasattr(llm, "model") and isinstance(llm.model, str):
                prov = settings.LLM_PROVIDER.lower()
                prov_disp = "Groq" if prov == "groq" else ("OpenAI" if prov == "openai" else prov.capitalize())
                llm_info = f"{prov_disp} ({llm.model})"
        except Exception:
            pass

        # Embeddings
        t0 = time.perf_counter()
        try:
            from app.rag.factory import EmbeddingFactory
            embedding = EmbeddingFactory.create()
            embeddings_ok = True
            embeddings_latency = int((time.perf_counter() - t0) * 1000)
            model_str = None
            if hasattr(embedding, "model_name") and isinstance(embedding.model_name, str):
                model_str = embedding.model_name
            elif hasattr(embedding, "model") and isinstance(embedding.model, str):
                model_str = embedding.model

            if model_str:
                prov = settings.EMBEDDING_PROVIDER.lower()
                prov_disp = "HuggingFace" if prov in ("huggingface", "local") else ("OpenAI" if prov == "openai" else prov.capitalize())
                embedding_info = f"{prov_disp} ({model_str})"
        except Exception:
            pass

        # Reranker
        t0 = time.perf_counter()
        try:
            from app.rag.factory import RerankerFactory
            reranker = RerankerFactory.create()
            reranker_ok = True
            reranker_latency = int((time.perf_counter() - t0) * 1000)
            if hasattr(reranker, "model_name") and isinstance(reranker.model_name, str):
                reranker_info = reranker.model_name
        except Exception:
            pass
    else:
        # Production: Mark as lazy-loaded to prevent memory consumption on startup
        llm_ok = True
        embeddings_ok = True
        reranker_ok = True
        llm_info += " [Lazy]"
        embedding_info += " [Lazy]"
        reranker_info += " [Lazy]"

    total_latency_s = time.perf_counter() - start_total

    # Storage Info
    if settings.STORAGE_PROVIDER == "s3":
        storage_type = "Amazon S3"
        storage_label = "S3        "
    else:
        storage_type = "Local Filesystem"
        storage_label = "Storage   "

    # Environment with Color
    env_str = "🟡 Development" if settings.DEBUG else "🔴 Production"

    # Print beautiful status board
    print("\n" + "═" * 47)
    print("🐝 BetterBee v1.0.0")
    print(
        f"\n"
        f"Environment : {env_str}\n"
        f"Storage     : {storage_type}\n"
        f"Vector DB   : ChromaDB\n"
        f"LLM         : {llm_info}\n"
        f"Embeddings  : {embedding_info}\n"
        f"Reranker    : {reranker_info}\n"
        f"Workers     : 2\n"
    )
    print("Health")
    print("─" * 30)
    print(f"Database      {'✓' if db_connected else '✗'}  ({db_latency} ms)")
    print(f"Redis         {'✓' if redis_connected else '✗'}  ({redis_latency} ms)")
    print(f"{storage_label}    {'✓' if s3_connected else '✗'}  ({s3_latency} ms)")
    print(f"Chroma        {'✓' if chroma_ready else '✗'}  ({chroma_latency} ms)")

    if settings.DEBUG:
        print(f"LLM           {'✓' if llm_ok else '✗'}  ({llm_latency} ms)")
        print(f"Embeddings    {'✓' if embeddings_ok else '✗'}  ({embeddings_latency} ms)")
        print(f"Reranker      {'✓' if reranker_ok else '✗'}  ({reranker_latency} ms)")
    else:
        print("LLM           ✓  (Lazy)")
        print("Embeddings    ✓  (Lazy)")
        print("Reranker      ✓  (Lazy)")
    print()
    print(f"✓ Backend Ready ({total_latency_s:.2f} s)")
    allowed_origins = ", ".join(settings.CORS_ORIGINS)
    print(
        f"\n"
        f"API Bind    http://0.0.0.0:8000\n"
        f"Docs Path   /docs (API Swagger documentation)\n"
        f"Origins     {allowed_origins}"
    )
    print("═" * 47 + "\n")

    yield

    # Shutdown
    logger.info("Shutting down BetterBee")
    from app.db.engine import engine

    await engine.dispose()
    logger.info("Database engine disposed")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Private AI Workspace for trustworthy knowledge retrieval and document intelligence.",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        openapi_url="/openapi.json" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    # --- Middleware (order matters: first added = outermost) ---
    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Response-Time"],
    )

    # Request ID (must be before latency to ensure ID is available)
    app.add_middleware(RequestIDMiddleware)

    # Latency tracking
    app.add_middleware(LatencyMiddleware)

    # Authentication
    app.add_middleware(AuthMiddleware)

    # --- Exception Handlers ---
    @app.exception_handler(BetterBeeError)
    async def betterbee_error_handler(request: Request, exc: BetterBeeError) -> JSONResponse:
        """Handle all BetterBee application errors with consistent response format."""
        logger.error(
            "Application error",
            error_type=type(exc).__name__,
            message=exc.message,
            status_code=exc.status_code,
            path=request.url.path,
        )
        body: dict[str, Any] = {
            "error": {
                "type": type(exc).__name__,
                "message": exc.message,
            }
        }
        if exc.detail:
            body["error"]["detail"] = exc.detail
        return JSONResponse(status_code=exc.status_code, content=body)

    @app.exception_handler(Exception)
    async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
        """Catch-all for unhandled exceptions. Logs full traceback."""
        logger.exception(
            "Unhandled exception",
            error_type=type(exc).__name__,
            path=request.url.path,
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "type": "InternalServerError",
                    "message": "An unexpected error occurred",
                }
            },
        )

    # --- API Router ---
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    return app


# Application instance used by uvicorn
app = create_app()
