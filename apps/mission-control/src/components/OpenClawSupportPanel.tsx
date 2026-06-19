import React from 'react';
import { Bot } from 'lucide-react';
import { PanelBase } from './PanelBase';

export const OpenClawSupportPanel: React.FC = () => (
  <PanelBase title="OpenClaw Support" path="/health/openclaw" pill=":18789">
    {(d: any) => (
      <div className="font-mono text-xs space-y-2">
        <div className="flex items-center gap-2 text-gray-400">
          <Bot size={12} className="text-accentCyan" />
          support mode · {d?.support_mode ?? 'date-app-customer-service'}
        </div>
        <div className="rounded border border-gray-800 bg-gray-950 p-2 text-gray-300">
          gateway · {d?.target_real ?? 'http://127.0.0.1:18789/healthz'}
        </div>
        <div className="text-gray-500">commit · {d?.commit ?? 'unknown'}</div>
      </div>
    )}
  </PanelBase>
);
