export interface LoginFormValues {
  email: string;
  password: string;
}

export interface ChangePasswordFormValues {
  old_password: string;
  new_password: string;
  new_password2: string;
}

export interface AuthState {
  user: import("@/lib/token-utils").UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
