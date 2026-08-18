"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { X, UploadCloud, File, Loader2, CheckCircle2, AlertTriangle, Trash2 } from "lucide-react";

import { documentService } from "@/services/document-service";

interface UploadDialogProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "idle" | "uploading" | "confirming" | "success" | "error";
  error?: string;
}

interface StagedFile {
  id: string;
  file: File;
}

export function UploadDialog({ workspaceId, isOpen, onClose }: UploadDialogProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);

  const isUploading = files.some(
    (f) => f.status === "uploading" || f.status === "confirming"
  );
  const hasStaging = stagedFiles.length > 0;

  // Function to handle a single file upload
  const uploadFile = async (file: File, fileId: string) => {
    try {
      // 1. Initiate upload with backend
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: "uploading" } : f))
      );
      const fileType = file.name.split(".").pop() || "txt";
      
      const initiateRes = await documentService.initiateUpload(
        workspaceId,
        {
          filename: file.name,
          file_size: file.size,
          file_type: fileType,
        },
        getToken
      );

      // 2. Direct upload (PUT) to pre-signed S3 / Local mock URL
      await axios.put(initiateRes.upload_url, file, {
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || file.size)
          );
          setFiles((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, progress: percentCompleted } : f))
          );
        },
      });

      // 3. Confirm upload with backend
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: "confirming" } : f))
      );
      
      await documentService.confirmUpload(workspaceId, initiateRes.document_id, getToken);

      // Success
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: "success", progress: 100 } : f))
      );
    } catch (err: unknown) {
      console.error(`Upload failed for ${file.name}:`, err);
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: "error", error: errorMessage } : f))
      );
      toast.error(`Failed to upload ${file.name}`);
    }
  };

  const handleConfirmUpload = async () => {
    if (stagedFiles.length === 0) return;

    const filesToUpload = [...stagedFiles];
    // Remove the staged files from staging list as they are about to be uploaded
    setStagedFiles([]);

    // Process all uploads in parallel
    const uploadPromises = filesToUpload.map((staged) =>
      uploadFile(staged.file, staged.id)
    );

    await Promise.all(uploadPromises);
    
    // Invalidate queries to refresh document list
    queryClient.invalidateQueries({ queryKey: ["documents", workspaceId] });
    toast.success("Batch upload process completed.");
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setStagedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) => {
        const fileId = `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        return {
          id: fileId,
          name: file.name,
          size: file.size,
          progress: 0,
          status: "idle" as const,
          file,
        };
      });

      setFiles((prev) => [...prev, ...newFiles.map((item) => ({ id: item.id, name: item.name, size: item.size, progress: item.progress, status: item.status }))]);
      setStagedFiles((prev) => [...prev, ...newFiles.map(({ id, file }) => ({ id, file }))]);
    },
    []
  );

  const handleClose = () => {
    if (isUploading) return;
    setFiles([]);
    setStagedFiles([]);
    onClose();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isUploading,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/markdown": [".md"],
      "text/plain": [".txt"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg rounded-xl border border-[#272935] bg-[#18191f] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#23252d] pb-3.5">
          <div>
            <h3 className="text-sm font-semibold text-[#f4f4f6]">Upload Documents</h3>
            <p className="text-xs text-[#8b8e9b] mt-0.5">
              Files are parsed, chunked, and vectorized securely.
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-[#8b8e9b] hover:text-[#eaebee] p-1 hover:bg-[#1f212a] rounded transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 transition-all ${
            isUploading
              ? "border-[#23252d] bg-[#14151a] cursor-not-allowed opacity-50"
              : isDragActive
              ? "border-[#d48b38] bg-[#d48b38]/5 cursor-pointer"
              : "border-[#272935] hover:border-[#383b4b] bg-[#14151a]/60 hover:bg-[#14151a] cursor-pointer"
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="h-8 w-8 text-[#6c6f80]" />
          <span className="text-xs font-medium text-[#eaebee]">
            {isDragActive ? "Drop documents here..." : "Drag & drop files or click to browse"}
          </span>
          <span className="text-[10px] text-[#6c6f80]">
            Supports PDF, DOCX, Markdown, Text, Excel, PowerPoint (max 50MB)
          </span>
        </div>

        {/* Upload List */}
        {files.length > 0 && (
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            <h4 className="text-[11px] font-medium text-[#8b8e9b] uppercase tracking-wider">
              Selected Files
            </h4>
            {files.map((file) => (
              <div
                key={file.id}
                className="flex flex-col p-2.5 rounded border border-[#23252d] bg-[#14151a] gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <File className="h-3.5 w-3.5 text-[#d48b38] shrink-0" />
                    <span className="text-xs font-medium text-[#eaebee] truncate max-w-xs">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-[#6c6f80] shrink-0">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {file.status === "idle" && (
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        disabled={isUploading}
                        className="text-[#6c6f80] hover:text-rose-400 p-1 hover:bg-rose-500/10 rounded transition-colors cursor-pointer disabled:opacity-50"
                        title="Remove file"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {file.status === "uploading" && (
                      <span className="text-[10px] text-[#d48b38] font-mono">
                        {file.progress}%
                      </span>
                    )}
                    {file.status === "confirming" && (
                      <div className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 text-[#d48b38] animate-spin" />
                        <span className="text-[10px] text-[#8b8e9b]">Processing...</span>
                      </div>
                    )}
                    {file.status === "success" && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                    {file.status === "error" && (
                      <span title={file.error}>
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {file.status === "uploading" && (
                  <div className="h-1 w-full bg-[#23252d] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#d48b38] transition-all duration-200"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Confirmation Footer */}
        {hasStaging && (
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#23252d]">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="px-3 py-1.5 text-xs font-medium rounded border border-[#272935] bg-[#14151a] text-[#8b8e9b] hover:text-[#eaebee] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmUpload}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-[#f4f4f6] hover:bg-[#eaebee] text-[#121316] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-[#121316]" />
                  <span>Uploading...</span>
                </>
              ) : (
                <span>Confirm & Upload {stagedFiles.length} {stagedFiles.length === 1 ? "file" : "files"}</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
