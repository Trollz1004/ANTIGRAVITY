import React, { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TUNNEL_ID = "c7bc9665-3923-4977-acd7-2033838cd56e";
const TUNNEL_CONFIG = "C:\\ANTIGRAVITY\\infra\\cloudflare\\paperclip-hq.yml";
const CMD_DEPLOY = "cd c:\\Antigravity\\infra\\paperclip-worker && wrangler deploy";
const CMD_TAIL = "cd c:\\Antigravity\\infra\\paperclip-worker && wrangler tail";

export function PaperclipWorkerPanel() {
  const [health, setHealth] = useState({ status: "loading", data: null });
  const [copied, setCopied] = useState(null);

  const fetchHealth = async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    try {
      const r = await fetch(`${API}/paperclip/health`, { signal: ctrl.signal });
      const data = await r.json();
      setHealth({ status: r.ok ? "ok" : "down", data });
    } catch (e) {
      setHealth({ status: e.name === "AbortError" ? "timeout" : "down", data: null });
    } finally {
      clearTimeout(timer);
    }
  };

  useEffect(() => {
    fetchHealth();
    const iv = setInterval(() => { if (!document.hidden) fetchHealth(); }, 10_000);
    return () => clearInterval(iv);
  }, []);

  const copy = async (label, cmd) => {
    await navigator.clipboard?.writeText(cmd);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const dot =
    health.status === "ok"      ? "bg-[#00e676] shadow-[0_0_6px_#00e676]" :
    health.status === "timeout" ? "bg-[#ffb300] shadow-[0_0_6px_#ffb300]" :
    health.status === "loading" ? "bg-[#6b82a6]" :
                                  "bg-[#ff1744] shadow-[0_0_6px_#ff1744] animate-pulse";

  return (
    <div data-testid="paperclip-panel" className="bg-[#1a2332] border border-[#2a3a52] rounded-md">
      <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dot}`} />
          <span className="text-xs font-bold tracking-wide">PAPERCLIP WORKER</span>
          <span className="text-[8px] tracking-widest uppercase bg-[#ffb300]/10 border border-[#ffb300]/20 rounded-full px-2 py-0.5 text-[#ffb300]">
            cloudflare
          </span>
        </div>
        <button
          data-testid="paperclip-refresh"
          onClick={fetchHealth}
          className="text-[8px] tracking-widest uppercase text-[#6b82a6] hover:text-[#ffb300]"
        >
          refresh
        </button>
      </div>

      <div className="p-3 space-y-3">
        {health.data ? (
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-[#0a0f1a] border border-[#2a3a52] rounded p-2">
              <div className="text-[8px] tracking-widest uppercase text-[#6b82a6] mb-0.5">deploy</div>
              <div className="mono text-[#e8f0ff] truncate" title={health.data.deploy_time}>
                {new Date(health.data.deploy_time).toLocaleString()}
              </div>
            </div>
            <div className="bg-[#0a0f1a] border border-[#2a3a52] rounded p-2">
              <div className="text-[8px] tracking-widest uppercase text-[#6b82a6] mb-0.5">commit</div>
              <div className="mono text-[#e8f0ff] truncate">{health.data.commit}</div>
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-[#4a5568] italic">
            {health.status === "timeout" ? "TIMEOUT — retry" : "endpoint unreachable — retry"}
          </div>
        )}

        <div className="space-y-1.5">
          <button
            data-testid="paperclip-copy-deploy"
            onClick={() => copy("deploy", CMD_DEPLOY)}
            className="w-full flex items-center justify-between bg-[#0a0f1a] border border-[#2a3a52] hover:border-[#ffb300] rounded px-2.5 py-2 transition-all group"
          >
            <span className="flex items-center gap-2">
              <span className="text-[8px] tracking-widest uppercase text-[#ffb300]">copy</span>
              <code className="mono text-[10px] text-[#e8f0ff] truncate">wrangler deploy</code>
            </span>
            {copied === "deploy" ? <Check size={12} className="text-[#00e676]" /> : <Copy size={12} className="text-[#6b82a6] group-hover:text-[#ffb300]" />}
          </button>

          <button
            data-testid="paperclip-copy-tail"
            onClick={() => copy("tail", CMD_TAIL)}
            className="w-full flex items-center justify-between bg-[#0a0f1a] border border-[#2a3a52] hover:border-[#ffb300] rounded px-2.5 py-2 transition-all group"
          >
            <span className="flex items-center gap-2">
              <span className="text-[8px] tracking-widest uppercase text-[#ffb300]">copy</span>
              <code className="mono text-[10px] text-[#e8f0ff] truncate">wrangler tail</code>
            </span>
            {copied === "tail" ? <Check size={12} className="text-[#00e676]" /> : <Copy size={12} className="text-[#6b82a6] group-hover:text-[#ffb300]" />}
          </button>
        </div>

        <div className="text-[9px] mono text-[#6b82a6] space-y-0.5 border-t border-[#2a3a52] pt-2">
          <div><span className="text-[#4a5568] uppercase tracking-widest text-[8px]">tunnel</span> · {TUNNEL_ID}</div>
          <div className="truncate" title={TUNNEL_CONFIG}>
            <span className="text-[#4a5568] uppercase tracking-widest text-[8px]">config</span> · {TUNNEL_CONFIG}
          </div>
        </div>
      </div>
    </div>
  );
}
