"use client";

import React, { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { searchService } from "@/services/search-service";
import { SearchResults } from "@/components/search/search-results";
import { Search, Sparkles, HelpCircle, FileText, Loader2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function SearchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  
  const workspaceId = params.workspaceId as string;
  const initialQuery = searchParams.get("q") || "";

  const [queryInput, setQueryInput] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<"semantic" | "keyword">("semantic");

  // Query search service
  const { data, isLoading, error } = useQuery({
    queryKey: ["search", workspaceId, searchQuery, searchType],
    queryFn: () => {
      if (!searchQuery.trim()) return null;
      return searchService.searchWorkspace(workspaceId, searchQuery, searchType, getToken);
    },
    enabled: !!searchQuery.trim() && !!workspaceId,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) {
      toast.error("Please enter a search query");
      return;
    }
    setSearchQuery(queryInput.trim());
  };

  const handleSuggestionClick = (promptText: string) => {
    setQueryInput(promptText);
    setSearchQuery(promptText);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#121316] text-[#eaebee] p-4 sm:p-6 custom-scrollbar h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto space-y-6 select-none">
        
        {/* Page Hero */}
        <div className="space-y-1 border-b border-[#23252d] pb-4">
          <h1 className="text-xl font-medium tracking-tight text-[#f4f4f6] flex items-center gap-2">
            <Search className="h-4 w-4 text-[#d48b38]" />
            Document Explorer
          </h1>
          <p className="text-xs text-[#8b8e9b]">
            Locate exact matches, sections, and tables across your workspace document corpus.
          </p>
        </div>

        {/* Search Control Box */}
        <form
          onSubmit={handleSearchSubmit}
          className="bg-[#18191f] border border-[#23252d] p-4 sm:p-5 rounded-lg space-y-4 shadow-xs"
        >
          {/* Tabs */}
          <div className="flex gap-1 p-0.5 rounded bg-[#14151a] border border-[#272935] w-fit">
            <button
              type="button"
              onClick={() => setSearchType("semantic")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                searchType === "semantic"
                  ? "bg-[#23252d] text-[#f4f4f6]"
                  : "text-[#8b8e9b] hover:text-[#eaebee]"
              }`}
            >
              <Sparkles className="h-3 w-3 text-[#d48b38]" />
              <span>Semantic Search</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchType("keyword")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                searchType === "keyword"
                  ? "bg-[#23252d] text-[#f4f4f6]"
                  : "text-[#8b8e9b] hover:text-[#eaebee]"
              }`}
            >
              <FileText className="h-3 w-3 text-[#8b8e9b]" />
              <span>Keyword Matching</span>
            </button>
          </div>

          {/* Search Inputs */}
          <div className="flex gap-2">
            <div className="relative flex-1 flex items-center rounded border border-[#272935] bg-[#14151a] px-3 py-1.5 focus-within:border-[#3d4152] transition-colors">
              <Search className="h-3.5 w-3.5 text-[#6c6f80] shrink-0 mr-2" />
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder={
                  searchType === "semantic"
                    ? "Ask a question or enter a topic concept..."
                    : "Search for specific literal keywords, names, or values..."
                }
                className="flex-1 bg-transparent text-xs sm:text-sm text-[#eaebee] placeholder-[#6c6f80] focus:outline-hidden"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#f4f4f6] hover:bg-[#eaebee] text-[#121316] font-medium text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#121316]" />
              ) : (
                <>
                  <span>Search</span>
                  <ArrowRight className="h-3 w-3" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Dynamic content rendering */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-14 text-center space-y-2"
            >
              <Loader2 className="h-6 w-6 animate-spin text-[#8b8e9b]" />
              <span className="text-xs text-[#8b8e9b]">
                Searching document database...
              </span>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3 border border-rose-900/40 bg-rose-950/20 text-rose-400 text-xs rounded-lg flex items-center gap-2"
            >
              <span>Search query failed. Please verify API connection or try again.</span>
            </motion.div>
          ) : data ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <SearchResults
                results={data.results}
                query={data.query}
                searchType={data.search_type}
                workspaceId={workspaceId}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3 pt-2"
            >
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#8b8e9b] block">
                Suggested queries
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleSuggestionClick("guidelines and requirements")}
                  className="flex items-center justify-between text-left p-3 rounded-lg border border-[#23252d] bg-[#18191f] hover:bg-[#1f212a] hover:border-[#2f3240] transition-colors cursor-pointer text-xs"
                >
                  <span className="text-[#c7cad6] font-medium truncate max-w-[250px]">
                    &quot;guidelines and requirements&quot;
                  </span>
                  <HelpCircle className="h-3.5 w-3.5 text-[#6c6f80] shrink-0 ml-2" />
                </button>
                <button
                  onClick={() => handleSuggestionClick("financial performance table")}
                  className="flex items-center justify-between text-left p-3 rounded-lg border border-[#23252d] bg-[#18191f] hover:bg-[#1f212a] hover:border-[#2f3240] transition-colors cursor-pointer text-xs"
                >
                  <span className="text-[#c7cad6] font-medium truncate max-w-[250px]">
                    &quot;financial performance table&quot;
                  </span>
                  <HelpCircle className="h-3.5 w-3.5 text-[#6c6f80] shrink-0 ml-2" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
