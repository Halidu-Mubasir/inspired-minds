import { TOKEN_KEYS } from "@/lib/constants";
import { setSessionCookies, clearAuthCookies } from "@/lib/auth-cookies";

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

// Treat tokens as expired slightly early so they don't lapse in flight.
const EXPIRY_MARGIN_MS = 30_000;

/** Expiry (ms since epoch) from a JWT's `exp` claim, or null if it can't be read. */
export function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenFresh(token: string | null): boolean {
  const exp = token ? getTokenExpiry(token) : null;
  return exp !== null && Date.now() < exp - EXPIRY_MARGIN_MS;
}

export function setAuthTokens(
  accessToken: string,
  refreshToken: string,
  user: UserData
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
  localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
  localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
  localStorage.removeItem(`${TOKEN_KEYS.ACCESS}_exp`); // written by earlier versions
  setSessionCookies(user.role, getTokenExpiry(refreshToken) ?? Date.now());
}

/** Stores tokens from a refresh. The refresh token rotates, extending the session. */
export function updateTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
  if (!refreshToken) return;
  localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
  const user = getStoredUser();
  if (user) setSessionCookies(user.role, getTokenExpiry(refreshToken) ?? Date.now());
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

export function getStoredUser(): UserData | null {
  if (typeof window === "undefined") return null;
  try {
    const userStr = localStorage.getItem(TOKEN_KEYS.USER);
    return userStr ? (JSON.parse(userStr) as UserData) : null;
  } catch {
    return null;
  }
}
