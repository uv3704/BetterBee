/**
 * BetterBee — Document Ingestion & Management Services.
 */

import { authenticatedRequest } from "@/lib/api";

export interface DocumentInfo {
  id: string;
  workspace_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  s3_key: string;
  status: "uploaded" | "processing" | "ready" | "failed";
  chunk_count: number;
  error_message: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadInitiatePayload {
  filename: string;
  file_size: number;
  file_type: string;
}

export interface UploadInitiateResponse {
  document_id: string;
  upload_url: string;
  s3_key: string;
}

export const documentService = {
  /**
   * Upload file directly via multipart form data to backend (bypasses browser S3 CORS limitations).
   */
  async uploadDirect(
    workspaceId: string,
    file: File,
    getToken: () => Promise<string | null>,
    onProgress?: (progress: number) => void,
  ): Promise<DocumentInfo> {
    const formData = new FormData();
    formData.append("file", file);

    return authenticatedRequest<DocumentInfo>(
      {
        url: `/workspaces/${workspaceId}/documents/upload-direct`,
        method: "POST",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      },
      getToken,
    );
  },

  /**
   * Initiate document upload to receive a pre-signed URL.
   */
  async initiateUpload(
    workspaceId: string,
    payload: UploadInitiatePayload,
    getToken: () => Promise<string | null>,
  ): Promise<UploadInitiateResponse> {
    return authenticatedRequest<UploadInitiateResponse>(
      {
        url: `/workspaces/${workspaceId}/documents/upload-url`,
        method: "POST",
        data: payload,
      },
      getToken,
    );
  },

  /**
   * Confirm document upload after upload URL PUT finishes.
   */
  async confirmUpload(
    workspaceId: string,
    documentId: string,
    getToken: () => Promise<string | null>,
  ): Promise<DocumentInfo> {
    return authenticatedRequest<DocumentInfo>(
      {
        url: `/workspaces/${workspaceId}/documents/confirm`,
        method: "POST",
        data: { document_id: documentId },
      },
      getToken,
    );
  },

  /**
   * List all documents in a workspace.
   */
  async listDocuments(
    workspaceId: string,
    getToken: () => Promise<string | null>,
  ): Promise<DocumentInfo[]> {
    return authenticatedRequest<DocumentInfo[]>(
      {
        url: `/workspaces/${workspaceId}/documents`,
        method: "GET",
      },
      getToken,
    );
  },

  /**
   * Fetch current processing status of a document.
   */
  async getDocumentStatus(
    workspaceId: string,
    documentId: string,
    getToken: () => Promise<string | null>,
  ): Promise<{ id: string; status: string; chunk_count: number; error_message: string | null }> {
    return authenticatedRequest<{
      id: string;
      status: string;
      chunk_count: number;
      error_message: string | null;
    }>(
      {
        url: `/workspaces/${workspaceId}/documents/${documentId}/status`,
        method: "GET",
      },
      getToken,
    );
  },

  /**
   * Delete a document.
   */
  async deleteDocument(
    workspaceId: string,
    documentId: string,
    getToken: () => Promise<string | null>,
  ): Promise<void> {
    return authenticatedRequest<void>(
      {
        url: `/workspaces/${workspaceId}/documents/${documentId}`,
        method: "DELETE",
      },
      getToken,
    );
  },
};
