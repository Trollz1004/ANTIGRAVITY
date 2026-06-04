import React from 'react';
import { Loader2 } from 'lucide-react';

export const ScanningRepoIndicator: React.FC = () => (
  <div className="flex items-center gap-2 text-xs font-mono text-gray-500 mb-3">
    <Loader2 size={12} className="animate-spin text-accentCyan" />
    Scanning repository…
  </div>
);
