"use client";
import { useQuery } from "@tanstack/react-query";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { lessonsApi } from "@/lib/api/lessons";
import { queryKeys } from "@/lib/query-keys";

const NONE = "__none__";
const PARAMS = { page_size: "100" };

/** Pick one of the teacher's lessons to ground an AI tool. "" means none. */
export function LessonSelect({ value, onChange }: { value: string; onChange: (lessonId: string) => void }) {
  const { data, isPending } = useQuery({
    queryKey: queryKeys.lessons.list(PARAMS),
    queryFn: () => lessonsApi.getAll(PARAMS),
  });

  return (
    <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{isPending ? "Loading lessons…" : "No lesson"}</SelectItem>
        {(data?.results ?? []).map((l) => (
          <SelectItem key={l.id} value={l.id}>
            {l.title} · {l.student_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
