import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";
import type { Message } from "@/lib/api/chat";

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

interface MessageBubbleProps {
  message: Message;
  isSelf: boolean;
  showAvatar?: boolean;
}

export function MessageBubble({ message, isSelf, showAvatar = true }: MessageBubbleProps) {
  return (
    <div className={cn("flex gap-2 max-w-[80%]", isSelf ? "ml-auto flex-row-reverse" : "mr-auto")}>
      {/* Avatar */}
      {!isSelf && showAvatar && (
        <div className="flex-shrink-0 h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground mt-auto">
          {message.sender?.avatar
            ? <img src={message.sender.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
            : getInitials(message.sender?.first_name ?? "", message.sender?.last_name ?? "")}
        </div>
      )}
      {!isSelf && !showAvatar && <div className="w-7 flex-shrink-0" />}

      {/* Bubble */}
      <div>
        <div
          className={cn(
            "px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words",
            isSelf
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm"
          )}
        >
          {message.content}
        </div>
        <div className={cn("flex items-center gap-1 mt-1", isSelf ? "justify-end" : "justify-start")}>
          <span className="text-[10px] text-muted-foreground">{formatTime(message.created_at)}</span>
          {isSelf && (
            message.is_read
              ? <CheckCheck className="h-3 w-3 text-primary" />
              : <Check className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );
}
