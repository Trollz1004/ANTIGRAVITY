import React, { useState } from 'react';
import { ListChecks, Send } from 'lucide-react';

// Stub for Genspark submission tracker seeded into mission-mcp (T-012 / 6fe897f3-bc1d-4756-a568-da5142b0349b).
// Storage via MCP (pieces create_pieces_memory as mission-mcp). Full impl would use mcpCall for list/search/submit.
// See briefings/genspark-submission-tracker-T012.md + genspark-submissions-seed.json
// mission-mcp seeded 2026-07-01 Grok heartbeat.

type GensparkEntry = {
  id: string;
  title: string;
  query: string;
  status: 'submitted' | 'indexed' | 'reviewed' | 'failed';
  submitted_at: string;
  notes?: string;
};

const SEED_ENTRIES: GensparkEntry[] = [
  {
    id: 'gs-001',
    title: 'YouAndINotAI verification best practices',
    query: 'human verified dating app bot shield',
    status: 'submitted',
    submitted_at: '2026-07-01T00:00:00Z',
    notes: 'Seed for content calendar',
  },
  {
    id: 'gs-002',
    title: 'Mission control patterns',
    query: 'paperclip mission mcp agents',
    status: 'submitted',
    submitted_at: '2026-07-01T00:00:00Z',
    notes: 'For agent orchestration',
  },
  {
    id: 'gs-003',
    title: 'Product Hunt launch assets',
    query: 'youandinotai product hunt launch kit 2026',
    status: 'indexed',
    submitted_at: '2026-07-01T00:10:00Z',
    notes: 'TRO-29 related',
  },
  {
    id: 'gs-004',
    title: 'BotShield explainer content',
    query: 'how BotShield verification works dating safety',
    status: 'reviewed',
    submitted_at: '2026-07-01T00:20:00Z',
    notes: 'For X/Reddit cadence + GensparkClaw',
  },
];

export const GensparkSubmissionTracker: React.FC = () => {
  const [entries, setEntries] = useState<GensparkEntry[]>(SEED_ENTRIES);
  const [form, setForm] = useState({ title: '', query: '' });
  const [live, setLive] = useState(false); // would be true if MCP reachable

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.query) return;
    const newEntry: GensparkEntry = {
      id: 'gs-' + Date.now(),
      title: form.title,
      query: form.query,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      notes: 'Stub submit - integrate with MCP store_memory / create_task',
    };
    setEntries(prev => [newEntry, ...prev]);
    setForm({ title: '', query: '' });
    // TODO: call mcpCall('store_memory', { content: JSON.stringify(newEntry), tags: ['genspark', 'submission'] })
    // or create_task for tracking.
    setLive(true);
  };

  return (
    <div className="bg-panel rounded border border-border p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-mono uppercase tracking-wider text-white flex items-center gap-2">
          <ListChecks size={14} /> Genspark Submissions (stub)
        </h2>
        <span className="text-[10px] font-mono text-accentCyan">mission-mcp seed</span>
      </div>

      {!live && (
        <div className="text-[10px] font-mono text-amber-400/80 mb-2">MCP stub mode - submissions in memory only</div>
      )}

      <form onSubmit={handleSubmit} className="mb-3 flex gap-2">
        <input
          className="flex-1 bg-bg text-xs font-mono p-1 border border-border rounded"
          placeholder="Title / query"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />
        <button type="submit" className="text-xs font-mono px-2 border border-accentCyan hover:bg-accentCyan/10">
          <Send size={12} />
        </button>
      </form>

      {entries.length === 0 ? (
        <div className="text-xs font-mono text-gray-500">No submissions yet. Use form to stub.</div>
      ) : (
        <ul className="space-y-1 text-xs font-mono max-h-40 overflow-auto">
          {entries.map(e => (
            <li key={e.id} className="flex justify-between text-gray-300 border-b border-border/50 pb-0.5">
              <span className="truncate">{e.title} — {e.status}</span>
              <span className="text-[10px] text-gray-500">{e.submitted_at.slice(0,10)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 text-[10px] font-mono text-gray-500">
        Storage: pieces MCP (mission-mcp). UI list + form stub. Full: integrate list_tasks / search_memory. T-012 seeded.
      </div>
    </div>
  );
};
