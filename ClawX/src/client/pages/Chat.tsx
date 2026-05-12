import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Streamdown } from 'streamdown';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useRoute } from 'wouter';
import {
  Bot,
  Brain,
  Sparkles,
  Search,
  Zap,
  Server,
  Send,
  Radio,
  Plus,
  Trash2,
  Loader2,
  Clock,
  Hash,
  ChevronDown,
} from 'lucide-react';
import type { AiProviderSlug } from '../../shared/ai-providers';

const providerIcons: Record<string, React.ElementType> = {
  manus: Bot,
  claude: Brain,
  gemini: Sparkles,
  perplexity: Search,
  grok: Zap,
  ollama: Server,
};

const providerColors: Record<string, string> = {
  manus: '#6366f1',
  claude: '#d97706',
  gemini: '#4285f4',
  perplexity: '#22c55e',
  grok: '#ef4444',
  ollama: '#8b5cf6',
};

export default function Chat() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [matched, params] = useRoute<{ id: string }>('/chat/:id');
  const conversationId = matched && params?.id ? parseInt(params.id) : null;

  const [selectedProviders, setSelectedProviders] = useState<AiProviderSlug[]>(['manus']);
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [input, setInput] = useState('');
  const [activeConvId, setActiveConvId] = useState<number | null>(conversationId);
  const [activeTab, setActiveTab] = useState<string>('manus');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: providers } = trpc.providers.list.useQuery();
  const { data: conversations, refetch: refetchConvs } = trpc.conversations.list.useQuery();
  const { data: chatMessages, refetch: refetchMsgs } = trpc.messages.list.useQuery(
    { conversationId: activeConvId! },
    { enabled: !!activeConvId },
  );

  const createConv = trpc.conversations.create.useMutation({
    onSuccess: (data) => {
      setActiveConvId(data.id);
      refetchConvs();
    },
  });
  const deleteConv = trpc.conversations.delete.useMutation({
    onSuccess: () => {
      setActiveConvId(null);
      refetchConvs();
    },
  });
  const sendMessage = trpc.messages.send.useMutation({
    onSuccess: () => {
      refetchMsgs();
      refetchConvs();
    },
  });

  const availableProviders = useMemo(() => providers?.filter((p) => p.isAvailable) ?? [], [providers]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'broadcast') {
      setIsBroadcast(true);
      setSelectedProviders(availableProviders.map((p) => p.slug as AiProviderSlug));
    }
  }, [availableProviders]);

  const toggleProvider = useCallback((slug: AiProviderSlug) => {
    setSelectedProviders((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }, []);

  const toggleBroadcast = useCallback(() => {
    setIsBroadcast((prev) => {
      const next = !prev;
      if (next) {
        setSelectedProviders(availableProviders.map((p) => p.slug as AiProviderSlug));
      } else {
        setSelectedProviders((cur) => (cur.length > 0 ? [cur[0]] : ['manus']));
      }
      return next;
    });
  }, [availableProviders]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sendMessage.isPending) return;
    const content = input.trim();
    setInput('');

    let convId = activeConvId;
    if (!convId) {
      const conv = await createConv.mutateAsync({
        title: content.slice(0, 60),
        mode: isBroadcast ? 'broadcast' : 'single',
        selectedProviders: selectedProviders,
      });
      convId = conv.id;
      setActiveConvId(conv.id);
    }

    await sendMessage.mutateAsync({
      conversationId: convId,
      content,
      providers: selectedProviders,
    });
  }, [input, activeConvId, selectedProviders, isBroadcast, sendMessage, createConv]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // Group messages by provider for broadcast view
  const messagesByProvider = useMemo(() => {
    const groups: Record<string, any[]> = {};
    chatMessages?.forEach((msg) => {
      if (msg.role === 'user') {
        // Add user messages to all groups
        selectedProviders.forEach((slug) => {
          if (!groups[slug]) groups[slug] = [];
          groups[slug]!.push(msg);
        });
      } else if (msg.providerSlug) {
        if (!groups[msg.providerSlug]) groups[msg.providerSlug] = [];
        groups[msg.providerSlug]!.push(msg);
      }
    });
    return groups;
  }, [chatMessages, selectedProviders]);

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Conversation Sidebar */}
      <div className="w-64 shrink-0 flex flex-col gap-2 hidden lg:flex">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => {
            setActiveConvId(null);
          }}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
        <ScrollArea className="flex-1">
          <div className="space-y-1 pr-2">
            {conversations?.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
                  activeConvId === conv.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveConvId(conv.id)}
              >
                <MessageIcon mode={conv.mode} />
                <span className="truncate flex-1">{conv.title}</span>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConv.mutate({ id: conv.id });
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Provider Selector Bar */}
        <div className="flex items-center gap-2 pb-3 flex-wrap">
          <Button variant={isBroadcast ? 'default' : 'outline'} size="sm" onClick={toggleBroadcast} className="gap-1.5">
            <Radio className="h-3.5 w-3.5" />
            Broadcast
          </Button>
          <Separator orientation="vertical" className="h-6" />
          {providers?.map((provider) => {
            const Icon = providerIcons[provider.slug] ?? Bot;
            const color = providerColors[provider.slug] ?? '#6366f1';
            const isSelected = selectedProviders.includes(provider.slug as AiProviderSlug);
            return (
              <Button
                key={provider.slug}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                disabled={!provider.isAvailable}
                onClick={() => toggleProvider(provider.slug as AiProviderSlug)}
                className="gap-1.5"
                style={isSelected ? { backgroundColor: color, borderColor: color } : {}}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{provider.slug}</span>
              </Button>
            );
          })}
        </div>

        {/* Messages Area */}
        {isBroadcast && selectedProviders.length > 1 ? (
          <BroadcastView
            messagesByProvider={messagesByProvider}
            selectedProviders={selectedProviders}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            messagesEndRef={messagesEndRef}
          />
        ) : (
          <SingleView messages={chatMessages ?? []} messagesEndRef={messagesEndRef} isPending={sendMessage.isPending} />
        )}

        {/* Input Area */}
        <div className="pt-3">
          <div className="flex items-end gap-2 bg-card border border-border rounded-xl p-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isBroadcast
                  ? `Broadcast to ${selectedProviders.length} AI${selectedProviders.length > 1 ? 's' : ''}...`
                  : `Message ${selectedProviders[0] ?? 'AI'}...`
              }
              className="flex-1 bg-transparent border-0 outline-none resize-none text-sm min-h-[40px] max-h-[120px] text-foreground placeholder:text-muted-foreground"
              rows={1}
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!input.trim() || sendMessage.isPending || selectedProviders.length === 0}
              className="shrink-0"
            >
              {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {selectedProviders.length} provider{selectedProviders.length !== 1 ? 's' : ''} selected
            </span>
            {isBroadcast && (
              <Badge variant="secondary" className="text-xs">
                <Radio className="h-3 w-3 mr-1" />
                Broadcast Mode
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageIcon({ mode }: { mode: string }) {
  return mode === 'broadcast' ? <Radio className="h-3.5 w-3.5 shrink-0" /> : <Bot className="h-3.5 w-3.5 shrink-0" />;
}

function SingleView({
  messages,
  messagesEndRef,
  isPending,
}: {
  messages: any[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  isPending: boolean;
}) {
  return (
    <ScrollArea className="flex-1">
      <div className="space-y-4 pb-4">
        {messages.length === 0 && !isPending && (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Bot className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-sm">Select a provider and type your message below</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={msg.id ?? i} message={msg} />
        ))}
        {isPending && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm pl-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating response...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}

function BroadcastView({
  messagesByProvider,
  selectedProviders,
  activeTab,
  setActiveTab,
  messagesEndRef,
}: {
  messagesByProvider: Record<string, any[]>;
  selectedProviders: AiProviderSlug[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
      <TabsList className="bg-secondary/50 w-full justify-start">
        {selectedProviders.map((slug) => {
          const Icon = providerIcons[slug] ?? Bot;
          const color = providerColors[slug] ?? '#6366f1';
          return (
            <TabsTrigger key={slug} value={slug} className="gap-1.5 data-[state=active]:text-foreground">
              <Icon className="h-3.5 w-3.5" style={{ color }} />
              <span className="capitalize">{slug}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
      {selectedProviders.map((slug) => (
        <TabsContent key={slug} value={slug} className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4">
              {(messagesByProvider[slug] ?? []).map((msg: any, i: number) => (
                <MessageBubble key={msg.id ?? i} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  );
}

function MessageBubble({ message }: { message: any }) {
  const isUser = message.role === 'user';
  const Icon = message.providerSlug ? providerIcons[message.providerSlug] ?? Bot : null;
  const color = message.providerSlug ? providerColors[message.providerSlug] ?? '#6366f1' : undefined;

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && Icon && (
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-1"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'
        }`}
      >
        <Streamdown>{message.content}</Streamdown>
        {!isUser && (message.inputTokens || message.responseTimeMs) && (
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
            {message.inputTokens != null && (
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {(message.inputTokens + (message.outputTokens ?? 0)).toLocaleString()} tokens
              </span>
            )}
            {message.responseTimeMs != null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {(message.responseTimeMs / 1000).toFixed(1)}s
              </span>
            )}
            {message.model && <span className="text-muted-foreground/60">{message.model}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
