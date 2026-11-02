import { API_BASE_URL } from "@/lib/constants";
import { clearAuthTokens, getAuthTokens, isTokenFresh, updateTokens } from "@/lib/token-utils";

type RequestOptions = {
  method?: string;
  body?: Record<string, unknown> | FormData;
  headers?: Record<string, string>;
  isFormData?: boolean;
  /** Send the user's access token. Off for login, logout and password reset. */
  auth?: boolean;
};

let refreshInFlight: Promise<string | null> | null = null;

async function requestNewAccessToken(): Promise<string | null> {
  const { refreshToken } = getAuthTokens();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!res.ok) return null;
    const data: { access: string; refresh?: string } = await res.json();
    updateTokens(data.access, data.refresh);
    return data.access;
  } catch {
    return null;
  }
}

/**
 * Refreshes the access token. Concurrent callers share one request: refresh tokens
 * rotate, so a second parallel refresh with the old token would be rejected.
 */
function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  refreshInFlight ??= requestNewAccessToken().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/** A usable access token, refreshing it first if it has expired. Null if the session is over. */
export async function getValidAccessToken(): Promise<string | null> {
  const { accessToken } = getAuthTokens();
  if (isTokenFresh(accessToken)) return accessToken;
  return refreshAccessToken();
}

function endSession(): never {
  clearAuthTokens();
  if (typeof window !== "undefined") window.location.href = "/login";
  throw { status: 401, data: { detail: "Your session has expired. Please sign in again." } };
}

async function authorizedFetch(
  endpoint: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { method = "GET", body, headers = {}, isFormData = false, auth = true } = options;

  const send = (accessToken: string | null) => {
    const requestHeaders: Record<string, string> = { ...headers };
    if (accessToken) {
      requestHeaders["Authorization"] = `Bearer ${accessToken}`;
    }
    if (!isFormData && !(body instanceof FormData)) {
      requestHeaders["Content-Type"] = "application/json";
    }
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body:
        body instanceof FormData
          ? body
          : body
          ? JSON.stringify(body)
          : undefined,
    });
  };

  let res = await send(auth ? await getValidAccessToken() : null);

  // The access token can be rejected before its expiry (e.g. after a server-side
  // change), so retry once with a refreshed token before giving up on the session.
  if (res.status === 401 && auth) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) endSession();
    res = await send(refreshed);
    if (res.status === 401) endSession();
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Request failed" }));
    throw { status: res.status, data: errorData };
  }

  return res;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const res = await authorizedFetch(endpoint, options);
  if (res.status === 204) return undefined as T;
  return res.json();
}

/** Fetches a file with the user's credentials and hands it to the browser as a download. */
export async function apiDownload(endpoint: string, fileName: string): Promise<void> {
  const res = await authorizedFetch(endpoint);
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
