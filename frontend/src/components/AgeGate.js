import React, { useState } from "react";
import { Rocket, ShieldCheck } from "lucide-react";

export function AgeGate({ onVerified }) {
  const [ack, setAck] = useState(false);

  return (
    <div className="h-screen w-screen bg-[#0a0f1a] text-[#e8f0ff] flex items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(0,212,255,0.08),transparent_40%),radial-gradient(circle_at_100%_100%,rgba(224,64,251,0.08),transparent_45%)]" />
      <div className="relative max-w-md w-full border border-[#2a3a52] bg-[#111827] rounded-md p-10 shadow-[0_0_80px_rgba(0,212,255,0.05)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-md bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center">
            <Rocket className="text-[#00d4ff]" size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#e040fb] uppercase tracking-[0.3em]">OpusPawClaw</div>
            <div className="text-lg font-bold tracking-tight">Mission Control</div>
          </div>
        </div>

        <p className="text-sm text-[#6b82a6] leading-relaxed mb-6">
          This is the orchestrator surface for the ANTIGRAVITY stack. Opus conducts; agents
          execute on Ollama, Hermes Router, and OpenClaw support. By entering you confirm you are{" "}
          <span className="text-[#e8f0ff] font-semibold">18 or older</span> and authorized to
          operate this node.
        </p>

        <label className="flex items-start gap-3 text-xs text-[#e8f0ff] cursor-pointer select-none mb-6">
          <input
            data-testid="agegate-checkbox"
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
            className="mt-0.5 accent-[#00d4ff]"
          />
          <span>
            I am 18+ and acknowledge this node operates Opus-directed agents. for the product.
            <span className="block text-[10px] text-[#e040fb] font-bold uppercase tracking-[0.25em] mt-1">
              Business-only product operations
            </span>
          </span>
        </label>

        <button
          data-testid="agegate-enter"
          disabled={!ack}
          onClick={onVerified}
          className="w-full py-3 rounded-md bg-[#00d4ff] text-[#0a0f1a] text-xs font-bold uppercase tracking-[0.3em] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#33ddff] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.25)]"
        >
          <ShieldCheck size={14} /> Enter Mission Control
        </button>
      </div>
    </div>
  );
}
