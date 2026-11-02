/** The shape `apiRequest` throws for non-2xx responses. */
export interface ApiError {
  status: number;
  data: Record<string, unknown>;
}

export function isApiError(error: unknown): error is ApiError {
  return typeof error === "object" && error !== null && "status" in error && "data" in error;
}

export function isNotFound(error: unknown): boolean {
  return isApiError(error) && error.status === 404;
}

/**
 * A human-readable message from an API error: DRF's `detail`, else the first
 * field or non-field error, else the fallback.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (!isApiError(error)) return fallback;
  const { detail, ...fields } = error.data;
  if (typeof detail === "string") return detail;
  for (const value of Object.values(fields)) {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  }
  return fallback;
}
