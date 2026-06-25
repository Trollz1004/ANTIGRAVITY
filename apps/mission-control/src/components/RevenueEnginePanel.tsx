import React from 'react';
import { PanelBase } from './PanelBase';

export const RevenueEnginePanel: React.FC = () => (
  <PanelBase title="Revenue Engine" path="/health/revenue-buckets" pill="operations">
    {(d: any) => (
      <div className="font-mono text-xs text-gray-300">
        <div>Operating view · <span className="text-accentCyan">{d?.streams?.length ?? d?.buckets?.length ?? 0}</span> active streams</div>
        <div className="text-gray-500 mt-1">1-wallet model · all revenue in, all costs out</div>
      </div>
    )}
  </PanelBase>
);
