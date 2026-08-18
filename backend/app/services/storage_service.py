"""
BetterBee — Storage Service.

Abstracts file storage operations to support both local filesystem storage
(for zero-dependency offline local development) and AWS S3 (for production).
"""

import os
from abc import ABC, abstractmethod
from typing import Any

import boto3
import structlog
from botocore.config import Config

from app.core.config import get_settings

logger = structlog.get_logger(__name__)


class StorageProvider(ABC):
    """Abstract interface defining required file storage operations."""

    @abstractmethod
    async def generate_upload_url(self, key: str, expires_in: int = 3600, base_url: str | None = None) -> str:
        """Generate a pre-signed URL to upload a file directly."""
        pass

    @abstractmethod
    async def generate_download_url(self, key: str, expires_in: int = 3600, base_url: str | None = None) -> str:
        """Generate a pre-signed URL to download a file."""
        pass

    @abstractmethod
    async def delete_prefix(self, prefix: str) -> None:
        """Delete all objects under a given prefix/folder."""
        pass


class S3StorageProvider(StorageProvider):
    """S3-compatible storage implementation using boto3."""

    def __init__(self) -> None:
        settings = get_settings()
        self.bucket = settings.S3_BUCKET_NAME

        # Configure boto3 client
        s3_config = Config(
            signature_version="s3v4",
            region_name=settings.S3_REGION,
        )

        client_kwargs: dict[str, Any] = {
            "config": s3_config,
            "region_name": settings.S3_REGION,
        }

        if settings.AWS_ACCESS_KEY_ID:
            client_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
        if settings.AWS_SECRET_ACCESS_KEY:
            client_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY

        # Override endpoint for MinIO if provided, otherwise default to regional AWS S3 endpoint
        if settings.S3_ENDPOINT_URL:
            client_kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
        else:
            client_kwargs["endpoint_url"] = f"https://s3.{settings.S3_REGION}.amazonaws.com"

        self.client = boto3.client("s3", **client_kwargs)

    async def generate_upload_url(self, key: str, expires_in: int = 3600, base_url: str | None = None) -> str:
        try:
            return self.client.generate_presigned_url(
                ClientMethod="put_object",
                Params={"Bucket": self.bucket, "Key": key},
                ExpiresIn=expires_in,
            )
        except Exception as e:
            logger.error("Failed to generate S3 pre-signed upload URL", error=str(e), key=key)
            raise

    async def generate_download_url(self, key: str, expires_in: int = 3600, base_url: str | None = None) -> str:
        try:
            return self.client.generate_presigned_url(
                ClientMethod="get_object",
                Params={"Bucket": self.bucket, "Key": key},
                ExpiresIn=expires_in,
            )
        except Exception as e:
            logger.error("Failed to generate S3 pre-signed download URL", error=str(e), key=key)
            raise

    async def delete_object(self, key: str) -> None:
        try:
            self.client.delete_object(Bucket=self.bucket, Key=key)
            logger.info("Deleted object from S3", key=key)
        except Exception as e:
            logger.error("Failed to delete object from S3", error=str(e), key=key)
            raise

    async def delete_prefix(self, prefix: str) -> None:
        try:
            paginator = self.client.get_paginator("list_objects_v2")
            for page in paginator.paginate(Bucket=self.bucket, Prefix=prefix):
                if "Contents" in page:
                    delete_objects = [{"Key": obj["Key"]} for obj in page["Contents"]]
                    if delete_objects:
                        self.client.delete_objects(Bucket=self.bucket, Delete={"Objects": delete_objects})
            logger.info("Deleted all S3 objects under prefix", prefix=prefix)
        except Exception as e:
            logger.warning("Failed to delete objects under S3 prefix", prefix=prefix, error=str(e))

    async def get_object(self, key: str) -> bytes:
        try:
            response = self.client.get_object(Bucket=self.bucket, Key=key)
            return response["Body"].read()
        except Exception as e:
            logger.error("Failed to fetch object from S3", error=str(e), key=key)
            raise

    async def upload_object(self, key: str, content: bytes) -> None:
        try:
            self.client.put_object(Bucket=self.bucket, Key=key, Body=content)
            logger.debug("Uploaded object to S3", key=key)
        except Exception as e:
            logger.error("Failed to upload object to S3", error=str(e), key=key)
            raise


class LocalStorageProvider(StorageProvider):
    """Local filesystem storage implementation for mock pre-signed URLs."""

    def __init__(self) -> None:
        settings = get_settings()
        self.storage_dir = os.path.abspath(settings.LOCAL_STORAGE_DIR)
        os.makedirs(self.storage_dir, exist_ok=True)
        logger.info("Local storage provider initialized", storage_dir=self.storage_dir)

    def _get_path(self, key: str) -> str:
        # Prevent directory traversal attacks
        safe_key = os.path.basename(key)
        return os.path.join(self.storage_dir, safe_key)

    async def generate_upload_url(self, key: str, expires_in: int = 3600, base_url: str | None = None) -> str:
        settings = get_settings()
        resolved_base = base_url or settings.API_BASE_URL or "http://localhost:8000"
        resolved_base = resolved_base.rstrip("/")
        return f"{resolved_base}{settings.API_V1_PREFIX}/storage/upload?key={key}"

    async def generate_download_url(self, key: str, expires_in: int = 3600, base_url: str | None = None) -> str:
        settings = get_settings()
        resolved_base = base_url or settings.API_BASE_URL or "http://localhost:8000"
        resolved_base = resolved_base.rstrip("/")
        return f"{resolved_base}{settings.API_V1_PREFIX}/storage/download?key={key}"

    async def delete_object(self, key: str) -> None:
        path = self._get_path(key)
        if os.path.exists(path):
            os.remove(path)
            logger.info("Deleted local file", path=path)

    async def delete_prefix(self, prefix: str) -> None:
        # Local mock implementation
        safe_prefix = os.path.basename(prefix)
        for fname in os.listdir(self.storage_dir):
            if fname.startswith(safe_prefix):
                fpath = os.path.join(self.storage_dir, fname)
                if os.path.isfile(fpath):
                    os.remove(fpath)

    async def get_object(self, key: str) -> bytes:
        path = self._get_path(key)
        if not os.path.exists(path):
            raise FileNotFoundError(f"File not found: {key}")
        with open(path, "rb") as f:
            return f.read()

    async def upload_object(self, key: str, content: bytes) -> None:
        path = self._get_path(key)
        with open(path, "wb") as f:
            f.write(content)
        logger.debug("Uploaded local file", path=path)


def get_storage_provider() -> StorageProvider:
    """Factory to get the configured storage provider instance."""
    settings = get_settings()
    if settings.STORAGE_PROVIDER == "s3":
        return S3StorageProvider()
    return LocalStorageProvider()
