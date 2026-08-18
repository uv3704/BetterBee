"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  MessageSquare,
  Sparkles,
  FileText,
  CheckCircle2,
  BarChart2,
  ChevronRight,
  Copy,
  Check,
  Download,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Message } from "@/services/chat-service";
import { toast } from "sonner";

interface MessageBubbleProps {
  message: Message;
  onOpenExplain?: (message: Message) => void;
  isExplainOpen?: boolean;
  onSendMessage?: (text: string) => void;
}

function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1].toUpperCase() : "CODE";
  const codeText = String(children).replace(/\n$/, "");

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(codeText);
    setCopied(true);
    toast.success("Code copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg border border-[#272935] bg-[#14151a] overflow-hidden text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#18191f] border-b border-[#272935] text-[10px] font-mono text-[#8b8e9b]">
        <span className="text-[#d48b38] font-semibold tracking-wider">{language}</span>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1 hover:text-[#eaebee] transition-colors cursor-pointer text-[#8b8e9b]"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? "Copied" : "Copy Code"}</span>
        </button>
      </div>
      <div className="p-3 overflow-x-auto font-mono text-xs text-[#eaebee] leading-relaxed">
        <code className={className}>{children}</code>
      </div>
    </div>
  );
}

export function MessageBubble({
  message,
  onOpenExplain,
  isExplainOpen,
  onSendMessage,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Message copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([message.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `betterbee-answer-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Response downloaded as Markdown");
  };

  const suggestions = [
    "🔍 What are the key deliverables?",
    "🛠️ Which tech stack & tools were used?",
    "📊 Outline the database schema & queries",
  ];

  return (
    <div
      className={cn(
        "group relative flex w-full gap-3.5 p-4 sm:p-5 rounded-lg border transition-colors",
        isUser
          ? "bg-[#14151a] border-[#23252d]"
          : "bg-[#18191f] border-[#23252d] hover:border-[#2f3240]"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded border text-xs font-medium",
          isUser
            ? "border-[#272935] bg-[#1a1c24] text-[#8b8e9b]"
            : "border-[#3d3326] bg-[#221c15] text-[#d48b38]"
        )}
      >
        {isUser ? <MessageSquare className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
      </div>

      {/* Content Container */}
      <div className="flex-1 min-w-0 space-y-2.5 overflow-hidden">
        {/* Header line */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#eaebee]">
              {isUser ? "You" : "BetterBee"}
            </span>
            {!isUser && (
              <span className="px-1.5 py-0.2 rounded bg-[#14151a] border border-[#272935] text-[9px] font-mono text-[#d48b38]">
                Synthesized RAG
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#6c6f80] font-mono">
              {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            {!isUser && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Download Markdown */}
                <button
                  onClick={handleDownload}
                  className="p-1 rounded hover:bg-[#14151a] text-[#6c6f80] hover:text-[#eaebee] transition-colors cursor-pointer"
                  title="Download Markdown"
                >
                  <Download className="h-3 w-3" />
                </button>

                {/* Copy response */}
                <button
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-[#14151a] text-[#6c6f80] hover:text-[#eaebee] transition-colors cursor-pointer"
                  title="Copy response"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Message Body with Custom Markdown Component Renderers */}
        <div className="text-xs sm:text-[13px] leading-relaxed text-[#d2d5e0]">
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                // Custom Headings
                h1: ({ children }) => (
                  <h1 className="text-base font-semibold text-[#f4f4f6] mt-4 mb-2 pb-1 border-b border-[#23252d]">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-sm font-semibold text-[#f4f4f6] mt-3.5 mb-1.5">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xs font-semibold text-[#d48b38] uppercase tracking-wider mt-3 mb-1">
                    {children}
                  </h3>
                ),
                // Custom Paragraphs
                p: ({ children }) => (
                  <p className="mb-2.5 leading-relaxed text-[#d2d5e0]">
                    {children}
                  </p>
                ),
                // Custom Lists
                ul: ({ children }) => (
                  <ul className="list-disc list-outside pl-4 space-y-1.5 my-2 text-[#d2d5e0]">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-outside pl-4 space-y-1.5 my-2 text-[#d2d5e0]">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">
                    {children}
                  </li>
                ),
                // Custom Strong Text
                strong: ({ children }) => (
                  <strong className="font-semibold text-[#f4f4f6]">
                    {children}
                  </strong>
                ),
                // Custom Blockquote
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-[#d48b38] bg-[#14151a] pl-3 py-1.5 my-2 text-xs italic text-[#b0b3c1] rounded-r">
                    {children}
                  </blockquote>
                ),
                // Custom Code Blocks
                code: ({ children, className, ...props }) => {
                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code className="bg-[#14151a] px-1.5 py-0.5 rounded font-mono text-[11px] text-[#d48b38] border border-[#272935]" {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <CodeBlock className={className}>
                      {children}
                    </CodeBlock>
                  );
                },
                // Custom Markdown Tables
                table: ({ children }) => (
                  <div className="my-3 overflow-x-auto rounded-lg border border-[#23252d] bg-[#14151a]">
                    <table className="w-full text-left text-xs border-collapse">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-[#18191f] border-b border-[#23252d]">
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th className="py-2.5 px-3.5 text-[10px] font-mono uppercase tracking-wider text-[#8b8e9b] font-medium">
                    {children}
                  </th>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-[#23252d]/60">
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-[#1c1e27] transition-colors">
                    {children}
                  </tr>
                ),
                td: ({ children }) => (
                  <td className="py-2.5 px-3.5 text-xs text-[#d2d5e0] leading-relaxed align-top">
                    {children}
                  </td>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Citations & Explainability */}
        {!isUser && (
          <div className="pt-3 space-y-3.5 pb-1">
            {/* References Card */}
            {message.citations && message.citations.length > 0 && (
              <div className="rounded-lg bg-[#14151a] border border-[#23252d] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#8b8e9b] flex items-center gap-1.5 font-mono">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#d48b38]" /> Referenced Documents ({message.citations.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {message.citations.map((cite, idx) => {
                    const pageStr = cite.page_number
                      ? `p. ${cite.page_number}`
                      : cite.sheet_name
                      ? `sheet ${cite.sheet_name}`
                      : cite.slide_number
                      ? `slide ${cite.slide_number}`
                      : "";

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#18191f] border border-[#272935] text-[#d2d5e0] hover:border-[#3d4152] transition-colors"
                      >
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#14151a] text-[#d48b38]">
                          <FileText className="h-3 w-3" />
                        </div>
                        <span className="text-xs font-medium truncate max-w-[220px] text-[#f4f4f6]">{cite.filename}</span>
                        {pageStr && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#14151a] text-[#8b8e9b] border border-[#272935]">
                            {pageStr}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Explainability CTA & Suggested Follow-up Prompts */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
              {onOpenExplain && message.explainability_data && Object.keys(message.explainability_data).length > 0 && (
                <button
                  onClick={() => onOpenExplain(message)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium border transition-colors cursor-pointer self-start",
                    isExplainOpen
                      ? "bg-[#221c15] text-[#d48b38] border-[#3d3326]"
                      : "bg-[#14151a] text-[#8b8e9b] border-[#272935] hover:text-[#eaebee] hover:border-[#353847]"
                  )}
                >
                  <BarChart2 className="h-3.5 w-3.5" />
                  <span>Inspect Grounding &amp; RAG Metrics</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}

              {/* Follow-up Prompts Chips */}
              {onSendMessage && !isUser && message.content.length > 50 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {suggestions.map((s, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => onSendMessage(s.replace(/^[^\w]+/, ""))}
                      className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium bg-[#14151a] hover:bg-[#1f212a] border border-[#272935] hover:border-[#3d4152] text-[#8b8e9b] hover:text-[#eaebee] transition-colors cursor-pointer"
                    >
                      <span>{s}</span>
                      <ArrowUpRight className="h-2.5 w-2.5 text-[#d48b38]" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
