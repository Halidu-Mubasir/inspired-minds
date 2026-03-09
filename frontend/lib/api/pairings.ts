import { apiRequest } from "./client";
import type { PaginatedResponse } from "./users";

export interface UserSummary {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar: string | null;
}

export interface Pairing {
  id: string;
  teacher: UserSummary;
  student: UserSummary;
  subject: string;
  status: "active" | "paused" | "ended";
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PairingStats {
  total: number;
  active: number;
  paused: number;
  ended: number;
}

export interface CreatePairingData {
  teacher_id: string;
  student_id: string;
  subject: string;
  start_date: string;
  notes?: string;
}

export interface UpdatePairingData {
  status?: "active" | "paused" | "ended";
  end_date?: string;
  notes?: string;
}

export const pairingsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return apiRequest<PaginatedResponse<Pairing>>(`/pairings/${query}`);
  },
  get: (id: string) => apiRequest<Pairing>(`/pairings/${id}/`),
  create: (data: CreatePairingData) =>
    apiRequest<Pairing>("/pairings/", { method: "POST", body: data as unknown as Record<string, unknown> }),
  update: (id: string, data: UpdatePairingData) =>
    apiRequest<Pairing>(`/pairings/${id}/`, { method: "PATCH", body: data as unknown as Record<string, unknown> }),
  end: (id: string) =>
    apiRequest<{ message: string }>(`/pairings/${id}/`, { method: "DELETE" }),
  getStats: () => apiRequest<PairingStats>("/pairings/stats/"),
  getMyStudents: () => apiRequest<Pairing[]>("/pairings/my-students/"),
  getMyTeachers: () => apiRequest<Pairing[]>("/pairings/my-teachers/"),
};
