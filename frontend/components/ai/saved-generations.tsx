"use client";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, parseISO } from "date-fns";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CardGridSkeleton } from "@/components/shared/card-grid-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { GenerationView } from "@/components/ai/generation-view";
import { aiApi } from "@/lib/api/ai";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

export function SavedGenerations() {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const params = { page: String(page) };
  const list = useQuery({
    queryKey: queryKeys.ai.generations(params),
    queryFn: () => aiApi.getGenerations(params),
    placeholderData: keepPreviousData,
  });

  if (list.isPending) return <CardGridSkeleton count={3} cardClassName="h-20" />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => list.refetch()} />;
  const items = list.data.results;
  if (items.length === 0) {
    return <EmptyState icon={History} title="Nothing saved yet" description="Question sets and summaries you create appear here." />;
  }
  const selected = items.find((g) => g.id === selectedId) ?? items[0];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <div className="space-y-2">
        <div className="rounded-xl border divide-y overflow-hidden">
          {items.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedId(g.id)}
              className={cn("w-full text-left px-4 py-3 hover:bg-muted/60", g.id === selected.id && "bg-muted")}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium truncate">{g.title}</p>
                <Badge variant="outline" className="text-[10px] shrink-0">{g.kind === "questions" ? "Questions" : "Summary"}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{formatDistanceToNow(parseISO(g.created_at), { addSuffix: true })}</p>
            </button>
          ))}
        </div>
        <PaginationControls page={page} count={list.data.count} onPageChange={setPage} />
      </div>
      <div className="min-w-0">
        <GenerationView key={selected.id} generation={selected} />
      </div>
    </div>
  );
}
