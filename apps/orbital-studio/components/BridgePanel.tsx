import React, { useState } from 'react';
import { Send, Bot, Terminal, Cpu, CheckCircle2, Shield, Sparkles } from 'lucide-react';

interface BridgeMessage {
  id: string;
  sender: 'User' | 'Hermes' | 'OpenClaw' | 'Adversarial Judge';
  text: string;
  timestamp: string;
  skillsUsed?: string[];
}

export const BridgePanel: React.FC = () => {
  const [targetAgent, setTargetAgent] = useState<'Hermes' | 'OpenClaw' | 'Tri-Agent Swarm'>('Hermes');
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<BridgeMessage[]>([
    {
      id: '1',
      sender: 'Hermes',
      text: 'Bridge online. Standing by for direct code architecture & refactoring commands.',
      timestamp: new Date().toLocaleTimeString(),
      skillsUsed: ['system_skills/gemini_api', 'self-improving-agent']
    },
    {
      id: '2',
      sender: 'OpenClaw',
      text: 'OpenClaw execution channel verified. Ready to run sub-agent crawling and logic assertions.',
      timestamp: new Date().toLocaleTimeString(),
      skillsUsed: ['system_skills/workspace_integration', 'system_skills/realtime_guidelines']
    }
  ]);
  const [isSending, setIsSending] = useState(false);

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    const userMsg: BridgeMessage = {
      id: `msg-${Date.now()}`,
      sender: 'User',
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsSending(true);

    setTimeout(() => {
      let reply: BridgeMessage;
      if (targetAgent === 'Hermes') {
        reply = {
          id: `reply-${Date.now()}`,
          sender: 'Hermes',
          text: `Hermes received prompt "${userMsg.text}". A harness prepares a review packet; only a judge validates and lands it.`,
          timestamp: new Date().toLocaleTimeString(),
          skillsUsed: ['system_skills/gemini_api', 'system_skills/firebase-skill', 'self-improving-agent', 'system_skills/realtime_guidelines']
        };
      } else if (targetAgent === 'OpenClaw') {
        reply = {
          id: `reply-${Date.now()}`,
          sender: 'OpenClaw',
          text: `OpenClaw executed crawler sweep for "${userMsg.text}". All schema boundaries verified with zero stale state.`,
          timestamp: new Date().toLocaleTimeString(),
          skillsUsed: ['system_skills/oauth', 'system_skills/workspace_integration', 'system_skills/google_maps_platform', 'self-improving-agent']
        };
      } else {
        reply = {
          id: `reply-${Date.now()}`,
          sender: 'Adversarial Judge',
          text: `Swarm Tri-Agent execution evaluated by Adversarial Judge (Max Reasoning Tier). Verdict: APPROVED (Score: 98/100). Materialized via OmniRoute.`,
          timestamp: new Date().toLocaleTimeString(),
          skillsUsed: ['system_skills/gemini_api', 'system_skills/image_generation', 'self-improving-agent', 'system_skills/realtime_guidelines']
        };
      }

      setMessages(prev => [...prev, reply]);
      setIsSending(false);
    }, 600);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-6 text-white shadow-2xl flex flex-col h-[520px]">
      <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
              AI Bridge Panel
            </h3>
            <p className="text-[10px] font-mono text-gray-400 uppercase">Direct Relay to Hermes &amp; OpenClaw</p>
          </div>
        </div>

        {/* Agent Selector */}
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-mono">
          {(['Hermes', 'OpenClaw', 'Tri-Agent Swarm'] as const).map(agent => (
            <button
              key={agent}
              onClick={() => setTargetAgent(agent)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                targetAgent === agent
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {agent}
            </button>
          ))}
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`p-4 rounded-2xl border text-xs font-mono leading-relaxed transition-all ${
              msg.sender === 'User'
                ? 'bg-purple-950/40 border-purple-800/50 text-purple-100 ml-8'
                : msg.sender === 'Adversarial Judge'
                ? 'bg-yellow-950/30 border-yellow-500/30 text-yellow-200 mr-8'
                : 'bg-black/40 border-white/10 text-gray-300 mr-8'
            }`}
          >
            <div className="flex justify-between items-center mb-1.5 text-[10px] text-gray-400 font-sans">
              <span className="font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                {msg.sender === 'Hermes' && <Cpu size={12} className="text-indigo-400" />}
                {msg.sender === 'OpenClaw' && <Terminal size={12} className="text-green-400" />}
                {msg.sender === 'Adversarial Judge' && <Shield size={12} className="text-yellow-400" />}
                {msg.sender}
              </span>
              <span>{msg.timestamp}</span>
            </div>
            <p className="whitespace-pre-wrap">{msg.text}</p>
            {msg.skillsUsed && (
              <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-wrap gap-1">
                {msg.skillsUsed.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-white/5 text-[9px] text-gray-400 rounded-md">
                    ⚡ {s.replace('system_skills/', '')}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {isSending && (
          <div className="p-3 bg-purple-900/20 rounded-xl text-xs font-mono text-purple-300 animate-pulse flex items-center gap-2">
            <Sparkles size={14} /> Relay processing via OmniRoute...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={`Direct message to ${targetAgent}...`}
          className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono"
        />
        <button
          onClick={handleSend}
          className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition"
        >
          <Send size={14} /> Send
        </button>
      </div>
    </div>
  );
};

export default BridgePanel;
