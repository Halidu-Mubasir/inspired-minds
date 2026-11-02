import { API_BASE_URL, TOKEN_KEYS } from "@/lib/constants";

type RequestOptions = {
  method?: string;
  body?: Record<string, unknown> | FormData;
  headers?: Record<string, string>;
  isFormData?: boolean;
};

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH);
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const newAccess = data.access;
    localStorage.setItem(TOKEN_KEYS.ACCESS, newAccess);
    localStorage.setItem(
      `${TOKEN_KEYS.ACCESS}_exp`,
      String(Date.now() + 23 * 60 * 60 * 1000)
    );
    return newAccess;
  } catch {
    return null;
  }
}

async function authorizedFetch(
  endpoint: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { method = "GET", body, headers = {}, isFormData = false } = options;

  // Get access token
  let accessToken =
    typeof window !== "undefined"
      ? localStorage.getItem(TOKEN_KEYS.ACCESS)
      : null;

  // Check expiry and refresh if needed
  const exp =
    typeof window !== "undefined"
      ? localStorage.getItem(`${TOKEN_KEYS.ACCESS}_exp`)
      : null;
  if (exp && Date.now() >= parseInt(exp)) {
    accessToken = await refreshAccessToken();
    if (!accessToken) {
      // Force logout
      if (typeof window !== "undefined") {
        localStorage.clear();
        window.location.href = "/login";
      }
      throw new Error("Session expired");
    }
  }

  const requestHeaders: Record<string, string> = { ...headers };
  if (accessToken) {
    requestHeaders["Authorization"] = `Bearer ${accessToken}`;
  }
  if (!isFormData && !(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: requestHeaders,
    body:
      body instanceof FormData
        ? body
        : body
        ? JSON.stringify(body)
        : undefined,
  });

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
