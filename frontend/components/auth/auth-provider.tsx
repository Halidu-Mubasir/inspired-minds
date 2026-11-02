"use client";
import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
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

interface AuthContextValue {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginPayload) => Promise<UserData>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const subscribeToNothing = () => () => {};

/** One shared copy of the signed-in user for the whole app. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // The user lives in localStorage, which the server can't read. Until hydration finishes,
  // report "loading" so the server render and the first client render match.
  const isClient = useSyncExternalStore(subscribeToNothing, () => true, () => false);
  const [storedUser, setUser] = useState<UserData | null>(getStoredUser);
  const user = isClient ? storedUser : null;
  const isLoading = !isClient;
  const router = useRouter();
  const queryClient = useQueryClient();

  const login = useCallback(
    async (credentials: LoginPayload) => {
      const { tokens, user: userData } = await authApi.login(credentials);
      queryClient.clear(); // never show a previous user's cached data
      setAuthTokens(tokens.access_token, tokens.refresh_token, userData);
      setUser(userData);
      router.push(ROLE_DASHBOARDS[userData.role]);
      return userData;
    },
    [router, queryClient]
  );

  const logout = useCallback(async () => {
    try {
      const { refreshToken } = getAuthTokens();
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // The session ends locally regardless; the server token expires on its own.
    } finally {
      clearAuthTokens();
      queryClient.clear();
      setUser(null);
      router.push("/login");
    }
  }, [router, queryClient]);

  const refreshUser = useCallback(async () => {
    const userData = await authApi.getMe();
    const { accessToken, refreshToken } = getAuthTokens();
    if (accessToken && refreshToken) {
      setAuthTokens(accessToken, refreshToken, userData);
    }
    setUser(userData);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, isLoading, login, logout, refreshUser }),
    [user, isLoading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
