"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Pin, Trash2, Edit3, Check, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { type ChatSession } from "@/services/chat-service";

interface SessionListProps {
  sessions: ChatSession[];
  activeSessionId?: string;
  workspaceId: string;
  onRename: (sessionId: string, newTitle: string) => Promise<void>;
  onDelete: (sessionId: string) => Promise<void>;
  onTogglePin: (sessionId: string, currentPinStatus: boolean) => Promise<void>;
  onCreateNewChat: () => void;
}

export function SessionList({
  sessions,
  activeSessionId,
  workspaceId,
  onRename,
  onDelete,
  onTogglePin,
  onCreateNewChat,
}: SessionListProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleStartEdit = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      await onRename(sessionId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  // Grouping sessions
  const pinnedSessions = sessions.filter((s) => s.is_pinned);
  const unpinnedSessions = sessions.filter((s) => !s.is_pinned);

  const renderSessionItem = (session: ChatSession) => {
    const isActive = session.id === activeSessionId;
    const isEditing = session.id === editingId;

    return (
      <motion.div
        key={session.id}
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={() => {
          if (!isEditing) {
            router.push(`/workspaces/${workspaceId}/chat/${session.id}`);
          }
        }}
        className={cn(
          "group relative flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer select-none border",
          isActive
            ? "bg-[#1f212a] border-[#2c2e3a] text-[#f4f4f6]"
            : "bg-[#18191f] border-[#23252d] hover:bg-[#1f212a] hover:border-[#2f3240] text-[#8b8e9b] hover:text-[#eaebee]"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MessageSquare className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-[#d48b38]" : "text-[#6c6f80]")} />
          
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#14151a] border border-[#272935] text-[#eaebee] text-xs py-0.5 px-1.5 rounded focus:outline-hidden focus:border-[#3d4152] w-full"
              autoFocus
            />
          ) : (
            <span className="truncate text-xs">{session.title}</span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                onClick={(e) => handleSaveRename(session.id, e)}
                className="p-0.5 rounded hover:bg-[#14151a] text-emerald-400 transition-colors cursor-pointer"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                onClick={handleCancelRename}
                className="p-0.5 rounded hover:bg-[#14151a] text-rose-400 transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <>
              {/* Pin indicator or pin action */}
              {(session.is_pinned || isActive) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void onTogglePin(session.id, session.is_pinned);
                  }}
                  className={cn(
                    "p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#d48b38] cursor-pointer",
                    session.is_pinned ? "opacity-100 text-[#d48b38]" : "text-[#6c6f80]"
                  )}
                  title={session.is_pinned ? "Unpin session" : "Pin session"}
                >
                  <Pin className="h-3 w-3" />
                </button>
              )}

              {/* Rename/Delete actions on hover */}
              <button
                onClick={(e) => handleStartEdit(session, e)}
                className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:text-[#eaebee] text-[#6c6f80] transition-opacity cursor-pointer"
                title="Rename Session"
              >
                <Edit3 className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void onDelete(session.id);
                }}
                className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:text-rose-400 text-[#6c6f80] transition-opacity cursor-pointer"
                title="Delete Session"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full border-r border-[#23252d] bg-[#14151a] w-64 shrink-0 select-none">
      {/* New chat button */}
      <div className="p-3 border-b border-[#23252d]">
        <button
          onClick={onCreateNewChat}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[#18191f] hover:bg-[#1f212a] border border-[#272935] text-[#eaebee] font-medium text-xs py-2 transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5 text-[#d48b38]" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Session list container */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 custom-scrollbar">
        {/* Pinned conversations */}
        {pinnedSessions.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#6c6f80] px-2 block">
              Pinned
            </span>
            <div className="space-y-1">
              <AnimatePresence initial={false}>
                {pinnedSessions.map(renderSessionItem)}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Regular conversations */}
        <div className="space-y-1 pb-6">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#6c6f80] px-2 block">
            Recent Conversations
          </span>
          {unpinnedSessions.length === 0 && pinnedSessions.length === 0 ? (
            <div className="px-3 py-6 text-center rounded border border-dashed border-[#272935] bg-[#18191f]/40">
              <span className="text-xs text-[#6c6f80]">No chat history yet.</span>
            </div>
          ) : (
            <div className="space-y-1">
              <AnimatePresence initial={false}>
                {unpinnedSessions.map(renderSessionItem)}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
