"use client";
import { useEffect } from "react";
import { ArrowLeft, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageThread } from "./message-thread";
import { MessageInput } from "./message-input";
import { useChat } from "@/hooks/use-chat";
import type { Conversation, Message } from "@/lib/api/chat";

interface ConversationPanelProps {
  conversation: Conversation;
  currentUserId: string;
  onBack: () => void;
  /** Called with the newest message so the conversation list preview can follow along. */
  onLatestMessage: (message: Message) => void;
}

/**
 * One open conversation. Render with `key={conversation.id}` so switching conversations
 * remounts it: history, socket and typing state all start fresh.
 */
export function ConversationPanel({ conversation, currentUserId, onBack, onLatestMessage }: ConversationPanelProps) {
  const {
    messages,
    isConnected,
    isLoadingHistory,
    historyError,
    hasMore,
    otherUserTyping,
    sendMessage,
    sendTyping,
    loadMore,
  } = useChat(conversation.id, currentUserId);

  const other = conversation.teacher.id === currentUserId ? conversation.student : conversation.teacher;
  const latest = messages[messages.length - 1];

  useEffect(() => {
    if (latest) onLatestMessage(latest);
  }, [latest, onLatestMessage]);

  return (
    <>
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background">
        <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
          {other.avatar
            ? <img src={other.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
            : `${other.first_name[0]}${other.last_name[0]}`.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">
            {other.first_name} {other.last_name}
          </p>
          <p className="text-xs text-muted-foreground">{conversation.subject}</p>
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
        currentUserId={currentUserId}
        isLoadingHistory={isLoadingHistory}
        historyError={historyError}
        hasMore={hasMore}
        otherUserTyping={otherUserTyping}
        onLoadMore={loadMore}
      />

      {conversation.pairing_status === "ended" ? (
        <p className="px-4 py-3 border-t text-center text-xs text-muted-foreground">
          This pairing has ended. The conversation is kept as read-only history.
        </p>
      ) : (
        <MessageInput onSend={sendMessage} onTyping={sendTyping} disabled={!isConnected} />
      )}
    </>
  );
}
