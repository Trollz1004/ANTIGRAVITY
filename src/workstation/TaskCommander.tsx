import React, { useState } from 'react';
import {
  Send,
  GitCompare,
  History,
  Terminal,
  Columns2,
  Sparkles,
  Zap,
} from 'lucide-react';

interface TaskCommanderProps {
  onBroadcast: (task: string, target: 'both' | 'alpha' | 'beta') => void;
  onOpenCompare: () => void;
  isStreaming: boolean;
}

export const TaskCommander: React.FC<TaskCommanderProps> = ({
  onBroadcast,
  onOpenCompare,
  isStreaming,
}) => {
  const [taskInput, setTaskInput] = useState(
    'Create an enterprise Stripe webhook receiver in TypeScript with signature validation and Jules compliance check'
  );
  const [target, setTarget] = useState<'both' | 'alpha' | 'beta'>('both');
  const [history, setHistory] = useState<string[]>([
    'Create an enterprise Stripe webhook receiver in TypeScript with signature validation and Jules compliance check',
    'Build a high-performance LRU cache in TypeScript with zero dependencies',
    'Write a secure OAuth PKCE token exchange handler for Cloudflare Workers',
  ]);
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!taskInput.trim() || isStreaming) return;

    if (!history.includes(taskInput)) {
      setHistory([taskInput, ...history.slice(0, 7)]);
    }
    onBroadcast(taskInput, target);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="relative border-b border-[#1e293b] bg-[#0c1424] px-4 py-2.5 z-10">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2.5">
        {/* Prompt label */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#00d4ff] shrink-0">
          <Terminal className="h-4 w-4" />
          <span className="font-mono">COMMANDER&gt;</span>
        </div>

        {/* Input box */}
        <div className="relative w-full flex-1">
          <input
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="Assign task to both agents (Ctrl+Enter to broadcast)..."
            className="w-full rounded-xl border border-[#2a3a52] bg-[#111827] px-3.5 py-2 text-xs sm:text-sm font-mono text-white placeholder-[#475569] focus:border-[#00d4ff] focus:outline-none"
          />

          {/* Quick history toggle */}
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            title="Task History"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white transition-colors"
          >
            <History className="h-4 w-4" />
          </button>
        </div>

        {/* Target selector pills */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setTarget('both')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              target === 'both'
                ? 'bg-gradient-to-r from-[#00d4ff] to-[#e040fb] text-slate-950 shadow-sm'
                : 'bg-[#1e293b] text-[#8ba3c7] hover:text-white'
            }`}
          >
            Dual Broadcast
          </button>

          <button
            type="button"
            onClick={() => setTarget('alpha')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              target === 'alpha'
                ? 'bg-[#d97706] text-white font-bold'
                : 'bg-[#1e293b] text-[#8ba3c7] hover:text-white'
            }`}
          >
            Alpha
          </button>

          <button
            type="button"
            onClick={() => setTarget('beta')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              target === 'beta'
                ? 'bg-[#00d4ff] text-slate-950 font-bold'
                : 'bg-[#1e293b] text-[#8ba3c7] hover:text-white'
            }`}
          >
            Beta
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="submit"
            disabled={isStreaming}
            className="flex items-center gap-1.5 rounded-xl bg-[#00d4ff] px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-[#00d4ff]/20"
          >
            <Zap className="h-3.5 w-3.5 fill-slate-950" />
            <span>{isStreaming ? 'Synthesizing...' : 'Execute'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenCompare}
            title="Diff Alpha vs Beta outputs"
            className="flex items-center gap-1.5 rounded-xl border border-[#2a3a52] bg-[#111827] px-3 py-2 text-xs font-medium text-[#8ba3c7] hover:border-[#e040fb] hover:text-white transition-colors"
          >
            <GitCompare className="h-3.5 w-3.5 text-[#e040fb]" />
            <span className="hidden sm:inline">Compare Diff</span>
          </button>
        </div>
      </form>

      {/* History dropdown */}
      {showHistory && (
        <div className="absolute left-16 right-16 top-full mt-1 z-30 rounded-xl border border-[#2a3a52] bg-[#0f172a] p-2 shadow-2xl">
          <div className="flex items-center justify-between pb-1.5 px-2 border-b border-[#1e293b] text-[10px] font-mono uppercase text-[#64748b]">
            <span>Recent Task Broadcasts</span>
            <button
              onClick={() => setShowHistory(false)}
              className="text-[#94a3b8] hover:text-white"
            >
              Close
            </button>
          </div>
          <div className="mt-1 space-y-1">
            {history.map((h, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setTaskInput(h);
                  setShowHistory(false);
                }}
                className="w-full text-left rounded-lg p-2 text-xs font-mono text-[#cbd5e1] hover:bg-[#1a2332] hover:text-[#00d4ff] transition-colors truncate"
              >
                &bull; {h}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
