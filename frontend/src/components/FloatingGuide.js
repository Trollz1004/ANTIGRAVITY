import React, { useState, useEffect } from "react";
import { HelpCircle, X } from "lucide-react";

const TIPS = [
  "Type ⌘/Ctrl + any key while focused — TaskCommander dispatches across active agents.",
  "Every chat message shows X-Hermes-Provider + X-Hermes-Real-Model footers.",
  "Hermes pill tester lives on Mission Control — click a pill to open the prompt box.",
  "Runbook viewer is sandboxed — HTML files cannot exfiltrate from the iframe.",
  "DAO band is mirrored — replace with Base L2 reader when you deploy.",
];

export function FloatingGuide() {
  const [open, setOpen] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), 8000);
    return () => clearInterval(iv);
  }, []);

  return (
    <>
      <button
        data-testid="floating-guide-toggle"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-14 right-6 z-30 w-10 h-10 rounded-full bg-[#e040fb]/20 border border-[#e040fb]/40 text-[#e040fb] flex items-center justify-center hover:bg-[#e040fb]/30 transition-all shadow-[0_0_20px_rgba(224,64,251,0.25)]"
        title="Gemma guide"
      >
        {open ? <X size={16} /> : <HelpCircle size={16} />}
      </button>

      {open && (
        <div className="fixed bottom-28 right-6 z-30 w-72 bg-[#1a2332] border border-[#e040fb]/30 rounded-md shadow-2xl overflow-hidden">
          <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#e040fb] animate-pulse shadow-[0_0_5px_#e040fb]" />
            <span className="text-xs font-bold tracking-wide">GEMMA · GUIDE</span>
          </div>
          <div className="p-3 text-[11px] leading-relaxed text-[#e8f0ff] min-h-[88px]">
            {TIPS[tipIdx]}
          </div>
          <div className="px-3 py-2 border-t border-[#2a3a52] flex items-center justify-between text-[8px] tracking-widest uppercase text-[#6b82a6]">
            <span>tip {tipIdx + 1}/{TIPS.length}</span>
            <button
              data-testid="floating-guide-next"
              onClick={() => setTipIdx((i) => (i + 1) % TIPS.length)}
              className="text-[#e040fb] hover:text-[#f070fe] transition-colors"
            >
              next →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
