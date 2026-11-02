"use client";
import { useQuery } from "@tanstack/react-query";
import { subjectsApi } from "@/lib/api/subjects";
import type { Subject } from "@/lib/api/subjects";
import { queryKeys } from "@/lib/query-keys";

/** The active subjects a user can pick from. Loads once `enabled` is true (e.g. when a sheet opens). */
export function useSubjects(enabled = true): Subject[] {
  const { data } = useQuery({
    queryKey: queryKeys.subjects,
    queryFn: subjectsApi.getAll,
    enabled,
    staleTime: 10 * 60_000, // the subject list rarely changes
  });
  return data?.filter((s) => s.is_active) ?? [];
}
