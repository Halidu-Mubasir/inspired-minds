"use client";
import { AUTH_COOKIES, TOKEN_KEYS } from "@/lib/constants";
import type { UserRole } from "@/lib/constants";

// Cookies written by earlier versions, which stored the access token itself.
const LEGACY_COOKIES = [TOKEN_KEYS.ACCESS, `${TOKEN_KEYS.ACCESS}_exp`];

function expireCookies(names: readonly string[]): void {
  for (const name of names) document.cookie = `${name}=; path=/; max-age=0`;
}

/**
 * Sets the cookies the Next.js middleware uses for route gating. They live as long as
 * the refresh token, so an expired access token alone never bounces the user to /login.
 * These are a UX guard only; the API enforces access.
 */
export function setSessionCookies(role: UserRole, sessionExpiresAt: number): void {
  if (typeof document === "undefined") return;
  const maxAge = Math.max(0, Math.floor((sessionExpiresAt - Date.now()) / 1000));
  const cookieOptions = `; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `${AUTH_COOKIES.SESSION}=${sessionExpiresAt}${cookieOptions}`;
  document.cookie = `${AUTH_COOKIES.ROLE}=${role}${cookieOptions}`;
  expireCookies(LEGACY_COOKIES);
}

export function clearAuthCookies(): void {
  if (typeof document === "undefined") return;
  expireCookies([AUTH_COOKIES.SESSION, AUTH_COOKIES.ROLE, ...LEGACY_COOKIES]);
}
