"use client";
import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ConversationList } from "./conversation-list";
import { ConversationPanel } from "./conversation-panel";
import { chatApi } from "@/lib/api/chat";
import { useAuth } from "@/hooks/use-auth";
import type { Conversation, Message } from "@/lib/api/chat";
import { queryKeys } from "@/lib/query-keys";

export function ChatPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mobileShowThread, setMobileShowThread] = useState(false);

  const activeId = searchParams.get("id");

  const conversationsQuery = useQuery({ queryKey: queryKeys.conversations, queryFn: chatApi.getConversations });
  const conversations = conversationsQuery.data ?? [];

  /** Patch one conversation in the cached list (unread count, latest message preview). */
  const patchConversation = useCallback(
    (convId: string, patch: Partial<Conversation>) => {
      queryClient.setQueryData<Conversation[]>(queryKeys.conversations, (prev) =>
        prev?.map((c) => (c.id === convId ? { ...c, ...patch } : c))
      );
    },
    [queryClient]
  );

  const showLatestMessage = useCallback(
    (message: Message) =>
      patchConversation(message.conversation, {
        last_message_preview: message.content,
        last_message_at: message.created_at,
      }),
    [patchConversation]
  );

  function selectConversation(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    router.replace(`?${params.toString()}`);
    setMobileShowThread(true);
  }

  const activeConv = conversations.find((c) => c.id === activeId) ?? null;

  // Mark as read when a conversation opens
  useEffect(() => {
    if (!activeId) return;
    chatApi
      .markRead(activeId)
      .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.mySummary }))
      .catch(() => {}); // best effort; the socket "read" event also marks messages
    patchConversation(activeId, { unread_count: 0 });
  }, [activeId, patchConversation, queryClient]);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-xl border bg-background">
      {/* Conversation list — hidden on mobile when thread is shown */}
      <div className={cn("w-80 flex-shrink-0", mobileShowThread && activeId ? "hidden md:flex md:flex-col" : "flex flex-col w-full md:w-80")}>
        <div className="px-4 py-3.5 border-b">
          <h2 className="font-semibold text-sm">Messages</h2>
        </div>
        <ConversationList
          conversations={conversations}
          loading={conversationsQuery.isPending}
          error={conversationsQuery.isError ? conversationsQuery.error : undefined}
          onRetry={() => conversationsQuery.refetch()}
          activeId={activeId}
          currentUserId={user?.id}
          onSelect={selectConversation}
        />
      </div>

      {/* Message thread */}
      <div className={cn("flex-1 flex flex-col min-w-0", !mobileShowThread && !activeId ? "hidden md:flex" : "flex")}>
        {activeConv && user ? (
          <ConversationPanel
            key={activeConv.id}
            conversation={activeConv}
            currentUserId={user.id}
            onBack={() => setMobileShowThread(false)}
            onLatestMessage={showLatestMessage}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
