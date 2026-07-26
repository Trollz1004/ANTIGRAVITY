import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Shield, Flame, Loader2, Video } from 'lucide-react';
import { useChat } from '../../lib/useChat';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import { isSafetyToolsAvailable } from '../../lib/safety';
import { GoogleGenAI } from '@google/genai';
import { SafetyDrawer } from '../components/SafetyDrawer';
import { OptimizedImage } from '../../components/OptimizedImage';

async function generateIcebreaker(): Promise<string> {
  const ai = new GoogleGenAI({
    apiKey: 'PROXY',
    httpOptions: { baseUrl: 'https://gemini-proxy.joshlcoleman.workers.dev' },
  });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: 'Generate one creative, fun, flirty icebreaker message for a dating app. Keep it under 2 sentences. Be witty but respectful. No emojis. No quotes around it. Just the message.',
          },
        ],
      },
    ],
    config: {
      systemInstruction:
        'You are the Icebreaker Engine for YouAndiNotAi dating platform. Generate short, clever, human-sounding opening messages that feel natural — not cheesy, not generic. Think first-message-that-actually-gets-a-reply energy.',
      temperature: 1.0,
    },
  });
  return (
    response.text ||
    "I don't usually message first, but your profile made me rethink my whole strategy."
  );
}

export function Chat() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, connected, sendMessage, loadHistory } = useChat(
    matchId || null
  );
  const [input, setInput] = useState('');
  const [icebreakerLoading, setIcebreakerLoading] = useState(false);
  const [matchDisplayName, setMatchDisplayName] = useState('Chat');
  const [matchUserId, setMatchUserId] = useState<string | null>(null);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [safetyAvailable, setSafetyAvailable] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchId) loadHistory(matchId);
  }, [matchId, loadHistory]);

  useEffect(() => {
    void isSafetyToolsAvailable().then(setSafetyAvailable);
  }, []);

  useEffect(() => {
    if (!matchId) return;
    api
      .get<{ user_id: string; display_name: string }>(`/matches/${matchId}`)
      .then(match => {
        setMatchDisplayName(match.display_name);
        setMatchUserId(match.user_id);
      })
      .catch(() => {
        setMatchDisplayName('Chat');
        setMatchUserId(null);
      });
  }, [matchId]);

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
      setInput(
        "I don't usually message first, but your profile made me rethink my whole strategy."
      );
    } finally {
      setIcebreakerLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#f4efe6]">
      <div className="flex items-center gap-3 border-b-4 border-[#111111] bg-[#fffaf2] px-4 py-4 relative z-10">
        <Link to="/app/inbox" className="app-back-link p-1">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="app-kicker mb-1">Messages</div>
          <h2 className="text-lg font-black tracking-[-0.05em] text-[#111111]">
            {matchDisplayName}
          </h2>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-[#ff4f00]' : 'bg-[#8a8478]'
              }`}
            />
            <span
              className={`text-xs font-bold uppercase tracking-[0.16em] ${
                connected ? 'text-[#111111]' : 'text-[#5c594f]'
              }`}
            >
              {connected ? 'Online' : 'Connecting...'}
            </span>
          </div>
        </div>
        {matchUserId && safetyAvailable && (
          <button
            type="button"
            onClick={() => setSafetyOpen(true)}
            className="flex h-12 items-center justify-center gap-2 rounded-[1rem] border-[3px] border-[#111111] bg-white px-4 text-xs font-black uppercase tracking-[0.14em] text-[#111111] shadow-[4px_4px_0_0_rgba(17,17,17,1)]"
          >
            <Shield size={14} className="text-[#ff4f00]" />
            Safety
          </button>
        )}
        {matchId && (
          <Link
            to={`/app/video/${matchId}`}
            className="flex h-12 items-center justify-center gap-2 rounded-[1rem] border-[3px] border-[#111111] bg-[#ff4f00] px-4 text-xs font-black uppercase tracking-[0.14em] text-white shadow-[4px_4px_0_0_rgba(17,17,17,1)]"
          >
            <Video size={14} /> Video
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 app-bg-premium">
        {messages.length === 0 && (
          <div className="text-center mt-12 animate-fade-in">
            {/* Flaming Heart Icebreaker */}
            <div className="relative w-32 h-32 mx-auto mb-5">
              <OptimizedImage
                src="/icebreaker.jpg"
                alt="Break the Ice"
                className="w-32 h-32 rounded-2xl object-cover shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                loading="eager"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/50 to-transparent" />
            </div>
            <p className="text-[#111111] font-black text-lg mb-1 tracking-[-0.05em]">
              Break the Ice
            </p>
            <p className="text-[#5c594f] text-xs mb-5 max-w-xs mx-auto font-medium">
              Heart on fire but frozen on words? Let AI craft the perfect
              opener.
            </p>
            <button
              onClick={handleIcebreaker}
              disabled={icebreakerLoading}
              className="app-button-accent px-6 py-3 text-sm disabled:opacity-60"
            >
              {icebreakerLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Melting the
                  ice...
                </>
              ) : (
                <>
                  <Flame size={16} /> Generate Icebreaker
                </>
              )}
            </button>
            <p className="text-[#5c594f] text-[10px] mt-3 uppercase tracking-widest font-bold">
              Powered by Gemini AI
            </p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === user?.user_id;
          const showTimestamp =
            i === 0 ||
            new Date(msg.created_at).getTime() -
              new Date(messages[i - 1].created_at).getTime() >
              300000;
          return (
            <div key={msg.id}>
              {showTimestamp && (
                <div className="text-center my-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] px-3 py-1 glass rounded-full">
                    {new Date(msg.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
              <div
                className={`flex ${
                  isMine ? 'justify-end' : 'justify-start'
                } animate-slide-up`}
              >
                <div
                  className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed ${
                    isMine
                      ? 'rounded-2xl rounded-br-md border-[3px] border-[#111111] bg-[#111111] text-white shadow-[6px_6px_0_0_rgba(17,17,17,1)]'
                      : 'glass text-[#111111] rounded-2xl rounded-bl-md'
                  }`}
                >
                  <p className="break-words">{msg.content}</p>
                  <span
                    className={`text-[10px] mt-1.5 block text-right font-bold uppercase tracking-[0.12em] ${
                      isMine ? 'text-white/60' : 'text-[#5c594f]'
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input — glass */}
      <div className="border-t-4 border-[#111111] bg-[#fffaf2] p-4 relative">
        <div className="flex gap-2 items-end">
          {/* Icebreaker mini button */}
          <button
            onClick={handleIcebreaker}
            disabled={icebreakerLoading}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border-[3px] border-[#111111] bg-white shadow-[4px_4px_0_0_rgba(17,17,17,1)] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-30"
            title="Generate icebreaker"
          >
            {icebreakerLoading ? (
              <Loader2 size={18} className="text-[#ff4f00] animate-spin" />
            ) : (
              <Flame size={18} className="text-[#ff4f00]" />
            )}
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="app-input input-glow flex-1"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border-[3px] border-[#111111] bg-[#111111] text-white shadow-[4px_4px_0_0_rgba(17,17,17,1)] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-30 disabled:shadow-none"
          >
            <Send size={18} className="text-[#ff4f00]" />
          </button>
        </div>
      </div>

      {matchUserId && safetyAvailable && (
        <SafetyDrawer
          open={safetyOpen}
          targetUserId={matchUserId}
          targetName={matchDisplayName}
          source="chat"
          onClose={() => setSafetyOpen(false)}
          onBlocked={() => {
            navigate('/app/inbox', { replace: true });
          }}
        />
      )}
    </div>
  );
}
