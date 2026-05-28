import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Send, Plus, Trash2, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

export default function Chat() {
  const { user } = useAuth();
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("ollama");
  const [selectedModel, setSelectedModel] = useState("neural-chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: sessions, refetch: refetchSessions } = trpc.chat.listSessions.useQuery(undefined);
  const { data: messages, refetch: refetchMessages } = trpc.chat.getMessages.useQuery(
    selectedSessionId ? { sessionId: selectedSessionId } : { sessionId: 0 },
    { enabled: !!selectedSessionId }
  );

  const createSessionMutation = trpc.chat.createSession.useMutation({
    onSuccess: () => refetchSessions(),
  });

  const addMessageMutation = trpc.chat.addMessage.useMutation({
    onSuccess: () => {
      refetchMessages();
      setMessageInput("");
    },
  });

  const deleteSessionMutation = trpc.chat.deleteSession.useMutation({
    onSuccess: () => {
      refetchSessions();
      setSelectedSessionId(null);
    },
  });

  const generateImageMutation = trpc.chat.generateImage.useMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCreateSession = async () => {
    const title = `Chat ${new Date().toLocaleTimeString()}`;
    await createSessionMutation.mutateAsync({ title });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedSessionId) return;

    const content = messageInput;
    
    // Check if message contains image generation keywords
    const imageKeywords = ['generate image', 'create image', 'draw', 'paint', 'illustration', 'artwork', 'visual', 'picture'];
    const shouldGenerateImage = imageKeywords.some(keyword => content.toLowerCase().includes(keyword));
    
    // Save user message
    await addMessageMutation.mutateAsync({
      sessionId: selectedSessionId,
      role: "user",
      content,
      provider: selectedProvider,
      model: selectedModel,
      metadata: shouldGenerateImage ? { generateImage: true } : undefined,
    });
    
    // If image generation requested, generate and save image
    if (shouldGenerateImage) {
      try {
        const imageResult = await generateImageMutation.mutateAsync({ prompt: content });
        if (imageResult.success && imageResult.url) {
          // Save image URL as assistant message
          await addMessageMutation.mutateAsync({
            sessionId: selectedSessionId,
            role: "assistant",
            content: `![Generated Image](${imageResult.url})`,
            provider: selectedProvider,
            model: selectedModel,
            metadata: { isGeneratedImage: true },
          });
        }
      } catch (error) {
        console.error("Image generation error:", error);
        toast.error("Failed to generate image");
      }
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (confirm("Delete this session?")) {
      await deleteSessionMutation.mutateAsync({ sessionId });
    }
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex bg-background">
        {/* Sidebar - Sessions */}
        <div className="w-64 border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <Button
              onClick={handleCreateSession}
              className="cyber-button w-full"
              disabled={createSessionMutation.isPending}
            >
              <Plus size={16} className="mr-2" />
              New Chat
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 p-3">
            {sessions?.map((session) => (
              <div
                key={session.id}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between group ${
                  selectedSessionId === session.id
                    ? "neon-border bg-primary/10"
                    : "border-border hover:border-primary"
                }`}
                onClick={() => setSelectedSessionId(session.id)}
              >
                <span className="text-sm truncate flex-1">{session.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/20 rounded"
                >
                  <Trash2 size={14} className="text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedSessionId ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages?.map((msg, idx) => (
                  <div key={idx}>
                    <div
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-2xl p-4 rounded-lg ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-card border border-border rounded-bl-none"
                        }`}
                      >
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    </div>
                    {(msg.metadata as any)?.generateImage && msg.role === "user" && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-secondary">
                        <Zap size={12} />
                        Image generation requested
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-border bg-card p-4 space-y-3">
                <div className="flex gap-2">
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="cyber-input flex-1"
                  >
                    <option value="ollama">Ollama</option>
                    <option value="openai">OpenAI</option>
                    <option value="openrouter">OpenRouter</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Model name"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="cyber-input flex-1"
                  />
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="cyber-input"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || addMessageMutation.isPending}
                    className="cyber-button"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-muted-foreground">
                  No chat selected
                </h2>
                <p className="text-muted-foreground">
                  Create a new chat or select one from the sidebar
                </p>
                <Button
                  onClick={handleCreateSession}
                  className="cyber-button"
                  disabled={createSessionMutation.isPending}
                >
                  <Plus size={16} className="mr-2" />
                  Start New Chat
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
