"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ConversationList } from "./conversation-list";
import { MessageThread } from "./message-thread";
import { MessageInput } from "./message-input";
import { useChat } from "@/hooks/use-chat";
import { chatApi } from "@/lib/api/chat";
import { useAuth } from "@/hooks/use-auth";
import type { Conversation } from "@/lib/api/chat";

export function ChatPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [mobileShowThread, setMobileShowThread] = useState(false);

  const activeId = searchParams.get("id");

  // Load conversations
  useEffect(() => {
    chatApi.getConversations()
      .then((res) => {
        const results = Array.isArray(res) ? res : (res as { results?: Conversation[] }).results ?? [];
        setConversations(results);
      })
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, []);

  // Update unread count on conversation when read
  const updateConvUnread = useCallback((convId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
    );
  }, []);

  function selectConversation(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    router.replace(`?${params.toString()}`);
    setMobileShowThread(true);
  }

  // Find active conversation details for header
  const activeConv = conversations.find((c) => c.id === activeId) ?? null;
  const otherParticipant = activeConv
    ? activeConv.teacher.id === user?.id ? activeConv.student : activeConv.teacher
    : null;

  const {
    messages,
    isConnected,
    isLoadingHistory,
    hasMore,
    otherUserTyping,
    sendMessage,
    sendTyping,
    loadMore,
  } = useChat(activeId, user?.id);

  // Mark as read when conversation opens
  useEffect(() => {
    if (activeId) {
      chatApi.markRead(activeId).catch(() => {});
      updateConvUnread(activeId);
    }
  }, [activeId, updateConvUnread]);

  // Update conversation preview on new messages
  useEffect(() => {
    if (!activeId || messages.length === 0) return;
    const last = messages[messages.length - 1];
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, last_message_preview: last.content, last_message_at: last.created_at }
          : c
      )
    );
  }, [messages, activeId]);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-xl border bg-background">
      {/* Conversation list — hidden on mobile when thread is shown */}
      <div className={cn("w-80 flex-shrink-0", mobileShowThread && activeId ? "hidden md:flex md:flex-col" : "flex flex-col w-full md:w-80")}>
        <div className="px-4 py-3.5 border-b">
          <h2 className="font-semibold text-sm">Messages</h2>
        </div>
        <ConversationList
          conversations={conversations}
          loading={loadingConvs}
          activeId={activeId}
          currentUserId={user?.id}
          onSelect={selectConversation}
        />
      </div>

      {/* Message thread */}
      <div className={cn("flex-1 flex flex-col min-w-0", !mobileShowThread && !activeId ? "hidden md:flex" : "flex")}>
        {activeId && otherParticipant ? (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-background">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:hidden"
                onClick={() => setMobileShowThread(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {otherParticipant.avatar
                  ? <img src={otherParticipant.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                  : `${otherParticipant.first_name[0]}${otherParticipant.last_name[0]}`.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {otherParticipant.first_name} {otherParticipant.last_name}
                </p>
                <p className="text-xs text-muted-foreground">{activeConv?.subject}</p>
              </div>
              {!isConnected && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <WifiOff className="h-3.5 w-3.5" />
                  <span>Reconnecting…</span>
                </div>
              )}
            </div>

            <MessageThread
              messages={messages}
              currentUserId={user?.id}
              isLoadingHistory={isLoadingHistory}
              hasMore={hasMore}
              otherUserTyping={otherUserTyping}
              onLoadMore={loadMore}
            />

            <MessageInput
              onSend={(content) => {
                sendMessage(content);
              }}
              onTyping={sendTyping}
              disabled={!isConnected}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
