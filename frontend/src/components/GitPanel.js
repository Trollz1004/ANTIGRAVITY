import React, { useEffect, useState } from "react";
import axios from "axios";
import { GitBranch, RefreshCw, FileText, GitCommit } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function GitPanel() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/git/status`, { timeout: 4000 });
      setState(r.data);
    } catch {
      setState(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const iv = setInterval(() => { if (!document.hidden) refresh(); }, 20_000);
    return () => clearInterval(iv);
  }, []);

  if (!state) {
    return (
      <div data-testid="git-panel" className="p-4 text-[#6b82a6] text-xs flex flex-col items-center gap-2 bg-[#111827] border border-[#2a3a52] rounded-md">
        <RefreshCw className="animate-spin" size={16} />
        Scanning repository…
      </div>
    );
  }

  const changed = [
    ...state.modified.map((f) => ({ name: f, status: "modified" })),
    ...state.not_added.map((f) => ({ name: f, status: "new" })),
    ...state.deleted.map((f) => ({ name: f, status: "deleted" })),
  ];

  return (
    <div data-testid="git-panel" className="flex flex-col bg-[#111827] border border-[#2a3a52] rounded-md">
      <div className="px-3 py-2 bg-[#111827] border-b border-[#2a3a52] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch size={14} className="text-[#00d4ff]" />
          <span className="mono text-xs font-bold uppercase tracking-wider text-[#00d4ff] truncate">
            {state.current}
          </span>
        </div>
        <button
          data-testid="git-refresh"
          onClick={refresh}
          className="p-1 hover:bg-[#1a2332] rounded text-[#6b82a6] hover:text-[#00d4ff] transition-colors"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="p-3 space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">
              Changes ({changed.length})
            </span>
          </div>
          <div className="space-y-1">
            {changed.map((f) => (
              <div key={`${f.status}-${f.name}`} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#1a2332] rounded text-xs transition-colors border border-transparent hover:border-[#2a3a52]">
                <FileText size={12} className={
                  f.status === "new" ? "text-[#00e676]" :
                  f.status === "deleted" ? "text-red-400" : "text-yellow-400"
                } />
                <span className="flex-1 truncate text-[#6b82a6]">{f.name}</span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-[#4a5568]">
                  {f.status[0]}
                </span>
              </div>
            ))}
            {changed.length === 0 && (
              <div className="px-2 py-4 text-[10px] text-[#4a5568] text-center italic">Workspace clean</div>
            )}
          </div>
        </div>

        {state.last_commit && (
          <div className="border-t border-[#2a3a52] pt-3">
            <div className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <GitCommit size={10} /> Last Commit
            </div>
            <div className="mono text-[10px] text-[#e8f0ff] break-words">{state.last_commit}</div>
          </div>
        )}

        <div className="border-t border-[#2a3a52] pt-3">
          <div className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">
            Branches ({state.branches.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {state.branches.map((b) => (
              <span
                key={b}
                className={`mono text-[9px] px-1.5 py-0.5 rounded border ${
                  b === state.current
                    ? "bg-[#00d4ff]/10 border-[#00d4ff]/40 text-[#00d4ff]"
                    : "bg-[#1a2332] border-[#2a3a52] text-[#6b82a6]"
                }`}
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
