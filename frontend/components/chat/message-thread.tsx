"use client";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./message-bubble";
import type { Message } from "@/lib/api/chat";

interface MessageThreadProps {
  messages: Message[];
  currentUserId?: string;
  isLoadingHistory: boolean;
  hasMore: boolean;
  otherUserTyping: boolean;
  onLoadMore: () => void;
}

export function MessageThread({
  messages,
  currentUserId,
  isLoadingHistory,
  hasMore,
  otherUserTyping,
  onLoadMore,
}: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  // Scroll to bottom when new messages arrive (not when loading older ones)
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      const lastMsg = messages[messages.length - 1];
      // Only auto-scroll if the last message is new (within last 5 seconds)
      const isNew = lastMsg && Date.now() - new Date(lastMsg.created_at).getTime() < 5000;
      if (isNew || prevLengthRef.current === 0) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
    prevLengthRef.current = messages.length;
  }, [messages]);

  if (isLoadingHistory && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col gap-3 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`flex gap-2 max-w-[60%] ${i % 2 === 0 ? "mr-auto" : "ml-auto flex-row-reverse"}`}>
            <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
            <Skeleton className="h-10 w-48 rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-1 p-4">
        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center mb-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-muted-foreground"
              onClick={onLoadMore}
              disabled={isLoadingHistory}
            >
              {isLoadingHistory ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Load older messages
            </Button>
          </div>
        )}

        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Say hello!
          </p>
        )}

        {messages.map((msg, idx) => {
          const isSelf = msg.sender?.id === currentUserId;
          const prevSenderId = messages[idx - 1]?.sender?.id;
          const showAvatar = !isSelf && prevSenderId !== msg.sender?.id;
          return (
            <MessageBubble key={msg.id} message={msg} isSelf={isSelf} showAvatar={showAvatar} />
          );
        })}

        {/* Typing indicator */}
        {otherUserTyping && (
          <div className="flex items-end gap-2 max-w-[80%] mr-auto">
            <div className="w-7 flex-shrink-0" />
            <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-muted flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
