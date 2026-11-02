"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { chatApi } from "@/lib/api/chat";
import { queryKeys } from "@/lib/query-keys";

const POLL_INTERVAL_MS = 60_000;

/** Unread chat messages for a teacher or student, linking straight to each conversation. */
export function NotificationBell({ userId, role }: { userId: string; role: "teacher" | "student" }) {
  const { data: conversations = [] } = useQuery({
    queryKey: queryKeys.conversations,
    queryFn: chatApi.getConversations,
    refetchInterval: POLL_INTERVAL_MS,
  });

  const unread = conversations.filter((c) => c.unread_count > 0);
  const total = unread.reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={total ? `${total} unread message${total === 1 ? "" : "s"}` : "No unread messages"}
        >
          <Bell className="h-5 w-5" />
          {total > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-destructive text-[10px] font-semibold leading-4 text-white">
              {total > 99 ? "99+" : total}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Messages</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {unread.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">You&apos;re all caught up.</p>
        ) : (
          unread.map((c) => {
            const other = c.teacher.id === userId ? c.student : c.teacher;
            return (
              <DropdownMenuItem key={c.id} asChild>
                <Link href={`/${role}/chat?id=${c.id}`} className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-medium">
                    {other.first_name} {other.last_name}
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {c.unread_count} new · {c.subject}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground line-clamp-1">{c.last_message_preview}</span>
                </Link>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
