import { apiRequest } from "./client";
import type { PaginatedResponse } from "./users";

export interface ConversationParticipant {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
}

export interface Conversation {
  id: string;
  pairing_id: string;
  /** Chat on an ended pairing is read-only history. */
  pairing_status: "active" | "paused" | "ended";
  subject: string;
  teacher: ConversationParticipant;
  student: ConversationParticipant;
  last_message_at: string | null;
  last_message_preview: string;
  unread_count: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation: string;
  sender: ConversationParticipant;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export const chatApi = {
  /** A user has one conversation per pairing, so a single large page covers everyone. */
  getConversations: async () =>
    (await apiRequest<PaginatedResponse<Conversation>>("/chat/conversations/?page_size=100")).results,
  getConversation: (id: string) =>
    apiRequest<Conversation>(`/chat/conversations/${id}/`),
  getMessages: (id: string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return apiRequest<PaginatedResponse<Message>>(`/chat/conversations/${id}/messages/${query}`);
  },
  markRead: (id: string) =>
    apiRequest<{ marked_read: number }>(`/chat/conversations/${id}/read/`, { method: "POST" }),
};
