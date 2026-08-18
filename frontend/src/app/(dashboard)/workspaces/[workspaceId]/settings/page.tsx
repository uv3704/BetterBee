"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { ArrowLeft, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";

import { workspaceService } from "@/services/workspace-service";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { setActiveWorkspace } = useWorkspaceStore();

  const workspaceId = params.workspaceId as string;

  const [customName, setCustomName] = useState<string | null>(null);
  const [customDescription, setCustomDescription] = useState<string | null>(null);
  const [customIcon, setCustomIcon] = useState<string | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch current workspace details
  const { data: workspace, isLoading } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: () => workspaceService.getWorkspace(workspaceId, getToken),
    enabled: Boolean(workspaceId),
  });

  const name = customName ?? workspace?.name ?? "";
  const description = customDescription ?? workspace?.description ?? "";
  const icon = customIcon ?? workspace?.icon ?? "🐝";

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (payload: { name: string; description: string; icon: string }) =>
      workspaceService.updateWorkspace(workspaceId, payload, getToken),
    onSuccess: (data) => {
      toast.success("Workspace updated successfully!");
      setActiveWorkspace(data);
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
    },
    onError: (error) => {
      console.error("Failed to update workspace:", error);
      toast.error("Failed to update workspace. Try another name.");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: () => workspaceService.deleteWorkspace(workspaceId, getToken),
    onSuccess: () => {
      toast.success("Workspace deleted successfully.");
      setActiveWorkspace(null);
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      router.push("/workspaces");
    },
    onError: (error) => {
      console.error("Failed to delete workspace:", error);
      toast.error("Failed to delete workspace. Try again.");
    },
  });

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Workspace name is required.");
      return;
    }
    updateMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      icon: icon.trim(),
    });
  };

  const handleDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmDeleteName.trim().toLowerCase() !== workspace?.name.trim().toLowerCase()) {
      toast.error("Workspace name does not match confirmation.");
      return;
    }
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 text-[#8b8e9b] animate-spin" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-rose-400 text-xs">Workspace not found.</p>
        <Link href="/workspaces" className="text-xs text-[#d48b38] hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/workspaces/${workspaceId}/chat`}
          className="flex h-8 w-8 items-center justify-center rounded border border-[#272935] bg-[#18191f] hover:bg-[#1f212a] text-[#8b8e9b] hover:text-[#eaebee] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-medium text-[#f4f4f6]">Workspace Settings</h1>
          <p className="text-xs text-[#8b8e9b]">Manage configuration, identity, and data for this workspace.</p>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-6 space-y-6">
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8b8e9b] block">Workspace Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full bg-[#14151a] border border-[#272935] text-[#eaebee] rounded px-3 py-2 text-xs sm:text-sm focus:outline-hidden focus:border-[#3d4152]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8b8e9b] block">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setCustomDescription(e.target.value)}
              className="w-full bg-[#14151a] border border-[#272935] text-[#eaebee] rounded px-3 py-2 text-xs sm:text-sm focus:outline-hidden focus:border-[#3d4152]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8b8e9b] block">Icon / Emoji</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setCustomIcon(e.target.value)}
              className="w-24 bg-[#14151a] border border-[#272935] text-[#eaebee] rounded px-3 py-2 text-center text-sm focus:outline-hidden focus:border-[#3d4152]"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded bg-[#f4f4f6] hover:bg-[#eaebee] text-[#121316] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-rose-900/40 bg-rose-950/10 p-6 space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-rose-950/40 border border-rose-900/50 rounded text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-rose-300">Danger Zone</h3>
            <p className="text-xs text-[#8b8e9b] mt-0.5 max-w-xl leading-relaxed">
              Permanently delete this workspace, including all associated documents, vector indexes, and conversation history. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-rose-900/30 pt-4">
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Workspace</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-[#18191f] border border-[#272935] rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h4 className="text-sm font-semibold text-[#f4f4f6]">Delete Workspace?</h4>
            </div>

            <p className="text-xs text-[#9fa2b4] leading-relaxed">
              This will permanently delete the workspace <strong className="text-[#f4f4f6]">&quot;{workspace.name}&quot;</strong> and all of its files.
            </p>

            <form onSubmit={handleDeleteSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] text-[#8b8e9b] block">
                  Type <span className="text-[#f4f4f6] font-medium">{workspace.name}</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={confirmDeleteName}
                  onChange={(e) => setConfirmDeleteName(e.target.value)}
                  placeholder={workspace.name}
                  className="w-full bg-[#14151a] border border-[#272935] text-[#eaebee] rounded px-3 py-1.5 text-xs focus:outline-hidden focus:border-rose-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setConfirmDeleteName("");
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded border border-[#272935] bg-[#14151a] text-[#8b8e9b] hover:text-[#eaebee] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteMutation.isPending || confirmDeleteName.trim().toLowerCase() !== workspace.name.trim().toLowerCase()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Workspace</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
