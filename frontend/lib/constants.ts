export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

export const USER_ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
};

export const TOKEN_KEYS = {
  ACCESS: "inspired_minds_access",
  REFRESH: "inspired_minds_refresh",
  USER: "inspired_minds_user",
} as const;
