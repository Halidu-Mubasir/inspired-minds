"use client";
import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversationItem } from "./conversation-item";
import type { Conversation } from "@/lib/api/chat";

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  activeId: string | null;
  currentUserId?: string;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, loading, activeId, currentUserId, onSelect }: ConversationListProps) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    const other = c.teacher.id === currentUserId ? c.student : c.teacher;
    const name = `${other.first_name} ${other.last_name} ${c.subject}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full border-r">
      {/* Search */}
      <div className="p-3 border-b">
        <Input
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="space-y-px p-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="bg-muted rounded-full p-4 mb-3">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">
              {search ? "No matches found" : "No conversations yet"}
            </p>
            {!search && (
              <p className="text-xs text-muted-foreground mt-1">
                Conversations are created when pairings are set up.
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((c) => (
              <ConversationItem
                key={c.id}
                conversation={c}
                isActive={c.id === activeId}
                currentUserId={currentUserId}
                onClick={() => onSelect(c.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
