/**
 * ChatWindow — real-time encrypted chat UI for YouAndINotAI matches.
 * Connects via WebSocket through useChat hook. E2E encrypted via Web Crypto.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../lib/useChat';
import { ErrorBoundary } from './ErrorBoundary';

interface Props {
  matchId: string;
  currentUserId: string;
  matchedUser: {
    display_name: string;
    photos: string[];
    verified: boolean;
  };
  onClose?: () => void;
}

export default function ChatWindow({
  matchId,
  currentUserId,
  matchedUser,
  onClose,
}: Props) {
  const { messages, connectionState, sendMessage } = useChat(matchId);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    try {
      await sendMessage(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, sending, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const connectionLabel: Record<typeof connectionState, string> = {
    connected: '🟢 Live',
    connecting: '🟡 Connecting…',
    polling: '🟠 Syncing',
    disconnected: '🔴 Offline',
  };

  const avatar = matchedUser.photos?.[0]
    ? matchedUser.photos[0]
    : `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
        matchedUser.display_name
      )}`;

  return (
    <ErrorBoundary boundaryName="ChatWindow">
      <div className="flex flex-col h-full bg-gray-950 text-white rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800">
          <img
            src={avatar}
            alt={matchedUser.display_name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold truncate">
                {matchedUser.display_name}
              </span>
              {matchedUser.verified && (
                <span className="text-blue-400 text-xs" title="Human-verified">
                  ✓
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {connectionLabel[connectionState]}
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors ml-auto"
              aria-label="Close chat"
            >
              ✕
            </button>
          )}
        </div>

        {/* ── Message list ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-700">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 text-sm mt-8">
              <p className="text-2xl mb-2">💬</p>
              <p>Start the conversation.</p>
              {connectionState === 'connected' && (
                <p className="text-xs mt-1 text-green-500">
                  🔒 End-to-end encrypted
                </p>
              )}
            </div>
          )}

          {messages.map(msg => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words ${
                    isMe
                      ? 'bg-purple-600 text-white rounded-br-sm'
                      : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                  }`}
                >
                  <p>{msg.content}</p>
                  <div
                    className={`flex items-center gap-1 mt-1 ${
                      isMe ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span className="text-[10px] opacity-50">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {msg.encrypted && (
                      <span
                        className="text-[10px] opacity-40"
                        title="End-to-end encrypted"
                      >
                        🔒
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* ── E2E notice ── */}
        {connectionState === 'connected' && (
          <div className="text-center text-[10px] text-gray-600 py-1 bg-gray-900 border-t border-gray-800">
            🔒 Messages are end-to-end encrypted
          </div>
        )}

        {/* ── Input ── */}
        <div className="px-4 py-3 bg-gray-900 border-t border-gray-800">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                connectionState === 'disconnected'
                  ? 'Reconnecting…'
                  : 'Type a message…'
              }
              disabled={connectionState === 'disconnected'}
              rows={1}
              maxLength={2000}
              className="flex-1 resize-none bg-gray-800 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 max-h-32 overflow-y-auto"
              style={{ lineHeight: '1.5' }}
            />
            <button
              onClick={handleSend}
              disabled={
                !input.trim() || sending || connectionState === 'disconnected'
              }
              className="shrink-0 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
            >
              {sending ? '…' : 'Send'}
            </button>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-600">
              Shift+Enter for new line
            </span>
            <span
              className={`text-[10px] ${
                input.length > 1800 ? 'text-orange-400' : 'text-gray-600'
              }`}
            >
              {input.length}/2000
            </span>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
