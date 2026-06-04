import React from 'react';

export function TitleBar() {
  return (
    <div className="h-8 bg-[#0a0f1a] border-b border-[#2a3a52] flex items-center px-4" style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="flex gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
      </div>
      <div className="mx-auto text-xs font-medium text-[#6b82a6]">OpusPawClaw</div>
    </div>
  );
}
