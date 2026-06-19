import React from 'react';
import { Server } from 'lucide-react';
import { PanelBase } from './PanelBase';
import { clsx } from 'clsx';

type ServiceRow = {
  service: string;
  status: 'ok' | 'degraded' | 'unreachable';
  port: number;
  latency_ms: number;
  error: string | null;
};

const LABELS: Record<string, string> = {
  date_app_api: 'date app API',
  date_app_static: 'date app static',
  postgres: 'uandinotai-postgres',
  redis: 'redis cache',
  openclaw_support: 'OpenClaw support',
};

export const T5500Panel: React.FC = () => (
  <PanelBase title="T5500 Production Stack" path="/health/t5500" pill="192.168.0.15">
    {(d: any) => (
      <div className="font-mono text-xs space-y-1">
        <div className="flex items-center gap-2 text-gray-400 mb-2">
          <Server size={12} className="text-accentCyan" />
          host · {d?.host ?? '—'} · {d?.ok ?? 0}/{d?.total ?? 4} services
        </div>
        {Array.isArray(d?.services) &&
          d.services.map((s: ServiceRow) => (
            <div key={s.service} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span
                  className={clsx(
                    'inline-block w-1.5 h-1.5 rounded-full',
                    s.status === 'ok' ? 'bg-accentCyan' : s.status === 'degraded' ? 'bg-amber-400' : 'bg-rose-500'
                  )}
                />
                <span className="text-gray-200">{LABELS[s.service] ?? s.service}</span>
                <span className="text-gray-500">:{s.port}</span>
              </span>
              <span className="text-gray-500">{s.latency_ms}ms</span>
            </div>
          ))}
      </div>
    )}
  </PanelBase>
);
