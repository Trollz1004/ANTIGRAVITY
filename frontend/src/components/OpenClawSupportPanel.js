import React, { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SUPPORT_URL = "http://127.0.0.1:18789";
const CMD_HEALTH = "curl http://127.0.0.1:18789/healthz";
const CMD_TAIL = "powershell -NoProfile -Command \"Get-Content E:/ANTIGRAVITY\\logs\\openclaw-support.log -Tail 80 -Wait\"";

export function OpenClawSupportPanel() {
  const [health, setHealth] = useState({ status: "loading", data: null });
  const [copied, setCopied] = useState(null);

  const fetchHealth = async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    try {
      const r = await fetch(`${API}/openclaw/health`, { signal: ctrl.signal });
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
    const iv = setInterval(() => {
      if (!document.hidden) fetchHealth();
    }, 10_000);
    return () => clearInterval(iv);
  }, []);

  const copy = async (label, cmd) => {
    await navigator.clipboard?.writeText(cmd);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const dot =
    health.status === "ok" ? "bg-[#00e676] shadow-[0_0_6px_#00e676]" :
    health.status === "timeout" ? "bg-[#ffb300] shadow-[0_0_6px_#ffb300]" :
    health.status === "loading" ? "bg-[#6b82a6]" :
    "bg-[#ff1744] shadow-[0_0_6px_#ff1744] animate-pulse";

  return (
    <div data-testid="openclaw-support-panel" className="bg-[#1a2332] border border-[#2a3a52] rounded-md">
      <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dot}`} />
          <span className="text-xs font-bold tracking-wide">OPENCLAW SUPPORT</span>
          <span className="text-[8px] tracking-widest uppercase bg-[#00d4ff]/10 border border-[#00d4ff]/20 rounded-full px-2 py-0.5 text-[#00d4ff]">
            date app
          </span>
        </div>
        <button
          data-testid="openclaw-support-refresh"
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
            {health.status === "timeout" ? "TIMEOUT - retry" : "endpoint unreachable - retry"}
          </div>
        )}

        <div className="space-y-1.5">
          <button
            data-testid="openclaw-copy-health"
            onClick={() => copy("health", CMD_HEALTH)}
            className="w-full flex items-center justify-between bg-[#0a0f1a] border border-[#2a3a52] hover:border-[#ffb300] rounded px-2.5 py-2 transition-all group"
          >
            <span className="flex items-center gap-2">
              <span className="text-[8px] tracking-widest uppercase text-[#ffb300]">copy</span>
              <code className="mono text-[10px] text-[#e8f0ff] truncate">health check</code>
            </span>
            {copied === "health" ? <Check size={12} className="text-[#00e676]" /> : <Copy size={12} className="text-[#6b82a6] group-hover:text-[#ffb300]" />}
          </button>

          <button
            data-testid="openclaw-copy-tail"
            onClick={() => copy("tail", CMD_TAIL)}
            className="w-full flex items-center justify-between bg-[#0a0f1a] border border-[#2a3a52] hover:border-[#ffb300] rounded px-2.5 py-2 transition-all group"
          >
            <span className="flex items-center gap-2">
              <span className="text-[8px] tracking-widest uppercase text-[#ffb300]">copy</span>
              <code className="mono text-[10px] text-[#e8f0ff] truncate">tail support log</code>
            </span>
            {copied === "tail" ? <Check size={12} className="text-[#00e676]" /> : <Copy size={12} className="text-[#6b82a6] group-hover:text-[#ffb300]" />}
          </button>
        </div>

        <div className="text-[9px] mono text-[#6b82a6] space-y-0.5 border-t border-[#2a3a52] pt-2">
          <div><span className="text-[#4a5568] uppercase tracking-widest text-[8px]">gateway</span> - {SUPPORT_URL}</div>
          <div><span className="text-[#4a5568] uppercase tracking-widest text-[8px]">mode</span> - customer service support</div>
        </div>
      </div>
    </div>
  );
}
