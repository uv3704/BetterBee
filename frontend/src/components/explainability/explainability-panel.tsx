import React from "react";
import { X, Clock, BarChart2, Activity, Cpu, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface ExplainabilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  explainData?: {
    confidence: number;
    retrieved_chunks: Array<{
      id: string;
      document: string;
      score: number;
      filename: string;
      page_number?: number;
      sheet_name?: string;
      slide_number?: number;
      chunk_index?: number;
    }>;
    reranked_chunks: Array<{
      id: string;
      document: string;
      score: number;
      filename: string;
      page_number?: number;
      sheet_name?: string;
      slide_number?: number;
      chunk_index?: number;
      rank: number;
    }>;
    latencies: {
      retrieval_ms: number;
      reranking_ms: number;
      generation_ms: number;
      total_ms: number;
    };
    model_info: {
      provider: string;
      model_name: string;
    };
  } | null;
}

export function ExplainabilityPanel({ isOpen, onClose, explainData }: ExplainabilityPanelProps) {
  if (!isOpen) return null;

  if (!explainData) {
    return (
      <div className="flex flex-col h-full border-l border-neutral-900 bg-neutral-950/95 backdrop-blur-md w-88 shrink-0 p-6 select-none">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Explainability</span>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-7 w-7 text-zinc-600 mb-2" />
          <span className="text-xs text-zinc-500">No diagnostic data available for this message.</span>
        </div>
      </div>
    );
  }

  const { confidence, reranked_chunks = [], latencies = { retrieval_ms: 0, reranking_ms: 0, generation_ms: 0, total_ms: 0 }, model_info } = explainData;

  const retMs = latencies?.retrieval_ms || 0;
  const rerMs = latencies?.reranking_ms || 0;
  const genMs = latencies?.generation_ms || 0;
  const totMs = latencies?.total_ms || 0;

  // Latency fractions for visualization
  const maxLatency = Math.max(retMs + rerMs + genMs, totMs || 1);

  const retrievalPct = (retMs / maxLatency) * 100;
  const rerankPct = (rerMs / maxLatency) * 100;
  const genPct = (genMs / maxLatency) * 100;

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="flex flex-col h-full border-l border-zinc-800 bg-zinc-950/95 backdrop-blur-md w-88 shrink-0 select-none overflow-y-auto custom-scrollbar"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 sticky top-0 bg-zinc-950/95 z-10">
        <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-amber-500" />
          Query Diagnostics
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Confidence Gauge */}
        <div className="bg-neutral-900/30 border border-neutral-900 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Confidence Metric</span>
            <span className="text-xs font-mono font-bold text-amber-400">{confidence}%</span>
          </div>
          <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidence}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 rounded-full"
            />
          </div>
          <p className="text-[10px] text-neutral-500 leading-relaxed">
            Confidence represents grounding quality based on similarity matching of the top 5 reranked context blocks.
          </p>
        </div>

        {/* Model Spec */}
        <div className="bg-neutral-900/30 border border-neutral-900 p-4 rounded-xl space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">LLM Processing Unit</span>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5 text-amber-500/70" />
              <span className="text-xs font-mono text-neutral-300 font-medium">{model_info.model_name}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-950 border border-neutral-800 text-neutral-400 uppercase">
              {model_info.provider}
            </span>
          </div>
        </div>

        {/* Timeline Latencies */}
        <div className="bg-neutral-900/30 border border-neutral-900 p-4 rounded-xl space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-neutral-500" /> Latency Timeline
          </span>

          <div className="space-y-3">
            {/* Visual segmented bar */}
            <div className="h-3 w-full bg-neutral-900 rounded-lg overflow-hidden flex border border-neutral-850">
              <div style={{ width: `${retrievalPct}%` }} className="bg-amber-600/60" title="Retrieval" />
              <div style={{ width: `${rerankPct}%` }} className="bg-amber-500/50" title="Reranking" />
              <div style={{ width: `${genPct}%` }} className="bg-amber-400/80" title="LLM Generation" />
            </div>

            {/* List breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-0.5 border-b border-neutral-900/50">
                <span className="text-neutral-500 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-600/60" /> Retrieval
                </span>
                <span className="font-mono text-neutral-300">{latencies.retrieval_ms}ms</span>
              </div>
              <div className="flex items-center justify-between py-0.5 border-b border-neutral-900/50">
                <span className="text-neutral-500 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500/50" /> Reranking
                </span>
                <span className="font-mono text-neutral-300">{latencies.reranking_ms}ms</span>
              </div>
              <div className="flex items-center justify-between py-0.5 border-b border-neutral-900/50">
                <span className="text-neutral-500 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400/80" /> Generation
                </span>
                <span className="font-mono text-neutral-300">{latencies.generation_ms}ms</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 text-amber-500 font-medium">
                <span className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5" /> Total execution
                </span>
                <span className="font-mono">{latencies.total_ms || (latencies.retrieval_ms + latencies.reranking_ms + latencies.generation_ms).toFixed(1)}ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Chunks (Reranked Top 5) */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
            RAG Document Selections (Top 5)
          </span>
          <div className="space-y-2.5">
            {reranked_chunks.map((chunk, index) => {
              const pRef = chunk.page_number
                ? `page ${chunk.page_number}`
                : chunk.sheet_name
                ? `sheet ${chunk.sheet_name}`
                : chunk.slide_number
                ? `slide ${chunk.slide_number}`
                : "";

              return (
                <div
                  key={chunk.id || index}
                  className="bg-neutral-900/20 border border-neutral-900 hover:border-neutral-800 p-3.5 rounded-xl space-y-2 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-amber-500/10 text-[10px] font-bold text-amber-400 border border-amber-500/25">
                        {index + 1}
                      </div>
                      <span className="text-xs font-semibold text-neutral-200 truncate">{chunk.filename}</span>
                      {pRef && <span className="text-[10px] text-neutral-500 font-mono">({pRef})</span>}
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10 shrink-0">
                      S: {chunk.score.toFixed(3)}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-400 line-clamp-3 leading-normal font-mono bg-neutral-950/40 p-2 rounded-lg border border-neutral-950">
                    &quot;{chunk.document}&quot;
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
