"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Search, Home, ChevronRight } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { CommandPalette } from "./command-palette";

export function Header() {
  const { activeWorkspace } = useWorkspaceStore();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Setup Command+K global shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-[#23252d] bg-[#121316] px-6 sticky top-0 z-40">
        <div className="flex items-center gap-2 text-xs">
          {/* Direct Home link */}
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[#8b8e9b] hover:text-[#eaebee] transition-colors py-1 px-1.5 rounded hover:bg-[#18191f]"
            title="Go to Home landing page"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="font-medium hidden sm:inline">Home</span>
          </Link>

          <ChevronRight className="h-3 w-3 text-[#353847] shrink-0" />

          {/* Direct Dashboard link */}
          <Link
            href="/workspaces"
            className="text-[#8b8e9b] hover:text-[#eaebee] font-medium transition-colors py-1 px-1.5 rounded hover:bg-[#18191f]"
            title="Go to Workspaces Dashboard"
          >
            Dashboard
          </Link>

          {activeWorkspace && (
            <>
              <ChevronRight className="h-3 w-3 text-[#353847] shrink-0" />
              <span className="text-[#f4f4f6] font-medium flex items-center gap-1 px-1.5 py-1">
                {activeWorkspace.icon && <span className="text-xs">{activeWorkspace.icon}</span>}
                <span className="truncate max-w-[150px] sm:max-w-xs">{activeWorkspace.name}</span>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Global Search CMD+K Trigger */}
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="flex items-center gap-2 rounded-md border border-[#272935] bg-[#18191f] px-3 py-1.5 text-xs text-[#8b8e9b] hover:text-[#eaebee] hover:border-[#353847] transition-colors w-48 text-left cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-4.5 select-none items-center gap-0.5 rounded bg-[#23252d] px-1 font-mono text-[10px] text-[#8b8e9b]">
              ⌘K
            </kbd>
          </button>

          {/* Clerk User Button for Profile & Logout */}
          <div className="flex items-center pl-2 border-l border-[#23252d]">
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-7 w-7 hover:opacity-80 transition-opacity",
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Command Palette Modal */}
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </>
  );
}
