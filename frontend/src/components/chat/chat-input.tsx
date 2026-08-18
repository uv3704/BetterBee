import React, { useRef, useEffect } from "react";
import { Send, CornerDownLeft, Paperclip } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onUploadClick?: () => void;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSubmit, onUploadClick, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize height based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit();
      }
    }
  };

  return (
    <div className="relative flex items-end w-full rounded-lg border border-[#272935] bg-[#18191f] pl-3 pr-3 py-2.5 focus-within:border-[#3d4152] transition-colors gap-2">
      {onUploadClick && (
        <button
          type="button"
          onClick={onUploadClick}
          disabled={disabled}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-[#272935] bg-[#14151a] hover:bg-[#1f212a] text-[#8b8e9b] hover:text-[#eaebee] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mb-0.5"
          title="Upload Document"
        >
          <Paperclip className="h-3.5 w-3.5" />
        </button>
      )}
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question about your documents..."
        disabled={disabled}
        className="flex-1 max-h-[200px] resize-none bg-transparent text-[#eaebee] placeholder-[#6c6f80] text-xs sm:text-sm focus:outline-hidden pr-12 pb-1 align-bottom"
        style={{ height: "auto" }}
      />
      <div className="absolute right-2.5 bottom-2 flex items-center gap-2">
        <span className="hidden md:flex items-center gap-0.5 text-[10px] text-[#6c6f80] font-mono">
          <span>Enter</span>
          <CornerDownLeft className="h-2.5 w-2.5" />
        </span>
        <button
          onClick={onSubmit}
          disabled={!value.trim() || disabled}
          className="flex h-7 w-7 items-center justify-center rounded bg-[#f4f4f6] hover:bg-[#eaebee] disabled:bg-[#23252d] text-[#121316] disabled:text-[#6c6f80] transition-colors cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
