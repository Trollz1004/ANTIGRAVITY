import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  Settings,
  Send,
  Loader2,
  MessageSquare,
  Zap,
} from "lucide-react";
import { Streamdown } from "streamdown";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Workspace() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // tRPC queries and mutations
  const { data: sessions, refetch: refetchSessions } = trpc.chat.listSessions.useQuery();
  const { data: messages, refetch: refetchMessages } = trpc.chat.getMessages.useQuery(
    { sessionId: currentSessionId || 0 },
    { enabled: !!currentSessionId }
  );

  const createSessionMutation = trpc.chat.createSession.useMutation({
    onSuccess: () => {
      refetchSessions();
    },
  });

  const deleteSessionMutation = trpc.chat.deleteSession.useMutation({
    onSuccess: () => {
      refetchSessions();
      setCurrentSessionId(null);
    },
  });

  const addMessageMutation = trpc.chat.addMessage.useMutation({
    onSuccess: () => {
      refetchMessages();
      setMessageInput("");
    },
  });

  // Create initial session on mount
  useEffect(() => {
    if (sessions && sessions.length === 0 && !createSessionMutation.isPending) {
      createSessionMutation.mutate({ title: "New Chat" });
    } else if (sessions && sessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessions, createSessionMutation.isPending]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleCreateSession = () => {
    createSessionMutation.mutate({ title: "New Chat" });
  };

  const handleDeleteSession = (sessionId: number) => {
    deleteSessionMutation.mutate({ sessionId });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentSessionId) return;

    setIsLoading(true);
    try {
      // Add user message
      await addMessageMutation.mutateAsync({
        sessionId: currentSessionId,
        role: "user",
        content: messageInput,
        provider: "user",
        model: "user",
      });

      // TODO: Call actual model provider here
      // For now, just add a placeholder response
      setTimeout(() => {
        addMessageMutation.mutate({
          sessionId: currentSessionId,
          role: "assistant",
          content: "This is a placeholder response. Model integration coming soon.",
          provider: "placeholder",
          model: "placeholder",
        });
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-accent neon-glow" />
            <h1 className="text-lg font-bold neon-glow">OpenClaw</h1>
          </div>
          <Button
            onClick={handleCreateSession}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Sessions List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {sessions?.map((session) => (
              <div
                key={session.id}
                className={`flex items-center gap-2 p-3 rounded cursor-pointer transition-colors ${
                  currentSessionId === session.id
                    ? "bg-sidebar-accent/20 border border-accent"
                    : "hover:bg-sidebar-accent/10"
                }`}
                onClick={() => setCurrentSessionId(session.id)}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate text-sm">{session.title}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      ⋮
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleDeleteSession(session.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            onClick={() => navigate("/settings")}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages?.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <Card
                  className={`max-w-2xl p-4 ${
                    msg.role === "user"
                      ? "bg-accent/20 border-accent/50"
                      : "bg-card border-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {msg.role === "user" ? "You" : `${msg.provider}/${msg.model}`}
                    </span>
                    <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                      {msg.provider}
                    </span>
                  </div>
                  <div className="prose prose-invert max-w-none text-sm">
                    <Streamdown>{msg.content}</Streamdown>
                  </div>
                </Card>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <Card className="bg-card border-card p-4">
                  <Loader2 className="w-5 h-5 animate-spin text-accent" />
                </Card>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-card/50">
          <div className="max-w-4xl mx-auto flex gap-3">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              className="bg-input border-border"
              disabled={isLoading || !currentSessionId}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !messageInput.trim() || !currentSessionId}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
