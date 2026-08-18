import React from "react";
import { FileText, FileSpreadsheet, Sparkles, AlertCircle, MessageSquare } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { type SearchDocumentResult } from "@/services/search-service";
import { useRouter } from "next/navigation";

interface SearchResultsProps {
  results: SearchDocumentResult[];
  query: string;
  searchType: "semantic" | "keyword";
  workspaceId: string;
}

export function SearchResults({ results, query, searchType, workspaceId }: SearchResultsProps) {
  const router = useRouter();

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/5">
        <AlertCircle className="h-8 w-8 text-neutral-600 mb-2 animate-bounce" />
        <h3 className="text-sm font-semibold text-neutral-200">No results found</h3>
        <p className="text-xs text-neutral-500 max-w-xs mx-auto mt-1 leading-normal">
          We couldn&apos;t find any passages matching &quot;{query}&quot; using {searchType} search. Try adjusting keywords or upload more documents.
        </p>
      </div>
    );
  }

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type === "xlsx" || type === "xls" || type === "csv") {
      return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
    }
    return <FileText className="h-5 w-5 text-amber-500" />;
  };

  const handleStartChat = (docName: string, snippet: string) => {
    const promptText = `Based on the document [${docName}], what can you tell me about the following passage:\n\n"${snippet}"`;
    router.push(`/workspaces/${workspaceId}/chat?initialMessage=${encodeURIComponent(promptText)}`);
  };

  return (
    <div className="space-y-4 select-none">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[#8b8e9b]">
          Results grouped by document
        </span>
        <span className="text-[11px] font-mono text-[#d48b38] bg-[#14151a] px-2 py-0.5 rounded border border-[#272935] flex items-center gap-1">
          {searchType === "semantic" && <Sparkles className="h-3 w-3" />}
          {results.length} Document{results.length > 1 ? "s" : ""} matched
        </span>
      </div>

      <div className="space-y-3">
        {results.map((docResult) => {
          const Icon = getFileIcon(docResult.file_type);
          return (
            <div
              key={docResult.document_id}
              className="bg-[#18191f] border border-[#23252d] rounded-lg overflow-hidden transition-colors"
            >
              {/* Document Header */}
              <div className="flex items-center justify-between p-3 bg-[#15161b] border-b border-[#23252d]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-[#14151a] border border-[#272935] text-[#8b8e9b] shrink-0">
                    {Icon}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-[#eaebee] truncate block">
                      {docResult.filename}
                    </span>
                    <span className="text-[10px] text-[#6c6f80] font-mono block">
                      {docResult.file_type.toUpperCase()} &middot; {formatBytes(docResult.file_size)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chunks/Passages Matches */}
              <div className="p-3 space-y-3">
                {docResult.matches.map((match, idx) => {
                  const pRef = match.page_number
                    ? `page ${match.page_number}`
                    : match.sheet_name
                    ? `sheet ${match.sheet_name}`
                    : match.slide_number
                    ? `slide ${match.slide_number}`
                    : "";

                  return (
                    <div
                      key={match.chunk_id || idx}
                      className={cn(
                        "pt-2.5 first:pt-0 space-y-1.5 group",
                        idx > 0 && "border-t border-[#23252d]"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px]">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-[#14151a] border border-[#272935] text-[#8b8e9b]">
                            Match {idx + 1}
                          </span>
                          {pRef && (
                            <span className="text-[#6c6f80]">
                              ({pRef})
                            </span>
                          )}
                        </div>

                        {searchType === "semantic" && (
                          <span className="font-mono text-[#d48b38] bg-[#14151a] px-1.5 py-0.5 rounded border border-[#272935]">
                            Score: {match.score.toFixed(3)}
                          </span>
                        )}
                      </div>

                      {/* Snippet display */}
                      <div className="relative">
                        <blockquote className="text-xs text-[#c7cad6] font-mono leading-relaxed bg-[#14151a] p-2.5 rounded border border-[#272935] border-l-2 border-l-[#d48b38] select-text">
                          &ldquo;{match.content}&rdquo;
                        </blockquote>

                        {/* Action buttons on match hover */}
                        <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex gap-1.5">
                          <button
                            onClick={() => handleStartChat(docResult.filename, match.content)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#f4f4f6] hover:bg-[#eaebee] text-[#121316] shadow-xs transition-colors cursor-pointer"
                          >
                            <MessageSquare className="h-2.5 w-2.5" />
                            <span>Discuss</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
