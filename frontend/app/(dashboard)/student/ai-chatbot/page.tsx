"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Bot, Plus, Send, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/shared/empty-state";
import {
  aiChatApi,
  CONVERSATION_TYPE_LABELS,
} from "@/lib/api/ai-chat";
import type { AIConversationSummary, AIMessage } from "@/lib/api/ai-chat";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: AIMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="flex-shrink-0 mr-2 mt-1">
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm"
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}

// ── Thinking indicator ────────────────────────────────────────────────────────

function ThinkingBubble() {
  return (
    <div className="flex justify-start mb-3">
      <div className="flex-shrink-0 mr-2 mt-1">
        <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentAIChatbotPage() {
  const [conversations, setConversations] = useState<AIConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load conversation list on mount
  const fetchConversations = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const data = await aiChatApi.getConversations();
      // Filter to only general_chat for student chatbot
      const chats = Array.isArray(data)
        ? data.filter((c) => c.conversation_type === "general_chat")
        : [];
      setConversations(chats);
    } catch {
      // silent
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    aiChatApi
      .getConversation(activeId)
      .then((conv) => setMessages(conv.messages))
      .catch(() => toast.error("Failed to load conversation."))
      .finally(() => setLoadingMessages(false));
  }, [activeId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleNewChat() {
    try {
      const conv = await aiChatApi.createConversation({
        conversation_type: "general_chat",
        title: "",
      });
      setConversations((prev) => [
        {
          id: conv.id,
          title: conv.title,
          conversation_type: conv.conversation_type,
          message_count: 0,
          last_message_at: conv.created_at,
          created_at: conv.created_at,
        },
        ...prev,
      ]);
      setActiveId(conv.id);
      setMessages([]);
    } catch {
      toast.error("Failed to start a new chat.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await aiChatApi.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
    } catch {
      toast.error("Failed to delete conversation.");
    }
  }

  async function handleSend() {
    if (!input.trim() || !activeId || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    // Optimistic user message
    const tempUserMsg: AIMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      input_tokens: 0,
      output_tokens: 0,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await aiChatApi.sendMessage(activeId, content);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        res.user_message,
        res.ai_message,
      ]);
      // Update conversation title if it was blank
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, title: c.title || content.slice(0, 60), message_count: c.message_count + 2 }
            : c
        )
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const activeConv = conversations.find((c) => c.id === activeId);

  return (
    <div className="flex h-full overflow-hidden rounded-xl border bg-background">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">AI Tutor</span>
          </div>
          <Button size="sm" onClick={handleNewChat} className="h-7 gap-1 text-xs">
            <Plus className="h-3 w-3" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {loadingConvs ? (
            <div className="p-3 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No conversations yet. Start a new chat!
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 group transition-colors hover:bg-accent ${
                    activeId === conv.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-sm font-medium truncate flex-1">
                      {conv.title || "New conversation"}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(conv.id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {timeAgo(conv.last_message_at)} · {conv.message_count} msg{conv.message_count !== 1 ? "s" : ""}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ── Chat thread ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Bot}
              title="Start a conversation"
              description="Click 'New Chat' to start talking with your AI tutor."
            />
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="px-4 py-3 border-b flex items-center gap-3">
              <div>
                <p className="font-semibold text-sm">
                  {activeConv?.title || "New conversation"}
                </p>
                <Badge variant="secondary" className="text-xs mt-0.5">
                  {CONVERSATION_TYPE_LABELS[activeConv?.conversation_type ?? "general_chat"]}
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-4">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <Bot className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">How can I help you today?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ask me anything — I&apos;m here to help you learn!
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                  {sending && <ThinkingBubble />}
                  <div ref={bottomRef} />
                </>
              )}
            </ScrollArea>

            <Separator />

            {/* Input bar */}
            <div className="p-3 flex gap-2 items-end">
              <Textarea
                rows={1}
                placeholder="Ask your AI tutor anything… (Enter to send, Shift+Enter for new line)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                className="resize-none min-h-[40px] max-h-36"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                size="icon"
                className="flex-shrink-0"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
