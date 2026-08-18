"""
BetterBee — Core Configuration.

Centralized settings management using pydantic-settings.
All configuration is loaded from environment variables with sensible defaults.
Provider-specific keys are only required when that provider is active.
"""

from functools import lru_cache
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- App ---
    APP_NAME: str = "BetterBee"
    APP_VERSION: str = "0.1.0"
    API_BASE_URL: str = "http://localhost:8000"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: list[str] | str = ["http://localhost:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            v_stripped = v.strip()
            if v_stripped.startswith("[") and v_stripped.endswith("]"):
                import json
                try:
                    return json.loads(v_stripped)
                except Exception:
                    pass
            return [origin.strip() for origin in v_stripped.split(",") if origin.strip()]
        elif isinstance(v, list):
            return [str(item).strip() for item in v if str(item).strip()]
        return v

    # --- Database ---
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/betterbee"
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_ECHO: bool = False

    # --- Background Processing ---
    # options: background_tasks | celery
    ASYNC_MODE: str = "background_tasks"

    # --- Redis ---
    REDIS_URL: str = "redis://localhost:6379/0"

    # --- AWS S3 / Local Storage ---
    STORAGE_PROVIDER: str = "local"     # local | s3
    S3_BUCKET_NAME: str = "betterbee-documents"
    S3_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    S3_ENDPOINT_URL: str | None = None  # For MinIO compatibility
    S3_PRESIGNED_URL_EXPIRY: int = 3600  # 1 hour
    LOCAL_STORAGE_DIR: str = "./storage_data"

    @field_validator("S3_BUCKET_NAME", mode="before")
    @classmethod
    def parse_s3_bucket(cls, v: Any, info: Any) -> str:
        if v and str(v).strip():
            return str(v).strip()
        import os
        return os.getenv("AWS_STORAGE_BUCKET_NAME", "betterbee-documents").strip()

    @field_validator("S3_REGION", mode="before")
    @classmethod
    def parse_s3_region(cls, v: Any, info: Any) -> str:
        if v and str(v).strip():
            return str(v).strip()
        import os
        return os.getenv("AWS_REGION", os.getenv("AWS_DEFAULT_REGION", "us-east-1")).strip()

    # --- Clerk Authentication ---
    CLERK_SECRET_KEY: str = ""
    CLERK_PUBLISHABLE_KEY: str = ""
    CLERK_JWKS_URL: str = ""

    # --- AI Providers (Interface-based) ---
    # Active LLM provider: groq | ollama | openai | anthropic | gemini
    LLM_PROVIDER: str = "groq"
    LLM_MODEL: str = "groq/compound-mini"

    # Active embedding provider: ollama | openai | gemini | huggingface
    EMBEDDING_PROVIDER: str = "ollama"
    EMBEDDING_MODEL: str = "nomic-embed-text"

    # Provider-specific API keys (only needed for active provider)
    GROQ_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None
    GOOGLE_API_KEY: str | None = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # --- ChromaDB (Persistent Client) ---
    CHROMA_PERSIST_DIR: str = "./chroma_data"
    CHROMA_COLLECTION_PREFIX: str = "workspace_"

    # --- RAG Configuration ---
    RERANKER_PROVIDER: str = "cross-encoder"  # cross-encoder | none
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    RETRIEVAL_TOP_K: int = 20
    RERANK_TOP_K: int = 5

    # --- Upload Limits ---
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_FILE_TYPES: list[str] = ["pdf", "docx", "md", "txt", "xlsx", "pptx"]


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance. Call once at startup."""
    return Settings()
