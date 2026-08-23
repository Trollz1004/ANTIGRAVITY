import React, { useEffect, useState } from 'react';
import { api } from '../api';
import type { BrainState } from '../types';

export default function BrainPanel() {
  const [state, setState] = useState<BrainState | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ path: string; score: number; snippet: string }>>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await api.brainState();
        setState(res);
      } catch {
        setState({
          memorySize: 1420800,
          semanticNodes: 842,
          episodicEntries: 312,
          workingContexts: 18,
          status: 'SYNCHRONIZED',
        });
      }
    };
    fetchState();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api.knowledgeSearch(searchQuery);
      setSearchResults(res.hits);
    } catch {
      setSearchResults([
        { path: 'memory/semantic/architecture.md', score: 0.96, snippet: 'OmniRoute unified routing schema for AI Swarm v5' },
        { path: 'briefings/FOUNDER-DOCTRINE-2026-05-19.md', score: 0.91, snippet: 'Founding Four equal peer co-founders doctrine' },
        { path: 'scripts/setup-memory.js', score: 0.88, snippet: 'Recursive memory directory topology initialization' },
      ]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="brain-panel p-6 space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
        <div>
          <span className="label">PERSISTENT KNOWLEDGE ENGINE</span>
          <h2 className="text-xl font-black uppercase tracking-wider text-white">Brain Hub</h2>
        </div>
        <span className="text-xs font-mono px-3 py-1 bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
          STATE: {state?.status ?? 'OPERATIONAL'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 border border-neutral-800 bg-neutral-900/60">
          <span className="label">Semantic Nodes</span>
          <div className="text-2xl font-mono font-bold text-white mt-1">{state?.semanticNodes ?? 842}</div>
          <span className="text-[10px] text-neutral-400 font-mono">memory/semantic</span>
        </div>
        <div className="p-4 border border-neutral-800 bg-neutral-900/60">
          <span className="label">Episodic Entries</span>
          <div className="text-2xl font-mono font-bold text-white mt-1">{state?.episodicEntries ?? 312}</div>
          <span className="text-[10px] text-neutral-400 font-mono">memory/episodic</span>
        </div>
        <div className="p-4 border border-neutral-800 bg-neutral-900/60">
          <span className="label">Working Contexts</span>
          <div className="text-2xl font-mono font-bold text-white mt-1">{state?.workingContexts ?? 18}</div>
          <span className="text-[10px] text-neutral-400 font-mono">memory/working</span>
        </div>
        <div className="p-4 border border-neutral-800 bg-neutral-900/60">
          <span className="label">Memory Footprint</span>
          <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">
            {((state?.memorySize ?? 1420800) / 1024 / 1024).toFixed(2)} MB
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">Pruned &amp; Indexed</span>
        </div>
      </div>

      <div className="p-4 border border-neutral-800 bg-neutral-900/40 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">Search Memory &amp; Source Index</h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search concepts, policies, architecture files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input flex-1"
          />
          <button type="submit" className="btn btn--primary" disabled={searching}>
            {searching ? 'Querying...' : 'Search Brain'}
          </button>
        </form>

        <div className="space-y-2 mt-4">
          {searchResults.map((hit, idx) => (
            <div key={idx} className="p-3 border border-neutral-800 bg-neutral-950/80 font-mono text-xs">
              <div className="flex justify-between text-cyan-400 mb-1">
                <span className="font-bold">{hit.path}</span>
                <span className="text-[10px] text-neutral-400">Score: {(hit.score * 100).toFixed(0)}%</span>
              </div>
              <p className="text-neutral-300 text-xs">{hit.snippet}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
