import React from 'react';
import { Copy, Terminal as TerminalIcon } from 'lucide-react';

interface AgentConfig {
  name: string;
  description: string;
  command: string;
  color: string;
}

const agents: AgentConfig[] = [
  {
    name: 'OpenClaw',
    description: 'Personal AI with 100+ skills',
    command: 'ollama run openclaw',
    color: '#00d4ff', // Cyan
  },
  {
    name: 'Claude',
    description: "Anthropic's coding tool with subagents",
    command: 'ollama run claude',
    color: '#b200ff', // Purple
  },
  {
    name: 'Codex',
    description: "OpenAI's open-source coding agent",
    command: 'ollama run codex',
    color: '#00e676', // Green
  },
  {
    name: 'OpenCode',
    description: "Anomaly's open-source coding agent",
    command: 'ollama run opencode',
    color: '#3b82f6', // Blue
  },
  {
    name: 'Droid',
    description: "Factory's coding agent across terminal and IDEs",
    command: 'ollama run droid',
    color: '#f59e0b', // Amber
  },
  {
    name: 'Pi',
    description: 'Minimal AI agent toolkit with plugin support',
    command: 'ollama run pi',
    color: '#ec4899', // Pink
  }
];

export function LaunchPanel({ onExecute }: { onExecute?: (cmd: string) => void }) {
  const handleCopy = (command: string) => {
    navigator.clipboard.writeText(command);
  };

  return (
    <div className="flex flex-col h-full bg-[#111827] text-[#e8f0ff] overflow-y-auto custom-scrollbar p-4">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Launch</h2>
        <p className="text-[10px] text-[#6b82a6] bg-[#2a3a52]/30 px-2 py-1 rounded inline-block">Copy a command and run it in your terminal.</p>
      </div>

      <div className="space-y-4">
        {agents.map((agent, index) => (
          <div key={index} className="flex gap-3">
            {/* Agent Icon Placeholder */}
            <div 
              className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-lg opacity-90 shadow-md"
              style={{ backgroundColor: `${agent.color}20`, color: agent.color, border: `1px solid ${agent.color}40` }}
            >
              {agent.name.charAt(0)}
            </div>
            
            <div className="flex-1">
              <div className="mb-1">
                <span className="text-xs font-bold text-white tracking-wide" style={{ textShadow: `0 0 5px ${agent.color}40` }}>{agent.name}</span>
                <p className="text-[10px] text-[#8ba3c7] mt-0.5">{agent.description}</p>
              </div>
              
              <div className="flex items-center mt-1.5 bg-[#0a0f1a] border border-[#2a3a52] rounded-md overflow-hidden hover:border-[#4a5568] transition-colors group">
                <code className="text-[10px] font-mono text-[#00d4ff] px-2 py-1.5 flex-1 whitespace-nowrap overflow-x-auto custom-scrollbar">
                  {agent.command}
                </code>
                {onExecute && (
                  <button 
                    onClick={() => onExecute(agent.command + '\r')}
                    className="p-1.5 text-[#6b82a6] hover:text-[#00e676] hover:bg-[#1a2332] transition-colors shrink-0 border-l border-[#2a3a52]"
                    title="Run in Terminal"
                  >
                    <TerminalIcon size={12} />
                  </button>
                )}
                <button 
                  onClick={() => handleCopy(agent.command)}
                  className="p-1.5 text-[#6b82a6] hover:text-white hover:bg-[#1a2332] transition-colors shrink-0 border-l border-[#2a3a52]"
                  title="Copy to Clipboard"
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-[9px] text-[#4a5568] uppercase tracking-widest text-center italic">
        Powered by Ollama Local Runtime
      </div>
    </div>
  );
}
