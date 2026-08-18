/**
 * BetterBee — Clerk Provider Wrapper.
 *
 * Wraps the application in ClerkProvider for authentication context.
 * Configures sign-in/sign-up URLs and appearance.
 */

"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { clerkTheme } from "@/lib/clerk-theme";

interface ClerkProviderWrapperProps {
  children: ReactNode;
}

export function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
  return (
    <ClerkProvider
      appearance={clerkTheme}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
