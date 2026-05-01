import React from "react";
import { Settings, Shield } from "lucide-react";

export function SettingsPanel() {
  const backend = process.env.REACT_APP_BACKEND_URL;
  return (
    <div data-testid="settings-mode" className="h-full bg-[#0a0f1a] text-[#e8f0ff] p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Settings size={22} className="text-[#00d4ff]" />
          <div>
            <div className="text-[10px] font-bold text-[#6b82a6] uppercase tracking-[0.3em]">mode</div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          </div>
        </div>

        <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md p-5 space-y-3">
          <div className="text-[10px] font-bold text-[#6b82a6] uppercase tracking-widest">endpoints</div>
          <Row label="Backend" value={backend} />
          <Row label="Hermes Mirror" value={`${backend}/api/hermes/healthz`} />
          <Row label="Paperclip Mirror" value={`${backend}/api/paperclip/health`} />
          <Row label="Target (local flagship)" value="http://localhost:11435/healthz" />
        </div>

        <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-[#e040fb]" />
            <span className="text-[10px] font-bold text-[#6b82a6] uppercase tracking-widest">doctrine</span>
          </div>
          <ul className="mono text-[11px] text-[#e8f0ff] leading-relaxed list-disc pl-5 space-y-1">
            <li>Opus conducts. Agents execute.</li>
            <li>No Haiku. No solicitation language. FL §496.405.</li>
            <li>Mirror endpoints honest — no fabricated live numbers.</li>
            <li>#UntilNoKidInNeed · for the kids.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[11px]">
      <span className="mono text-[#6b82a6] uppercase tracking-widest text-[9px]">{label}</span>
      <span className="mono text-[#e8f0ff] truncate max-w-[70%]" title={value}>{value || "—"}</span>
    </div>
  );
}
