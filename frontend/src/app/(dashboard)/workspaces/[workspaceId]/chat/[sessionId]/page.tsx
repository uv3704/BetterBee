"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { chatService, type Message, type ExplainabilityData } from "@/services/chat-service";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { ExplainabilityPanel } from "@/components/explainability/explainability-panel";
import { Loader2, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { UploadDialog } from "@/components/documents/upload-dialog";

export default function ChatSessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const workspaceId = params.workspaceId as string;
  const sessionId = params.sessionId as string;
  const initialMessage = searchParams.get("initialMessage");

  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Explainability Panel State
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [explainData, setExplainData] = useState<ExplainabilityData | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const initialHandledRef = useRef(false);

  // Fetch session messages
  const { data: session, isLoading } = useQuery({
    queryKey: ["chat-session", sessionId],
    queryFn: () => chatService.getSession(workspaceId, sessionId, getToken),
    enabled: Boolean(sessionId),
  });

  const messages = [...(session?.messages || []), ...optimisticMessages];

  // Handle scroll events to show/hide scroll-to-bottom button
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  const scrollToBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  };

  // Auto-scroll during streaming
  useEffect(() => {
    if (streamingMessage) {
      scrollToBottom();
    }
  }, [streamingMessage]);

  // Auto-scroll on initial load or new messages
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  // Handle sending a message
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isSending) return;

    setIsSending(true);
    setInputValue("");

    // 1. Create local user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      session_id: sessionId,
      role: "user",
      content: text,
      citations: [],
      explainability_data: undefined,
      token_count: text.split(/\s+/).length,
      latency_ms: 0,
      created_at: new Date().toISOString(),
    };

    setOptimisticMessages((prev) => [...prev, userMsg]);

    // 2. Initialize local streaming assistant message
    const assistantMsgId = `assistant-${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      session_id: sessionId,
      role: "assistant",
      content: "",
      citations: [],
      explainability_data: undefined,
      token_count: 0,
      latency_ms: 0,
      created_at: new Date().toISOString(),
    };

    setStreamingMessage(initialAssistantMsg);

    // 3. Initiate SSE chat stream
    await chatService.streamChatMessage(
      workspaceId,
      text,
      sessionId,
      getToken,
      (event) => {
        if (event.type === "token") {
          setStreamingMessage((prev) => {
            if (!prev) return null;
            return { ...prev, content: prev.content + (typeof event.content === "string" ? event.content : "") };
          });
        } else if (event.type === "citations") {
          setStreamingMessage((prev) => {
            if (!prev) return null;
            return { ...prev, citations: Array.isArray(event.content) ? event.content : [] };
          });
        } else if (event.type === "explain") {
          setStreamingMessage((prev) => {
            if (!prev) return null;
            return { ...prev, explainability_data: event.content as ExplainabilityData };
          });
        } else if (event.type === "message_id") {
          setStreamingMessage((prev) => {
            if (!prev) return null;
            return { ...prev, id: String(event.content) };
          });
        }
      },
      (err) => {
        toast.error("Error communicating with AI engine");
        setIsSending(false);
        setStreamingMessage(null);
        console.error(err);
      },
      () => {
        // Complete - reload from DB
        queryClient.invalidateQueries({ queryKey: ["chat-session", sessionId] });
        queryClient.invalidateQueries({ queryKey: ["chat-sessions", workspaceId] });
        setStreamingMessage(null);
        setOptimisticMessages([]);
        setIsSending(false);
      }
    );
  }, [isSending, sessionId, workspaceId, getToken, queryClient]);

  // Catch initialMessage redirect and execute it
  useEffect(() => {
    if (initialMessage && !initialHandledRef.current && !isLoading) {
      initialHandledRef.current = true;
      // Clean up search query param from URL
      const url = new URL(window.location.href);
      url.searchParams.delete("initialMessage");
      window.history.replaceState({}, "", url.pathname);

      void handleSendMessage(initialMessage);
    }
  }, [initialMessage, isLoading, handleSendMessage]);

  const handleOpenExplain = (message: Message) => {
    if (selectedMessageId === message.id && isExplainOpen) {
      setIsExplainOpen(false);
      setSelectedMessageId(null);
      setExplainData(null);
    } else {
      setSelectedMessageId(message.id);
      setExplainData(message.explainability_data || null);
      setIsExplainOpen(true);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden h-full relative">
      {/* Active Conversation thread */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-[#121316]">
        
        {/* Messages List Area */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 pb-12 space-y-5 custom-scrollbar"
        >
          {isLoading && messages.length === 0 ? (
            <div className="flex flex-col h-full items-center justify-center text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-[#8b8e9b]" />
              <span className="text-xs text-[#8b8e9b]">Loading conversation...</span>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-5">
              <AnimatePresence initial={false}>
                {messages.map((msg: Message) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MessageBubble
                      message={msg}
                      onOpenExplain={handleOpenExplain}
                      isExplainOpen={selectedMessageId === msg.id && isExplainOpen}
                      onSendMessage={handleSendMessage}
                    />
                  </motion.div>
                ))}
                
                {/* Streaming Assistant Message */}
                {streamingMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <MessageBubble
                      message={streamingMessage}
                      onOpenExplain={handleOpenExplain}
                      isExplainOpen={selectedMessageId === streamingMessage.id && isExplainOpen}
                      onSendMessage={handleSendMessage}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-24 right-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#18191f] border border-[#272935] text-[#b0b3c1] hover:text-[#f4f4f6] shadow-sm transition-colors cursor-pointer z-10"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Input Panel */}
        <div className="px-4 sm:px-6 pb-6 pt-3 border-t border-[#23252d] bg-[#121316] max-w-6xl mx-auto w-full">
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={() => handleSendMessage(inputValue)}
            onUploadClick={() => setIsUploadOpen(true)}
            disabled={isSending}
          />
        </div>
      </div>

      {/* AI Explainability Diagnostic Panel */}
      <AnimatePresence>
        {isExplainOpen && (
          <ExplainabilityPanel
            isOpen={isExplainOpen}
            explainData={explainData}
            onClose={() => {
              setIsExplainOpen(false);
              setSelectedMessageId(null);
              setExplainData(null);
            }}
          />
        )}
      </AnimatePresence>

      <UploadDialog
        workspaceId={workspaceId}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}
