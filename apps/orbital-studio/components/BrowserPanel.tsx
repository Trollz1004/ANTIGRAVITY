import React from 'react';

export default function BrowserPanel() {
  return (
    <div className="browser-panel p-4 border border-neutral-800 bg-neutral-900/60 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
        <span className="label">EMBEDDED OPERATIONAL BROWSER</span>
        <div className="flex gap-2">
          <span className="px-2 py-0.5 text-[10px] font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
            SANDBOXED
          </span>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 text-center text-neutral-500 font-mono text-xs">
        Browser Bridge active in Electron shell context.
      </div>
    </div>
  );
}
