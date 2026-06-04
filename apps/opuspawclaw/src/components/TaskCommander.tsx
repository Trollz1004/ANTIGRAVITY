import React, { useState } from 'react';
import { Sparkles, Send } from 'lucide-react';

export function TaskCommander() {
  const [task, setTask] = useState('');

  const handleDispatch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!task.trim()) return;
    const event = new CustomEvent('opuspawclaw-task', { detail: { task } });
    window.dispatchEvent(event);
    setTask('');
  };

  return (
    <div className="h-20 bg-[#0a0f1a]/90 backdrop-blur-xl border-b border-[#2a3a52] flex items-center px-8 relative overflow-hidden">
      {/* Gemini Elite Styling Glare/Gradient */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent opacity-60" />
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-20 bg-[#00d4ff] opacity-10 blur-[50px] pointer-events-none" />
      
      <form onSubmit={handleDispatch} className="flex-1 relative group max-w-5xl mx-auto">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00d4ff] via-[#b200ff] to-[#00d4ff] rounded-2xl opacity-0 group-hover:opacity-20 group-focus-within:opacity-30 transition-all blur shadow-2xl" />
        <div className="relative flex items-center">
          <input 
            type="text" 
            value={task}
            onChange={e => setTask(e.target.value)}
            placeholder="Assign a global task to orchestrate across all active agents..." 
            className="w-full bg-[#111827]/80 backdrop-blur-sm border border-[#2a3a52] rounded-xl py-3 pl-4 pr-14 text-sm text-[#e8f0ff] focus:outline-none focus:border-[#00d4ff]/50 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)] placeholder:text-[#4a5568]"
          />
          <button 
            type="submit" 
            disabled={!task.trim()} 
            className="absolute right-2 p-1.5 text-[#00d4ff] hover:bg-[#2a3a52]/80 disabled:opacity-30 rounded-lg transition-all"
          >
            <Sparkles size={18} className={task.trim() ? "animate-pulse" : ""} />
          </button>
        </div>
      </form>
    </div>
  );
}
