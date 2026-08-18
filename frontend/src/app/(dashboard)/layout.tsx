"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useUserSync } from "@/hooks/use-user-sync";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // Sync the logged-in Clerk user in background
  useUserSync();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#121316] text-[#eaebee]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-[#121316] p-6 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
