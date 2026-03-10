"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { TOKEN_KEYS, WS_BASE_URL } from "@/lib/constants";
import { chatApi } from "@/lib/api/chat";
import type { Message } from "@/lib/api/chat";

interface UseChatReturn {
  messages: Message[];
  isConnected: boolean;
  isLoadingHistory: boolean;
  hasMore: boolean;
  otherUserTyping: boolean;
  sendMessage: (content: string) => void;
  sendTyping: (isTyping: boolean) => void;
  loadMore: () => void;
}

export function useChat(conversationId: string | null, currentUserId?: string): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Load message history
  const loadHistory = useCallback(async (convId: string, pageNum: number) => {
    setIsLoadingHistory(true);
    try {
      const res = await chatApi.getMessages(convId, { page: String(pageNum), page_size: "50" });
      const results = res.results ?? [];
      setHasMore(!!res.next);
      if (pageNum === 1) {
        setMessages(results);
      } else {
        setMessages((prev) => [...results, ...prev]);
      }
    } catch {
      // silently ignore
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Connect WebSocket
  const connect = useCallback((convId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEYS.ACCESS) : null;
    if (!token) return;

    const url = `${WS_BASE_URL}/chat/${convId}/?token=${token}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      // Reconnect if the close was unexpected (not intentional 1000)
      if (event.code !== 1000 && reconnectAttemptsRef.current < 3 && conversationIdRef.current === convId) {
        const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 8000);
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(() => {
          if (conversationIdRef.current === convId) connect(convId);
        }, delay);
      }
    };

    ws.onerror = () => {
      ws.close();
    };

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
              prev.map((m) =>
                m.sender.id === currentUserId ? { ...m, is_read: true } : m
              )
            );
          }
        }
      } catch {
        // ignore parse errors
      }
    };
  }, [currentUserId]);

  // Switch conversation
  useEffect(() => {
    // Cleanup previous connection
    if (wsRef.current) {
      wsRef.current.close(1000);
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setMessages([]);
    setPage(1);
    setHasMore(false);
    setIsConnected(false);
    setOtherUserTyping(false);
    conversationIdRef.current = conversationId;

    if (!conversationId) return;

    loadHistory(conversationId, 1);
    connect(conversationId);

    return () => {
      conversationIdRef.current = null;
      wsRef.current?.close(1000);
      wsRef.current = null;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, connect, loadHistory]);

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
    if (!conversationId || isLoadingHistory || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadHistory(conversationId, nextPage);
  }, [conversationId, isLoadingHistory, hasMore, page, loadHistory]);

  return { messages, isConnected, isLoadingHistory, hasMore, otherUserTyping, sendMessage, sendTyping, loadMore };
}
