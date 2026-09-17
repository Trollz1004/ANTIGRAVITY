import React, { useState } from 'react';
import {
  Cpu,
  Copy,
  Check,
  ChevronDown,
  Terminal,
  Code2,
  Sparkles,
  ArrowUpRight,
  Send,
  Loader2,
} from 'lucide-react';
import { AIProvider, ChatMessage } from '../types';
import { PROVIDERS } from '../data/products';
import { JulesCodeCheck } from './JulesCodeCheck';

interface AgentPaneProps {
  paneId: 'alpha' | 'beta';
  name: string;
  provider: AIProvider;
  onProviderChange: (p: AIProvider) => void;
  messages: ChatMessage[];
  isStreaming: boolean;
  onSendMessage: (text: string) => void;
  onInsertCodeToEditor: (code: string) => void;
}

export const AgentPane: React.FC<AgentPaneProps> = ({
  paneId,
  name,
  provider,
  onProviderChange,
  messages,
  isStreaming,
  onSendMessage,
  onInsertCodeToEditor,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const currentProviderObj =
    PROVIDERS.find((p) => p.id === provider) || PROVIDERS[0];
  const isAlpha = paneId === 'alpha';

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isStreaming) return;
    onSendMessage(inputVal);
    setInputVal('');
  };

  return (
    <div className="flex h-full flex-col bg-[#090e1a] border border-[#1e293b] rounded-xl overflow-hidden shadow-lg">
      {/* Pane Top Bar */}
      <div className="flex h-11 items-center justify-between border-b border-[#1e293b] bg-[#0c1424] px-3">
        {/* Provider Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-[#2a3a52] bg-[#111827] px-2.5 py-1 text-xs font-semibold text-white hover:border-[#00d4ff] transition-all"
          >
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: currentProviderObj.color }}
            />
            <span
              className="font-mono text-xs uppercase"
              style={{ color: isAlpha ? '#d97706' : '#00d4ff' }}
            >
              {name}:
            </span>
            <span>{currentProviderObj.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-[#64748b]" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute left-0 top-full mt-1 z-40 w-64 rounded-xl border border-[#2a3a52] bg-[#0f172a] p-1.5 shadow-2xl">
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-[#64748b]">
                Select Agent Model ({name})
              </div>
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onProviderChange(p.id);
                    setDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg p-2 text-xs transition-colors ${
                    provider === p.id
                      ? 'bg-[#1e293b] text-white font-bold'
                      : 'text-[#94a3b8] hover:bg-[#131c2e] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <div className="text-left">
                      <div>{p.name}</div>
                      <div className="text-[10px] text-[#64748b]">{p.model}</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono rounded bg-[#111827] px-1.5 py-0.5 text-[#8ba3c7]">
                    {p.badge}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Streaming & Stats */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#64748b]">
          {isStreaming ? (
            <span className="flex items-center gap-1 text-[#00d4ff]">
              <Loader2 className="h-3 w-3 animate-spin" />
              Streaming...
            </span>
          ) : (
            <span>Ready • Context: 128k</span>
          )}
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs sm:text-sm">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              {/* Role Header */}
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#64748b] mb-1">
                <span
                  className="font-bold uppercase"
                  style={{
                    color: isUser
                      ? '#38bdf8'
                      : isAlpha
                      ? '#d97706'
                      : '#00d4ff',
                  }}
                >
                  {isUser ? 'You' : `${name} (${msg.provider || currentProviderObj.name})`}
                </span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[95%] rounded-xl p-3 sm:p-3.5 leading-relaxed ${
                  isUser
                    ? 'bg-[#1e293b] text-white border border-[#2a3a52]'
                    : 'bg-[#111827]/90 text-[#e2e8f0] border border-[#1e293b]'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Code block if present */}
                {msg.codeSnippet && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-[#2a3a52] bg-[#050913]">
                    <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#0c1424] px-3 py-1.5 text-[11px] font-mono text-[#64748b]">
                      <span className="text-[#38bdf8]">
                        {msg.codeLanguage || 'typescript'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleCopy(msg.id, msg.codeSnippet || '')
                          }
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          {copiedCodeId === msg.id ? (
                            <>
                              <Check className="h-3 w-3 text-[#00e676]" />
                              <span className="text-[#00e676]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() =>
                            onInsertCodeToEditor(msg.codeSnippet || '')
                          }
                          className="flex items-center gap-1 text-[#00d4ff] hover:underline"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                          <span>Editor</span>
                        </button>
                      </div>
                    </div>
                    <pre className="p-3 text-[11px] font-mono text-[#cbd5e1] overflow-x-auto">
                      <code>{msg.codeSnippet}</code>
                    </pre>
                  </div>
                )}

                {/* Jules Enterprise Code Check Offer beneath code block */}
                {msg.codeSnippet && (
                  <JulesCodeCheck
                    codeSnippet={msg.codeSnippet}
                    onCodePatched={(newCode) => {
                      onInsertCodeToEditor(newCode);
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pane Bottom Input */}
      <form
        onSubmit={handleSend}
        className="border-t border-[#1e293b] bg-[#0a0f1a] p-2 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={isStreaming}
          placeholder={`Direct message to ${name}...`}
          className="flex-1 bg-[#111827] border border-[#2a3a52] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#475569] focus:border-[#00d4ff] focus:outline-none"
        />
        <button
          type="submit"
          disabled={isStreaming || !inputVal.trim()}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e293b] text-white hover:bg-[#00d4ff] hover:text-slate-950 disabled:opacity-40 transition-colors"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
};
