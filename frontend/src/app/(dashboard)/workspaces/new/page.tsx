"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";

import { workspaceService } from "@/services/workspace-service";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function NewWorkspacePage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { setActiveWorkspace } = useWorkspaceStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🐝");

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; description: string; icon: string }) =>
      workspaceService.createWorkspace(payload, getToken),
    onSuccess: (data) => {
      toast.success("Workspace created successfully!");
      // Set active workspace
      setActiveWorkspace(data);
      // Invalidate workspaces list
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      // Redirect to chat
      router.push(`/workspaces/${data.id}/chat`);
    },
    onError: (error) => {
      console.error("Failed to create workspace:", error);
      toast.error("Failed to create workspace. Try another name.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Workspace name is required.");
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      icon: icon.trim(),
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div className="flex items-center gap-4">
        <Link
          href="/workspaces"
          className="flex h-8 w-8 items-center justify-center rounded border border-[#272935] bg-[#18191f] hover:bg-[#1f212a] text-[#8b8e9b] hover:text-[#eaebee] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-medium tracking-tight text-[#f4f4f6]">
            Create Workspace
          </h1>
          <p className="text-xs text-[#8b8e9b]">
            Set up an isolated knowledge environment for your team.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-6 shadow-xs relative">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {/* Icon Picker */}
            <div className="col-span-1 space-y-1.5">
              <label className="text-xs font-medium text-[#8b8e9b] block">
                Icon
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={2}
                className="w-full bg-[#14151a] border border-[#272935] rounded px-3 py-2 text-center text-lg focus:outline-hidden focus:border-[#3d4152] text-[#eaebee]"
              />
            </div>

            {/* Name */}
            <div className="col-span-3 space-y-1.5">
              <label className="text-xs font-medium text-[#8b8e9b] block">
                Workspace Name
              </label>
              <input
                type="text"
                placeholder="e.g. Legal, Finance, Engineering"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
                className="w-full bg-[#14151a] border border-[#272935] text-[#eaebee] rounded px-3 py-2 text-xs sm:text-sm focus:outline-hidden focus:border-[#3d4152] placeholder:text-[#6c6f80]"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8b8e9b] block">
              Description
            </label>
            <textarea
              placeholder="Provide a brief overview of what this workspace contains..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={255}
              className="w-full bg-[#14151a] border border-[#272935] text-[#eaebee] rounded px-3 py-2 text-xs sm:text-sm focus:outline-hidden focus:border-[#3d4152] placeholder:text-[#6c6f80] resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#23252d]">
            <Link
              href="/workspaces"
              className="px-3 py-1.5 text-xs font-medium rounded border border-[#272935] bg-[#14151a] text-[#8b8e9b] hover:text-[#eaebee] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded bg-[#f4f4f6] hover:bg-[#eaebee] text-[#121316] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Create Workspace</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
