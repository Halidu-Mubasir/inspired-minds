import { apiRequest } from "./client";
import { API_BASE_URL, TOKEN_KEYS } from "@/lib/constants";
import type { PaginatedResponse } from "./users";

export interface ResourceUploaderSummary {
  id: string;
  first_name: string;
  last_name: string;
}

export type ResourceType = "note" | "document" | "past_question" | "answer_sheet" | "worksheet";
export type ResourceVisibility = "private" | "library";

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  resource_type: ResourceType;
  subject: string;
  visibility: ResourceVisibility;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_url?: string;
  uploaded_by: ResourceUploaderSummary;
  pairing_id: string | null;
  lesson_id: string | null;
  created_at: string;
}

export interface UploadResourceData {
  title: string;
  description?: string;
  resource_type: ResourceType;
  subject?: string;
  visibility: ResourceVisibility;
  pairing_id?: string;
  lesson_id?: string;
  file: File;
}

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  note: "Note",
  document: "Document",
  past_question: "Past Question",
  answer_sheet: "Answer Sheet",
  worksheet: "Worksheet",
};

function buildFormData(data: UploadResourceData): FormData {
  const fd = new FormData();
  fd.append("title", data.title);
  fd.append("resource_type", data.resource_type);
  fd.append("visibility", data.visibility);
  fd.append("file", data.file);
  if (data.description) fd.append("description", data.description);
  if (data.subject) fd.append("subject", data.subject);
  if (data.pairing_id) fd.append("pairing_id", data.pairing_id);
  if (data.lesson_id) fd.append("lesson_id", data.lesson_id);
  return fd;
}

export const resourcesApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return apiRequest<PaginatedResponse<Resource>>(`/resources/${query}`);
  },
  get: (id: string) => apiRequest<Resource>(`/resources/${id}/`),
  upload: (data: UploadResourceData) =>
    apiRequest<Resource>("/resources/", { method: "POST", body: buildFormData(data), isFormData: true }),
  update: (id: string, data: Partial<Pick<Resource, "title" | "description" | "subject">>) =>
    apiRequest<Resource>(`/resources/${id}/`, { method: "PATCH", body: data as unknown as Record<string, unknown> }),
  delete: (id: string) =>
    apiRequest<void>(`/resources/${id}/`, { method: "DELETE" }),

  getDownloadUrl: (id: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEYS.ACCESS) : null;
    return `${API_BASE_URL}/resources/${id}/download/${token ? `?token=${token}` : ""}`;
  },

  getLibrary: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return apiRequest<PaginatedResponse<Resource>>(`/resources/library/${query}`);
  },
  uploadToLibrary: (data: UploadResourceData) =>
    apiRequest<Resource>("/resources/library/", { method: "POST", body: buildFormData(data), isFormData: true }),
};
