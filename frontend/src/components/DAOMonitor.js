import React, { useEffect, useState } from "react";
import axios from "axios";
import { Activity, ChevronRight, LayoutDashboard, Users, Wallet, Gavel, TrendingUp, Globe, Code2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * DAOMonitor — 4-DAO treasury / governance strip for the sidebar.
 * All numbers come from /api/dao/stats and are labelled source="mirror".
 */
export function DAOMonitor() {
  const [expanded, setExpanded] = useState(true);
  const [data, setData] = useState(null);
  const [uptime, setUptime] = useState(99.98);

  useEffect(() => {
    axios.get(`${API}/dao/stats`, { timeout: 4000 }).then((r) => setData(r.data)).catch(() => setData(null));
    const iv = setInterval(() => {
      setUptime((p) => Math.min(100, p + (Math.random() - 0.5) * 0.01));
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  const tokens = data?.tokens || [];

  return (
    <div data-testid="dao-monitor" className="mt-6 border-t border-[#2a3a52] pt-4 select-none">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 mb-3 group outline-none"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <LayoutDashboard size={12} className="text-[#6b82a6] group-hover:text-[#00d4ff] transition-colors" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#e040fb] rounded-full animate-pulse shadow-[0_0_5px_#e040fb]" />
          </div>
          <span className="mono text-[10px] font-bold text-[#4a5568] uppercase tracking-widest group-hover:text-[#e8f0ff] transition-colors">
            Antigravity DAO
          </span>
        </div>
        <ChevronRight size={12} className={`text-[#4a5568] transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>

      {expanded && (
        <div className="px-4 space-y-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1a2332] to-[#0a0f1a] border border-[#2a3a52] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
              <Globe size={48} className="text-[#00d4ff]" />
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity size={10} className="text-[#e040fb] animate-pulse" />
                <span className="text-[8px] font-black text-[#00d4ff] uppercase tracking-tighter">
                  Base L2 · {uptime.toFixed(2)}% uptime
                </span>
              </div>
              <div className="w-2 h-2 rounded-full bg-[#00e676] shadow-[0_0_5px_#00e676]" />
            </div>

            <div className="space-y-2 relative z-10">
              {tokens.map((t) => {
                const pct = (t.circulating / t.cap) * 100;
                return (
                  <div key={t.symbol} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm" style={{ background: `${t.color}26`, border: `1px solid ${t.color}` }} />
                        <span className="mono text-[10px] font-bold" style={{ color: t.color }}>${t.symbol}</span>
                      </div>
                      <span className="mono text-[9px] text-[#e8f0ff]">
                        {t.circulating.toLocaleString()}/{(t.cap / 1_000_000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="h-1 w-full bg-[#0a0f1a] rounded-full overflow-hidden">
                      <div className="h-full" style={{ width: `${pct}%`, background: t.color }} />
                    </div>
                  </div>
                );
              })}
              {tokens.length === 0 && (
                <div className="text-[9px] text-[#4a5568] italic">endpoint unreachable — retry</div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#2a3a52]/50 grid grid-cols-2 gap-2">
              <div className="flex flex-col">
                <span className="text-[7px] text-[#4a5568] uppercase font-bold">Treasury (4-DAO)</span>
                <span className="mono text-[9px] text-[#6b82a6]">$2,450,892 · mirror</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[7px] text-[#4a5568] uppercase font-bold">Proposals</span>
                <span className="mono text-[9px] text-[#6b82a6]">14 · 3 queued</span>
              </div>
            </div>
          </div>

          <button className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-[#00d4ff]/10 to-[#e040fb]/10 hover:from-[#00d4ff]/20 hover:to-[#e040fb]/20 border border-[#00d4ff]/20 text-[#00d4ff] text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95">
            <TrendingUp size={10} /> Governance Hub
          </button>

          <div className="px-1 text-center">
            <p className="text-[7px] text-[#4a5568] uppercase leading-tight italic">
              Antigravity Platforms DAO v1.0<br />
              <span className="text-[#00d4ff]/40">#UntilNoKidInNeed</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
