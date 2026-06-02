import React, { useEffect, useState } from "react";
import axios from "axios";
import { Copy, Terminal as TerminalIcon } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * LaunchPanel — 6-agent dispatcher. Reads from /api/agents.
 * Users copy commands or (in Electron) trigger the terminal. In the web build,
 * TerminalIcon is replaced with a "dispatch" action that fires an
 * `opuspawclaw-task` custom event.
 */
export function LaunchPanel() {
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${API}/agents`, { timeout: 4000 })
      .then((r) => { if (!cancelled) setAgents(r.data.agents || []); })
      .catch(() => { if (!cancelled) setAgents([]); });
    return () => { cancelled = true; };
  }, []);

  const copy = (cmd) => navigator.clipboard?.writeText(cmd);
  const dispatch = (cmd) =>
    window.dispatchEvent(new CustomEvent("opuspawclaw-task", { detail: { task: cmd } }));

  return (
    <div data-testid="launch-panel" className="flex flex-col h-full bg-[#111827] text-[#e8f0ff] overflow-y-auto custom-scrollbar p-4 border border-[#2a3a52] rounded-md">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Launch</h2>
        <p className="text-[10px] text-[#6b82a6] bg-[#2a3a52]/30 px-2 py-1 rounded inline-block">
          Copy a command and run it in your terminal.
        </p>
      </div>

      <div className="space-y-4">
        {agents.length === 0 && (
          <div className="text-[10px] text-[#4a5568] italic">endpoint unreachable — retry</div>
        )}
        {agents.map((agent) => (
          <div key={agent.name} className="flex gap-3">
            <div
              className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-lg shadow-md"
              style={{
                backgroundColor: `${agent.color}20`,
                color: agent.color,
                border: `1px solid ${agent.color}40`,
              }}
            >
              {agent.name.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="mb-1">
                <span
                  className="text-xs font-bold text-white tracking-wide"
                  style={{ textShadow: `0 0 5px ${agent.color}40` }}
                >
                  {agent.name}
                </span>
                <p className="text-[10px] text-[#8ba3c7] mt-0.5 truncate">{agent.description}</p>
              </div>

              <div className="flex items-center mt-1.5 bg-[#0a0f1a] border border-[#2a3a52] rounded-md overflow-hidden hover:border-[#4a5568] transition-colors group">
                <code className="mono text-[10px] text-[#00d4ff] px-2 py-1.5 flex-1 whitespace-nowrap overflow-x-auto custom-scrollbar">
                  {agent.command}
                </code>
                <button
                  data-testid={`launch-dispatch-${agent.name.toLowerCase()}`}
                  onClick={() => dispatch(agent.command)}
                  className="p-1.5 text-[#6b82a6] hover:text-[#00e676] hover:bg-[#1a2332] transition-colors shrink-0 border-l border-[#2a3a52]"
                  title="Dispatch as global task"
                >
                  <TerminalIcon size={12} />
                </button>
                <button
                  data-testid={`launch-copy-${agent.name.toLowerCase()}`}
                  onClick={() => copy(agent.command)}
                  className="p-1.5 text-[#6b82a6] hover:text-white hover:bg-[#1a2332] transition-colors shrink-0 border-l border-[#2a3a52]"
                  title="Copy to clipboard"
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-[9px] text-[#4a5568] uppercase tracking-widest text-center italic">
        Powered by Ollama Local Runtime
      </div>
    </div>
  );
}
