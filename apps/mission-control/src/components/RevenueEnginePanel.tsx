import React from 'react';
import { PanelBase } from './PanelBase';

export const RevenueEnginePanel: React.FC = () => (
  <PanelBase title="10-Bucket Revenue Engine" path="/health/revenue-buckets" pill="compounding">
    {(d: any) => (
      <div className="font-mono text-xs text-gray-300">
        <div>Reserve cap · <span className="text-accentCyan">{d?.reserve_percent ?? 10}%</span> (founder-directed quarterly)</div>
        <div className="text-gray-500 mt-1">1-wallet model · all revenue in, all costs out</div>
      </div>
    )}
  </PanelBase>
);
