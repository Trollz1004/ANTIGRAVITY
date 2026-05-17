import React from "react";
import { Code2, Terminal } from "lucide-react";

export function CodeMode() {
  return (
    <div data-testid="code-mode" className="h-full bg-[#0a0f1a] text-[#e8f0ff] p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Code2 size={22} className="text-[#00d4ff]" />
          <div>
            <div className="text-[10px] font-bold text-[#6b82a6] uppercase tracking-[0.3em]">mode</div>
            <h1 className="text-2xl font-bold tracking-tight">Code Mode</h1>
          </div>
        </div>
        <p className="text-sm text-[#6b82a6] leading-relaxed mb-6">
          In the Electron flagship this hosts the Monaco editor + xTerm.js terminal. The
          web build links out — your Hermes Router and Ollama agents live on your workstation.
        </p>
        <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-[#00e676]" />
            <span className="text-xs font-bold tracking-wide">QUICKSTART</span>
          </div>
          <pre className="mono text-[12px] text-[#e8f0ff] bg-[#0a0f1a] border border-[#2a3a52] rounded p-3 overflow-x-auto">
{`# clone + run the flagship
git clone https://github.com/Trollz1004/OpusPawClaw.git
cd OpusPawClaw
npm install
npm run dev:electron`}
          </pre>
          <div className="text-[10px] text-[#6b82a6] uppercase tracking-widest">
            Mission Control ships as a drop-in mode — see /app/dropin/ in this repo.
          </div>
        </div>
      </div>
    </div>
  );
}
