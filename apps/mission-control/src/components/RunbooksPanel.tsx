import React, { useEffect, useState } from 'react';
import { Book, FolderOpen } from 'lucide-react';
import { apiGet } from '../lib/api';

type RunbookFile = { filename: string; size: number; mtime: string };

export const RunbooksPanel: React.FC = () => {
  const [files, setFiles] = useState<RunbookFile[]>([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    apiGet<RunbookFile[]>('/runbooks/list').then(env => {
      if (env.status === 'ok' && Array.isArray(env.details)) {
        setFiles(env.details);
        setLive(true);
      }
    });
  }, []);

  return (
    <div className="bg-panel rounded border border-border p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-mono uppercase tracking-wider text-white">Runbooks</h2>
        <button className="text-xs font-mono text-accentCyan flex items-center gap-1 hover:text-accentCyan/70">
          <FolderOpen size={12} /> open runbook
        </button>
      </div>
      {!live ? (
        <div className="text-xs font-mono text-rose-400/80">endpoint unreachable — retry</div>
      ) : files.length === 0 ? (
        <div className="text-center py-4">
          <Book size={24} className="mx-auto text-gray-500 mb-2" />
          <div className="text-xs font-mono text-gray-300">Select a runbook</div>
          <div className="text-[10px] font-mono text-gray-500 mt-1">c:\Antigravity\briefings\runbooks\</div>
        </div>
      ) : (
        <ul className="space-y-1 text-xs font-mono">
          {files.slice(0, 8).map(f => (
            <li key={f.filename} className="text-gray-300 hover:text-accentCyan cursor-pointer truncate">
              {f.filename}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
