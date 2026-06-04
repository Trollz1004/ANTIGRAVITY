import React from 'react';
import { PanelBase } from './PanelBase';

export const TreasuryBand: React.FC = () => (
  <PanelBase title="4-DAO Treasury Band" path="/health/treasury" pill="live">
    {(d: any) => (
      <div className="font-mono text-sm text-gray-200 space-y-1">
        <div>Balance · <span className="text-accentCyan">${d?.balanceUsd?.toLocaleString?.() ?? '—'}</span> · {d?.source ?? 'mirror'}</div>
        <div>Uptime · {d?.uptime ?? '—'}</div>
        <div>Proposals · {d?.proposals ?? 0} · queued {d?.queued ?? 0}</div>
      </div>
    )}
  </PanelBase>
);
