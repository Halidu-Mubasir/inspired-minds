"use client";
import { TOKEN_KEYS } from "@/lib/constants";
import type { UserData } from "@/lib/token-utils";

/**
 * Sets auth cookies so the Next.js middleware can verify auth on the server.
 * Called after a successful login in addition to localStorage storage.
 */
export function setAuthCookies(accessToken: string, user: UserData, expiresAt: number): void {
  if (typeof document === "undefined") return;
  const maxAge = Math.floor((expiresAt - Date.now()) / 1000);
  const cookieOptions = `; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `${TOKEN_KEYS.ACCESS}=${accessToken}${cookieOptions}`;
  document.cookie = `${TOKEN_KEYS.ACCESS}_exp=${expiresAt}${cookieOptions}`;
  document.cookie = `inspired_minds_role=${user.role}${cookieOptions}`;
}

export function clearAuthCookies(): void {
  if (typeof document === "undefined") return;
  const expired = "; path=/; max-age=0";
  document.cookie = `${TOKEN_KEYS.ACCESS}=${expired}`;
  document.cookie = `${TOKEN_KEYS.ACCESS}_exp=${expired}`;
  document.cookie = `inspired_minds_role=${expired}`;
}
