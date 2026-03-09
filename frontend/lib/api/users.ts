import { apiRequest } from "./client";

export interface TeacherProfile {
  id: string;
  subjects: string[];
  qualifications: string;
  bio: string;
  years_of_experience: number;
  hourly_rate: string | null;
  is_available: boolean;
}

export interface StudentProfile {
  id: string;
  education_level: string;
  school_name: string;
  grade_or_year: string;
  subjects_of_interest: string[];
  parent_guardian_name: string;
  parent_guardian_phone: string;
  parent_guardian_email: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  avatar: string | null;
  role: "admin" | "teacher" | "student";
  address: string | null;
  is_active: boolean;
  teacher_profile?: TeacherProfile;
  student_profile?: StudentProfile;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const usersApi = {
  // Teachers
  getTeachers: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return apiRequest<PaginatedResponse<User>>(`/auth/teachers/${query}`);
  },
  getTeacher: (id: string) => apiRequest<User>(`/auth/teachers/${id}/`),
  createTeacher: (data: Record<string, unknown>) =>
    apiRequest<User>("/auth/teachers/", { method: "POST", body: data }),
  updateTeacher: (id: string, data: Partial<User>) =>
    apiRequest<User>(`/auth/teachers/${id}/`, { method: "PATCH", body: data as unknown as Record<string, unknown> }),
  deleteTeacher: (id: string) =>
    apiRequest<{ message: string }>(`/auth/teachers/${id}/`, { method: "DELETE" }),

  // Students
  getStudents: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return apiRequest<PaginatedResponse<User>>(`/auth/students/${query}`);
  },
  getStudent: (id: string) => apiRequest<User>(`/auth/students/${id}/`),
  createStudent: (data: Record<string, unknown>) =>
    apiRequest<User>("/auth/students/", { method: "POST", body: data }),
  updateStudent: (id: string, data: Partial<User>) =>
    apiRequest<User>(`/auth/students/${id}/`, { method: "PATCH", body: data as unknown as Record<string, unknown> }),
  deleteStudent: (id: string) =>
    apiRequest<{ message: string }>(`/auth/students/${id}/`, { method: "DELETE" }),

  // Stats
  getDashboardStats: () =>
    apiRequest<{ total_teachers: number; total_students: number; active_pairings: number }>("/auth/dashboard-stats/"),
};
