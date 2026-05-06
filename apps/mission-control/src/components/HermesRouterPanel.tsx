import React, { useEffect, useState } from 'react';
import { PanelBase } from './PanelBase';
import { apiGet, apiPost } from '../lib/api';

const CHIPS = ['hermes', 'hermes-deep', 'cfo', 'code', 'marketing', 'kimi', 'fast'];

export const HermesRouterPanel: React.FC = () => {
  const [active, setActive] = useState<string>('hermes');

  useEffect(() => {
    apiGet<{ models: string[]; active: string }>('/hermes/models').then(env => {
      if (env.status === 'ok' && env.details?.active) setActive(env.details.active);
    });
  }, []);

  const swap = async (model: string) => {
    setActive(model);
    await apiPost('/hermes/active', { model });
  };

  return (
    <PanelBase title="Hermes Router" path="/health/hermes" pill=":11435 mirror">
      <div className="flex flex-wrap gap-2">
        {CHIPS.map(m => (
          <button
            key={m}
            onClick={() => swap(m)}
            className={
              'px-2 py-1 text-xs font-mono rounded-full border transition ' +
              (active === m
                ? 'bg-accentCyan/20 border-accentCyan text-accentCyan'
                : 'border-border text-gray-300 hover:border-accentCyan/50')
            }
          >
            {m}
          </button>
        ))}
      </div>
    </PanelBase>
  );
};
