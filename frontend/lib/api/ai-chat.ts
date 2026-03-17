import { apiRequest } from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConversationType =
  | "general_chat"
  | "question_generator"
  | "note_summarizer"
  | "problem_solver";

export const CONVERSATION_TYPE_LABELS: Record<ConversationType, string> = {
  general_chat: "General Chat",
  question_generator: "Question Generator",
  note_summarizer: "Note Summarizer",
  problem_solver: "Problem Solver",
};

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  input_tokens: number;
  output_tokens: number;
  created_at: string;
}

export interface AIConversationSummary {
  id: string;
  title: string;
  conversation_type: ConversationType;
  message_count: number;
  last_message_at: string;
  created_at: string;
}

export interface AIConversationDetail extends AIConversationSummary {
  system_prompt: string;
  messages: AIMessage[];
}

export interface CreateConversationData {
  title?: string;
  conversation_type?: ConversationType;
  system_prompt?: string;
}

export interface SendMessageResponse {
  user_message: AIMessage;
  ai_message: AIMessage;
}

// ── API client ────────────────────────────────────────────────────────────────

export const aiChatApi = {
  getConversations: () =>
    apiRequest<AIConversationSummary[]>("/ai-chat/conversations/"),

  createConversation: (data: CreateConversationData) =>
    apiRequest<AIConversationDetail>("/ai-chat/conversations/", {
      method: "POST",
      body: data as unknown as Record<string, unknown>,
    }),

  getConversation: (id: string) =>
    apiRequest<AIConversationDetail>(`/ai-chat/conversations/${id}/`),

  deleteConversation: (id: string) =>
    apiRequest<void>(`/ai-chat/conversations/${id}/`, { method: "DELETE" }),

  sendMessage: (conversationId: string, content: string) =>
    apiRequest<SendMessageResponse>(
      `/ai-chat/conversations/${conversationId}/messages/`,
      { method: "POST", body: { content } as unknown as Record<string, unknown> }
    ),
};
