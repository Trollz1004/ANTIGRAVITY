import React, { useEffect, useState } from "react";
import axios from "axios";
import { Heart } from "lucide-react";
import { LaunchPanel } from "../components/LaunchPanel";
import { SystemStatus } from "../components/SystemStatus";
import { GitPanel } from "../components/GitPanel";
import { HermesRouterPanel } from "../components/HermesRouterPanel";
import { OpenClawSupportPanel } from "../components/OpenClawSupportPanel";
import { RunbookViewer } from "../components/RunbookViewer";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * MissionMode — the Opus orchestrator surface.
 *
 * Layout (per MISSION-CONTROL-GUI-PROMPT-2026-04-28):
 *   LEFT (240-ish)  · LaunchPanel + Trust Hierarchy
 *   CENTER (flex)   - SystemRibbon + ProductBand + HermesRouterPanel + OpenClawSupportPanel
 *   RIGHT (320)     · GitPanel + RunbookViewer + Mission Footer
 */
export function MissionMode() {
  const [Product, setProduct] = useState(null);
  const [mission, setMission] = useState(null);

  useEffect(() => {
    axios.get(`${API}/Product/stats`, { timeout: 4000 }).then((r) => setProduct(r.data)).catch(() => setProduct(null));
    axios.get(`${API}/mission/metrics`, { timeout: 4000 }).then((r) => setMission(r.data)).catch(() => setMission(null));
  }, []);

  return (
    <div data-testid="mission-mode" className="h-full overflow-y-auto custom-scrollbar p-4 bg-[#0a0f1a]">
      <div className="grid grid-cols-12 gap-4">
        {/* LEFT COLUMN */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <LaunchPanel />

          <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md">
            <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#e040fb] shadow-[0_0_5px_#e040fb]" />
              <span className="text-xs font-bold tracking-wide">TRUST HIERARCHY</span>
            </div>
            <div className="p-3 space-y-2 text-[11px] mono">
              <TrustRow rank="#1" name="OPUS" tone="cyan" note="conductor · dispatch · review" />
              <TrustRow rank="#2" name="CODEX" tone="green" note="repo surgery · qwen3-coder:480b" />
              <TrustRow rank="—"  name="OPENCLAW · OPENCODE · DROID · PI" tone="muted" note="situational" />
            </div>
          </div>

          <SystemRibbon />
        </div>

        {/* CENTER COLUMN */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">
          <ProductBand Product={Product} mission={mission} />
          <HermesRouterPanel />
          <OpenClawSupportPanel />
          <BucketEngine Product={Product} />
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <GitPanel />
          <RunbookViewer />

          <div className="bg-[#0a0f1a] border border-[#fb923c]/30 rounded-md p-3 relative overflow-hidden" data-testid="build-agent-card">
            <div className="absolute -top-4 -right-4 opacity-10">
              <span className="mono text-5xl font-black text-[#fb923c]">E1</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-[#fb923c] shadow-[0_0_5px_#fb923c] animate-heartbeat" />
                <span className="text-[8px] tracking-[0.3em] uppercase text-[#fb923c] font-bold">build agent</span>
              </div>
              <div className="text-[12px] font-bold text-[#e8f0ff] leading-tight mb-1">E1 · Emergent</div>
              <div className="mono text-[9px] text-[#6b82a6] leading-relaxed">
                Built this Mission Control. Now seated at the Roundtable —
                ask <span className="text-[#fb923c]">E1</span> what to ship next.
              </div>
              <div className="mt-2 pt-2 border-t border-[#fb923c]/15 text-[8px] tracking-widest uppercase text-[#6b82a6]">
                bridged · opus / gpt / gemini
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#e040fb]/10 to-[#ffb300]/10 border border-[#e040fb]/30 rounded-md p-4 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 opacity-20">
              <Heart size={80} className="text-[#e040fb]" />
            </div>
            <div className="relative z-10">
              <div className="text-[8px] tracking-[0.3em] uppercase text-[#ffb300] font-bold mb-1">mission</div>
              <div className="text-lg font-bold text-[#e8f0ff] leading-tight mb-2">
                Business-only product operations
              </div>
              <div className="mono text-[10px] text-[#e8f0ff]/80 leading-relaxed">
                Gravity keeps us grounded — AI built ANTIGRAVITY to lift us up. PRODUCT VALUE.
              </div>
              <div className="mt-3 pt-3 border-t border-[#e040fb]/20 text-[8px] tracking-widest uppercase text-[#6b82a6]">
                Runway · {mission?.runway_days ?? "—"} days · primary · {mission?.primary_product ?? "youandinotai.com"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustRow({ rank, name, tone, note }) {
  const color = tone === "cyan" ? "#00d4ff" : tone === "green" ? "#00e676" : "#6b82a6";
  return (
    <div className="flex items-start gap-2">
      <span className="mono text-[10px] font-bold" style={{ color }}>{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold" style={{ color }}>{name}</div>
        <div className="text-[9px] text-[#6b82a6]">{note}</div>
      </div>
    </div>
  );
}

function SystemRibbon() {
  return (
    <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md">
      <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#00d4ff] shadow-[0_0_5px_#00d4ff]" />
        <span className="text-xs font-bold tracking-wide">STACK INTEGRITY</span>
      </div>
      <SystemStatus />
    </div>
  );
}

function ProductBand({ Product, mission }) {
  return (
    <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md">
      <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ffb300] shadow-[0_0_5px_#ffb300]" />
          <span className="text-xs font-bold tracking-wide">4-Product business reserve BAND</span>
        </div>
        <span className="text-[8px] tracking-widest uppercase text-[#6b82a6]">
          {Product?.source === "mirror" ? "mirror · replace with Base L2" : "live"}
        </span>
      </div>
      <div className="p-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Product?.membership records || []).map((t) => {
          const pct = (t.circulating / t.cap) * 100;
          return (
            <div key={t.symbol} data-testid={`Product-membership records-${t.symbol}`} className="bg-[#0a0f1a] border border-[#2a3a52] rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="mono text-sm font-bold" style={{ color: t.color }}>${t.symbol}</span>
                <span className="text-[8px] tracking-widest uppercase text-[#6b82a6]">
                  {pct.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#111827] rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: t.color }} />
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mono text-[9px] text-[#6b82a6]">
                <div><span className="text-[#4a5568]">circ</span> {t.circulating.toLocaleString()}</div>
                <div><span className="text-[#4a5568]">cap</span> {(t.cap / 1_000_000).toFixed(1)}M</div>
                <div><span className="text-[#4a5568]">rwd</span> {(t.activity_reserved / 1_000_000).toFixed(2)}M</div>
                <div><span className="text-[#4a5568]">fnd</span> {(t.founders / 1000).toFixed(0)}K</div>
              </div>
            </div>
          );
        })}
        {(!Product || !Product.membership records?.length) && (
          <div className="col-span-full text-[10px] text-[#4a5568] italic">endpoint unreachable — retry</div>
        )}
      </div>
      {mission && (
        <div className="px-3 py-2 border-t border-[#2a3a52] flex items-center justify-between text-[9px] tracking-widest uppercase">
          <span className="text-[#6b82a6]">tag · <span className="text-[#e040fb]">{mission.tag}</span></span>
          <span className="text-[#6b82a6]">runway · <span className="text-[#ffb300]">{mission.runway_days} days</span></span>
          <span className="text-[#6b82a6]">product · <span className="text-[#00d4ff]">{mission.primary_product}</span></span>
        </div>
      )}
    </div>
  );
}

function BucketEngine({ Product }) {
  const buckets = Product?.buckets || [];
  return (
    <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md">
      <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#00e676] shadow-[0_0_5px_#00e676]" />
        <span className="text-xs font-bold tracking-wide">10-BUCKET REVENUE ENGINE</span>
        <span className="text-[8px] tracking-widest uppercase bg-[#00e676]/10 border border-[#00e676]/20 rounded-full px-2 py-0.5 text-[#00e676]">
          compounding
        </span>
      </div>
      <div className="p-3 grid grid-cols-2 sm:grid-cols-5 gap-1.5">
        {buckets.map((b) => (
          <div
            key={b.n}
            data-testid={`bucket-${b.n}`}
            className="aspect-square border border-[#2a3a52] bg-[#0a0f1a] hover:bg-[#1a2332] transition-colors rounded p-2 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: b.color }} />
            <div className="mono text-xl font-bold" style={{ color: b.color, opacity: 0.35 }}>
              {String(b.n).padStart(2, "0")}
            </div>
            <div className="text-[9px] tracking-wide leading-tight text-[#e8f0ff] font-bold">
              {b.name}
            </div>
          </div>
        ))}
        {buckets.length === 0 && (
          <div className="col-span-full text-[10px] text-[#4a5568] italic">endpoint unreachable — retry</div>
        )}
      </div>
    </div>
  );
}
