import { TOKEN_KEYS } from "@/lib/constants";
import { setAuthCookies, clearAuthCookies } from "@/lib/auth-cookies";

export interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "teacher" | "student";
  avatar: string | null;
  phone_number: string | null;
  is_active: boolean;
}

export function setAuthTokens(
  accessToken: string,
  refreshToken: string,
  user: UserData
): void {
  if (typeof window === "undefined") return;
  // Store in localStorage
  localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
  localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
  localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
  // Also store access token expiry (1 day = 86400s)
  const expiresAt = Date.now() + 23 * 60 * 60 * 1000; // 23 hours
  localStorage.setItem(`${TOKEN_KEYS.ACCESS}_exp`, String(expiresAt));
  // Set cookies for SSR middleware auth check
  setAuthCookies(accessToken, user, expiresAt);
}

export function clearAuthTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEYS.ACCESS);
  localStorage.removeItem(TOKEN_KEYS.REFRESH);
  localStorage.removeItem(TOKEN_KEYS.USER);
  localStorage.removeItem(`${TOKEN_KEYS.ACCESS}_exp`);
  clearAuthCookies();
}

export function getAuthTokens(): {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserData | null;
} {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null, user: null };
  }
  try {
    const accessToken = localStorage.getItem(TOKEN_KEYS.ACCESS);
    const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH);
    const userStr = localStorage.getItem(TOKEN_KEYS.USER);
    const user = userStr ? (JSON.parse(userStr) as UserData) : null;
    return { accessToken, refreshToken, user };
  } catch {
    return { accessToken: null, refreshToken: null, user: null };
  }
}

export function isTokenValid(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const exp = localStorage.getItem(`${TOKEN_KEYS.ACCESS}_exp`);
    if (!exp) return false;
    return Date.now() < parseInt(exp);
  } catch {
    return false;
  }
}

export function getStoredUser(): UserData | null {
  if (typeof window === "undefined") return null;
  try {
    const userStr = localStorage.getItem(TOKEN_KEYS.USER);
    return userStr ? (JSON.parse(userStr) as UserData) : null;
  } catch {
    return null;
  }
}
