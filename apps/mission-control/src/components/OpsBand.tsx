import React from 'react';
import { Activity } from 'lucide-react';

export const OpsBand: React.FC = () => (
  <div className="bg-gradient-to-br from-panel to-background rounded border border-accentMagenta/20 p-4 mb-4">
    <div className="flex items-center gap-2 mb-2">
      <Activity size={14} className="text-accentMagenta" />
      <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500">operations</div>
      <div className="text-xs font-mono text-accentMagenta">business-only</div>
    </div>
    <p className="text-xs text-gray-300 leading-relaxed">
      ANTIGRAVITY tracks launch readiness, support status, and product operations.
    </p>
    <div className="mt-3 text-[10px] font-mono text-gray-500">
      Runway · — days · primary · youandinotai.com
    </div>
  </div>
);
