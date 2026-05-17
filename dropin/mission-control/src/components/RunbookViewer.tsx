/**
 * src/components/RunbookViewer.tsx
 *
 * HTML runbook loader. File picker → sandboxed iframe.
 * Runbooks already ship with their own copy-to-clipboard wiring; the iframe
 * just renders them. Empty state points at c:\Antigravity\briefings\runbooks\.
 */
import React, { useRef, useState } from 'react';
import { BookOpen, Upload, X } from 'lucide-react';

export function RunbookViewer() {
  const [content, setContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setContent(text);
    setFileName(file.name);
  };

  const clear = () => {
    setContent(null); setFileName(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md flex flex-col overflow-hidden">
      <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={12} className="text-[#e040fb]" />
          <span className="text-xs font-bold tracking-wide">RUNBOOKS</span>
          {fileName && <span className="font-mono text-[9px] text-[#6b82a6] truncate max-w-[180px]">{fileName}</span>}
        </div>
        <div className="flex items-center gap-1">
          <input ref={inputRef} type="file" accept=".html,.htm" onChange={onFile} className="hidden" />
          <button onClick={() => inputRef.current?.click()} className="flex items-center gap-1 text-[8px] tracking-widest uppercase text-[#e040fb] hover:text-[#f070fe] transition-colors">
            <Upload size={10} /> open runbook
          </button>
          {content && (
            <button onClick={clear} className="p-1 text-[#6b82a6] hover:text-[#ff1744] transition-colors" title="Close">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-[220px] max-h-[480px] relative bg-[#0a0f1a]">
        {content ? (
          <iframe
            title="runbook"
            sandbox="allow-scripts allow-same-origin"
            srcDoc={content}
            className="absolute inset-0 w-full h-full border-0 bg-white"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-3">
            <BookOpen size={32} className="text-[#4a5568]" />
            <div className="text-[10px] tracking-widest uppercase text-[#6b82a6]">Select a runbook</div>
            <div className="font-mono text-[10px] text-[#4a5568]">c:\Antigravity\briefings\runbooks\</div>
          </div>
        )}
      </div>
    </div>
  );
}
