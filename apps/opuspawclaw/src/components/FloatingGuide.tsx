import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, User } from 'lucide-react';
import { sendMessage } from '../lib/providers';

export function FloatingGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm Gemma, your elite workstation guide. I run on a lightweight local model. How can I assist you with Opus PawClaw?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      // Simulate Gemma-4 response
      const stream = sendMessage('anthropic', 'claude-3-5-sonnet', [{ role: 'user', content: userMsg }], 'mock-key');
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      for await (const chunk of stream) {
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].content += chunk;
          return newMsgs;
        });
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Oops, my micro-engine encountered an error.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-10 right-6 z-50">
      {isOpen ? (
        <div className="bg-[#111827]/95 backdrop-blur-xl border border-[#2a3a52] w-80 h-96 rounded-2xl shadow-[0_0_40px_rgba(0,212,255,0.15)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-300">
          {/* Header */}
          <div className="h-14 bg-gradient-to-r from-[#00d4ff]/20 to-[#b200ff]/20 border-b border-[#2a3a52] flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#00d4ff]/20 rounded-lg">
                <Sparkles size={16} className="text-[#00d4ff]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Gemma 4</h3>
                <p className="text-[9px] text-[#6b82a6] uppercase tracking-widest">Local Guide</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-[#6b82a6] hover:text-white hover:bg-[#2a3a52] rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Chat Area */}
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                  m.role === 'user' ? 'bg-[#00d4ff]/20 text-[#00d4ff]' : 'bg-gradient-to-br from-[#00d4ff] to-[#b200ff] text-white'
                }`}>
                  {m.role === 'user' ? <User size={12} /> : <Sparkles size={12} />}
                </div>
                <div className={`p-2.5 rounded-lg text-xs leading-relaxed max-w-[85%] ${
                  m.role === 'user' ? 'bg-[#1a2332] text-[#e8f0ff] border border-[#2a3a52]' : 'bg-[#0a0f1a] text-[#6b82a6] border border-[#00d4ff]/20'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-[#00d4ff] to-[#b200ff] text-white flex items-center justify-center shrink-0">
                  <Sparkles size={12} />
                </div>
                <div className="p-2.5 rounded-lg bg-[#0a0f1a] border border-[#00d4ff]/20 flex gap-1 items-center">
                  <div className="w-1 h-1 bg-[#00d4ff] rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-[#00d4ff] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1 h-1 bg-[#00d4ff] rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 bg-[#0a0f1a] border-t border-[#2a3a52]">
            <form onSubmit={handleSend} className="relative">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Gemma..."
                className="w-full bg-[#111827] border border-[#2a3a52] rounded-lg py-2 pl-3 pr-8 text-xs focus:border-[#00d4ff] outline-none text-white"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isTyping}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#00d4ff] disabled:opacity-30 p-1 hover:bg-[#2a3a52] rounded transition-colors"
              >
                <Sparkles size={14} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#00d4ff] to-[#b200ff] rounded-full shadow-[0_0_20px_rgba(0,212,255,0.4)] hover:shadow-[0_0_30px_rgba(0,212,255,0.6)] hover:scale-110 active:scale-95 transition-all"
        >
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity" />
          <Sparkles size={24} className="text-white animate-pulse" />
          
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#00e676] border-2 border-[#0a0f1a] rounded-full shadow-lg" />
        </button>
      )}
    </div>
  );
}
