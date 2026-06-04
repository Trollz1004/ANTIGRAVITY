import React from 'react';
import { Heart } from 'lucide-react';

export const MissionBand: React.FC = () => (
  <div className="bg-gradient-to-br from-panel to-background rounded border border-accentMagenta/20 p-4 mb-4">
    <div className="flex items-center gap-2 mb-2">
      <Heart size={14} className="text-accentMagenta" />
      <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500">mission</div>
      <div className="text-xs font-mono text-accentMagenta">#UntilNoKidInNeed</div>
    </div>
    <p className="text-xs text-gray-300 leading-relaxed">
      Gravity keeps us grounded — AI built ANTIGRAVITY to lift us up. For the kids.
    </p>
    <div className="mt-3 text-[10px] font-mono text-gray-500">
      Runway · — days · primary · youandinotai.com
    </div>
  </div>
);
