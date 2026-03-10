import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Conversation } from "@/lib/api/chat";

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function relativeTime(dateStr: string | null) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  currentUserId?: string;
  onClick: () => void;
}

export function ConversationItem({ conversation, isActive, currentUserId, onClick }: ConversationItemProps) {
  const other = conversation.teacher.id === currentUserId ? conversation.student : conversation.teacher;
  const initials = getInitials(other.first_name, other.last_name);
  const time = relativeTime(conversation.last_message_at);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors",
        isActive ? "bg-muted" : "hover:bg-muted/60"
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
        {other.avatar
          ? <img src={other.avatar} alt={other.first_name} className="h-9 w-9 rounded-full object-cover" />
          : initials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-sm font-medium truncate">
            {other.first_name} {other.last_name}
          </span>
          <span className="text-xs text-muted-foreground flex-shrink-0">{time}</span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs text-muted-foreground truncate">
            {conversation.last_message_preview || (
              <span className="italic">No messages yet</span>
            )}
          </p>
          {conversation.unread_count > 0 && (
            <span className="flex-shrink-0 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
              {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
            </span>
          )}
        </div>
        <Badge variant="outline" className="text-[10px] h-4 mt-1 px-1.5">{conversation.subject}</Badge>
      </div>
    </button>
  );
}
