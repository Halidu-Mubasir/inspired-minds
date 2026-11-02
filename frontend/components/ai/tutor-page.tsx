"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Bot, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { AiNotConfigured } from "@/components/ai/ai-not-configured";
import { ConversationSummary } from "@/components/ai/conversation-summary";
import { NewTutorChatDialog } from "@/components/ai/new-tutor-chat-dialog";
import { TutorThread } from "@/components/ai/tutor-thread";
import { aiApi } from "@/lib/api/ai";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

const LIST_PARAMS = { page_size: "50" };

function ActiveThread({ id }: { id: string }) {
  const query = useQuery({ queryKey: queryKeys.ai.conversation(id), queryFn: () => aiApi.getConversation(id) });
  if (query.isPending) return <div className="p-4 space-y-3"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-16 w-3/4 ml-auto" /></div>;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  return <TutorThread key={id} conversation={query.data} />;
}

/** Student AI tutor: conversation list on the left, the open conversation on the right. */
export function TutorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const activeId = searchParams.get("id");
  const [creating, setCreating] = useState(false);

  const usage = useQuery({ queryKey: queryKeys.ai.usage, queryFn: aiApi.getUsage });
  const list = useQuery({
    queryKey: queryKeys.ai.conversations(LIST_PARAMS),
    queryFn: () => aiApi.getConversations(LIST_PARAMS),
  });

  function open(id: string | null) {
    router.replace(id ? `?id=${id}` : "?");
  }

  if (usage.data && !usage.data.configured) return <AiNotConfigured />;

  return (
    <div className="flex h-[calc(100vh-7rem)] overflow-hidden rounded-xl border bg-background">
      <div className={cn("flex-col border-r w-full md:w-72 shrink-0", activeId ? "hidden md:flex" : "flex")}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-sm flex items-center gap-2"><Bot className="h-4 w-4" /> Study helper</h2>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" /> New
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto divide-y">
          {list.isPending ? (
            <div className="p-3 space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : list.isError ? (
            <ErrorState error={list.error} onRetry={() => list.refetch()} />
          ) : list.data.results.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No chats yet. Start one to get help with your studies.</p>
          ) : (
            list.data.results.map((c) => (
              <ConversationSummary key={c.id} conversation={c} active={c.id === activeId} onSelect={() => open(c.id)} />
            ))
          )}
        </div>
      </div>

      <div className={cn("flex-1 flex-col min-w-0", activeId ? "flex" : "hidden md:flex")}>
        {activeId ? (
          <>
            <div className="md:hidden border-b px-2 py-1.5">
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => open(null)}>
                <ArrowLeft className="h-4 w-4" /> Chats
              </Button>
            </div>
            <ActiveThread id={activeId} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-6">
            <Bot className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Your study helper explains topics, gives hints and helps you practise past questions.
            </p>
            <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="h-4 w-4" /> New chat</Button>
          </div>
        )}
      </div>

      <NewTutorChatDialog
        open={creating}
        onClose={() => setCreating(false)}
        onStarted={(conversation) => {
          setCreating(false);
          queryClient.invalidateQueries({ queryKey: ["ai", "conversations"] });
          open(conversation.id);
        }}
      />
    </div>
  );
}
