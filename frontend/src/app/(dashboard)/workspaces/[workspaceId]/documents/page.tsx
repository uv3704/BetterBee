"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  Upload,
  RefreshCw,
  Trash2,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  MessageSquare,
  HardDrive,
  Layers,
  FileCheck2,
} from "lucide-react";

import { documentService } from "@/services/document-service";
import { UploadDialog } from "@/components/documents/upload-dialog";

export default function WorkspaceDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load documents
  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ["documents", workspaceId],
    queryFn: () => documentService.listDocuments(workspaceId, getToken),
    enabled: !!workspaceId,
  });

  // Poll for document status if any are processing
  const anyProcessing = documents.some(
    (doc) => doc.status === "uploaded" || doc.status === "processing"
  );

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (anyProcessing) {
      intervalId = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ["documents", workspaceId] });
      }, 4000); // Poll every 4s
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [anyProcessing, workspaceId, queryClient]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (documentId: string) =>
      documentService.deleteDocument(workspaceId, documentId, getToken),
    onSuccess: () => {
      toast.success("Document deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["documents", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to delete document");
    },
  });

  const handleDelete = (docId: string, filename: string) => {
    if (confirm(`Are you sure you want to delete "${filename}"? This will also remove all its vectors and S3 files.`)) {
      deleteMutation.mutate(docId);
    }
  };

  const handleAskInChat = (filename: string) => {
    const prompt = `Tell me about ${filename}`;
    router.push(`/workspaces/${workspaceId}/chat?initialMessage=${encodeURIComponent(prompt)}`);
  };

  const filteredDocs = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute metrics
  const totalChunks = documents.reduce((acc, doc) => acc + (doc.chunk_count || 0), 0);
  const totalSizeBytes = documents.reduce((acc, doc) => acc + (doc.file_size || 0), 0);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(1);
  const readyCount = documents.filter((d) => d.status === "ready").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pt-1 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23252d] pb-5">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-[#f4f4f6]">
            Document Library
          </h1>
          <p className="text-xs text-[#8b8e9b] mt-0.5">
            Manage your workspace documents, monitor chunk indexing, and launch direct AI queries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            className="flex h-8 w-8 items-center justify-center rounded border border-[#272935] bg-[#18191f] hover:bg-[#1f212a] text-[#8b8e9b] hover:text-[#eaebee] transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${anyProcessing ? "animate-spin text-[#d48b38]" : ""}`} />
          </button>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded bg-[#f4f4f6] hover:bg-[#eaebee] text-[#121316] transition-colors shadow-xs cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload New Files</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg border border-[#23252d] bg-[#18191f]">
          <div className="flex items-center gap-2 text-[#8b8e9b] text-[11px]">
            <FileText className="h-3.5 w-3.5 text-[#d48b38]" />
            <span>Total Files</span>
          </div>
          <p className="text-lg font-semibold text-[#f4f4f6] mt-1 font-mono">{documents.length}</p>
        </div>

        <div className="p-3.5 rounded-lg border border-[#23252d] bg-[#18191f]">
          <div className="flex items-center gap-2 text-[#8b8e9b] text-[11px]">
            <Layers className="h-3.5 w-3.5 text-emerald-400" />
            <span>Indexed Vectors</span>
          </div>
          <p className="text-lg font-semibold text-[#f4f4f6] mt-1 font-mono">{totalChunks} chunks</p>
        </div>

        <div className="p-3.5 rounded-lg border border-[#23252d] bg-[#18191f]">
          <div className="flex items-center gap-2 text-[#8b8e9b] text-[11px]">
            <HardDrive className="h-3.5 w-3.5 text-sky-400" />
            <span>Storage Volume</span>
          </div>
          <p className="text-lg font-semibold text-[#f4f4f6] mt-1 font-mono">{totalSizeMB} MB</p>
        </div>

        <div className="p-3.5 rounded-lg border border-[#23252d] bg-[#18191f]">
          <div className="flex items-center gap-2 text-[#8b8e9b] text-[11px]">
            <FileCheck2 className="h-3.5 w-3.5 text-amber-400" />
            <span>Ingestion Health</span>
          </div>
          <p className="text-lg font-semibold text-[#f4f4f6] mt-1 font-mono">
            {documents.length > 0 ? `${Math.round((readyCount / documents.length) * 100)}% Ready` : "Ready"}
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#a0a3b1]" />
          <input
            type="text"
            placeholder="Search documents by filename..."
            aria-label="Search documents by filename"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#14151a] border border-[#272935] text-[#eaebee] rounded px-3 py-1.5 pl-9 text-xs focus:outline-hidden focus:border-[#3d4152] placeholder:text-[#a0a3b1]"
          />
        </div>
      </div>

      {/* Library Table Card */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 rounded-lg border border-[#23252d] bg-[#18191f]">
          <Loader2 className="h-6 w-6 text-[#8b8e9b] animate-spin" />
          <span className="text-xs text-[#8b8e9b] mt-3">Loading document library...</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-14 rounded-lg border border-dashed border-[#272935] bg-[#18191f]/40">
          <FileText className="h-10 w-10 text-[#a0a3b1] mb-3" />
          <h3 className="text-sm font-medium text-[#eaebee]">No documents found</h3>
          <p className="text-xs text-[#8b8e9b] mt-0.5 max-w-xs mx-auto">
            {searchQuery ? "No documents match your search query." : "Upload documents to this workspace to index and query."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="mt-4 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-[#f4f4f6] hover:bg-[#eaebee] text-[#121316] transition-colors cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Files</span>
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-[#23252d] bg-[#18191f] overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#23252d] text-[10px] font-medium font-mono uppercase tracking-wider text-[#8b8e9b] bg-[#15161b]">
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Date Uploaded</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#23252d]/70 text-xs text-[#c7cad6]">
              {filteredDocs.map((doc) => {
                const sizeMb = doc.file_size / (1024 * 1024);
                const sizeDisplay = sizeMb >= 0.1 ? `${sizeMb.toFixed(1)} MB` : `${(doc.file_size / 1024).toFixed(0)} KB`;
                const ext = doc.filename.split(".").pop()?.toUpperCase() || doc.file_type.toUpperCase();

                return (
                  <tr key={doc.id} className="hover:bg-[#1f212a]/50 transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#14151a] border border-[#272935] text-[#d48b38]">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-[#eaebee] block truncate group-hover:text-white transition-colors">
                            {doc.filename}
                          </span>
                          <span className="text-[10px] text-[#8b8e9b] font-mono block">
                            {doc.chunk_count ? `${doc.chunk_count} vector chunks` : "Pending chunking"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#a0a3b1]">
                      <span className="px-1.5 py-0.5 rounded bg-[#14151a] border border-[#272935]">
                        {ext}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#a0a3b1]">{sizeDisplay}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#a0a3b1]">
                      {new Date(doc.created_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      {doc.status === "ready" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/30 text-emerald-400 border border-emerald-900/40">
                          <CheckCircle className="h-3 w-3" />
                          Indexed
                        </span>
                      )}
                      {doc.status === "processing" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/30 text-amber-400 border border-amber-900/40">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Processing
                        </span>
                      )}
                      {doc.status === "failed" && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/30 text-rose-400 border border-rose-900/40 cursor-help"
                          title={doc.error_message || "Ingestion failed"}
                        >
                          <XCircle className="h-3 w-3" />
                          Failed
                        </span>
                      )}
                      {doc.status === "uploaded" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#241f17] text-[#d48b38] border border-[#3d2e18]">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Queued
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {doc.status === "ready" && (
                          <button
                            onClick={() => handleAskInChat(doc.filename)}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border border-[#272935] bg-[#14151a] hover:bg-[#1f212a] text-[#8b8e9b] hover:text-[#eaebee] transition-colors cursor-pointer"
                            title="Ask questions about this document in Chat"
                          >
                            <MessageSquare className="h-3 w-3 text-[#d48b38]" />
                            <span>Ask in Chat</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(doc.id, doc.filename)}
                          aria-label={`Delete ${doc.filename}`}
                          className="text-[#a0a3b1] hover:text-rose-400 p-1.5 hover:bg-rose-500/10 rounded transition-colors inline-flex cursor-pointer"
                          title="Delete document and purge vectors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Dialog */}
      <UploadDialog
        workspaceId={workspaceId}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}
