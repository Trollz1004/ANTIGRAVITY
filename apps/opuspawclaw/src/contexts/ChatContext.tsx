import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface Message {
  id?: number;
  role: string;
  content: string;
  model: string;
  created_at?: string;
}

interface Conversation {
  id: number;
  title: string;
  mode: string;
  created_at: string;
  updated_at: string;
}

interface ChatContextType {
  conversations: Conversation[];
  activeConversationId: number | null;
  messages: Message[];
  isLoading: boolean;
  loadConversations: () => Promise<void>;
  selectConversation: (id: number) => Promise<void>;
  createNewConversation: (title: string, mode: string) => Promise<number>;
  addMessage: (conversationId: number, role: string, content: string, model: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadConversations = useCallback(async () => {
    if (window.opuspawclaw) {
      const data = await window.opuspawclaw.getConversations();
      setConversations(data);
    }
  }, []);

  const selectConversation = async (id: number) => {
    setIsLoading(true);
    setActiveConversationId(id);
    if (window.opuspawclaw) {
      const data = await window.opuspawclaw.getMessages(id);
      setMessages(data);
    }
    setIsLoading(false);
  };

  const createNewConversation = async (title: string, mode: string) => {
    if (window.opuspawclaw) {
      const id = await window.opuspawclaw.createConversation(title, mode);
      await loadConversations();
      setActiveConversationId(id);
      setMessages([]);
      return id;
    }
    return -1;
  };

  const addMessage = async (conversationId: number, role: string, content: string, model: string) => {
    if (window.opuspawclaw) {
      await window.opuspawclaw.addMessage(conversationId, role, content, model);
      if (activeConversationId === conversationId) {
        const data = await window.opuspawclaw.getMessages(conversationId);
        setMessages(data);
      }
      await loadConversations();
    }
  };

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return (
    <ChatContext.Provider value={{
      conversations,
      activeConversationId,
      messages,
      isLoading,
      loadConversations,
      selectConversation,
      createNewConversation,
      addMessage
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
