import React, { useState } from 'react';
import {
  Code2,
  Play,
  Copy,
  Check,
  FileCode,
  FolderTree,
  GitBranch,
  ShieldCheck,
  Save,
} from 'lucide-react';
import { JulesCodeCheck } from './JulesCodeCheck';

interface CodeEditorViewProps {
  activeCode: string;
  onChangeCode: (code: string) => void;
  onExecuteCode: (code: string) => void;
}

export const CodeEditorView: React.FC<CodeEditorViewProps> = ({
  activeCode,
  onChangeCode,
  onExecuteCode,
}) => {
  const [activeFile, setActiveFile] = useState('stripe-handler.ts');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const files = [
    { name: 'stripe-handler.ts', lang: 'typescript' },
    { name: 'jules-sentinel.ts', lang: 'typescript' },
    { name: 'dual-agent.ts', lang: 'typescript' },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const lines = activeCode.split('\n');

  return (
    <div className="flex h-full flex-col bg-[#050913] border border-[#1e293b] rounded-xl overflow-hidden">
      {/* Editor Tab Bar */}
      <div className="flex h-10 items-center justify-between border-b border-[#1e293b] bg-[#090e1a] px-3">
        {/* File Tabs */}
        <div className="flex items-center gap-1">
          {files.map((f) => (
            <button
              key={f.name}
              onClick={() => setActiveFile(f.name)}
              className={`flex items-center gap-2 rounded-t-lg px-3 py-1.5 text-xs font-mono transition-colors ${
                activeFile === f.name
                  ? 'bg-[#050913] text-[#00d4ff] border-t-2 border-[#00d4ff] font-semibold'
                  : 'text-[#64748b] hover:text-white'
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>{f.name}</span>
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 rounded bg-[#1e293b] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#2a3a52] transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saved ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded bg-[#1e293b] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#2a3a52] transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#00e676]" />
                <span className="text-[#00e676]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={() => onExecuteCode(activeCode)}
            className="flex items-center gap-1 rounded bg-[#00e676] px-3 py-1 text-xs font-bold text-slate-950 hover:bg-[#00e676]/90 transition-colors cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-slate-950" />
            <span>Run in Terminal</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Line Numbers */}
        <div className="w-12 select-none border-r border-[#1e293b] bg-[#070c17] py-3 text-right pr-3 font-mono text-xs text-[#475569] overflow-hidden">
          {lines.map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code Textarea Area */}
        <div className="flex-1 relative overflow-auto p-3 bg-[#050913]">
          <textarea
            value={activeCode}
            onChange={(e) => onChangeCode(e.target.value)}
            spellCheck={false}
            className="w-full h-full min-h-[350px] bg-transparent text-xs font-mono text-[#38bdf8] focus:outline-none resize-none leading-6 selection:bg-[#00d4ff]/30"
          />
        </div>
      </div>

      {/* Bottom Jules Check Bar in Editor */}
      <div className="border-t border-[#1e293b] bg-[#090e1a] p-3">
        <JulesCodeCheck
          codeSnippet={activeCode}
          onCodePatched={(fixed) => onChangeCode(fixed)}
        />
      </div>
    </div>
  );
};
