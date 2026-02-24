import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, Send, Loader2, Heart, Stars } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useGameStore } from '../store/useGameStore';

interface GeminiMatchmakerProps {
  onClose: () => void;
  onMatch?: (score: number) => void;
}

export function GeminiMatchmaker({ onClose, onMatch }: GeminiMatchmakerProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: "Welcome to the Cosmic Matchmaker. I am Gemini, your celestial guide. Tell me, what are you seeking in this vast universe?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [compatibility, setCompatibility] = useState<number | null>(null);
  const myColor = useGameStore((state) => state.myColor);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const model = "gemini-3-flash-preview";
      
      const systemInstruction = `You are the "Cosmic Matchmaker" for the dating app "YouandInotai.Com". 
      Your personality is ethereal, wise, slightly mysterious, and romantic. 
      You use space metaphors (galaxies, stars, nebulae, gravity, orbits) to give dating advice or analyze the user's romantic prospects.
      The user's current "Aura Color" is ${myColor}. Incorporate this color into your response if it makes sense.
      Keep responses concise but poetic.`;

      const response = await ai.models.generateContent({
        model,
        contents: [...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })), { role: 'user', parts: [{ text: userMessage }] }],
        config: {
          systemInstruction,
          temperature: 0.8,
        },
      });

      const aiText = response.text || "The stars are silent for a moment. Try again, traveler.";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
      const score = Math.floor(Math.random() * 20) + 80;
      setCompatibility(score);
      
      if (score >= 95 && onMatch) {
        onMatch(score);
      }
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: "A solar flare has interrupted our connection. Please try again when the orbits align." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[600px]"
      >
        {/* Header */}
        <div className="p-6 border-bottom border-white/5 bg-gradient-to-r from-pink-500/10 to-indigo-500/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-xl">
              <Sparkles className="text-pink-400" size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-none">Cosmic Matchmaker</h2>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Powered by Gemini AI</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {compatibility && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-end"
              >
                <div className="text-[10px] text-pink-400 font-bold uppercase tracking-tighter">Compatibility</div>
                <div className="text-xl font-black text-white leading-none">{compatibility}%</div>
              </motion.div>
            )}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide"
        >
          {messages.map((msg, i) => (
            <motion.div
              initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white/5 text-gray-200 border border-white/5 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5">
                <Loader2 className="animate-spin text-pink-400" size={18} />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-white/5 bg-black/20">
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask the stars..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500/50 transition-colors pr-12"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 disabled:opacity-50 disabled:hover:bg-pink-500 transition-all active:scale-90"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[9px] text-center text-gray-500 mt-4 uppercase tracking-widest">
            Your aura is currently <span style={{ color: myColor || '#fff' }}>{myColor || 'calculating...'}</span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
