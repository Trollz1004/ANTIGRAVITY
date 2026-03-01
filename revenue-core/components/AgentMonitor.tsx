import React, { useState } from 'react';
import {
  Play,
  Pause,
  Network,
  Activity,
  Brain,
  Cpu,
  Search,
  Zap,
  Globe,
  BookOpen,
} from 'lucide-react';
import { Agent } from '../types';

interface AgentMonitorProps {
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
}

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  Anthropic: <Brain size={20} className="text-red-400" />,
  Google: <Search size={20} className="text-blue-400" />,
  Perplexity: <Globe size={20} className="text-purple-400" />,
};

const AgentMonitor: React.FC<AgentMonitorProps> = ({ agents, setAgents }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  const toggleAgentStatus = (id: string) => {
    setAgents(prev => prev.map(a =>
      a.id === id ? { ...a, status: a.status === 'Paused' ? 'Active' : a.status === 'Active' ? 'Paused' : a.status } : a
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]';
      case 'Standby': return 'bg-amber-400';
      case 'Paused': return 'bg-slate-500';
      case 'Error': return 'bg-rose-500 animate-pulse';
      default: return 'bg-slate-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Standby': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Paused': return 'bg-slate-700 text-slate-400 border-slate-600';
      case 'Error': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-700 text-slate-400 border-slate-600';
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="bg-surface p-6 rounded-xl border border-slate-700">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Network className="text-primary" /> AI Formation Control
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {agents.length} agents deployed. {agents.filter(a => a.status === 'Active').length} active, {agents.filter(a => a.status === 'Standby').length} on standby.
        </p>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* Agent Cards */}
        <div className="flex-1 grid grid-cols-1 gap-4 content-start overflow-auto">
          {agents.map(agent => (
            <div
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className={`p-6 rounded-xl border transition-all cursor-pointer ${
                selectedAgentId === agent.id
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/50'
                  : 'border-slate-700 bg-surface hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                    {PROVIDER_ICONS[agent.provider || ''] || <Cpu size={20} className="text-slate-400" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{agent.name}</h3>
                    <p className="text-sm text-slate-400">{agent.role} — {agent.provider}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(agent.status)}`} />
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${getStatusBadge(agent.status)}`}>
                    {agent.status}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Model</div>
                  <div className="text-xs font-mono text-white">{agent.model || '—'}</div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Node</div>
                  <div className="text-xs font-mono text-white">{agent.node || '—'}</div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Health</div>
                  <div className={`text-xs font-mono ${agent.health >= 80 ? 'text-emerald-400' : agent.health >= 50 ? 'text-yellow-400' : 'text-rose-400'}`}>
                    {agent.health}%
                  </div>
                </div>
              </div>

              <div className="mt-3 p-3 bg-slate-900/30 rounded-lg border border-slate-800/50">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Current Task</div>
                <div className="text-xs text-slate-300">{agent.task}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Inspector Panel */}
        <div className="w-80 bg-surface rounded-xl border border-slate-700 flex flex-col">
          {selectedAgent ? (
            <div className="flex-1 flex flex-col">
              <div className="p-6 border-b border-slate-700 bg-slate-900/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-4 bg-primary/10 text-primary rounded-2xl">
                    {PROVIDER_ICONS[selectedAgent.provider || ''] || <Cpu size={32} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedAgent.name}</h3>
                    <p className="text-slate-400 text-sm">{selectedAgent.role}</p>
                  </div>
                </div>

                {(selectedAgent.status === 'Active' || selectedAgent.status === 'Paused') && (
                  <button
                    onClick={() => toggleAgentStatus(selectedAgent.id)}
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all ${
                      selectedAgent.status === 'Paused'
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                  >
                    {selectedAgent.status === 'Paused' ? <Play size={16} /> : <Pause size={16} />}
                    {selectedAgent.status === 'Paused' ? 'Resume' : 'Pause'}
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Details */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Provider</span>
                    <span className="text-white font-medium">{selectedAgent.provider}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Model</span>
                    <span className="text-white font-mono text-xs">{selectedAgent.model}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Node</span>
                    <span className="text-white">{selectedAgent.node}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Health</span>
                    <span className={`font-bold ${selectedAgent.health >= 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                      {selectedAgent.health}%
                    </span>
                  </div>
                </div>

                {/* Health Bar */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={14} className="text-slate-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase">Health</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${selectedAgent.health >= 80 ? 'bg-emerald-400' : selectedAgent.health >= 50 ? 'bg-yellow-400' : 'bg-rose-500'}`}
                      style={{ width: `${selectedAgent.health}%` }}
                    />
                  </div>
                </div>

                {/* Capabilities */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={14} className="text-slate-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase">Capabilities</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.id === 'opus-4.6' && ['Code', 'Strategy', 'CLI', 'Git', 'Deploy', 'Stripe'].map(c => (
                      <span key={c} className="text-[10px] bg-red-500/10 text-red-300 border border-red-500/20 px-2 py-1 rounded">{c}</span>
                    ))}
                    {selectedAgent.id === 'gemini-3.1' && ['React', 'Search', 'Admin', 'UI/UX', 'Research'].map(c => (
                      <span key={c} className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-1 rounded">{c}</span>
                    ))}
                    {selectedAgent.id === 'comet-perplexity' && ['Web Search', 'Briefs', 'Audit', 'DNS', 'Context'].map(c => (
                      <span key={c} className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-1 rounded">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Network size={32} />
              </div>
              <h3 className="font-bold text-slate-300">Agent Inspector</h3>
              <p className="text-sm mt-2">Select an agent to view details and controls.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentMonitor;
