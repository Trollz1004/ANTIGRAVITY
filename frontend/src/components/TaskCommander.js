import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

export function TaskCommander() {
  const [task, setTask] = useState('');

  const dispatch = (e) => {
    e?.preventDefault();
    if (!task.trim()) return;
    // Fan out: TasksMode listens for this and opens the Dispatch dialog with prefill.
    window.dispatchEvent(new CustomEvent('opuspawclaw-task', { detail: { task } }));
    // Also bubble a request to switch to tasks mode if a parent wired it up.
    window.dispatchEvent(new CustomEvent('opuspawclaw-mode', { detail: { mode: 'tasks' } }));
    setTask('');
  };

  return (
    <div
      data-testid="task-commander"
      className="h-20 bg-[#0a0f1a]/90 backdrop-blur-xl border-b border-[#2a3a52] flex items-center px-8 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent opacity-60" />
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-20 bg-[#00d4ff] opacity-10 blur-[50px] pointer-events-none" />

      <form onSubmit={dispatch} className="flex-1 relative group max-w-5xl mx-auto">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00d4ff] via-[#e040fb] to-[#00d4ff] rounded-2xl opacity-0 group-hover:opacity-20 group-focus-within:opacity-30 transition-all blur" />
        <div className="relative flex items-center">
          <input
            data-testid="task-input"
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Type a task brief — dispatches to selected agents and creates a tracked task…"
            className="w-full bg-[#111827]/80 backdrop-blur-sm border border-[#2a3a52] rounded-xl py-3 pl-4 pr-14 text-sm text-[#e8f0ff] focus:outline-none focus:border-[#00d4ff]/50 transition-colors placeholder:text-[#4a5568]"
          />
          <button
            data-testid="task-send"
            type="submit"
            disabled={!task.trim()}
            className="absolute right-2 p-1.5 text-[#00d4ff] hover:bg-[#2a3a52]/80 disabled:opacity-30 rounded-lg transition-all"
          >
            <Sparkles size={18} className={task.trim() ? 'animate-pulse' : ''} />
          </button>
        </div>
      </form>
    </div>
  );
}
