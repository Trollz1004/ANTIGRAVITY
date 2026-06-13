'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn, formatDateTime } from '@/lib/utils';
import { Plus, Send, Search, Loader2, ArrowLeft, Paperclip, Mic, Smile } from 'lucide-react';
import Link from 'next/link';

interface Deal {
  id: string;
  listing: { id: string; title: string; type: string };
  buyerOrg: { name: string };
  sellerOrg: { name: string };
  status: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  isCurrentUser: boolean;
  createdAt: string;
}

export default function MessagesPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const res = await fetch('/api/deals', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDeals(data.deals);
        if (data.deals.length > 0 && !selectedDeal) {
          setSelectedDeal(data.deals[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (dealId: string) => {
    try {
      const res = await fetch(`/api/messages?dealId=${dealId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  useEffect(() => {
    if (selectedDeal) {
      fetchMessages(selectedDeal.id);
    } else {
      setMessages([]);
    }
  }, [selectedDeal]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedDeal) return;
    
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ dealId: selectedDeal.id, content: newMessage }),
      });
      if (res.ok) {
        setNewMessage('');
        fetchMessages(selectedDeal.id);
      }
    } catch {
      console.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-hydra-600" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] flex overflow-hidden">
      {/* Deal List Sidebar */}
      <div className="w-full lg:w-80 border-r border-nexus-200 dark:border-nexus-800 flex flex-col">
        <div className="p-4 border-b border-nexus-200 dark:border-nexus-800 flex items-center justify-between">
          <h2 className="font-semibold text-nexus-900 dark:text-nexus-100">Conversations</h2>
          <Badge variant="primary" size="sm">{deals.length}</Badge>
        </div>
        <div className="flex-1 overflow-y-auto">
          {deals.length === 0 ? (
            <div className="p-8 text-center text-nexus-500 dark:text-nexus-400">
              No active deals yet
            </div>
          ) : (
            <ul className="divide-y divide-nexus-200 dark:divide-nexus-800">
              {deals.map((deal) => (
                <li key={deal.id}>
                  <Link
                    href="#"
                    onClick={(e) => { e.preventDefault(); setSelectedDeal(deal); }}
                    className={cn(
                      'block p-4 hover:bg-nexus-50 dark:hover:bg-nexus-900/50 transition-colors',
                      selectedDeal?.id === deal.id && 'bg-hydra-50 dark:bg-hydra-900/20 border-l-2 border-hydra-500'
                    )}
                  >
                    <p className="font-medium text-nexus-900 dark:text-nexus-100 truncate">{deal.listing.title}</p>
                    <p className="text-sm text-nexus-500 dark:text-nexus-400 truncate">{deal.buyerOrg.name} ↔ {deal.sellerOrg.name}</p>
                    <Badge variant="default" size="sm" className="mt-2">{deal.listing.type}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedDeal ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-nexus-200 dark:border-nexus-800 flex items-center gap-4">
              <Link href="/dashboard/messages" className="p-2 hover:bg-nexus-100 dark:hover:bg-nexus-800 rounded-lg lg:hidden">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-nexus-900 dark:text-nexus-100 truncate">{selectedDeal.listing.title}</p>
                <p className="text-sm text-nexus-500 dark:text-nexus-400">{selectedDeal.buyerOrg.name} ↔ {selectedDeal.sellerOrg.name}</p>
              </div>
              <Badge variant="primary" size="sm">{selectedDeal.listing.type}</Badge>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-nexus-500 dark:text-nexus-400">
                  <Paperclip className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-lg">No messages yet</p>
                  <p className="text-sm">Start the conversation</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={cn('flex gap-3', msg.isCurrentUser && 'flex-row-reverse')}>
                    {!msg.isCurrentUser && (
                      <div className="w-8 h-8 rounded-full bg-hydra-100 dark:bg-hydra-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-hydra-600 dark:text-hydra-400">
                          {msg.senderName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className={cn(
                      'max-w-[70%] rounded-2xl px-4 py-2',
                      msg.isCurrentUser
                        ? 'bg-hydra-600 text-white rounded-br-md'
                        : 'bg-nexus-100 dark:bg-nexus-800 text-nexus-900 dark:text-nexus-100 rounded-bl-md'
                    )}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={cn('text-xs mt-1', msg.isCurrentUser ? 'text-hydra-100/70' : 'text-nexus-500 dark:text-nexus-400')}>
                        {msg.senderName} • {formatDateTime(msg.createdAt)}
                      </p>
                    </div>
                    {msg.isCurrentUser && (
                      <div className="w-8 h-8 rounded-full bg-nexus-100 dark:bg-nexus-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-nexus-600 dark:text-nexus-400">You</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-nexus-200 dark:border-nexus-800">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="pr-12"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                  />
                  <div className="absolute right-3 bottom-2 flex items-center gap-1">
                    <button type="button" className="p-1 text-nexus-400 hover:text-nexus-600"><Smile className="w-5 h-5" /></button>
                    <button type="button" className="p-1 text-nexus-400 hover:text-nexus-600"><Paperclip className="w-5 h-5" /></button>
                    <button type="button" className="p-1 text-nexus-400 hover:text-nexus-600"><Mic className="w-5 h-5" /></button>
                  </div>
                </div>
                <Button type="submit" loading={sending} className="h-10" disabled={!newMessage.trim()}>
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-nexus-500 dark:text-nexus-400">
            <div className="text-center">
              <Paperclip className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-nexus-900 dark:text-nexus-100 mb-2">Select a conversation</h3>
              <p className="text-sm">Choose a deal from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}