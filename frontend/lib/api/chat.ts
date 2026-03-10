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
  getConversations: () =>
    apiRequest<Conversation[] | PaginatedResponse<Conversation>>("/chat/conversations/"),
  getConversation: (id: string) =>
    apiRequest<Conversation>(`/chat/conversations/${id}/`),
  getMessages: (id: string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return apiRequest<PaginatedResponse<Message>>(`/chat/conversations/${id}/messages/${query}`);
  },
  markRead: (id: string) =>
    apiRequest<{ marked_read: number }>(`/chat/conversations/${id}/read/`, { method: "POST" }),
};
