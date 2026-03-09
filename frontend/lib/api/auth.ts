import { apiRequest } from "./client";
import type { UserData } from "@/lib/token-utils";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  tokens: { access_token: string; refresh_token: string };
  user: UserData;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
  new_password2: string;
}

export const authApi = {
  login: (data: LoginPayload) =>
    apiRequest<LoginResponse>("/auth/login/", { method: "POST", body: data as unknown as Record<string, unknown> }),

  logout: () =>
    apiRequest<{ message: string }>("/auth/logout/", { method: "POST" }),

  getMe: () => apiRequest<UserData>("/auth/me/"),

  updateMe: (data: Partial<UserData>) =>
    apiRequest<UserData>("/auth/me/", { method: "PATCH", body: data as unknown as Record<string, unknown> }),

  changePassword: (data: ChangePasswordPayload) =>
    apiRequest<{ message: string }>("/auth/change-password/", { method: "POST", body: data as unknown as Record<string, unknown> }),

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
