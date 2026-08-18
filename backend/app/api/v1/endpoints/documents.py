"""
BetterBee — Document Ingestion & Management API Endpoints.
"""

import uuid

import structlog
from fastapi import APIRouter, BackgroundTasks, File, Request, UploadFile, status

from app.core.deps import CurrentUser, DocumentServiceDep
from app.schemas.document import (
    DocumentConfirmRequest,
    DocumentResponse,
    DocumentStatusResponse,
    DocumentUploadInitiateRequest,
    DocumentUploadInitiateResponse,
)

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.post(
    "/upload-direct",
    response_model=DocumentResponse,
    status_code=status.HTTP_200_OK,
)
async def upload_direct(
    workspace_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: CurrentUser = None,
    document_service: DocumentServiceDep = None,
    background_tasks: BackgroundTasks = None,
) -> DocumentResponse:
    """
    Direct multi-part upload endpoint. Receives file bytes, stores to S3, and starts ingestion.
    Acts as a reliable upload fallback when browser-direct CORS is restricted.
    """
    content = await file.read()
    filename = file.filename or "uploaded_document"
    file_type = filename.split(".")[-1].lower() if "." in filename else "txt"

    doc = await document_service.upload_direct(
        workspace_id=workspace_id,
        user_id=current_user.id,
        filename=filename,
        content=content,
        file_type=file_type,
        background_tasks=background_tasks,
    )
    return DocumentResponse.model_validate(doc)


@router.post(
    "/upload-url",
    response_model=DocumentUploadInitiateResponse,
    status_code=status.HTTP_200_OK,
)
async def initiate_upload(
    workspace_id: uuid.UUID,
    body: DocumentUploadInitiateRequest,
    current_user: CurrentUser,
    document_service: DocumentServiceDep,
    request: Request,
) -> DocumentUploadInitiateResponse:
    """
    Register document metadata and get a pre-signed URL to upload directly to S3.
    """
    doc, upload_url = await document_service.initiate_upload(
        workspace_id=workspace_id,
        user_id=current_user.id,
        filename=body.filename,
        file_size=body.file_size,
        file_type=body.file_type,
        base_url=str(request.base_url),
    )
    return DocumentUploadInitiateResponse(
        document_id=doc.id,
        upload_url=upload_url,
        s3_key=doc.s3_key,
    )


@router.post(
    "/confirm",
    response_model=DocumentResponse,
    status_code=status.HTTP_200_OK,
)
async def confirm_upload(
    workspace_id: uuid.UUID,
    body: DocumentConfirmRequest,
    current_user: CurrentUser,
    document_service: DocumentServiceDep,
    background_tasks: BackgroundTasks,
) -> DocumentResponse:
    """
    Confirm that the file has been successfully uploaded to S3.
    Updates the document status and prepares it for processing.
    """
    doc = await document_service.confirm_upload(
        document_id=body.document_id,
        user_id=current_user.id,
        background_tasks=background_tasks,
    )
    return DocumentResponse.model_validate(doc)


@router.get(
    "",
    response_model=list[DocumentResponse],
    status_code=status.HTTP_200_OK,
)
async def list_documents(
    workspace_id: uuid.UUID,
    current_user: CurrentUser,
    document_service: DocumentServiceDep,
    offset: int = 0,
    limit: int = 50,
) -> list[DocumentResponse]:
    """List all documents uploaded to a specific workspace."""
    docs, _ = await document_service.list_documents_for_workspace(
        workspace_id=workspace_id,
        user_id=current_user.id,
        offset=offset,
        limit=limit,
    )
    return [DocumentResponse.model_validate(d) for d in docs]


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    status_code=status.HTTP_200_OK,
)
async def get_document(
    workspace_id: uuid.UUID,
    document_id: uuid.UUID,
    current_user: CurrentUser,
    document_service: DocumentServiceDep,
) -> DocumentResponse:
    """Retrieve metadata of a specific document in a workspace."""
    doc = await document_service.get_document_by_id(
        document_id=document_id,
        user_id=current_user.id,
    )
    return DocumentResponse.model_validate(doc)


@router.get(
    "/{document_id}/download-url",
    response_model=str,
    status_code=status.HTTP_200_OK,
)
async def get_download_url(
    workspace_id: uuid.UUID,
    document_id: uuid.UUID,
    current_user: CurrentUser,
    document_service: DocumentServiceDep,
    request: Request,
) -> str:
    """Get a temporary download URL for the document."""
    return await document_service.get_document_download_url(
        document_id=document_id,
        user_id=current_user.id,
        base_url=str(request.base_url),
    )


@router.get(
    "/{document_id}/status",
    response_model=DocumentStatusResponse,
    status_code=status.HTTP_200_OK,
)
async def get_document_status(
    workspace_id: uuid.UUID,
    document_id: uuid.UUID,
    current_user: CurrentUser,
    document_service: DocumentServiceDep,
) -> DocumentStatusResponse:
    """Get the current processing status of a document."""
    doc = await document_service.get_document_by_id(
        document_id=document_id,
        user_id=current_user.id,
    )
    return DocumentStatusResponse.model_validate(doc)


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_document(
    workspace_id: uuid.UUID,
    document_id: uuid.UUID,
    current_user: CurrentUser,
    document_service: DocumentServiceDep,
) -> None:
    """Delete a document from workspace and storage."""
    await document_service.delete_document(
        document_id=document_id,
        user_id=current_user.id,
    )
