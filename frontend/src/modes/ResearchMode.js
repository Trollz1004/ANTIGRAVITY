import React from "react";
import { Search } from "lucide-react";

export function ResearchMode() {
  return (
    <div data-testid="research-mode" className="h-full bg-[#0a0f1a] text-[#e8f0ff] p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Search size={22} className="text-[#00d4ff]" />
          <div>
            <div className="text-[10px] font-bold text-[#6b82a6] uppercase tracking-[0.3em]">mode</div>
            <h1 className="text-2xl font-bold tracking-tight">Research Mode</h1>
          </div>
        </div>
        <p className="text-sm text-[#6b82a6] leading-relaxed">
          Comet / Perplexity deep-research routing. Not wired in the preview build —
          plug in your Perplexity API key and route via `fast` or `kimi` pill for now.
        </p>
      </div>
    </div>
  );
}
