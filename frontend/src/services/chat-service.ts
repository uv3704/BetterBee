import { authenticatedRequest, getApiBaseUrl } from "@/lib/api";

export interface RetrievedChunk {
  id: string;
  document: string;
  score: number;
  filename: string;
  page_number?: number;
  sheet_name?: string;
  slide_number?: number;
  chunk_index?: number;
}

export interface RerankedChunk extends RetrievedChunk {
  rank: number;
}

export interface ExplainabilityData {
  confidence: number;
  retrieved_chunks: RetrievedChunk[];
  reranked_chunks: RerankedChunk[];
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
}

export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  citations: Array<{
    filename: string;
    page_number?: number;
    sheet_name?: string;
    slide_number?: number;
    content_preview?: string;
  }>;
  explainability_data?: ExplainabilityData;
  token_count: number;
  model?: string;
  provider?: string;
  latency_ms: number;
  created_at: string;
}

export interface ChatSession {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionDetail extends ChatSession {
  messages: Message[];
}

export interface ChatStreamEvent {
  type: "session_id" | "token" | "citations" | "explain" | "message_id";
  content: string | Array<{ filename: string; page_number?: number; sheet_name?: string; slide_number?: number; content_preview?: string }> | ExplainabilityData;
}

export const chatService = {
  /**
   * Create a new chat session.
   */
  createSession: async (
    workspaceId: string,
    getToken: () => Promise<string | null>,
    title?: string,
  ): Promise<ChatSession> => {
    return authenticatedRequest<ChatSession>(
      {
        url: `/workspaces/${workspaceId}/chat/sessions`,
        method: "POST",
        data: { title },
      },
      getToken,
    );
  },

  /**
   * List all chat sessions for a workspace.
   */
  listSessions: async (
    workspaceId: string,
    getToken: () => Promise<string | null>,
  ): Promise<ChatSession[]> => {
    return authenticatedRequest<ChatSession[]>(
      {
        url: `/workspaces/${workspaceId}/chat/sessions`,
        method: "GET",
      },
      getToken,
    );
  },

  /**
   * Get detail for a specific chat session.
   */
  getSession: async (
    workspaceId: string,
    sessionId: string,
    getToken: () => Promise<string | null>,
  ): Promise<ChatSessionDetail> => {
    return authenticatedRequest<ChatSessionDetail>(
      {
        url: `/workspaces/${workspaceId}/chat/sessions/${sessionId}`,
        method: "GET",
      },
      getToken,
    );
  },

  /**
   * Update chat session metadata (title, is_pinned).
   */
  updateSession: async (
    workspaceId: string,
    sessionId: string,
    data: { title?: string; is_pinned?: boolean },
    getToken: () => Promise<string | null>,
  ): Promise<ChatSession> => {
    return authenticatedRequest<ChatSession>(
      {
        url: `/workspaces/${workspaceId}/chat/sessions/${sessionId}`,
        method: "PATCH",
        data,
      },
      getToken,
    );
  },

  /**
   * Delete a chat session.
   */
  deleteSession: async (
    workspaceId: string,
    sessionId: string,
    getToken: () => Promise<string | null>,
  ): Promise<void> => {
    return authenticatedRequest<void>(
      {
        url: `/workspaces/${workspaceId}/chat/sessions/${sessionId}`,
        method: "DELETE",
      },
      getToken,
    );
  },

  /**
   * Retrieve explainability metrics for a message.
   */
  getMessageExplainability: async (
    workspaceId: string,
    sessionId: string,
    messageId: string,
    getToken: () => Promise<string | null>,
  ): Promise<ExplainabilityData> => {
    return authenticatedRequest<ExplainabilityData>(
      {
        url: `/workspaces/${workspaceId}/chat/sessions/${sessionId}/messages/${messageId}/explain`,
        method: "GET",
      },
      getToken,
    );
  },

  /**
   * Send chat message and stream RAG response via SSE.
   */
  streamChatMessage: async (
    workspaceId: string,
    message: string,
    sessionId: string | null,
    getToken: () => Promise<string | null>,
    onEvent: (event: ChatStreamEvent) => void,
    onError: (err: unknown) => void,
    onClose: () => void,
  ): Promise<void> => {
    try {
      const token = await getToken();
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/v1/workspaces/${workspaceId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message, session_id: sessionId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");

          // Keep the last incomplete block in the buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith("data: ")) {
              try {
                const event: ChatStreamEvent = JSON.parse(trimmed.slice(6));
                onEvent(event);
              } catch (parseErr) {
                console.error("Error parsing chat SSE event line:", parseErr, trimmed);
              }
            }
          }
        }

        // Final line check
        if (buffer.trim().startsWith("data: ")) {
          try {
            const event: ChatStreamEvent = JSON.parse(buffer.trim().slice(6));
            onEvent(event);
          } catch {
             // Ignore final edge case parse errors
          }
        }
      } finally {
        reader.releaseLock();
      }

      onClose();
    } catch (err: unknown) {
      onError(err);
    }
  },
};
