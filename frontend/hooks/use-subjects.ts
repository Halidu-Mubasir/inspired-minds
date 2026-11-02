"use client";
import { useEffect, useState } from "react";
import { subjectsApi } from "@/lib/api/subjects";
import type { Subject } from "@/lib/api/subjects";

/** The active subjects a user can pick from. Loads once `enabled` is true (e.g. when a sheet opens). */
export function useSubjects(enabled = true): Subject[] {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    if (!enabled) return;
    subjectsApi
      .getAll()
      .then((all) => setSubjects(all.filter((s) => s.is_active)))
      .catch(() => {});
  }, [enabled]);

  return subjects;
}
