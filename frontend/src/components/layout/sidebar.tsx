"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  Plus,
  Activity,
  Check,
  Sparkles,
  Home,
} from "lucide-react";

import { useWorkspaceStore, type Workspace } from "@/stores/workspace-store";
import { workspaceService } from "@/services/workspace-service";
import { useAuth } from "@clerk/nextjs";
import { BeeIcon } from "@/components/icons";
import { toast } from "sonner";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { getToken } = useAuth();
  const { activeWorkspace, setActiveWorkspace } = useWorkspaceStore();

  // Load workspaces list
  const { data: workspaces = [] } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => workspaceService.listWorkspaces(getToken),
  });

  // Extract workspace ID from URL if inside a workspace route
  const urlMatch = pathname.match(/\/workspaces\/([0-9a-fA-F-]{36}|[a-zA-Z0-9_-]+)/);
  const urlWorkspaceId = urlMatch && urlMatch[1] !== "new" ? urlMatch[1] : null;

  // Auto-sync active workspace with URL or defaults
  useEffect(() => {
    if (!workspaces.length) return;

    if (urlWorkspaceId) {
      const match = workspaces.find((w) => w.id === urlWorkspaceId || w.slug === urlWorkspaceId);
      if (match && activeWorkspace?.id !== match.id) {
        setActiveWorkspace(match);
      }
    } else if (!activeWorkspace && workspaces.length > 0) {
      // Default to first workspace if none active
      setActiveWorkspace(workspaces[0]);
    }
  }, [urlWorkspaceId, workspaces, activeWorkspace, setActiveWorkspace]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute the current target workspace
  const effectiveWs: Workspace | null =
    (urlWorkspaceId ? workspaces.find((w) => w.id === urlWorkspaceId || w.slug === urlWorkspaceId) : null) ||
    activeWorkspace ||
    (workspaces.length > 0 ? workspaces[0] : null);

  const handleNavClick = (href: string) => {
    if (href === "/workspaces/new" && !workspaces.length) {
      toast.info("Create a workspace first to start chatting and uploading documents.");
    }
    router.push(href);
  };

  const navigation = [
    {
      group: "General",
      items: [
        {
          name: "Home",
          href: "/",
          icon: Home,
          current: pathname === "/",
        },
        {
          name: "Dashboard",
          href: "/workspaces",
          icon: LayoutDashboard,
          current: pathname === "/workspaces",
        },
      ],
    },
    {
      group: "Workspace Tools",
      items: [
        {
          name: "Chat",
          href: effectiveWs ? `/workspaces/${effectiveWs.id}/chat` : "/workspaces/new",
          icon: MessageSquare,
          current: pathname.includes("/chat"),
        },
        {
          name: "Documents",
          href: effectiveWs ? `/workspaces/${effectiveWs.id}/documents` : "/workspaces/new",
          icon: FolderOpen,
          current: pathname.includes("/documents"),
        },
        {
          name: "Search",
          href: effectiveWs ? `/workspaces/${effectiveWs.id}/search` : "/workspaces/new",
          icon: Search,
          current: pathname.includes("/search"),
        },
        {
          name: "Settings",
          href: effectiveWs ? `/workspaces/${effectiveWs.id}/settings` : "/workspaces/new",
          icon: Settings,
          current: pathname.includes("/settings"),
        },
      ],
    },
    {
      group: "System",
      items: [
        {
          name: "System Status",
          href: "/status",
          icon: Activity,
          current: pathname === "/status",
        },
      ],
    },
  ];

  return (
    <div
      className={`relative flex flex-col h-screen border-r border-[#23252d] bg-[#121316] text-[#eaebee] transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Brand Logo */}
      <div className="flex h-16 items-center px-4 gap-2.5 border-b border-[#23252d]">
        <Link href="/" className="flex items-center gap-2.5 group" title="Return to Home">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#18191f] border border-[#272935] text-[#d48b38] group-hover:border-[#3d4152] transition-colors flex-shrink-0">
            <BeeIcon className="h-4 w-4" />
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-semibold tracking-tight text-[#f4f4f6] group-hover:text-white transition-colors">
                BetterBee
              </span>
              <span className="px-1.5 py-0.2 rounded bg-[#1f212a] border border-[#272935] text-[9px] font-mono text-[#d48b38]">
                RAG
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Custom Workspace Switcher */}
      <div className="p-3 border-b border-[#23252d] relative" ref={dropdownRef}>
        {isCollapsed ? (
          <button
            onClick={() => setIsCollapsed(false)}
            aria-label="Expand workspace switcher"
            className="flex h-9 w-9 items-center justify-center rounded bg-[#18191f] border border-[#272935] text-[#d48b38] hover:bg-[#20222b] mx-auto cursor-pointer"
            title={effectiveWs ? effectiveWs.name : "Select Workspace"}
          >
            {effectiveWs?.icon ? (
              <span className="text-sm">{effectiveWs.icon}</span>
            ) : (
              <Plus className="h-4 w-4 text-[#a0a3b1]" />
            )}
          </button>
        ) : (
          <div className="space-y-1">
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-label="Toggle workspace switcher dropdown"
              aria-expanded={isDropdownOpen}
              className="w-full flex items-center justify-between gap-2 p-2 rounded bg-[#18191f] hover:bg-[#1f212a] border border-[#272935] text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#14151a] border border-[#272935] text-xs">
                  {effectiveWs?.icon || "🐝"}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-medium text-[#eaebee] block truncate">
                    {effectiveWs ? effectiveWs.name : "Select Workspace"}
                  </span>
                  {effectiveWs && (
                    <span className="text-[10px] text-[#a0a3b1] font-mono block truncate">
                      /{effectiveWs.slug}
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-[#a0a3b1] transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Popover */}
            {isDropdownOpen && (
              <div className="absolute top-full left-3 right-3 mt-1.5 z-50 rounded-lg border border-[#272935] bg-[#18191f] shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar">
                  {workspaces.length === 0 ? (
                    <div className="p-3 text-center text-xs text-[#a0a3b1]">
                      No workspaces found.
                    </div>
                  ) : (
                    workspaces.map((w) => {
                      const isSelected = effectiveWs?.id === w.id;
                      return (
                        <button
                          key={w.id}
                          onClick={() => {
                            setActiveWorkspace(w);
                            setIsDropdownOpen(false);
                            router.push(`/workspaces/${w.id}/chat`);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#272935] text-[#f4f4f6] font-medium"
                              : "text-[#a0a3b1] hover:bg-[#1f212a] hover:text-[#eaebee]"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm">{w.icon || "🐝"}</span>
                            <div className="min-w-0 text-left">
                              <span className="block truncate">{w.name}</span>
                              <span className="text-[10px] text-[#a0a3b1] block font-mono">
                                /{w.slug}
                              </span>
                            </div>
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 text-[#d48b38] shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="pt-1.5 border-t border-[#272935]">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push("/workspaces/new");
                    }}
                    className="w-full flex items-center gap-2 p-1.5 rounded text-xs text-[#d48b38] hover:bg-[#20222b] transition-colors cursor-pointer font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-6 px-3 py-4 overflow-y-auto custom-scrollbar">
        {navigation.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!isCollapsed && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#a0a3b1] px-2 block">
                {group.group}
              </span>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item.href)}
                    className={`flex w-full items-center gap-3 rounded px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                      item.current
                        ? "bg-[#1f212a] text-[#f4f4f6] font-medium border border-[#2c2e3a]"
                        : "text-[#a0a3b1] hover:bg-[#18191f] hover:text-[#eaebee]"
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 ${item.current ? "text-[#d48b38]" : ""}`} />
                    {!isCollapsed && (
                      <span className="flex-1 text-left flex items-center justify-between">
                        <span>{item.name}</span>
                        {item.name === "Chat" && effectiveWs && (
                          <Sparkles className="h-3 w-3 text-[#d48b38]/60" />
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-[#272935] bg-[#18191f] text-[#a0a3b1] hover:text-[#eaebee] shadow-sm transition-colors z-50 cursor-pointer text-xs"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </div>
  );
}
