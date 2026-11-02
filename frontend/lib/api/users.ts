import { apiRequest } from "./client";

export interface TeacherProfile {
  id: string;
  subjects: string[];
  qualifications: string | null;
  bio: string | null;
  years_of_experience: number;
  hourly_rate: string | null;
  is_available: boolean;
}

export type EducationLevel = "primary" | "jhs" | "shs" | "university" | "other";

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  primary: "Primary",
  jhs: "JHS",
  shs: "SHS",
  university: "University",
  other: "Other",
};

export interface StudentProfile {
  id: string;
  education_level: EducationLevel | null;
  school_name: string | null;
  grade_or_year: string | null;
  subjects_of_interest: string[];
  parent_guardian_name: string | null;
  parent_guardian_phone: string | null;
  parent_guardian_email: string | null;
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

export interface DashboardStats {
  /** Active accounts only. */
  total_teachers: number;
  inactive_teachers: number;
  /** Active accounts only. */
  total_students: number;
  inactive_students: number;
  active_pairings: number;
  /** Scheduled lessons from today through the next 7 days. */
  lessons_this_week: number;
}

/** Dashboard counts for the signed-in teacher or student. */
export interface MySummary {
  active_pairings: number;
  /** Scheduled lessons from today through the next 7 days. */
  upcoming_lessons: number;
  unread_messages: number;
  /** Teachers: files they uploaded. Students: private files shared with them. */
  shared_files: number;
}

/** PATCH body for admin edits; is_active=false deactivates, true reactivates. */
export interface UserUpdate {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  address?: string;
  is_active?: boolean;
  teacher_profile?: Partial<Omit<TeacherProfile, "id">>;
  student_profile?: Partial<Omit<StudentProfile, "id">>;
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
  updateTeacher: (id: string, data: UserUpdate) =>
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
  updateStudent: (id: string, data: UserUpdate) =>
    apiRequest<User>(`/auth/students/${id}/`, { method: "PATCH", body: data as unknown as Record<string, unknown> }),
  deleteStudent: (id: string) =>
    apiRequest<{ message: string }>(`/auth/students/${id}/`, { method: "DELETE" }),

  // Stats
  getDashboardStats: () => apiRequest<DashboardStats>("/auth/dashboard-stats/"),
  getMySummary: () => apiRequest<MySummary>("/auth/me/summary/"),
};
