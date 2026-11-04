"use client";
import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { CheckCircle2, MessagesSquare, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Markdown } from "@/components/shared/markdown";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { ConversationSummary } from "@/components/ai/conversation-summary";
import { aiApi } from "@/lib/api/ai";
import type { SafeguardingFlag } from "@/lib/api/ai";
import { getErrorMessage } from "@/lib/api/errors";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

function FlagCard({ flag, conversationId }: { flag: SafeguardingFlag; conversationId: string }) {
  const queryClient = useQueryClient();
  const review = useMutation({
    mutationFn: () => aiApi.reviewFlag(flag.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ai.conversation(conversationId) });
      queryClient.invalidateQueries({ queryKey: ["ai", "conversations"] });
      toast.success("Marked as followed up");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update the flag.")),
  });
  const open = !flag.reviewed_at;

  return (
    <div className={cn("rounded-lg border p-3 text-sm space-y-2", open ? "border-destructive/40 bg-destructive/5" : "bg-muted/40")}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className={cn("h-4 w-4", open ? "text-destructive" : "text-muted-foreground")} />
          <Badge variant={flag.severity === "high" ? "destructive" : "secondary"}>
            {flag.severity === "high" ? "High concern" : "Concern"}
          </Badge>
          <span className="text-xs text-muted-foreground">{format(parseISO(flag.created_at), "d MMM yyyy, HH:mm")}</span>
        </div>
        {open ? (
          <Button size="sm" variant="outline" className="h-7 text-xs" disabled={review.isPending} onClick={() => review.mutate()}>
            Mark followed up
          </Button>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Followed up{flag.reviewed_by ? ` by ${flag.reviewed_by.first_name} ${flag.reviewed_by.last_name}` : ""}
          </span>
        )}
      </div>
      <p>{flag.reason}</p>
    </div>
  );
}

function ConversationReview({ id }: { id: string }) {
  const query = useQuery({ queryKey: queryKeys.ai.conversation(id), queryFn: () => aiApi.getConversation(id) });
  if (query.isPending) return <div className="p-4 space-y-3"><Skeleton className="h-20" /><Skeleton className="h-40" /></div>;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  const c = query.data;
  const flaggedMessageIds = new Set((c.flags ?? []).map((f) => f.message_id));

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="border-b px-4 py-3">
        <p className="font-semibold text-sm">{c.title || "New chat"}</p>
        <p className="text-xs text-muted-foreground">
          {c.student.first_name} {c.student.last_name}
          {c.subject && ` · ${c.subject}`}
          {c.resource && ` · about "${c.resource.title}"`}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(c.flags ?? []).map((flag) => <FlagCard key={flag.id} flag={flag} conversationId={c.id} />)}
        {c.messages.map((m) => (
          <div key={m.id} className={cn("rounded-lg px-3 py-2", m.role === "user" ? "bg-primary/5" : "bg-muted/50",
            flaggedMessageIds.has(m.id) && "ring-2 ring-destructive/50")}>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span className="font-medium">{m.role === "user" ? c.student.first_name : "Study helper"}{m.refused && " (declined)"}</span>
              <span>{format(parseISO(m.created_at), "d MMM, HH:mm")}</span>
            </div>
            {m.role === "assistant" ? <Markdown>{m.content}</Markdown> : <p className="text-sm whitespace-pre-wrap">{m.content}</p>}
          </div>
        ))}
        {c.messages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
      </div>
    </div>
  );
}

/** Teachers (their students) and admins (everyone) read tutor chats and follow up on flags. */
export function TutorChatReview({ subtitle }: { subtitle: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("id");
  const [filter, setFilter] = useState<"flagged" | "all">("flagged");
  const [page, setPage] = useState(1);
  const params: Record<string, string> = { page: String(page), ...(filter === "flagged" && { flagged: "true" }) };

  const list = useQuery({
    queryKey: queryKeys.ai.conversations(params),
    queryFn: () => aiApi.getConversations(params),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Tutor Chat Review" subtitle={subtitle} />
      <Tabs value={filter} onValueChange={(v) => { setFilter(v as "flagged" | "all"); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="flagged">Needs follow-up</TabsTrigger>
          <TabsTrigger value="all">All chats</TabsTrigger>
        </TabsList>
      </Tabs>

      {list.isPending ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : list.data.results.length === 0 && !activeId ? (
        <EmptyState
          icon={filter === "flagged" ? CheckCircle2 : MessagesSquare}
          title={filter === "flagged" ? "Nothing needs follow-up" : "No tutor chats yet"}
          description={filter === "flagged" ? "Chats the tutor flags for a safety concern appear here." : "Students' AI tutor chats appear here."}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="space-y-2">
            <div className="rounded-xl border divide-y overflow-hidden">
              {list.data.results.map((c) => (
                <ConversationSummary
                  key={c.id}
                  conversation={c}
                  active={c.id === activeId}
                  showStudent
                  onSelect={() => router.replace(`?id=${c.id}`)}
                />
              ))}
            </div>
            <PaginationControls page={page} count={list.data.count} onPageChange={setPage} />
          </div>
          <div className="rounded-xl border min-h-[24rem] h-[calc(100dvh-17rem)] bg-card overflow-hidden">
            {activeId ? (
              <ConversationReview id={activeId} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground p-6 text-center">
                Select a chat to read it.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
