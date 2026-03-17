import { apiRequest } from "./client";

export interface QuizOption {
  id: string;
  text: string;
  order: number;
  is_correct?: boolean; // only present for teachers or after submission
}

export interface QuizQuestion {
  id: string;
  question_type: "mcq" | "true_false";
  question_text: string;
  order: number;
  points: number;
  explanation?: string | null; // revealed after submission
  options: QuizOption[];
}

export interface QuizSummary {
  id: string;
  title: string;
  subject: string;
  status: "draft" | "published" | "archived";
  question_count: number;
  time_limit_minutes: number | null;
  generated_by_ai: boolean;
  created_at: string;
  student_name: string;
}

export interface QuizDetail extends QuizSummary {
  pairing: string;
  lesson: string | null;
  description: string | null;
  teacher_name: string;
  questions: QuizQuestion[];
}

export interface QuizAnswer {
  id: string;
  question: QuizQuestion;
  selected_option: QuizOption | null;
  is_correct: boolean | null;
  points_earned: number;
}

export interface QuizAttempt {
  id: string;
  quiz: string;
  status: "in_progress" | "submitted";
  score: number | null;
  total_points: number | null;
  submitted_at: string | null;
  answers: QuizAnswer[];
}

export interface CreateQuizData {
  pairing_id: string;
  title: string;
  subject?: string;
  description?: string;
  time_limit_minutes?: number;
}

export interface GenerateQuizData {
  pairing_id: string;
  topic: string;
  title?: string;
  subject?: string;
  num_questions?: number;
  difficulty?: "easy" | "medium" | "hard";
  question_types?: ("mcq" | "true_false")[];
  lesson_id?: string;
}

export interface SubmitAttemptData {
  answers: { question_id: string; selected_option_id: string }[];
}

export interface TeacherAttemptResult {
  id: string;
  student_name: string;
  student_email: string;
  status: string;
  score: number | null;
  total_points: number | null;
  submitted_at: string | null;
  percentage: number | null;
}

export const quizzesApi = {
  getAll: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest<QuizSummary[]>(`/quizzes/${qs}`);
  },

  get: (id: string) =>
    apiRequest<QuizDetail>(`/quizzes/${id}/`),

  create: (data: CreateQuizData) =>
    apiRequest<QuizDetail>("/quizzes/", { method: "POST", body: data as unknown as Record<string, unknown> }),

  update: (id: string, data: Partial<CreateQuizData>) =>
    apiRequest<QuizDetail>(`/quizzes/${id}/`, { method: "PATCH", body: data as unknown as Record<string, unknown> }),

  delete: (id: string) =>
    apiRequest<void>(`/quizzes/${id}/`, { method: "DELETE" }),

  generate: (data: GenerateQuizData) =>
    apiRequest<QuizDetail>("/quizzes/generate/", { method: "POST", body: data as unknown as Record<string, unknown> }),

  publish: (id: string) =>
    apiRequest<QuizDetail>(`/quizzes/${id}/publish/`, { method: "PATCH" }),

  getAttempt: (quizId: string) =>
    apiRequest<QuizAttempt>(`/quizzes/${quizId}/attempt/`),

  startAttempt: (quizId: string) =>
    apiRequest<QuizAttempt>(`/quizzes/${quizId}/attempt/`, { method: "POST" }),

  submitAttempt: (quizId: string, data: SubmitAttemptData) =>
    apiRequest<QuizAttempt>(`/quizzes/${quizId}/attempt/submit/`, { method: "POST", body: data as unknown as Record<string, unknown> }),

  getResults: (quizId: string) =>
    apiRequest<TeacherAttemptResult[] | QuizAttempt>(`/quizzes/${quizId}/results/`),
};
