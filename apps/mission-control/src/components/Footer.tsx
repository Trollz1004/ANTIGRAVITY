import React from 'react';

export const Footer: React.FC = () => (
  <footer className="flex justify-between items-center bg-panel px-4 py-2 border-t border-border text-[11px] font-mono">
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-2 text-accentCyan">
        <span className="w-2 h-2 rounded-full bg-accentCyan animate-pulse" />
        Mission Control Online
      </span>
      <span className="text-gray-500">Press ⌘K · roundtable across every AI platform</span>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-accentMagenta">#UntilNoKidInNeed</span>
      <span className="text-accentCyan">PAWCLAW-ELITE-V1</span>
    </div>
  </footer>
);
