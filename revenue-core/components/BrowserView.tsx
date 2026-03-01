
import React from 'react';

const BrowserView: React.FC = () => {
  return (
    <div className="h-full flex animate-fade-in">
      <div className="w-1/2 border-r border-slate-800 flex flex-col">
        <div className="h-8 bg-slate-900 flex items-center px-4 text-[10px] font-mono text-slate-400 border-b border-slate-800 justify-between">
          <span>OPUS-CLI (CLAUDE CODE)</span>
          <span className="text-red-500 font-bold uppercase">SANDBOXED</span>
        </div>
        <div className="flex-1 bg-black/20 flex items-center justify-center p-12 text-center text-slate-500 italic text-sm">
          Claude.ai orchestration active. <br/> Local node tunneling established.
        </div>
      </div>
      <div className="w-1/2 flex flex-col">
        <div className="h-8 bg-slate-900 flex items-center px-4 text-[10px] font-mono text-slate-400 border-b border-slate-800 justify-between">
          <span>GEMINI-HUB (AI STUDIO)</span>
          <span className="text-emerald-500 font-bold uppercase">LIVE SYNC</span>
        </div>
        <div className="flex-1 bg-black/20 flex items-center justify-center p-12 text-center text-slate-500 italic text-sm">
          Gemini AI Studio live grounding enabled. <br/> Protocol: Revenue First.
        </div>
      </div>
    </div>
  );
};

export default BrowserView;
