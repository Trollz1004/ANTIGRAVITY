import React, { useState, useEffect, useRef } from 'react';
import { ProviderDropdown } from './ProviderDropdown';
import { sendMessage } from '../lib/providers';
import { X, Sparkles, Send, Bot, TerminalSquare } from 'lucide-react';
import { PixelBattle } from './PixelBattle';
import Markdown from 'react-markdown';
import { CodeBlock } from './CodeBlock';

interface AgentPaneProps {
  title: string;
  defaultProvider: string;
  onRemove?: () => void;
  canRemove?: boolean;
}

export function AgentPane({ title, defaultProvider, onRemove, canRemove }: AgentPaneProps) {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState('');
  
  const isStreamingRef = useRef(false);
  isStreamingRef.current = isStreaming;

  const handleSend = async (e?: React.FormEvent, overrideInput?: string) => {
    if (e) e.preventDefault();
    const userMsg = overrideInput || input;
    if (!userMsg.trim() || isStreamingRef.current) return;
    
    setInput('');
    setIsStreaming(true);
    setMessages(prev => [...prev, { role: 'user', content: userMsg }, { role: 'assistant', content: '' }]);
    
    try {
      const stream = sendMessage('anthropic', 'claude-3-5-sonnet', [{ role: 'user', content: userMsg }], 'mock-key');
      for await (const chunk of stream) {
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].content += chunk;
          return newMsgs;
        });
      }
    } finally {
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    const handleGlobalTask = (e: CustomEvent) => {
      handleSend(undefined, e.detail.task);
    };
    
    window.addEventListener('opuspawclaw-task', handleGlobalTask as EventListener);
    return () => window.removeEventListener('opuspawclaw-task', handleGlobalTask as EventListener);
  }, []);

  const isTyping = isStreaming;

  return (
    <div className={`flex-1 flex flex-col bg-[#0a0f1a] border-[#2a3a52] group/pane transition-colors duration-500 ${isStreaming ? 'border-[#00d4ff]/30 shadow-[0_0_15px_rgba(0,212,255,0.05)]' : ''}`}>
      <div className="h-12 border-b border-[#2a3a52] flex items-center px-4 justify-between bg-[#111827] relative overflow-hidden">
        {isStreaming && (
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent animate-pulse" />
        )}
        <div className="flex items-center gap-3 z-10">
          <div className={`relative flex items-center justify-center`}>
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isStreaming ? 'bg-[#e040fb] shadow-[0_0_12px_#e040fb] animate-ping' : 'bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]'}`} />
            {isStreaming && (
              <div className="absolute w-4 h-4 rounded-full border border-[#e040fb] animate-[spin_3s_linear_infinite] opacity-50" />
            )}
          </div>
          <div className="flex flex-col">
            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${isStreaming ? 'text-[#e8f0ff] drop-shadow-[0_0_8px_rgba(224,64,251,0.5)]' : 'text-[#6b82a6]'}`}>
              {title}
            </span>
            {isStreaming && (
              <span className="text-[7px] font-black uppercase tracking-widest text-[#e040fb] animate-pulse">Computing</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 z-10">
          <ProviderDropdown defaultProvider={defaultProvider} />
          {canRemove && (
            <button 
              onClick={onRemove}
              className="p-1.5 text-[#4a5568] hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all opacity-0 group-hover/pane:opacity-100"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40">
            <Bot size={32} className="text-[#00d4ff] mb-4" />
            <p className="text-[10px] font-medium text-[#6b82a6] uppercase tracking-widest">Awaiting Command</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`text-sm ${m.role === 'user' ? 'text-[#00d4ff]' : 'text-[#e8f0ff]'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${m.role === 'user' ? 'opacity-50' : 'text-[#e040fb] opacity-80'}`}>
                  {m.role === 'user' ? 'You' : 'Agent'}
                </span>
                {i === messages.length - 1 && isStreaming && m.role === 'assistant' && (
                  <Sparkles size={10} className="text-[#e040fb] animate-pulse" />
                )}
              </div>
              <div className="pl-0 border-l-0 border-[#2a3a52] py-1">
                {m.content === '' && isStreaming && i === messages.length - 1 ? (
                  <div className="mt-2 animate-in fade-in zoom-in-95 duration-300">
                    <PixelBattle />
                  </div>
                ) : m.role === 'assistant' ? (
                  <div className="markdown-body text-sm leading-relaxed whitespace-normal relative">
                    <Markdown
                      components={{
                        code({node, inline, className, children, ...props}: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline ? (
                            <CodeBlock
                              language={match ? match[1] : ''}
                              value={String(children).replace(/\n$/, '')}
                            />
                          ) : (
                            <code className="bg-[#111827] text-[#00d4ff] px-1.5 py-0.5 rounded textxs font-mono border border-[#2a3a52]" {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {m.content}
                    </Markdown>
                    {isStreaming && i === messages.length - 1 && (
                      <span className="inline-block w-1.5 h-3.5 bg-[#e040fb] animate-pulse ml-1 align-baseline shadow-[0_0_8px_#e040fb]" />
                    )}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-[#2a3a52] bg-[#111827]/30">
        <form onSubmit={handleSend} className="relative">
          <input 
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Message ${title}...`}
            className="w-full bg-[#0a0f1a] border border-[#2a3a52] rounded-lg px-4 py-2 pr-10 text-xs text-[#e8f0ff] focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/20 outline-none transition-all placeholder:text-[#4a5568]"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#00d4ff] disabled:opacity-30 hover:bg-[#1a2332] rounded transition-colors"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
