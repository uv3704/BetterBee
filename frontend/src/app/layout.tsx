import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Suppress Clerk development keys warnings in terminal console
if (typeof window !== "undefined") {
  const filterClerkLog = (originalFn: (...args: unknown[]) => void) => {
    return (...args: unknown[]) => {
      if (
        args[0] &&
        typeof args[0] === "string" &&
        args[0].includes("Clerk has been loaded with development keys")
      ) {
        return;
      }
      originalFn(...args);
    };
  };
  console.log = filterClerkLog(console.log);
  console.warn = filterClerkLog(console.warn);
  console.info = filterClerkLog(console.info);
}

import { ClerkProviderWrapper } from "@/providers/clerk-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BetterBee — Private AI Workspace",
  description:
    "Your team's private AI workspace for trustworthy knowledge retrieval and document intelligence.",
  keywords: ["AI", "knowledge base", "RAG", "document intelligence", "workspace"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <ClerkProviderWrapper>
            <QueryProvider>
              {children}
              <Toaster position="bottom-right" richColors closeButton />
            </QueryProvider>
          </ClerkProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
