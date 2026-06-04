import React, { useEffect, useRef, useState } from "react";
import { Send, Bot, User, Zap } from "lucide-react";
import { useChat } from "../contexts/ChatContext";

const HERMES_MODELS = [
  { id: "hermes",       label: "hermes · opus bridge" },
  { id: "hermes-deep",  label: "hermes-deep · long context" },
  { id: "cfo",          label: "cfo · finance" },
  { id: "code",         label: "code · coder bridge" },
  { id: "marketing",    label: "marketing · opus" },
  { id: "kimi",         label: "kimi · openrouter" },
  { id: "fast",         label: "fast · gemini flash" },
];

export function ChatMode() {
  const { messages, addMessage, activeConversationId, createNewConversation, sendThroughHermes, isLoading } = useChat();
  const [input, setInput] = useState("");
  const [virtualModel, setVirtualModel] = useState("hermes");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    let cid = activeConversationId;
    if (!cid) cid = createNewConversation(input.slice(0, 30), "chat");

    const text = input;
    setInput("");
    addMessage(cid, "user", text, "user");

    try {
      const r = await sendThroughHermes({
        model: virtualModel,
        messages: [{ role: "user", content: text }],
        sessionId: `chat-${cid}`,
      });
      addMessage(cid, "assistant", r.reply, virtualModel, {
        provider: r.provider,
        realModel: r.realModel,
        latencyMs: r.latencyMs,
      });
    } catch (err) {
      addMessage(cid, "assistant", `endpoint unreachable — ${err.message}`, "error");
    }
  };

  return (
    <div data-testid="chat-mode" className="flex flex-col h-full bg-[#0a0f1a] text-[#e8f0ff]">
      <div className="px-6 py-3 border-b border-[#2a3a52] bg-[#111827]/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={14} className="text-[#00d4ff]" />
          <span className="text-xs font-bold tracking-wide">OPUS CHAT · HERMES ROUTER</span>
        </div>
        <select
          data-testid="chat-model-select"
          value={virtualModel}
          onChange={(e) => setVirtualModel(e.target.value)}
          className="mono text-xs bg-[#1a2332] border border-[#2a3a52] rounded px-3 py-1.5 text-[#e8f0ff] hover:border-[#00d4ff] transition-colors focus:outline-none"
        >
          {HERMES_MODELS.map((m) => (
            <option key={m.id} value={m.id} className="bg-[#111827]">{m.label}</option>
          ))}
        </select>
      </div>

      <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-[#1a2332] rounded-2xl flex items-center justify-center mb-4 border border-[#2a3a52]">
              <Bot size={32} className="text-[#00d4ff]" />
            </div>
            <h2 className="text-xl font-bold text-[#e8f0ff] mb-2">Opus Explorer</h2>
            <p className="text-[#6b82a6] max-w-sm text-sm">
              Every message routes through the Hermes Router mirror. Responses ship back
              with <span className="text-[#00d4ff] mono">X-Hermes-Provider</span> and{" "}
              <span className="text-[#00d4ff] mono">X-Hermes-Real-Model</span>.
            </p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                m.role === "user"
                  ? "bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]"
                  : "bg-[#111827] border-[#2a3a52] text-[#6b82a6]"
              }`}>
                {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-xl leading-relaxed ${
                m.role === "user"
                  ? "bg-[#1a2332] border border-[#2a3a52] text-white shadow-lg"
                  : "bg-[#111827] border border-[#2a3a52] text-[#e8f0ff]"
              }`}>
                <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                {m.meta && (
                  <div className="mt-2 pt-2 border-t border-[#2a3a52] flex flex-wrap gap-3 text-[9px] mono text-[#6b82a6]">
                    <span>X-Hermes-Provider: <span className="text-[#e8f0ff]">{m.meta.provider}</span></span>
                    <span>Real: <span className="text-[#e8f0ff]">{m.meta.realModel}</span></span>
                    {m.meta.latencyMs > 0 && (
                      <span className="text-[#ffb300] flex items-center gap-0.5"><Zap size={8}/> {m.meta.latencyMs}ms</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-lg bg-[#111827] border border-[#2a3a52] flex items-center justify-center text-[#6b82a6]">
              <Bot size={16} />
            </div>
            <div className="bg-[#111827] border border-[#2a3a52] p-4 rounded-xl">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-[#00d4ff]/50 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-[#00d4ff]/50 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                <div className="w-1.5 h-1.5 bg-[#00d4ff]/50 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-[#2a3a52] bg-[#111827]/50">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative">
          <input
            data-testid="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Opus via Hermes…"
            className="w-full bg-[#0a0f1a] border border-[#2a3a52] rounded-xl px-4 py-4 pr-14 text-sm focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/20 outline-none transition-all placeholder:text-[#4a5568]"
          />
          <button
            data-testid="chat-send"
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 w-10 bg-[#1a2332] hover:bg-[#2a3a52] disabled:opacity-50 text-[#00d4ff] rounded-lg flex items-center justify-center transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
        <div className="mt-3 text-center">
          <p className="text-[10px] text-[#4a5568] uppercase tracking-widest">
            #UntilNoKidInNeed · bridged via Emergent Universal LLM key
          </p>
        </div>
      </div>
    </div>
  );
}
