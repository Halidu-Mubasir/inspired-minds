"use client";
import { useQuery } from "@tanstack/react-query";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { isAiReadable } from "@/lib/api/ai";
import { resourcesApi } from "@/lib/api/resources";
import { queryKeys } from "@/lib/query-keys";

// Radix Select items can't have an empty value, so "no file" needs a sentinel.
const NONE = "__none__";
const PARAMS = { page_size: "100" };

interface AiFileSelectProps {
  value: string;
  onChange: (resourceId: string) => void;
  enabled?: boolean;
}

/** Pick one of the user's resources the AI can read (PDF, image or .txt). "" means none. */
export function AiFileSelect({ value, onChange, enabled = true }: AiFileSelectProps) {
  const { data, isPending } = useQuery({
    queryKey: queryKeys.resources.list(PARAMS),
    queryFn: () => resourcesApi.getAll(PARAMS),
    enabled,
  });
  const files = (data?.results ?? []).filter((r) => isAiReadable(r.file_name));

  return (
    <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{isPending ? "Loading files…" : "No file"}</SelectItem>
        {files.map((r) => (
          <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
