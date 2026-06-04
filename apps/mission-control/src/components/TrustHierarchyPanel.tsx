import React from 'react';

const ROWS = [
  { rank: '#1', label: 'OPUS', sub: 'conductor · dispatch · review', accent: 'text-accentCyan' },
  { rank: '#2', label: 'CODEX', sub: 'repo surgery · qwen3-coder:480b', accent: 'text-accentCyan' },
  { rank: '—', label: 'OPENCLAW · OPENCODE · DROID · PI', sub: 'situational', accent: 'text-gray-400' },
];

export const TrustHierarchyPanel: React.FC = () => (
  <div className="bg-panel rounded border border-border p-4 mb-4">
    <h2 className="text-sm font-mono uppercase tracking-wider text-white mb-3">Trust Hierarchy</h2>
    <div className="space-y-2">
      {ROWS.map(r => (
        <div key={r.label} className="flex items-baseline gap-3">
          <span className={`font-mono text-sm ${r.accent}`}>{r.rank}</span>
          <div className="flex-1">
            <div className="font-mono text-sm text-gray-100">{r.label}</div>
            <div className="text-[10px] font-mono text-gray-500">{r.sub}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
