import { apiRequest } from "./client";
import type { PaginatedResponse } from "./users";

export interface LessonTopic {
  id: string;
  title: string;
  description: string | null;
  order: number;
  is_completed: boolean;
}

export interface LessonUserSummary {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
}

export interface LessonDetail {
  id: string;
  pairing_id: string;
  subject: string;
  teacher: LessonUserSummary;
  student: LessonUserSummary;
  title: string;
  description: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  duration_minutes: number;
  status: "draft" | "scheduled" | "completed" | "cancelled";
  teacher_notes?: string | null;
  student_notes: string | null;
  homework: string | null;
  topics: LessonTopic[];
  created_at: string;
  updated_at: string;
}

export interface LessonSummary {
  id: string;
  title: string;
  status: "draft" | "scheduled" | "completed" | "cancelled";
  scheduled_date: string;
  scheduled_time: string | null;
  duration_minutes: number;
  pairing_id: string;
  subject: string;
  teacher_name: string;
  student_name: string;
  topic_count: number;
  updated_at: string;
}

export interface CreateLessonData {
  pairing_id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  scheduled_time?: string;
  duration_minutes?: number;
  teacher_notes?: string;
  student_notes?: string;
  homework?: string;
}

export interface UpdateLessonData {
  title?: string;
  description?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  duration_minutes?: number;
  teacher_notes?: string;
  student_notes?: string;
  homework?: string;
}

export const lessonsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return apiRequest<PaginatedResponse<LessonSummary>>(`/lessons/${query}`);
  },
  get: (id: string) => apiRequest<LessonDetail>(`/lessons/${id}/`),
  create: (data: CreateLessonData) =>
    apiRequest<LessonDetail>("/lessons/", { method: "POST", body: data as unknown as Record<string, unknown> }),
  update: (id: string, data: UpdateLessonData) =>
    apiRequest<LessonDetail>(`/lessons/${id}/`, { method: "PATCH", body: data as unknown as Record<string, unknown> }),
  delete: (id: string) =>
    apiRequest<void>(`/lessons/${id}/`, { method: "DELETE" }),
  updateStatus: (id: string, status: string) =>
    apiRequest<LessonDetail>(`/lessons/${id}/status/`, { method: "PATCH", body: { status } }),

  // Topics
  getTopics: (lessonId: string) =>
    apiRequest<LessonTopic[]>(`/lessons/${lessonId}/topics/`),
  createTopic: (lessonId: string, data: { title: string; description?: string; order?: number }) =>
    apiRequest<LessonTopic>(`/lessons/${lessonId}/topics/`, { method: "POST", body: data }),
  updateTopic: (lessonId: string, topicId: string, data: Partial<LessonTopic>) =>
    apiRequest<LessonTopic>(`/lessons/${lessonId}/topics/${topicId}/`, {
      method: "PATCH",
      body: data as unknown as Record<string, unknown>,
    }),
  deleteTopic: (lessonId: string, topicId: string) =>
    apiRequest<void>(`/lessons/${lessonId}/topics/${topicId}/`, { method: "DELETE" }),
};
