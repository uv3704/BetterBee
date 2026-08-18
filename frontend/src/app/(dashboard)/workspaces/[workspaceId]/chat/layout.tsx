"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { chatService } from "@/services/chat-service";
import { SessionList } from "@/components/chat/session-list";
import { toast } from "sonner";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  
  const workspaceId = params.workspaceId as string;
  
  // Extract sessionId if we are on a session sub-route
  const sessionId = params.sessionId as string | undefined;

  // Query sessions list
  const { data: sessions = [] } = useQuery({
    queryKey: ["chat-sessions", workspaceId],
    queryFn: () => chatService.listSessions(workspaceId, getToken),
    enabled: !!workspaceId,
  });

  const renameSessionMutation = useMutation({
    mutationFn: ({ sid, title }: { sid: string; title: string }) =>
      chatService.updateSession(workspaceId, sid, { title }, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions", workspaceId] });
      toast.success("Conversation renamed");
    },
    onError: (err) => {
      toast.error("Failed to rename conversation");
      console.error(err);
    }
  });

  const togglePinSessionMutation = useMutation({
    mutationFn: ({ sid, isPinned }: { sid: string; isPinned: boolean }) =>
      chatService.updateSession(workspaceId, sid, { is_pinned: isPinned }, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions", workspaceId] });
    },
    onError: (err) => {
      toast.error("Failed to update pin status");
      console.error(err);
    }
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (sid: string) => chatService.deleteSession(workspaceId, sid, getToken),
    onSuccess: (_, deletedSid) => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions", workspaceId] });
      toast.success("Conversation deleted");
      
      // If we deleted the currently active session, redirect to workspace chat landing page
      if (sessionId === deletedSid) {
        router.push(`/workspaces/${workspaceId}/chat`);
      }
    },
    onError: (err) => {
      toast.error("Failed to delete conversation");
      console.error(err);
    }
  });

  const handleCreateNewChat = () => {
    router.push(`/workspaces/${workspaceId}/chat`);
  };

  const handleRename = async (sid: string, newTitle: string) => {
    await renameSessionMutation.mutateAsync({ sid, title: newTitle });
  };

  const handleTogglePin = async (sid: string, currentPinStatus: boolean) => {
    await togglePinSessionMutation.mutateAsync({ sid, isPinned: !currentPinStatus });
  };

  const handleDelete = async (sid: string) => {
    await deleteSessionMutation.mutateAsync(sid);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden w-full bg-[#121316] text-[#eaebee]">
      {/* Session Navigation list */}
      <SessionList
        sessions={sessions}
        activeSessionId={sessionId}
        workspaceId={workspaceId}
        onRename={handleRename}
        onDelete={handleDelete}
        onTogglePin={handleTogglePin}
        onCreateNewChat={handleCreateNewChat}
      />
      
      {/* Nested Route Page content */}
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  );
}
