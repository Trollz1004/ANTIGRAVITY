import React from "react";
import { Image as ImageIcon } from "lucide-react";

export function CreateMode() {
  return (
    <div data-testid="create-mode" className="h-full bg-[#0a0f1a] text-[#e8f0ff] p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <ImageIcon size={22} className="text-[#00d4ff]" />
          <div>
            <div className="text-[10px] font-bold text-[#6b82a6] uppercase tracking-[0.3em]">mode</div>
            <h1 className="text-2xl font-bold tracking-tight">Create Mode</h1>
          </div>
        </div>
        <p className="text-sm text-[#6b82a6] leading-relaxed">
          Reserved for image / asset generation. In the flagship this ties into
          Gemini Nano Banana and the AI-Solutions.Store pipeline. Ship later.
        </p>
      </div>
    </div>
  );
}
