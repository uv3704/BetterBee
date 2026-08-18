"""
BetterBee — Local Mock Storage API.

Simulates S3 pre-signed upload and download URL behavior.
Only active/used when STORAGE_PROVIDER = "local".
"""

import os

import structlog
from fastapi import APIRouter, Request, Response, status
from fastapi.responses import FileResponse

from app.core.deps import StorageProviderDep
from app.core.exceptions import NotFoundError
from app.services.storage_service import LocalStorageProvider

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.put("/upload")
async def local_upload(
    key: str,
    request: Request,
    storage: StorageProviderDep,
) -> Response:
    """
    Simulates S3 direct PUT upload using raw body bytes.
    Writes the uploaded bytes to the local storage directory.
    """
    if not isinstance(storage, LocalStorageProvider):
        return Response(
            status_code=status.HTTP_400_BAD_REQUEST,
            content="Local storage provider is not active",
        )

    try:
        # Read raw stream bytes from request body
        content = await request.body()
        await storage.upload_object(key, content)
        logger.info("Local storage mock upload complete", key=key, size=len(content))
        return Response(status_code=status.HTTP_200_OK)
    except Exception as e:
        logger.error("Local mock upload failed", error=str(e), key=key)
        return Response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=str(e),
        )


@router.get("/download")
async def local_download(
    key: str,
    storage: StorageProviderDep,
) -> FileResponse:
    """
    Simulates S3 pre-signed download by returning a FileResponse of the local file.
    """
    if not isinstance(storage, LocalStorageProvider):
        raise NotFoundError("Local storage provider is not active")

    path = storage._get_path(key)
    if not os.path.exists(path):
        raise NotFoundError("File", key)

    filename = os.path.basename(key)
    # Extract original filename if it contains a UUID prefix
    # e.g., workspaces/{wid}/documents/{uuid}/filename.pdf -> filename.pdf
    return FileResponse(
        path=path,
        media_type="application/octet-stream",
        filename=filename,
    )
