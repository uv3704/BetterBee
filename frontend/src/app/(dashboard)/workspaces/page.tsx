"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  Plus,
  FolderOpen,
  Database,
  Layers,
  Clock,
  MessageSquare,
  FileText,
  Trash2,
  AlertTriangle,
  Loader2,
  Search,
  Settings,
} from "lucide-react";

import { useWorkspaceStore, type Workspace } from "@/stores/workspace-store";
import { workspaceService } from "@/services/workspace-service";
import { analyticsService } from "@/services/analytics-service";

export default function WorkspacesPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeWorkspace, setActiveWorkspace } = useWorkspaceStore();
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "has_docs" | "empty">("all");

  // Load workspaces list
  const { data: workspaces = [], isLoading: isWorkspacesLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => workspaceService.listWorkspaces(getToken),
  });

  // Load database analytics
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => analyticsService.getAnalytics(getToken),
  });

  // Delete Workspace Mutation
  const deleteMutation = useMutation({
    mutationFn: (wsId: string) => workspaceService.deleteWorkspace(wsId, getToken),
    onSuccess: () => {
      toast.success("Workspace deleted successfully.");
      if (activeWorkspace?.id === deletingWorkspace?.id) {
        setActiveWorkspace(null);
      }
      setDeletingWorkspace(null);
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (error) => {
      console.error("Failed to delete workspace:", error);
      toast.error("Failed to delete workspace. Please try again.");
    },
  });

  const handleDeleteConfirm = () => {
    if (deletingWorkspace) {
      deleteMutation.mutate(deletingWorkspace.id);
    }
  };

  const handleSelectWorkspace = (ws: Workspace, destination: "chat" | "documents" | "search" | "settings" = "chat") => {
    setActiveWorkspace(ws);
    router.push(`/workspaces/${ws.id}/${destination}`);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const dm = 1;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const isLoading = isWorkspacesLoading || isAnalyticsLoading;

  // Filter workspaces based on search query and filter chips
  const filteredWorkspaces = workspaces.filter((ws) => {
    const matchesSearch =
      ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ws.description && ws.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === "has_docs") return ws.document_count > 0;
    if (filterType === "empty") return ws.document_count === 0;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-2 px-1 sm:px-3">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23252d] pb-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-[#f4f4f6]">
            Workspaces Dashboard
          </h1>
          <p className="text-xs text-[#8b8e9b] mt-0.5">
            Manage your document collections, search vector indexes, and query history.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/workspaces/new"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[#1e2029] hover:bg-[#272935] text-[#f4f4f6] border border-[#2c2e3a] transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-[#d48b38]" />
            <span>New Workspace</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Workspaces */}
        <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-[#a0a3b1]">Active Workspaces</span>
            <div className="text-xl font-semibold text-[#f4f4f6]">
              {isLoading ? "-" : analytics?.total_workspaces}
            </div>
            <span className="text-[10px] text-[#a0a3b1] block">
              {workspaces.length} registered
            </span>
          </div>
          <div className="h-8 w-8 rounded bg-[#14151a] border border-[#23252d] flex items-center justify-center text-[#a0a3b1]">
            <Layers className="h-4 w-4" />
          </div>
        </div>

        {/* Total Documents / Storage */}
        <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-[#a0a3b1]">Indexed Documents</span>
            <div className="text-xl font-semibold text-[#f4f4f6]">
              {isLoading ? "-" : analytics?.total_documents}
            </div>
            <span className="text-[10px] text-[#a0a3b1] block">
              {isLoading ? "" : `${analytics?.total_chunks} chunks · ${formatBytes(analytics?.total_storage_bytes || 0)}`}
            </span>
          </div>
          <div className="h-8 w-8 rounded bg-[#14151a] border border-[#23252d] flex items-center justify-center text-[#a0a3b1]">
            <Database className="h-4 w-4" />
          </div>
        </div>

        {/* Queries executed */}
        <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-[#a0a3b1]">Total Queries</span>
            <div className="text-xl font-semibold text-[#f4f4f6]">
              {isLoading ? "-" : analytics?.total_queries}
            </div>
            <span className="text-[10px] text-[#a0a3b1] block">
              {isLoading ? "" : `${analytics?.total_tokens.toLocaleString()} tokens streamed`}
            </span>
          </div>
          <div className="h-8 w-8 rounded bg-[#14151a] border border-[#23252d] flex items-center justify-center text-[#a0a3b1]">
            <MessageSquare className="h-4 w-4" />
          </div>
        </div>

        {/* Latency */}
        <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-[#a0a3b1]">Avg Latency</span>
            <div className="text-xl font-semibold text-[#f4f4f6]">
              {isLoading ? "-" : `${analytics?.avg_latency_ms.toFixed(0)} ms`}
            </div>
            <span className="text-[10px] text-[#d48b38] block font-mono">
              Groq Llama-3 LPU
            </span>
          </div>
          <div className="h-8 w-8 rounded bg-[#14151a] border border-[#23252d] flex items-center justify-center text-[#a0a3b1]">
            <Clock className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Main Section split: Workspaces vs Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Workspaces List */}
        <div className="lg:col-span-2 space-y-3">
          {/* Workspaces Header + Search Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-medium text-[#a0a3b1] uppercase tracking-wider">
                Workspaces ({filteredWorkspaces.length})
              </h2>
              {/* Filter chips */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilterType("all")}
                  aria-label="Show all workspaces"
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                    filterType === "all"
                      ? "bg-[#272935] text-[#f4f4f6] font-medium"
                      : "text-[#a0a3b1] hover:text-[#f4f4f6]"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType("has_docs")}
                  aria-label="Filter workspaces with documents"
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                    filterType === "has_docs"
                      ? "bg-[#272935] text-[#f4f4f6] font-medium"
                      : "text-[#a0a3b1] hover:text-[#f4f4f6]"
                  }`}
                >
                  With Docs
                </button>
                <button
                  onClick={() => setFilterType("empty")}
                  aria-label="Filter empty workspaces"
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                    filterType === "empty"
                      ? "bg-[#272935] text-[#f4f4f6] font-medium"
                      : "text-[#a0a3b1] hover:text-[#f4f4f6]"
                  }`}
                >
                  Empty
                </button>
              </div>
            </div>

            {/* Live Search Input */}
            {workspaces.length > 2 && (
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#a0a3b1]" />
                <input
                  type="text"
                  placeholder="Filter workspaces..."
                  aria-label="Filter workspaces"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#18191f] border border-[#272935] rounded-md pl-8 pr-2.5 py-1 text-xs text-[#eaebee] placeholder:text-[#a0a3b1] focus:outline-hidden focus:border-[#3d4152] transition-colors"
                />
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-44 rounded-lg border border-[#23252d] bg-[#18191f] animate-pulse"
                />
              ))}
            </div>
          ) : workspaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg border border-dashed border-[#272935] bg-[#18191f]/50 max-w-md mx-auto">
              <FolderOpen className="h-8 w-8 text-[#6c6f80] mb-2" />
              <h3 className="text-sm font-medium text-[#eaebee]">No workspaces yet</h3>
              <p className="text-xs text-[#8b8e9b] mt-0.5 mb-4">
                Create a workspace to upload files and start querying.
              </p>
              <Link
                href="/workspaces/new"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-[#f4f4f6] text-[#121316] hover:bg-[#eaebee] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Workspace</span>
              </Link>
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            <div className="p-8 text-center rounded-lg border border-[#23252d] bg-[#18191f] text-xs text-[#8b8e9b]">
              No workspaces matching &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredWorkspaces.map((workspace) => {
                const isActive = activeWorkspace?.id === workspace.id;
                return (
                  <div
                    key={workspace.id}
                    className={`group relative flex flex-col justify-between rounded-lg p-4 border transition-all ${
                      isActive
                        ? "bg-[#1c1e27] border-[#3b3e4e] shadow-xs"
                        : "bg-[#18191f] border-[#23252d] hover:border-[#303342] hover:bg-[#1a1c24]"
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div
                          onClick={() => handleSelectWorkspace(workspace, "chat")}
                          className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                        >
                          <div className="flex items-center justify-center h-7 w-7 rounded bg-[#14151a] border border-[#272935] text-sm shrink-0">
                            {workspace.icon || "🐝"}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium text-[#eaebee] group-hover:text-[#f4f4f6] transition-colors text-xs truncate">
                              {workspace.name}
                            </h3>
                            <span className="text-[10px] text-[#a0a3b1] font-mono block truncate">
                              /{workspace.slug}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingWorkspace(workspace);
                          }}
                          aria-label={`Delete workspace ${workspace.name}`}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/10 text-[#a0a3b1] hover:text-rose-400 transition-all cursor-pointer shrink-0"
                          title="Delete workspace"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Description */}
                      <p
                        onClick={() => handleSelectWorkspace(workspace, "chat")}
                        className="text-xs text-[#8b8e9b] mt-2.5 line-clamp-2 leading-relaxed cursor-pointer min-h-[32px]"
                      >
                        {workspace.description || "No description provided."}
                      </p>
                    </div>

                    {/* Card Footer with Direct Tool Buttons */}
                    <div className="border-t border-[#23252d] pt-2.5 mt-3 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 text-[11px] text-[#a0a3b1]">
                        <FolderOpen className="h-3 w-3" />
                        {workspace.document_count} files
                      </span>

                      {/* Quick Action Tool Icons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSelectWorkspace(workspace, "chat")}
                          aria-label={`Open chat for ${workspace.name}`}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-[#14151a] hover:bg-[#20222b] text-[11px] text-[#eaebee] border border-[#272935] hover:border-[#353847] transition-colors cursor-pointer"
                          title="Open Chat"
                        >
                          <MessageSquare className="h-3 w-3 text-[#d48b38]" />
                          <span>Chat</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectWorkspace(workspace, "documents")}
                          aria-label={`Open documents for ${workspace.name}`}
                          className="p-1 rounded bg-[#14151a] hover:bg-[#20222b] text-[#a0a3b1] hover:text-[#eaebee] border border-[#272935] transition-colors cursor-pointer"
                          title="Documents"
                        >
                          <FolderOpen className="h-3 w-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectWorkspace(workspace, "search")}
                          aria-label={`Search vector index for ${workspace.name}`}
                          className="p-1 rounded bg-[#14151a] hover:bg-[#20222b] text-[#a0a3b1] hover:text-[#eaebee] border border-[#272935] transition-colors cursor-pointer"
                          title="Search Vector Explorer"
                        >
                          <Search className="h-3 w-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectWorkspace(workspace, "settings")}
                          aria-label={`Open settings for ${workspace.name}`}
                          className="p-1 rounded bg-[#14151a] hover:bg-[#20222b] text-[#a0a3b1] hover:text-[#eaebee] border border-[#272935] transition-colors cursor-pointer"
                          title="Settings"
                        >
                          <Settings className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Activity / Document Status */}
        <div className="space-y-5">
          
          {/* Document Status */}
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-[#a0a3b1] uppercase tracking-wider">
              Document Pipeline Status
            </h2>
            <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-3.5 space-y-2">
              {isLoading ? (
                <div className="h-12 animate-pulse bg-[#14151a] rounded" />
              ) : !analytics?.document_statuses.length ? (
                <p className="text-xs text-[#a0a3b1] text-center py-3">No documents indexed yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {analytics.document_statuses.map((status) => {
                    const isReady = status.status === "ready";
                    const isFailed = status.status === "failed";

                    const badgeClass = isReady
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                      : isFailed
                      ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                      : "text-amber-400 bg-amber-500/10 border-amber-500/20";

                    return (
                      <div
                        key={status.status}
                        className="flex items-center justify-between text-xs p-2 rounded bg-[#14151a] border border-[#23252d]"
                      >
                        <span className="font-medium text-[#b0b3c1] capitalize">{status.status}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${badgeClass}`}>
                          {status.count} files
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-[#a0a3b1] uppercase tracking-wider">
              Recent Queries &amp; Uploads
            </h2>
            <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-3.5 space-y-2">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-10 animate-pulse bg-[#14151a] rounded" />
                  ))}
                </div>
              ) : !analytics?.recent_queries.length && !analytics?.recent_uploads.length ? (
                <p className="text-xs text-[#a0a3b1] text-center py-3">No recent activity recorded.</p>
              ) : (
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                  {analytics?.recent_queries.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => {
                        const ws = workspaces.find((w) => w.id === q.workspace_id);
                        if (ws) {
                          setActiveWorkspace(ws);
                          router.push(`/workspaces/${q.workspace_id}/chat`);
                        }
                      }}
                      className="group cursor-pointer p-2.5 rounded bg-[#14151a] hover:bg-[#191b22] border border-[#23252d] hover:border-[#2f3240] transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono text-[#d48b38]">
                          {q.workspace_name}
                        </span>
                        <span className="text-[#a0a3b1] font-mono">{q.latency_ms} ms</span>
                      </div>
                      <p className="text-xs text-[#b0b3c1] line-clamp-2 group-hover:text-[#f4f4f6] transition-colors">
                        &ldquo;{q.query}&rdquo;
                      </p>
                      <span className="text-[10px] text-[#a0a3b1] block font-mono">
                        {new Date(q.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}

                  {analytics?.recent_uploads.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => {
                        const ws = workspaces.find((w) => w.id === doc.workspace_id);
                        if (ws) {
                          setActiveWorkspace(ws);
                          router.push(`/workspaces/${doc.workspace_id}/documents`);
                        }
                      }}
                      className="group cursor-pointer p-2.5 rounded bg-[#14151a] hover:bg-[#191b22] border border-[#23252d] hover:border-[#2f3240] transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono text-[#a0a3b1]">
                          {doc.workspace_name}
                        </span>
                        <span className="text-[#a0a3b1] capitalize">{doc.status}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <FileText className="h-3 w-3 text-[#a0a3b1] shrink-0" />
                        <p className="text-[#b0b3c1] truncate group-hover:text-[#f4f4f6] transition-colors text-xs">
                          {doc.filename}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {deletingWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-[#18191f] border border-[#272935] rounded-xl p-5 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h3 className="text-sm font-semibold text-[#f4f4f6]">Delete Workspace?</h3>
            </div>
            <p className="text-xs text-[#9fa2b4] leading-relaxed">
              Are you sure you want to delete <strong className="text-[#f4f4f6]">&quot;{deletingWorkspace.name}&quot;</strong>? All uploaded files and chat sessions in this workspace will be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingWorkspace(null)}
                disabled={deleteMutation.isPending}
                className="px-3 py-1.5 text-xs font-medium rounded border border-[#272935] bg-[#14151a] text-[#8b8e9b] hover:text-[#eaebee] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3 w-3" />
                    <span>Delete Workspace</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
