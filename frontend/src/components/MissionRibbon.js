import React, { useEffect, useState } from "react";
import axios from "axios";
import { Heart, AlertTriangle, Share2 } from "lucide-react";
import { ShareMissionModal } from "./ShareMissionModal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * MissionRibbon — always-on top strip showing the actual mission counter.
 * Reads /api/ledger/stats and /api/watchdog/status. Honest empty state.
 */
export function MissionRibbon() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [share, setShare] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onShareEvent = () => setShare(true);
    window.addEventListener("opuspawclaw-share", onShareEvent);
    return () => window.removeEventListener("opuspawclaw-share", onShareEvent);
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [s, w] = await Promise.all([
          axios.get(`${API}/ledger/stats`).then((r) => r.data),
          axios.get(`${API}/watchdog/status`).then((r) => r.data),
        ]);
        if (!alive) return;
        setStats(s); setAlerts(w.alerts || []);
      } catch { /* honest empty state */ }
    };
    load();
    const iv = setInterval(() => { if (!document.hidden) { load(); setTick((t) => t + 1); } }, 12_000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  const total = stats?.total_usd ?? 0;
  const kids = stats?.member_support_usd ?? 0;
  const estimate = stats?.member_support_estimate ?? 0;
  const threshold = stats?.member_support_threshold_usd ?? 250;

  return (
    <>
      <div
        data-testid="mission-ribbon"
        className={`relative px-6 py-2 border-b ${alerts.length ? "border-[#ff1744]/40 bg-gradient-to-r from-[#ff1744]/10 via-[#0a0f1a] to-[#0a0f1a]" : "border-[#2a3a52] bg-[#0a0f1a]"} flex items-center gap-4 flex-wrap`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Heart size={12} className="text-[#e040fb] animate-heartbeat shrink-0" />
          <span className="text-[9px] tracking-[0.3em] uppercase text-[#e040fb] font-bold whitespace-nowrap">Business-only product operations</span>
        </div>
        <span className="h-3 w-px bg-[#2a3a52]" />
        <Stat label="committed" value={`$${formatUsd(total)}`} tone="cyan" tick={tick} />
        <Stat label="product reserve" value={`$${formatUsd(kids)}`} tone="magenta" />
        <Stat label="kids covered (est.)" value={String(estimate)} tone="green" hint={`${threshold} USD per kid threshold`} />
        {alerts.length > 0 && (
          <div data-testid="mission-ribbon-alert" className="flex items-center gap-1.5 ml-auto bg-[#ff1744]/15 border border-[#ff1744]/40 rounded-full px-3 py-0.5 animate-pulse">
            <AlertTriangle size={11} className="text-[#ff1744]" />
            <span className="text-[9px] tracking-widest uppercase text-[#ff1744] font-bold">
              {alerts.length} silent · {alerts.map((a) => a.agent.toUpperCase()).join(" · ")}
            </span>
          </div>
        )}
        <button
          data-testid="mission-share-btn"
          onClick={() => setShare(true)}
          className={`flex items-center gap-1 text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full border transition-all bg-[#1a2332] border-[#2a3a52] text-[#6b82a6] hover:border-[#00d4ff] hover:text-[#00d4ff] ${alerts.length ? "" : "ml-auto"}`}
        >
          <Share2 size={10} /> share
        </button>
      </div>
      {share && stats && <ShareMissionModal stats={stats} onClose={() => setShare(false)} />}
    </>
  );
}

function Stat({ label, value, tone, hint, tick }) {
  const color = tone === "cyan" ? "#00d4ff" : tone === "magenta" ? "#e040fb" : tone === "green" ? "#00e676" : "#ffb300";
  return (
    <div title={hint || ""} className="flex items-baseline gap-1.5 min-w-0">
      <span className="text-[8px] tracking-[0.25em] uppercase text-[#6b82a6]">{label}</span>
      <span key={tick + (value || "")} className="mono text-xs font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

function formatUsd(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return Number(n).toFixed(2);
}
