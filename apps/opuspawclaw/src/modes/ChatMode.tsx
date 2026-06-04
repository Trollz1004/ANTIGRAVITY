import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import { Send, Bot, User } from 'lucide-react';
import { sendMessage } from '../lib/providers';

export function ChatMode() {
  const { messages, addMessage, activeConversationId, createNewConversation } = useChat();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    let convId = activeConversationId;
    if (!convId) {
      convId = await createNewConversation(input.slice(0, 30), 'chat');
    }

    const currentInput = input;
    setInput('');
    setIsTyping(true);

    // 1. Add User Message
    await addMessage(convId, 'user', currentInput, 'user-input');

    // 2. Simulate/Get AI Response
    // For now, we use the simulated streaming from providers.ts
    // or we could use the real one if keys are set.
    try {
      let fullResponse = '';
      const stream = sendMessage('anthropic', 'claude-3-5-sonnet', [{ role: 'user', content: currentInput }], 'mock-key');
      
      // In a more robust app, we'd add the assistant message first then update it
      // But for simplicity in this turn, we'll collect then push
      for await (const chunk of stream) {
        fullResponse += chunk;
      }
      
      await addMessage(convId, 'assistant', fullResponse, 'claude-3-5-sonnet');
    } catch (err) {
      console.error('Failed to get AI response', err);
      await addMessage(convId, 'assistant', 'Error: Failed to connect to AI provider.', 'error');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f1a] text-[#e8f0ff]">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-[#1a2332] rounded-2xl flex items-center justify-center mb-4 border border-[#2a3a52]">
              <Bot size={32} className="text-[#00d4ff]" />
            </div>
            <h2 className="text-xl font-bold text-[#e8f0ff] mb-2">Opus Explorer</h2>
            <p className="text-[#6b82a6] max-w-sm">
              Your professional workstation is ready. Start a new conversation or select one from the history.
            </p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                m.role === 'user' ? 'bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]' : 'bg-[#111827] border-[#2a3a52] text-[#6b82a6]'
              }`}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-xl leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-[#1a2332] border border-[#2a3a52] text-white shadow-lg' 
                  : 'bg-[#111827] border border-[#2a3a52] text-[#e8f0ff]'
              }`}>
                <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                {m.model && m.model !== 'user-input' && (
                  <div className="mt-2 text-[10px] text-[#4a5568] uppercase font-bold tracking-widest">{m.model}</div>
                )}
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-lg bg-[#111827] border border-[#2a3a52] flex items-center justify-center text-[#6b82a6]">
              <Bot size={16} />
            </div>
            <div className="bg-[#111827] border border-[#2a3a52] p-4 rounded-xl">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-[#00d4ff]/50 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-[#00d4ff]/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-[#00d4ff]/50 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-6 border-t border-[#2a3a52] bg-[#111827]/50">
        <form 
          onSubmit={handleSend}
          className="max-w-4xl mx-auto relative group"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message or task..."
            className="w-full bg-[#0a0f1a] border border-[#2a3a52] rounded-xl px-4 py-4 pr-14 text-sm focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/20 outline-none transition-all placeholder:text-[#4a5568]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 bottom-2 w-10 bg-[#1a2332] hover:bg-[#2a3a52] disabled:opacity-50 disabled:cursor-not-allowed text-[#00d4ff] rounded-lg flex items-center justify-center transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
        <div className="mt-3 text-center">
          <p className="text-[10px] text-[#4a5568] uppercase tracking-widest leading-none">
            Opus Workstation — Powered by Trash Or Treasure Online Recycler LLC
          </p>
        </div>
      </div>
    </div>
  );
}

