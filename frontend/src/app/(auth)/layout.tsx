import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { BeeIcon } from "@/components/icons";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#121316] text-[#eaebee] flex flex-col justify-between selection:bg-[#2b2d38] selection:text-[#f4f4f6]">
      {/* Top Header */}
      <header className="w-full max-w-[1500px] mx-auto px-4 sm:px-8 py-5 flex items-center justify-between border-b border-[#1f212a]">
        <Link
          href="/"
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#18191f] border border-[#23252d]">
            <BeeIcon className="h-4 w-4 text-[#d48b38]" />
          </div>
          <span className="text-base font-semibold tracking-tight text-[#f4f4f6]">
            BetterBee
          </span>
        </Link>

        <Link
          href="/"
          className="text-xs text-[#8b8e9b] hover:text-[#eaebee] transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main 2-Column Split Content */}
      <main className="flex-1 w-full max-w-[1500px] mx-auto px-4 sm:px-8 py-8 sm:py-16 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          
          {/* Left Column: Minimal Context & Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#d48b38]">
                Knowledge Base &middot; Document Retrieval
              </span>
              <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#f4f4f6] leading-tight max-w-xl">
                Internal search and question answering for your documents.
              </h1>
              <p className="text-sm text-[#8b8e9b] max-w-lg leading-relaxed">
                Connect your technical docs, PDFs, spreadsheets, and notes into isolated workspaces with direct citations for every answer.
              </p>
            </div>

            {/* Simple Feature List */}
            <div className="space-y-3 pt-2 text-xs text-[#b8bac7]">
              <div className="flex items-start gap-2.5">
                <div className="h-4 w-4 rounded bg-[#181922] border border-[#262833] flex items-center justify-center text-[#d48b38] shrink-0 mt-0.5">
                  <Check className="h-2.5 w-2.5" />
                </div>
                <span>Isolated workspaces with private vector storage per project.</span>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="h-4 w-4 rounded bg-[#181922] border border-[#262833] flex items-center justify-center text-[#d48b38] shrink-0 mt-0.5">
                  <Check className="h-2.5 w-2.5" />
                </div>
                <span>Dense vector retrieval combined with keyword search for high precision.</span>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="h-4 w-4 rounded bg-[#181922] border border-[#262833] flex items-center justify-center text-[#d48b38] shrink-0 mt-0.5">
                  <Check className="h-2.5 w-2.5" />
                </div>
                <span>Every answer includes source file links, page numbers, and similarity scores.</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-[#6c6f80] font-mono">
              Supported formats: PDF, DOCX, CSV, Excel, TXT, and Markdown
            </div>
          </div>

          {/* Right Column: Clean Auth Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              {children}
            </div>
          </div>

        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full max-w-[1500px] mx-auto px-4 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#6c6f80] font-mono border-t border-[#1f212a]">
        <span>Encrypted in transit and at rest with AWS S3</span>
        <span>&copy; {new Date().getFullYear()} BetterBee</span>
      </footer>
    </div>
  );
}
