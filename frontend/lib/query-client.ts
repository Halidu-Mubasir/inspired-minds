import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/lib/api/errors";

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Client errors (403, 404, 400…) won't change on retry; network and 5xx errors might.
        retry: (failureCount, error) =>
          !(isApiError(error) && error.status < 500) && failureCount < 2,
      },
    },
  });
}
