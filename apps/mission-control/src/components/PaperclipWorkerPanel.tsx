import React, { useState } from 'react';
import { PanelBase } from './PanelBase';
import { Copy, Check } from 'lucide-react';

const TUNNEL = 'c7bc9665-3923-4977-acd7-2033838cd56e';
const CONFIG_PATH = 'c:\\Antigravity\\infra\\cloudflare\\paperclip-hq.yml';

const CopyRow: React.FC<{ cmd: string }> = ({ cmd }) => {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cmd);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {}
  };
  return (
    <button
      onClick={copy}
      className="w-full flex items-center justify-between gap-2 px-3 py-2 mb-2 rounded bg-background border border-border hover:border-accentCyan/50 transition text-left"
    >
      <span className="font-mono text-xs text-gray-300">
        <span className="text-gray-500 mr-2">copy</span>
        {cmd}
      </span>
      {done ? <Check size={14} className="text-accentCyan" /> : <Copy size={14} className="text-gray-400" />}
    </button>
  );
};

export const PaperclipWorkerPanel: React.FC = () => (
  <PanelBase title="Paperclip Worker" path="/health/paperclip" pill="cloudflare">
    {(details: any) => (
      <>
        {details && (
          <div className="text-xs font-mono text-gray-400 mb-3">
            v{details?.json?.version ?? details?.version ?? '?'} · {details?.json?.deploymentMode ?? details?.deploymentMode ?? 'unknown'}
          </div>
        )}
        <CopyRow cmd="wrangler deploy" />
        <CopyRow cmd="wrangler tail" />
        <div className="text-xs font-mono text-gray-500 mt-2">tunnel · {TUNNEL}</div>
        <div className="text-xs font-mono text-gray-500" title={CONFIG_PATH}>config · {CONFIG_PATH}</div>
      </>
    )}
  </PanelBase>
);
