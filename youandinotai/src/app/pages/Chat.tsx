import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Smile } from 'lucide-react';
import { useChat } from '../../lib/useChat';
import { useAuth } from '../../lib/auth';

export function Chat() {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuth();
  const { messages, connected, sendMessage, loadHistory } = useChat(matchId || null);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchId) loadHistory(matchId);
  }, [matchId, loadHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Header — glass */}
      <div className="glass-strong flex items-center gap-3 px-4 py-3.5 border-b-0 relative z-10">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        <Link to="/app/inbox" className="text-gray-400 hover:text-white transition-colors p-1">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h2 className="text-white font-bold text-sm">Chat</h2>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-gray-500'}`} />
            <span className={`text-xs font-medium ${connected ? 'text-emerald-400' : 'text-gray-500'}`}>
              {connected ? 'Online' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center mt-16 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto mb-4">
              <Smile size={28} className="text-gray-500" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Send the first message!</p>
            <p className="text-gray-600 text-xs mt-1">Break the ice and say something nice</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === user?.user_id;
          const showTimestamp = i === 0 ||
            new Date(msg.created_at).getTime() - new Date(messages[i-1].created_at).getTime() > 300000;
          return (
            <div key={msg.id}>
              {showTimestamp && (
                <div className="text-center my-4">
                  <span className="text-[10px] text-gray-600 font-medium px-3 py-1 glass rounded-full">
                    {new Date(msg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                <div
                  className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed ${
                    isMine
                      ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-2xl rounded-br-md shadow-lg shadow-pink-500/10'
                      : 'glass text-gray-200 rounded-2xl rounded-bl-md'
                  }`}
                >
                  <p className="break-words">{msg.content}</p>
                  <span className={`text-[10px] mt-1.5 block text-right ${isMine ? 'text-white/50' : 'text-gray-500'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input — glass */}
      <div className="p-4 glass-strong border-t-0 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        <div className="flex gap-2 items-end">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/40 input-glow transition-all duration-300"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center hover:shadow-lg hover:shadow-pink-500/25 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-30 disabled:scale-100 disabled:shadow-none flex-shrink-0"
          >
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
