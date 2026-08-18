"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import { BeeIcon } from "@/components/icons";

export function PublicNav() {
  const { isLoaded, isSignedIn } = useUser();

  return (
    <header className="border-b border-[#23252d] bg-[#121316]/95 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <BeeIcon className="h-5 w-5 text-[#d48b38] flex-shrink-0" />
            <span className="text-base font-semibold tracking-tight text-[#f4f4f6]">
              BetterBee
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-xs text-[#8b8e9b]">
            <Link href="/how-it-works" className="hover:text-[#eaebee] transition-colors">
              How It Works
            </Link>
            <Link href="/use-cases" className="hover:text-[#eaebee] transition-colors">
              Use Cases
            </Link>
            <a
              href="https://yuviii.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#d48b38] hover:text-[#e5a04e] font-medium transition-colors"
            >
              <span>Portfolio</span>
              <span className="text-[10px]">↗</span>
            </a>
            <a
              href="https://github.com/uv3704"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[#eaebee] transition-colors"
            >
              <span>GitHub</span>
              <span className="text-[10px]">↗</span>
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {isLoaded && (
            <>
              {!isSignedIn ? (
                <>
                  <Link
                    href="/sign-in"
                    className="px-3 py-1.5 text-[#b0b3c1] hover:text-[#eaebee] transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/workspaces"
                    className="px-4 py-1.5 font-medium bg-[#1e2029] hover:bg-[#272935] text-[#f4f4f6] border border-[#2c2e3a] rounded-md transition-colors"
                  >
                    Open App
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/workspaces"
                    className="px-3.5 py-1.5 font-medium bg-[#1e2029] hover:bg-[#272935] text-[#f4f4f6] border border-[#2c2e3a] rounded-md transition-colors flex items-center gap-1.5"
                  >
                    Workspaces <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <UserButton />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
