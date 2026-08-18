"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Zap,
  Cpu,
  Clock,
  ExternalLink,
} from "lucide-react";

import { healthService } from "@/services/health-service";

export default function SystemStatusPage() {
  const { data: health, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["system-health"],
    queryFn: () => healthService.checkHealth(),
    refetchInterval: 15000, // Auto refresh every 15 seconds
  });

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);

    return parts.join(" ");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "connected":
      case "ready":
      case "running":
        return "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
      case "degraded":
      case "warning":
        return "text-amber-400 border-amber-500/20 bg-amber-500/5";
      case "not_configured":
        return "text-neutral-500 border-neutral-800 bg-neutral-900/10";
      default:
        return "text-rose-400 border-rose-500/20 bg-rose-500/5";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "connected":
      case "ready":
      case "running":
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      case "degraded":
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case "not_configured":
        return <Server className="h-5 w-5 text-neutral-600" />;
      default:
        return <XCircle className="h-5 w-5 text-rose-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#23252d] pb-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-[#f4f4f6] flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#d48b38]" />
            System Health &amp; Nodes
          </h1>
          <p className="text-xs text-[#8b8e9b] mt-0.5">
            Real-time status, network latency, and connection state of core services.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-[#18191f] border border-[#272935] text-[#8b8e9b] hover:text-[#eaebee] hover:bg-[#1f212a] transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin text-[#d48b38]" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 text-[#8b8e9b] animate-spin" />
        </div>
      ) : !health ? (
        <div className="text-center py-20 text-rose-400 text-xs">
          Failed to fetch system node health.
        </div>
      ) : (
        <>
          {/* Overall System Health Banner */}
          <div
            className={`border rounded-lg p-4 flex flex-col sm:flex-row items-center sm:justify-between gap-3 ${getStatusColor(
              health.status
            )}`}
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(health.status)}
              <div>
                <h3 className="text-sm font-medium capitalize">
                  System Status: {health.status}
                </h3>
                <p className="text-xs opacity-80 mt-0.5">
                  {health.status === "healthy"
                    ? "All services are functioning normally and within acceptable latency parameters."
                    : "Some background nodes are degraded or currently unreachable."}
                </p>
              </div>
            </div>

            {/* System Info Badges */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-center sm:justify-start">
              <div className="bg-[#14151a] border border-[#272935] rounded px-2.5 py-1 text-center text-xs">
                <span className="text-[#6c6f80] block text-[9px] uppercase tracking-wider">
                  Environment
                </span>
                <span className="font-mono text-[11px] text-[#eaebee] capitalize">
                  {health.environment}
                </span>
              </div>
              <div className="bg-[#14151a] border border-[#272935] rounded px-2.5 py-1 text-center text-xs">
                <span className="text-[#6c6f80] block text-[9px] uppercase tracking-wider">
                  Uptime
                </span>
                <span className="font-mono text-[11px] text-[#eaebee] flex items-center gap-1">
                  <Clock className="h-3 w-3 text-[#8b8e9b]" />
                  {formatUptime(health.uptime_seconds)}
                </span>
              </div>
              <div className="bg-[#14151a] border border-[#272935] rounded px-2.5 py-1 text-center text-xs">
                <span className="text-[#6c6f80] block text-[9px] uppercase tracking-wider">
                  Release
                </span>
                <span className="font-mono text-[11px] text-[#eaebee]">
                  v{health.version}
                </span>
              </div>
            </div>
          </div>

          {/* Node Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Database Node */}
            <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-4 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[#6c6f80] uppercase tracking-wider text-[10px] block font-mono">
                    PostgreSQL Node
                  </span>
                  <h4 className="text-sm font-medium text-[#eaebee] flex items-center gap-2">
                    <Database className="h-4 w-4 text-[#8b8e9b]" />
                    Storage Engine
                  </h4>
                  <p className="text-xs text-[#8b8e9b] leading-normal max-w-sm">
                    Primary transactional storage for workspaces, users, documents, and chats.
                  </p>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusColor(health.services.database.status)}`}>
                  {health.services.database.status}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#23252d] pt-3 text-xs">
                <span className="text-[#6c6f80]">Response Latency</span>
                <span className="font-mono text-[#eaebee] flex items-center gap-1 text-[11px]">
                  <Zap className="h-3 w-3 text-[#d48b38]" />
                  {health.services.database.latency_ms ? `${health.services.database.latency_ms} ms` : "--"}
                </span>
              </div>

              {health.services.database.error && (
                <div className="p-2 border border-rose-900/40 bg-rose-950/20 rounded text-[11px] text-rose-400 font-mono overflow-x-auto whitespace-pre-wrap select-text">
                  {health.services.database.error}
                </div>
              )}
            </div>

            {/* Redis Node */}
            <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-4 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[#6c6f80] uppercase tracking-wider text-[10px] block font-mono">
                    Redis Cache
                  </span>
                  <h4 className="text-sm font-medium text-[#eaebee] flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-[#8b8e9b]" />
                    Broker &amp; Queue
                  </h4>
                  <p className="text-xs text-[#8b8e9b] leading-normal max-w-sm">
                    In-memory data structures and task queueing for background document processing.
                  </p>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusColor(health.services.redis.status)}`}>
                  {health.services.redis.status}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#23252d] pt-3 text-xs">
                <span className="text-[#6c6f80]">Ping Latency</span>
                <span className="font-mono text-[#eaebee] flex items-center gap-1 text-[11px]">
                  <Zap className="h-3 w-3 text-[#d48b38]" />
                  {health.services.redis.latency_ms ? `${health.services.redis.latency_ms} ms` : "--"}
                </span>
              </div>

              {health.services.redis.error && (
                <div className="p-2 border border-rose-900/40 bg-rose-950/20 rounded text-[11px] text-rose-400 font-mono overflow-x-auto whitespace-pre-wrap select-text">
                  {health.services.redis.error}
                </div>
              )}
            </div>

            {/* ChromaDB Node */}
            <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-4 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[#6c6f80] uppercase tracking-wider text-[10px] block font-mono">
                    ChromaDB Store
                  </span>
                  <h4 className="text-sm font-medium text-[#eaebee] flex items-center gap-2">
                    <Server className="h-4 w-4 text-[#8b8e9b]" />
                    Vector Engine
                  </h4>
                  <p className="text-xs text-[#8b8e9b] leading-normal max-w-sm">
                    Persistent vector database for multi-workspace isolated semantic retrieval.
                  </p>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusColor(health.services.chromadb.status)}`}>
                  {health.services.chromadb.status}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#23252d] pt-3 text-xs">
                <span className="text-[#6c6f80]">Query Latency</span>
                <span className="font-mono text-[#eaebee] flex items-center gap-1 text-[11px]">
                  <Zap className="h-3 w-3 text-[#d48b38]" />
                  {health.services.chromadb.latency_ms ? `${health.services.chromadb.latency_ms} ms` : "--"}
                </span>
              </div>

              {health.services.chromadb.error && (
                <div className="p-2 border border-rose-900/40 bg-rose-950/20 rounded text-[11px] text-rose-400 font-mono overflow-x-auto whitespace-pre-wrap select-text">
                  {health.services.chromadb.error}
                </div>
              )}
            </div>

            {/* Ollama / AI Provider Node */}
            <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-4 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[#6c6f80] uppercase tracking-wider text-[10px] block font-mono">
                    AI Compute Nodes
                  </span>
                  <h4 className="text-sm font-medium text-[#eaebee] flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-[#8b8e9b]" />
                    Inference &amp; Embeddings
                  </h4>
                  <p className="text-xs text-[#8b8e9b] leading-normal max-w-sm">
                    Inference engines (Groq LPU, OpenAI, or local Ollama) for text and vector generation.
                  </p>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusColor(health.services.ollama.status)}`}>
                  {health.services.ollama.status === "not_configured" ? "Cloud-based" : health.services.ollama.status}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#23252d] pt-3 text-xs">
                <span className="text-[#6c6f80]">Connection State</span>
                <span className="font-mono text-[#eaebee] flex items-center gap-1.5 text-[11px]">
                  {health.services.ollama.status === "not_configured" ? (
                    <>
                      <span>Groq Llama-3 Cloud</span>
                      <ExternalLink className="h-3 w-3 text-[#6c6f80]" />
                    </>
                  ) : (
                    <>
                      <Zap className="h-3 w-3 text-[#d48b38]" />
                      <span>{health.services.ollama.latency_ms ? `${health.services.ollama.latency_ms} ms` : "--"}</span>
                    </>
                  )}
                </span>
              </div>

              {health.services.ollama.error && (
                <div className="p-2 border border-rose-900/40 bg-rose-950/20 rounded text-[11px] text-rose-400 font-mono overflow-x-auto whitespace-pre-wrap select-text">
                  {health.services.ollama.error}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Inline Loader component helper since there's no UI folder
function Loader2({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}
