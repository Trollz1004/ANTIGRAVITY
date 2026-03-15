import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Smile, Flame, Loader2 } from 'lucide-react';
import { useChat } from '../../lib/useChat';
import { useAuth } from '../../lib/auth';
import { GoogleGenAI } from '@google/genai';

async function generateIcebreaker(): Promise<string> {
  const ai = new GoogleGenAI({
    apiKey: 'PROXY',
    httpOptions: { baseUrl: 'https://gemini-proxy.joshlcoleman.workers.dev' },
  });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: 'Generate one creative, fun, flirty icebreaker message for a dating app. Keep it under 2 sentences. Be witty but respectful. No emojis. No quotes around it. Just the message.' }] }],
    config: {
      systemInstruction: 'You are the Icebreaker Engine for YouAndiNotAi dating platform. Generate short, clever, human-sounding opening messages that feel natural — not cheesy, not generic. Think first-message-that-actually-gets-a-reply energy.',
      temperature: 1.0,
    },
  });
  return response.text || "I don't usually message first, but your profile made me rethink my whole strategy.";
}

export function Chat() {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuth();
  const { messages, connected, sendMessage, loadHistory } = useChat(matchId || null);
  const [input, setInput] = useState('');
  const [icebreakerLoading, setIcebreakerLoading] = useState(false);
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

  const handleIcebreaker = async () => {
    setIcebreakerLoading(true);
    try {
      const line = await generateIcebreaker();
      setInput(line);
    } catch {
      setInput("I don't usually message first, but your profile made me rethink my whole strategy.");
    } finally {
      setIcebreakerLoading(false);
    }
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
          <div className="text-center mt-12 animate-fade-in">
            {/* Flaming Heart Icebreaker */}
            <div className="relative w-32 h-32 mx-auto mb-5">
              <img
                src="/icebreaker.jpg"
                alt="Break the Ice"
                className="w-32 h-32 rounded-2xl object-cover shadow-[0_0_30px_rgba(239,68,68,0.3)]"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/50 to-transparent" />
            </div>
            <p className="text-white font-bold text-lg mb-1">Break the Ice</p>
            <p className="text-gray-500 text-xs mb-5 max-w-xs mx-auto">
              Heart on fire but frozen on words? Let AI craft the perfect opener.
            </p>
            <button
              onClick={handleIcebreaker}
              disabled={icebreakerLoading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.8), rgba(236,72,153,0.8))',
                boxShadow: '0 0 20px rgba(239,68,68,0.3), inset 0 0 15px rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              {icebreakerLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Melting the ice...</>
              ) : (
                <><Flame size={16} /> Generate Icebreaker</>
              )}
            </button>
            <p className="text-gray-600 text-[10px] mt-3 uppercase tracking-widest">Powered by Gemini AI</p>
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
          {/* Icebreaker mini button */}
          <button
            onClick={handleIcebreaker}
            disabled={icebreakerLoading}
            className="w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 flex-shrink-0 disabled:opacity-30"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
            title="Generate icebreaker"
          >
            {icebreakerLoading ? (
              <Loader2 size={18} className="text-red-400 animate-spin" />
            ) : (
              <Flame size={18} className="text-red-400" />
            )}
          </button>
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
