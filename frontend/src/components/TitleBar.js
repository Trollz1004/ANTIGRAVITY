import React from "react";

export function TitleBar() {
  return (
    <div
      data-testid="title-bar"
      className="h-8 bg-[#0a0f1a] border-b border-[#2a3a52] flex items-center px-4 relative z-10"
    >
      <div className="flex gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
      </div>
      <div className="mx-auto text-xs font-medium text-[#6b82a6] tracking-wide">
        OpusPawClaw · Mission Control
      </div>
      <div className="text-[9px] font-bold text-[#00d4ff] uppercase tracking-[0.25em] opacity-70">
        pawclaw-elite-v1
      </div>
    </div>
  );
}
