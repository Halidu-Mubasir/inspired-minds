import { formatDistanceToNow, parseISO } from "date-fns";
import { FileText, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TutorConversation } from "@/lib/api/ai";

interface ConversationSummaryProps {
  conversation: TutorConversation;
  active: boolean;
  onSelect: () => void;
  showStudent?: boolean;
}

/** A row in a list of tutor conversations (student's own list, or staff review). */
export function ConversationSummary({ conversation: c, active, onSelect, showStudent }: ConversationSummaryProps) {
  const when = c.last_message_at ?? c.created_at;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left px-4 py-3 hover:bg-muted/60 transition-colors",
        active && "bg-muted"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium truncate">{c.title || "New chat"}</p>
        {!!c.open_flags && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-destructive shrink-0">
            <ShieldAlert className="h-3.5 w-3.5" /> {c.open_flags}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground truncate">
        {[showStudent && `${c.student.first_name} ${c.student.last_name}`, c.subject, `${c.message_count} messages`]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <div className="flex items-center justify-between gap-2 mt-0.5 text-[11px] text-muted-foreground">
        {c.resource ? (
          <span className="flex items-center gap-1 truncate"><FileText className="h-3 w-3" /> {c.resource.title}</span>
        ) : <span />}
        <span className="shrink-0">{formatDistanceToNow(parseISO(when), { addSuffix: true })}</span>
      </div>
    </button>
  );
}
