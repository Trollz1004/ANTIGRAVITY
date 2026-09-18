import React, { useState } from 'react';
import { Terminal, X, Play, Trash2, CheckCircle2 } from 'lucide-react';

interface TerminalPanelProps {
  logs: string[];
  onClear: () => void;
  onClose: () => void;
  onRunCommand: (cmd: string) => void;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  logs,
  onClear,
  onClose,
  onRunCommand,
}) => {
  const [cmdInput, setCmdInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput.trim()) return;
    onRunCommand(cmdInput.trim());
    setCmdInput('');
  };

  return (
    <div className="h-48 border-t border-[#1e293b] bg-[#050811] flex flex-col font-mono text-xs z-20">
      {/* Terminal Title Bar */}
      <div className="flex h-8 items-center justify-between border-b border-[#1e293b] bg-[#0c1424] px-3">
        <div className="flex items-center gap-2 text-[#00e676]">
          <Terminal className="h-3.5 w-3.5" />
          <span className="font-semibold text-white text-[11px]">
            Integrated PTY Terminal (xterm.js) — bash / zsh
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="p-1 text-[#64748b] hover:text-white transition-colors"
            title="Clear logs"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-[#64748b] hover:text-white transition-colors"
            title="Minimize terminal"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Output Screen */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1 text-[#94a3b8]">
        {logs.map((log, idx) => (
          <div key={idx} className="leading-relaxed">
            {log.startsWith('>') ? (
              <span className="text-[#00d4ff] font-bold">{log}</span>
            ) : log.includes('SUCCESS') || log.includes('PASSED') ? (
              <span className="text-[#00e676]">{log}</span>
            ) : log.includes('ERROR') || log.includes('FAILED') ? (
              <span className="text-[#ef4444]">{log}</span>
            ) : log.includes('JULES') ? (
              <span className="text-[#ffb300]">{log}</span>
            ) : (
              <span>{log}</span>
            )}
          </div>
        ))}
      </div>

      {/* Terminal Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-[#1e293b] bg-[#080d19] px-3 py-1.5 flex items-center gap-2"
      >
        <span className="text-[#00e676] font-bold">opus@t5500:~$</span>
        <input
          type="text"
          value={cmdInput}
          onChange={(e) => setCmdInput(e.target.value)}
          placeholder="Try: npm test, git status, ollama list, or jules-scan"
          className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder-[#475569]"
        />
        <button
          type="submit"
          className="text-xs text-[#00d4ff] hover:underline font-semibold"
        >
          Execute
        </button>
      </form>
    </div>
  );
};
