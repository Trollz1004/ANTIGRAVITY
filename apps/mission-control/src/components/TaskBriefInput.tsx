import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { apiPost } from '../lib/api';

export const TaskBriefInput: React.FC = () => {
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!brief.trim()) return;
    setLoading(true);
    await apiPost('/tasks/dispatch', { brief: brief.trim(), agents: [] });
    setLoading(false);
    setBrief('');
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="bg-panel rounded border border-border p-2 mb-4 flex items-center gap-2">
      <input
        type="text"
        value={brief}
        onChange={e => setBrief(e.target.value)}
        onKeyDown={onKey}
        placeholder="Type a task brief — dispatches to selected agents and creates a tracked task…"
        className="flex-1 bg-transparent border-none outline-none text-sm font-sans text-gray-200 placeholder-gray-500"
      />
      <button
        onClick={submit}
        disabled={!brief.trim() || loading}
        className="p-2 rounded bg-accentCyan/20 border border-accentCyan/50 text-accentCyan disabled:opacity-30 hover:bg-accentCyan/30 transition"
      >
        <Send size={14} />
      </button>
    </div>
  );
};
