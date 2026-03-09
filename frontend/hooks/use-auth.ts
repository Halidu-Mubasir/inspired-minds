"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getAuthTokens,
  setAuthTokens,
  clearAuthTokens,
  getStoredUser,
  type UserData,
} from "@/lib/token-utils";
import { ROLE_DASHBOARDS } from "@/lib/constants";
import { authApi } from "@/lib/api/auth";
import type { LoginPayload } from "@/lib/api/auth";

export function useAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (credentials: LoginPayload) => {
      const response = await authApi.login(credentials);
      const { tokens, user: userData } = response;
      setAuthTokens(tokens.access_token, tokens.refresh_token, userData);
      setUser(userData);
      router.push(ROLE_DASHBOARDS[userData.role]);
      return userData;
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore errors on logout
    } finally {
      clearAuthTokens();
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.getMe();
      const { accessToken, refreshToken } = getAuthTokens();
      if (accessToken && refreshToken) {
        setAuthTokens(accessToken, refreshToken, userData);
      }
      setUser(userData);
    } catch {
      // ignore
    }
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };
}
