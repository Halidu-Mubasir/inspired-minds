import { apiRequest } from "./client";
import type { UserData } from "@/lib/token-utils";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse {
  message: string;
  tokens: AuthTokens;
  user: UserData;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
  new_password2: string;
}

export interface PasswordResetConfirmPayload {
  uid: string;
  token: string;
  new_password: string;
  new_password2: string;
}

export const authApi = {
  login: (data: LoginPayload) =>
    apiRequest<LoginResponse>("/auth/login/", { method: "POST", body: data as unknown as Record<string, unknown>, auth: false }),

  logout: (refreshToken: string) =>
    apiRequest<{ message: string }>("/auth/logout/", { method: "POST", body: { refresh: refreshToken }, auth: false }),

  getMe: () => apiRequest<UserData>("/auth/me/"),

  updateMe: (data: Partial<UserData>) =>
    apiRequest<UserData>("/auth/me/", { method: "PATCH", body: data as unknown as Record<string, unknown> }),

  /** Signs out every other session; the response carries fresh tokens for this one. */
  changePassword: (data: ChangePasswordPayload) =>
    apiRequest<{ message: string; tokens: AuthTokens }>("/auth/change-password/", { method: "POST", body: data as unknown as Record<string, unknown> }),

  requestPasswordReset: (email: string) =>
    apiRequest<{ message: string }>("/auth/password-reset/", { method: "POST", body: { email }, auth: false }),

  confirmPasswordReset: (data: PasswordResetConfirmPayload) =>
    apiRequest<{ message: string }>("/auth/password-reset/confirm/", { method: "POST", body: data as unknown as Record<string, unknown>, auth: false }),

  changeAvatar: (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return apiRequest<{ avatar: string }>("/auth/me/avatar/", {
      method: "POST",
      body: form,
      isFormData: true,
    });
  },
};
