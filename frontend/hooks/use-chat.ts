"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { WS_BASE_URL } from "@/lib/constants";
import { chatApi } from "@/lib/api/chat";
import { getValidAccessToken } from "@/lib/api/client";
import type { Message } from "@/lib/api/chat";

const MAX_RECONNECT_ATTEMPTS = 3;

interface UseChatReturn {
  messages: Message[];
  isConnected: boolean;
  isLoadingHistory: boolean;
  /** The last history request failed; `messages` may be incomplete. */
  historyError: boolean;
  hasMore: boolean;
  otherUserTyping: boolean;
  sendMessage: (content: string) => void;
  sendTyping: (isTyping: boolean) => void;
  loadMore: () => void;
}

/**
 * Message history plus a live socket for one conversation. Render the component that
 * uses it with `key={conversationId}` so switching conversations starts from fresh state.
 */
export function useChat(conversationId: string, currentUserId?: string): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true); // page 1 loads on mount
  const [historyError, setHistoryError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load a page of message history. Callers set the loading flag first; state is only
  // touched once the request settles.
  const loadHistory = useCallback(
    (pageNum: number) =>
      chatApi
        .getMessages(conversationId, { page: String(pageNum), page_size: "50" })
        .then((res) => {
          // The API pages newest-first; display oldest-first.
          const results = [...(res.results ?? [])].reverse();
          setHasMore(!!res.next);
          if (pageNum === 1) {
            setMessages(results);
          } else {
            // Messages received since page 1 shift page boundaries, so older pages can overlap.
            setMessages((prev) => {
              const seen = new Set(prev.map((m) => m.id));
              return [...results.filter((m) => !seen.has(m.id)), ...prev];
            });
          }
        })
        .catch(() => setHistoryError(true))
        .finally(() => setIsLoadingHistory(false)),
    [conversationId]
  );

  useEffect(() => {
    let closedByUs = false;
    let attempts = 0;
    let reconnectTimer: NodeJS.Timeout | undefined;

    async function open() {
      // The socket authenticates once, on connect, so make sure the token is current.
      const token = await getValidAccessToken();
      if (!token || closedByUs) return;

      const ws = new WebSocket(`${WS_BASE_URL}/chat/${conversationId}/?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        attempts = 0;
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        // Reconnect with backoff if the close was unexpected (not an intentional 1000).
        if (!closedByUs && event.code !== 1000 && attempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(1000 * 2 ** attempts, 8000);
          attempts += 1;
          reconnectTimer = setTimeout(open, delay);
        }
      };

      ws.onerror = () => ws.close();

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "chat_message") {
            setMessages((prev) => [...prev, data.message]);
          } else if (data.type === "typing") {
            // Only show indicator if it's from the other user
            if (data.user_id !== currentUserId) {
              setOtherUserTyping(data.is_typing);
              if (data.is_typing) {
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setOtherUserTyping(false), 3000);
              }
            }
          } else if (data.type === "read") {
            if (data.user_id !== currentUserId) {
              setMessages((prev) =>
                prev.map((m) => (m.sender.id === currentUserId ? { ...m, is_read: true } : m))
              );
            }
          }
        } catch {
          // ignore malformed frames
        }
      };
    }

    loadHistory(1);
    open();

    return () => {
      closedByUs = true;
      clearTimeout(reconnectTimer);
      wsRef.current?.close(1000);
      wsRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, currentUserId, loadHistory]);

  const sendMessage = useCallback((content: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "chat_message", content }));
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "typing", is_typing: isTyping }));
  }, []);

  const loadMore = useCallback(() => {
    if (isLoadingHistory || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    setIsLoadingHistory(true);
    setHistoryError(false);
    loadHistory(nextPage);
  }, [isLoadingHistory, hasMore, page, loadHistory]);

  return { messages, isConnected, isLoadingHistory, historyError, hasMore, otherUserTyping, sendMessage, sendTyping, loadMore };
}
