import React, { useRef, useState } from 'react';
import { BookOpen, FolderOpen, X } from 'lucide-react';

export function RunbookViewer() {
  const [contents, setContents] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setContents(typeof reader.result === 'string' ? reader.result : null);
      setFilename(f.name);
    };
    reader.readAsText(f);
  };

  const clear = () => {
    setContents(null);
    setFilename(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen size={12} className="text-[#00d4ff]" />
          <span className="text-xs font-bold tracking-wide text-[#e8f0ff]">RUNBOOKS</span>
          {filename && (
            <span className="text-[9px] text-[#6b82a6] font-mono truncate">· {filename}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {contents && (
            <button
              onClick={clear}
              className="p-1 text-[#6b82a6] hover:text-[#ff1744] transition-colors"
              title="Close runbook"
            >
              <X size={11} />
            </button>
          )}
          <label className="cursor-pointer text-[8px] tracking-widest uppercase font-bold bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/20 rounded-full px-2.5 py-0.5 transition-colors flex items-center gap-1.5">
            <FolderOpen size={10} />
            Open Runbook
            <input
              ref={inputRef}
              type="file"
              accept=".html,text/html"
              onChange={onFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Body */}
      <div className="p-0 flex-1 min-h-[260px] flex flex-col bg-[#0a0f1a]">
        {contents ? (
          <iframe
            title={filename ?? 'Runbook'}
            sandbox="allow-scripts allow-same-origin"
            srcDoc={contents}
            className="w-full flex-1 min-h-[260px] bg-white border-0"
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <BookOpen size={36} className="text-[#00d4ff]/20" />
            <div className="text-[10px] text-[#6b82a6] font-medium leading-relaxed max-w-[280px]">
              Select a runbook from
              <br />
              <code className="text-[#00d4ff] font-mono text-[10px]">
                c:\Antigravity\briefings\runbooks\
              </code>
            </div>
            <div className="text-[8px] tracking-widest uppercase text-[#4a5568] font-mono">
              Sandboxed iframe · scripts + same-origin allowed
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
