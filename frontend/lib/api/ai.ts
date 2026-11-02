import { apiRequest, apiStream } from "./client";
import type { PaginatedResponse } from "./users";

/** File types the AI can read (mirrors the backend's ai_services/attachments.py). */
export const AI_FILE_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "gif", "webp", "txt"];

export function isAiReadable(fileName: string): boolean {
  const ext = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "";
  return AI_FILE_EXTENSIONS.includes(ext);
}

export interface Quota {
  used: number;
  limit: number;
  remaining: number;
}

export interface AIUsage {
  configured: boolean;
  tutor?: Quota;
  teacher_tools?: Quota;
}

export interface Person {
  id: string;
  first_name: string;
  last_name: string;
}

export interface TutorMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  refused: boolean;
  created_at: string;
}

export interface SafeguardingFlag {
  id: string;
  reason: string;
  severity: "low" | "high";
  message_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: Person | null;
}

export interface TutorConversation {
  id: string;
  title: string;
  student: Person;
  subject: string | null;
  resource: { id: string; title: string; file_name: string } | null;
  message_count: number;
  /** Staff only; absent for students. */
  open_flags?: number;
  last_message_at: string | null;
  created_at: string;
}

export interface TutorConversationDetail extends TutorConversation {
  messages: TutorMessage[];
  /** Staff only; absent for students. */
  flags?: SafeguardingFlag[];
}

export type TutorStreamEvent =
  | { type: "start"; user_message: TutorMessage }
  | { type: "text"; text: string }
  | { type: "done"; message: TutorMessage; usage: Quota }
  | { type: "error"; detail: string };

export interface GeneratedQuestion {
  question: string;
  type: "multiple_choice" | "short_answer" | "structured";
  options: string[];
  answer: string;
  explanation: string;
  marks: number;
}

export interface AIGeneration {
  id: string;
  kind: "questions" | "summary";
  title: string;
  params: Record<string, string | number>;
  output: { title?: string; questions?: GeneratedQuestion[]; markdown?: string };
  lesson_id: string | null;
  resource_id: string | null;
  created_at: string;
  /** Only on the response to a new generation. */
  usage?: Quota;
}

export interface QuestionRequest {
  subject: string;
  topic: string;
  level: string;
  count: number;
  question_type: "mixed" | "multiple_choice" | "short_answer" | "structured";
  difficulty: "mixed" | "easy" | "medium" | "hard";
  instructions?: string;
  lesson_id?: string;
  resource_id?: string;
}

export interface SummaryRequest {
  format: "revision_sheet" | "teacher_summary";
  length: "short" | "medium" | "detailed";
  lesson_id?: string;
  resource_id?: string;
  text?: string;
}

const query = (params?: Record<string, string>) => (params ? `?${new URLSearchParams(params)}` : "");

export const aiApi = {
  getUsage: () => apiRequest<AIUsage>("/ai/usage/"),

  getConversations: (params?: Record<string, string>) =>
    apiRequest<PaginatedResponse<TutorConversation>>(`/ai/tutor/conversations/${query(params)}`),
  getConversation: (id: string) => apiRequest<TutorConversationDetail>(`/ai/tutor/conversations/${id}/`),
  startConversation: (data: { subject?: string; resource_id?: string }) =>
    apiRequest<TutorConversation>("/ai/tutor/conversations/", { method: "POST", body: data as Record<string, unknown> }),
  /** Streams the tutor's reply; see TutorStreamEvent. */
  sendMessage: (conversationId: string, content: string, onEvent: (event: TutorStreamEvent) => void) =>
    apiStream<TutorStreamEvent>(`/ai/tutor/conversations/${conversationId}/messages/`, { content }, onEvent),
  reviewFlag: (flagId: string) =>
    apiRequest<SafeguardingFlag>(`/ai/tutor/flags/${flagId}/review/`, { method: "POST" }),

  generateQuestions: (data: QuestionRequest) =>
    apiRequest<AIGeneration>("/ai/tools/questions/", { method: "POST", body: data as unknown as Record<string, unknown> }),
  summarise: (data: SummaryRequest) =>
    apiRequest<AIGeneration>("/ai/tools/summary/", { method: "POST", body: data as unknown as Record<string, unknown> }),
  getGenerations: (params?: Record<string, string>) =>
    apiRequest<PaginatedResponse<AIGeneration>>(`/ai/tools/generations/${query(params)}`),
  deleteGeneration: (id: string) => apiRequest<void>(`/ai/tools/generations/${id}/`, { method: "DELETE" }),
};
