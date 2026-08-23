import React, { useState } from 'react';
import type { AgentDef, CategoryDef } from '../types';

interface Props {
  agents: AgentDef[];
  categories: CategoryDef[];
  selected: Set<string>;
  onDeploy: (agentId: string) => void;
}

const DEFAULT_AGENTS: AgentDef[] = [
  { id: 'gemini-architect', name: 'Google Gemini 2.5 Pro', category: 'orchestration', description: 'Visual intelligence, code scaffolding, multimodal analysis.', harness: 'Direct Google GenAI SDK', platformId: 'gemini' },
  { id: 'claude-architect', name: 'Claude Sonnet 3.5', category: 'architecture', description: 'Primary code architecture, high-precision refactoring.', harness: 'Direct Claude Client', platformId: 'claude' },
  { id: 'grok-adversary', name: 'Grok 3', category: 'verification', description: 'Adversarial verification, stress testing, edge-case analysis.', harness: 'Grok xAI Engine', platformId: 'grok' },
  { id: 'perplexity-intel', name: 'Perplexity Sonar Pro', category: 'research', description: 'Deep real-time research, competitive analysis, live facts.', harness: 'Sonar Pro Client', platformId: 'perplexity' },
  { id: 'codex-executor', name: 'CodeX Executor', category: 'execution', description: 'Repo build gatekeeper, quality gates, and automated test enforcement.', harness: 'Codex MCP Suite', platformId: 'codex' },
  { id: 'manus-orchestrator', name: 'Manus Continuity', category: 'orchestration', description: 'Context preservation, multi-node sync, memory coordinator.', harness: 'Manus Flow', platformId: 'manus' }
];

const DEFAULT_CATEGORIES: CategoryDef[] = [
  { id: 'all', label: 'ALL AGENTS' },
  { id: 'orchestration', label: 'ORCHESTRATION' },
  { id: 'architecture', label: 'ARCHITECTURE' },
  { id: 'verification', label: 'VERIFICATION' },
  { id: 'research', label: 'RESEARCH' },
  { id: 'execution', label: 'EXECUTION' }
];

export default function AgentLibrary({ agents = [], categories = [], selected, onDeploy }: Props) {
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');

  const displayAgents = agents.length > 0 ? agents : DEFAULT_AGENTS;
  const displayCats = categories.length > 0 ? [{ id: 'all', label: 'ALL AGENTS' }, ...categories] : DEFAULT_CATEGORIES;

  const filtered = displayAgents.filter((a) => {
    const matchCat = selectedCat === 'all' || a.category === selectedCat;
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="agent-library p-6">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-800">
        <div>
          <span className="label">148 SPECIALIZED AGENTS</span>
          <h2 className="text-xl font-black uppercase tracking-wider text-white">Agent Library</h2>
        </div>
        <input
          type="text"
          placeholder="Filter agents by skill or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-xs"
        />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {displayCats.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-colors ${
              selectedCat === cat.id ? 'bg-cyan-500 text-black border-cyan-400 font-bold' : 'border-neutral-800 text-neutral-400 hover:border-neutral-600'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((agent) => {
          const isSelected = selected.has(agent.id);
          return (
            <div
              key={agent.id}
              className={`p-4 border transition-all ${
                isSelected ? 'border-cyan-400 bg-cyan-950/20' : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-sm text-white">{agent.name}</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">{agent.category}</span>
                </div>
                <button
                  onClick={() => onDeploy(agent.id)}
                  className={`px-2.5 py-1 text-xs font-mono uppercase tracking-wider border ${
                    isSelected ? 'bg-cyan-500 text-black border-cyan-400' : 'border-neutral-700 text-neutral-300 hover:border-cyan-400'
                  }`}
                >
                  {isSelected ? 'SELECTED' : 'SELECT'}
                </button>
              </div>
              <p className="text-xs text-neutral-400 mb-3">{agent.description}</p>
              {agent.harness && (
                <div className="text-[10px] font-mono text-neutral-500 border-t border-neutral-800/80 pt-2">
                  HARNESS: {agent.harness}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
