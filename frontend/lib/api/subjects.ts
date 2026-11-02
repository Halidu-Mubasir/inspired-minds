import { apiRequest } from "./client";

export interface Subject {
  id: string;
  name: string;
  is_active: boolean;
}

export const subjectsApi = {
  /** Active subjects (admins also receive retired ones, with is_active=false). */
  getAll: () => apiRequest<Subject[]>("/subjects/"),
};
