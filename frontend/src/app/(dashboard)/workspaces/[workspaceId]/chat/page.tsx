"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { chatService } from "@/services/chat-service";
import { ChatInput } from "@/components/chat/chat-input";
import { BeeIcon } from "@/components/icons";
import { FileText, HelpCircle, Terminal, Compass, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { UploadDialog } from "@/components/documents/upload-dialog";

export default function ChatLandingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const workspaceId = params.workspaceId as string;
  const initialMessage = searchParams.get("initialMessage");
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const initialHandledRef = useRef(false);

  const createSessionMutation = useMutation({
    mutationFn: (message: string) => chatService.createSession(workspaceId, getToken, message.slice(0, 40)),
    onError: (err) => {
      toast.error("Failed to start conversation");
      setIsSubmitting(false);
      console.error(err);
    }
  });

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    createSessionMutation.mutate(messageText, {
      onSuccess: (newSession) => {
        queryClient.invalidateQueries({ queryKey: ["chat-sessions", workspaceId] });
        // Redirect to new session page and pass the initial message in query params
        router.push(
          `/workspaces/${workspaceId}/chat/${newSession.id}?initialMessage=${encodeURIComponent(messageText)}`
        );
      },
    });
  }, [isSubmitting, createSessionMutation, queryClient, workspaceId, router]);

  useEffect(() => {
    if (initialMessage && !initialHandledRef.current) {
      initialHandledRef.current = true;
      void handleSendMessage(initialMessage);
    }
  }, [initialMessage, handleSendMessage]);

  const suggestions = [
    {
      title: "Analyze workspace details",
      desc: "Summarize the key information across all uploaded files.",
      icon: FileText,
      prompt: "Summarize the key information and main themes from all the documents uploaded in this workspace.",
    },
    {
      title: "Query document metrics",
      desc: "Find figures, tables, or spreadsheets.",
      icon: Terminal,
      prompt: "What are the key numerical metrics, figures, or financial tables available in our workspace documents?",
    },
    {
      title: "Understand requirements",
      desc: "Identify deliverables or action items.",
      icon: Compass,
      prompt: "What are the primary deliverables, requirements, or action items outlined in the files?",
    },
    {
      title: "Ask a general question",
      desc: "Formulate a custom search search request.",
      icon: HelpCircle,
      prompt: "Show me a detailed overview of the project guidelines mentioned in the documentation.",
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full items-center justify-between p-4 sm:p-6 max-w-6xl mx-auto w-full select-none pb-8">
      {/* Spacer or flex filler */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-6 sm:space-y-8 w-full py-4">
        {/* Logo/Hero area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center text-center space-y-2.5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded bg-[#18191f] border border-[#272935] text-[#d48b38]">
            <BeeIcon className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-medium tracking-tight text-[#f4f4f6] sm:text-2xl">
              Ask anything about your documents
            </h1>
            <p className="text-xs text-[#8b8e9b] max-w-md mx-auto leading-relaxed">
              BetterBee retrieves matching sections from your uploaded files and provides answers with exact page citations.
            </p>
          </div>
        </motion.div>

        {/* Suggestions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full pt-1"
        >
          {suggestions.map((s, idx) => {
            const Icon = s.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSendMessage(s.prompt)}
                disabled={isSubmitting}
                className="flex items-start text-left gap-3 p-3.5 rounded-lg border border-[#23252d] bg-[#18191f] hover:bg-[#1f212a] hover:border-[#2f3240] transition-colors group cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#14151a] border border-[#272935] text-[#8b8e9b] group-hover:text-[#d48b38] transition-colors">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-xs font-medium text-[#eaebee] group-hover:text-[#f4f4f6] transition-colors block">
                    {s.title}
                  </span>
                  <p className="text-[11px] text-[#8b8e9b] leading-normal line-clamp-1">
                    {s.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </motion.div>
      </div>

      {/* Input area */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="w-full pt-4 sticky bottom-0 bg-[#121316] pb-2"
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-2 py-3 text-xs font-medium text-[#8b8e9b] bg-[#18191f] border border-[#23252d] rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin text-[#d48b38]" />
            <span>Searching document context...</span>
          </div>
        ) : (
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={() => handleSendMessage(inputValue)}
            onUploadClick={() => setIsUploadOpen(true)}
          />
        )}
      </motion.div>

      <UploadDialog
        workspaceId={workspaceId}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}
