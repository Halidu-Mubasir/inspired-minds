"use client";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, FileText, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/shared/markdown";
import { aiApi } from "@/lib/api/ai";
import type { AIUsage, TutorConversationDetail, TutorMessage } from "@/lib/api/ai";
import { getErrorMessage } from "@/lib/api/errors";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

function Bubble({ role, children }: { role: TutorMessage["role"]; children: React.ReactNode }) {
  const mine = role === "user";
  return (
    <div className={cn("flex gap-2", mine ? "justify-end" : "justify-start")}>
      {!mine && (
        <div className="h-7 w-7 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5",
          mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * One tutor conversation. Render with `key={conversation.id}` so switching conversations
 * starts from that conversation's messages.
 */
export function TutorThread({ conversation }: { conversation: TutorConversationDetail }) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<TutorMessage[]>(conversation.messages);
  const [draft, setDraft] = useState<string | null>(null); // the reply as it streams in
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: usage } = useQuery({ queryKey: queryKeys.ai.usage, queryFn: aiApi.getUsage });
  const remaining = usage?.tutor?.remaining;
  const outOfMessages = remaining === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, draft]);

  /** Show a saved message and keep the cached conversation in step, so reopening it is current. */
  function append(message: TutorMessage) {
    setMessages((prev) => [...prev, message]);
    queryClient.setQueryData<TutorConversationDetail>(
      queryKeys.ai.conversation(conversation.id),
      (prev) => prev && { ...prev, messages: [...prev.messages, message] }
    );
  }

  async function send() {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput("");
    setDraft("");
    try {
      await aiApi.sendMessage(conversation.id, content, (event) => {
        if (event.type === "start") {
          append(event.user_message);
        } else if (event.type === "text") {
          setDraft((prev) => (prev ?? "") + event.text);
        } else if (event.type === "done") {
          append(event.message);
          setDraft(null);
          queryClient.setQueryData<AIUsage>(queryKeys.ai.usage, (prev) => prev && { ...prev, tutor: event.usage });
        } else {
          setDraft(null);
          toast.error(event.detail);
        }
      });
      queryClient.invalidateQueries({ queryKey: ["ai", "conversations"] });
    } catch (error) {
      setDraft(null);
      setInput(content); // let them try again without retyping
      toast.error(getErrorMessage(error, "Couldn't send your message. Please try again."));
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-start gap-2 border-b px-4 py-2.5 text-xs text-muted-foreground bg-muted/40">
        <ShieldCheck className="h-4 w-4 shrink-0 mt-px" />
        <span>
          Your teacher and Inspired Minds staff can read these chats to keep you safe. Please don&apos;t share
          personal details like your address or phone number.
        </span>
      </div>
      {conversation.resource && (
        <div className="flex items-center gap-2 border-b px-4 py-2 text-xs">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Asking about <span className="font-medium">{conversation.resource.title}</span></span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && draft === null && (
          <div className="text-center text-sm text-muted-foreground py-10 space-y-1">
            <p className="font-medium text-foreground">What are you working on?</p>
            <p>Ask a question, or tell me which problem you&apos;re stuck on and what you&apos;ve tried.</p>
          </div>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} role={m.role}>
            {m.role === "assistant" ? <Markdown>{m.content}</Markdown> : <p className="text-sm whitespace-pre-wrap">{m.content}</p>}
          </Bubble>
        ))}
        {draft !== null && (
          <Bubble role="assistant">
            {draft ? <Markdown>{draft}</Markdown> : <p className="text-sm text-muted-foreground">Thinking…</p>}
          </Bubble>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 space-y-1.5">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={outOfMessages ? "You've used today's messages. Come back tomorrow!" : "Ask your study helper… (Enter to send)"}
            className="flex-1 resize-none min-h-[44px] max-h-40 text-sm"
            rows={1}
            maxLength={4000}
            disabled={sending || outOfMessages}
          />
          <Button size="icon" className="h-11 w-11 shrink-0" onClick={send} disabled={sending || outOfMessages || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {remaining !== undefined && (
          <p className="text-[11px] text-muted-foreground">
            {remaining} of {usage?.tutor?.limit} messages left today. The study helper can make mistakes, so check
            important answers with your teacher.
          </p>
        )}
      </div>
    </div>
  );
}
