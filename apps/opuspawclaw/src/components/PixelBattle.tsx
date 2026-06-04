import React from 'react';

export function PixelBattle() {
  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-[#0a0f1a]/80 backdrop-blur rounded-lg border border-[#2a3a52] w-fit shadow-lg shadow-[#00d4ff]/5">
      <div className="flex items-center justify-center gap-1.5 w-24 relative">
        <div className="absolute inset-0 bg-[#00d4ff]/5 blur-md rounded-full animate-pulse" />
        
        {/* Purple Jules (Octopus/Creature) */}
        <div className="animate-bounce relative z-10" style={{ animationDuration: '0.6s' }}>
          <svg width="24" height="24" viewBox="0 0 8 8" shapeRendering="crispEdges">
            <rect x="2" y="1" width="4" height="1" fill="#b200ff"/>
            <rect x="1" y="2" width="6" height="3" fill="#b200ff"/>
            <rect x="1" y="5" width="2" height="1" fill="#b200ff"/>
            <rect x="5" y="5" width="2" height="1" fill="#b200ff"/>
            <rect x="0" y="6" width="2" height="1" fill="#b200ff"/>
            <rect x="6" y="6" width="2" height="1" fill="#b200ff"/>
            {/* Eyes */}
            <rect x="2" y="3" width="1" height="1" fill="#fff"/>
            <rect x="5" y="3" width="1" height="1" fill="#fff"/>
            <rect x="2.5" y="3.5" width="0.5" height="0.5" fill="#000"/>
            <rect x="5.5" y="3.5" width="0.5" height="0.5" fill="#000"/>
          </svg>
        </div>
        
        {/* Action Lines / Magic Sparks */}
        <div className="flex flex-col gap-0.5 animate-pulse relative z-10">
           <div className="w-2 h-0.5 bg-[#00e676]" />
           <div className="w-3 h-0.5 bg-[#00d4ff]" />
           <div className="w-2 h-0.5 bg-[#e040fb]" />
        </div>

        {/* Claude Kraken (Crab/Lobster shape) */}
        <div className="animate-bounce relative z-10" style={{ animationDuration: '0.5s', animationDirection: 'alternate-reverse' }}>
          <svg width="24" height="24" viewBox="0 0 8 8" shapeRendering="crispEdges">
            <rect x="2" y="1" width="4" height="1" fill="#d97757"/>
            <rect x="0" y="2" width="8" height="3" fill="#d97757"/>
            <rect x="1" y="5" width="1" height="2" fill="#d97757"/>
            <rect x="3" y="5" width="2" height="1" fill="#d97757"/>
            <rect x="6" y="5" width="1" height="2" fill="#d97757"/>
            <rect x="0" y="7" width="2" height="1" fill="#d97757"/>
            <rect x="6" y="7" width="2" height="1" fill="#d97757"/>
            {/* Eyes */}
            <rect x="1" y="3" width="2" height="1" fill="#fff"/>
            <rect x="5" y="3" width="2" height="1" fill="#fff"/>
            <rect x="1" y="3.5" width="1" height="0.5" fill="#000"/>
            <rect x="5" y="3.5" width="1" height="0.5" fill="#000"/>
          </svg>
        </div>
      </div>
      
      <div className="flex flex-col justify-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#00d4ff] animate-pulse">
          Processing...
        </span>
        <span className="text-[7px] font-medium uppercase tracking-widest text-[#6b82a6]">
          Jules & Claude Synced
        </span>
      </div>
    </div>
  );
}
