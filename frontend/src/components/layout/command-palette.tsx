"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MessageSquare,
  FolderOpen,
  Settings,
  LayoutDashboard,
  LogOut,
  User,
  X,
  FileText,
  Command,
} from "lucide-react";

import { useWorkspaceStore, type Workspace } from "@/stores/workspace-store";
import { workspaceService } from "@/services/workspace-service";
import { searchService } from "@/services/search-service";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  type: "search-result" | "navigation" | "workspace" | "account";
  label: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { signOut, openUserProfile } = useClerk();
  const { activeWorkspace, setActiveWorkspace } = useWorkspaceStore();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);
    return () => clearTimeout(handler);
  }, [search]);

  // Load workspaces list
  const { data: workspaces = [] } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => workspaceService.listWorkspaces(getToken),
    enabled: isOpen,
  });

  // Query workspace search if a search query is entered and a workspace is active
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["command-palette-search", activeWorkspace?.id, debouncedSearch],
    queryFn: () => {
      if (!activeWorkspace || !debouncedSearch.trim()) return null;
      return searchService.searchWorkspace(
        activeWorkspace.id,
        debouncedSearch,
        "semantic",
        getToken,
        5
      );
    },
    enabled: isOpen && Boolean(activeWorkspace && debouncedSearch.trim()),
  });

  // Autofocus input & reset state on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const items = useMemo(() => {
    const list: CommandItem[] = [];

    // 1. Search Results (if searching)
    if (search.trim() && searchResults?.results) {
      searchResults.results.forEach((doc) => {
        const bestMatch = doc.matches?.[0]?.content || "";
        list.push({
          type: "search-result",
          label: doc.filename,
          subtitle: bestMatch ? `"${bestMatch.substring(0, 75)}..."` : "Document Match",
          icon: FileText,
          action: () => {
            onClose();
            router.push(
              `/workspaces/${activeWorkspace?.id}/search?q=${encodeURIComponent(search)}`
            );
          },
        });
      });
    }

    // 2. Navigation items
    if (!search.trim()) {
      list.push({
        type: "navigation",
        label: "Go to Chat",
        subtitle: "Chat with workspace knowledge base",
        icon: MessageSquare,
        action: () => {
          onClose();
          if (activeWorkspace) router.push(`/workspaces/${activeWorkspace.id}/chat`);
        },
      });
      list.push({
        type: "navigation",
        label: "Go to Document Library",
        subtitle: "Manage and upload documents",
        icon: FolderOpen,
        action: () => {
          onClose();
          if (activeWorkspace) router.push(`/workspaces/${activeWorkspace.id}/documents`);
        },
      });
      list.push({
        type: "navigation",
        label: "Go to Document Explorer (Search)",
        subtitle: "Run semantic and keyword searches",
        icon: Search,
        action: () => {
          onClose();
          if (activeWorkspace) router.push(`/workspaces/${activeWorkspace.id}/search`);
        },
      });
      list.push({
        type: "navigation",
        label: "Go to Workspace Settings",
        subtitle: "Manage workspace details and preferences",
        icon: Settings,
        action: () => {
          onClose();
          if (activeWorkspace) router.push(`/workspaces/${activeWorkspace.id}/settings`);
        },
      });
      list.push({
        type: "navigation",
        label: "Go to Workspaces Dashboard",
        subtitle: "List and switch all workspaces",
        icon: LayoutDashboard,
        action: () => {
          onClose();
          router.push("/workspaces");
        },
      });
    }

    // 3. Switch Workspaces (only shown if not actively searching or if query matches workspace name)
    const filteredWorkspaces = workspaces.filter(
      (ws: Workspace) =>
        ws.id !== activeWorkspace?.id &&
        (!search.trim() || ws.name.toLowerCase().includes(search.toLowerCase()))
    );

    if (filteredWorkspaces.length > 0) {
      filteredWorkspaces.forEach((ws: Workspace) => {
        list.push({
          type: "workspace",
          label: `Switch to Workspace: ${ws.name}`,
          subtitle: ws.description || `/${ws.slug}`,
          icon: Command,
          action: () => {
            onClose();
            setActiveWorkspace(ws);
            router.push(`/workspaces/${ws.id}/chat`);
          },
        });
      });
    }

    // 4. Account Settings
    if (!search.trim()) {
      list.push({
        type: "account",
        label: "Manage Profile",
        subtitle: "Clerk Account Profile Settings",
        icon: User,
        action: () => {
          onClose();
          openUserProfile();
        },
      });
      list.push({
        type: "account",
        label: "Sign Out",
        subtitle: "Log out of BetterBee",
        icon: LogOut,
        action: () => {
          onClose();
          void signOut(() => router.push("/sign-in"));
        },
      });
    }

    return list;
  }, [search, searchResults, activeWorkspace, workspaces, router, onClose, setActiveWorkspace, openUserProfile, signOut]);

  const totalItems = items.length;

  // Keyboard controls (Esc, Enter, Up, Down)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, Math.max(0, totalItems - 1)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (items[selectedIndex]) {
          items[selectedIndex].action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, totalItems, items, onClose]);

  // Close when clicking backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Group items by category for rendering
  const groupedItems = useMemo(() => {
    return items.reduce((groups, item, idx) => {
      const category =
        item.type === "search-result"
          ? "Document Search Results"
          : item.type === "navigation"
          ? "Quick Navigation"
          : item.type === "workspace"
          ? "Switch Workspaces"
          : "Account Settings";

      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push({ ...item, globalIndex: idx });
      return groups;
    }, {} as Record<string, Array<CommandItem & { globalIndex: number }>>);
  }, [items]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh] px-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            ref={containerRef}
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl"
          >
            {/* Input Header */}
            <div className="flex items-center gap-3 border-b border-neutral-900 px-4 py-3 bg-neutral-950">
              <Search className="h-5 w-5 text-neutral-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Type a command or search documents..."
                className="flex-1 bg-transparent text-sm text-neutral-200 placeholder-neutral-500 focus:outline-hidden"
              />
              {isSearching && (
                <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider animate-pulse mr-2">
                  Searching...
                </span>
              )}
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* List Content */}
            <div className="max-h-[50vh] overflow-y-auto p-2 custom-scrollbar bg-neutral-950">
              {totalItems === 0 ? (
                <div className="py-12 text-center text-sm text-neutral-500">
                  No matching commands or documents found.
                </div>
              ) : (
                Object.entries(groupedItems).map(([category, groupList]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <h3 className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                      {category}
                    </h3>
                    <div className="mt-1 space-y-0.5">
                      {groupList.map((item) => {
                        const Icon = item.icon;
                        const isSelected = selectedIndex === item.globalIndex;
                        return (
                          <button
                            key={`${item.label}-${item.globalIndex}`}
                            onClick={item.action}
                            onMouseEnter={() => setSelectedIndex(item.globalIndex)}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all cursor-pointer ${
                              isSelected
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/10"
                                : "text-neutral-400 hover:bg-neutral-900/50 border border-transparent"
                            }`}
                          >
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm transition-colors ${
                                isSelected
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                                  : "bg-neutral-900 border-neutral-800 text-neutral-400"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-semibold truncate ${
                                  isSelected ? "text-neutral-100" : "text-neutral-300"
                                }`}
                              >
                                {item.label}
                              </p>
                              {item.subtitle && (
                                <p className="text-xs text-neutral-500 truncate mt-0.5">
                                  {item.subtitle}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <span className="text-[10px] font-semibold text-neutral-600 border border-neutral-800 rounded-md px-1.5 py-0.5 bg-neutral-950 font-mono">
                                ↵ Enter
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-neutral-900 px-4 py-2 text-[10px] text-neutral-500 bg-neutral-950">
              <div className="flex items-center gap-4">
                <span>
                  Use <kbd className="font-mono text-[9px] bg-neutral-900 border border-neutral-800 px-1 py-0.5 rounded-sm">↑↓</kbd> to navigate
                </span>
                <span>
                  <kbd className="font-mono text-[9px] bg-neutral-900 border border-neutral-800 px-1 py-0.5 rounded-sm">Enter</kbd> to select
                </span>
              </div>
              <div>
                <span>
                  <kbd className="font-mono text-[9px] bg-neutral-900 border border-neutral-800 px-1 py-0.5 rounded-sm">ESC</kbd> to close
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
