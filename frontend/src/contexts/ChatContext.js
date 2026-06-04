import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChatContext = createContext(null);

/**
 * ChatContext — client-side conversation store with backend persistence mirror.
 * Mirrors the flagship contract (conversations, messages) but uses in-memory
 * state in the web build (the Electron flagship uses better-sqlite3).
 */
export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadConversations = useCallback(() => {
    // web build keeps history local-only per session
    setConversations((prev) => prev);
  }, []);

  const selectConversation = useCallback((id) => {
    setActiveConversationId(id);
    const conv = conversations.find((c) => c.id === id);
    setMessages(conv?.messages || []);
  }, [conversations]);

  const createNewConversation = useCallback((title, mode) => {
    const id = Date.now();
    const conv = {
      id,
      title: title || "New Chat",
      mode: mode || "chat",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [],
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveConversationId(id);
    setMessages([]);
    return id;
  }, []);

  const addMessage = useCallback((conversationId, role, content, model, meta) => {
    const msg = { role, content, model, created_at: new Date().toISOString(), meta: meta || null };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, msg], updated_at: msg.created_at }
          : c,
      ),
    );
    if (conversationId === activeConversationId) {
      setMessages((m) => [...m, msg]);
    }
  }, [activeConversationId]);

  /**
   * Calls the Hermes Router mirror.
   * Returns { reply, provider, realModel, latencyMs } — headers surface the
   * exact X-Hermes-Provider / X-Hermes-Real-Model contract from the flagship.
   */
  const sendThroughHermes = useCallback(async ({ model, messages: msgs, sessionId }) => {
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${API}/hermes/v1/chat/completions`,
        { model, messages: msgs, stream: false, session_id: sessionId },
        { timeout: 60_000 },
      );
      const reply = res.data?.choices?.[0]?.message?.content || "";
      return {
        reply,
        provider: res.headers["x-hermes-provider"] || res.data.provider,
        realModel: res.headers["x-hermes-real-model"] || res.data.real_model,
        latencyMs: Number(res.headers["x-hermes-latency-ms"] || res.data.latency_ms || 0),
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  return (
    <ChatContext.Provider value={{
      conversations, activeConversationId, messages, isLoading,
      loadConversations, selectConversation, createNewConversation, addMessage,
      sendThroughHermes,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
