import React from 'react';
import { X, GitCompare, ArrowRight, Check, Sparkles } from 'lucide-react';

interface CompareDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  alphaCode: string;
  betaCode: string;
  onSelectWinner: (chosenCode: string) => void;
}

export const CompareDiffModal: React.FC<CompareDiffModalProps> = ({
  isOpen,
  onClose,
  alphaCode,
  betaCode,
  onSelectWinner,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col rounded-2xl border border-[#2a3a52] bg-[#0c1424] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e040fb]/10 text-[#e040fb] border border-[#e040fb]/30">
              <GitCompare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Dual-Agent Diff & Merge Engine
              </h3>
              <p className="text-xs text-[#64748b]">
                Compare architectural implementations side-by-side and cherry-pick the optimal build
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#64748b] hover:bg-[#1e293b] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Side by side code view */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden min-h-[360px]">
          {/* Alpha Card */}
          <div className="flex flex-col rounded-xl border border-[#d97706]/40 bg-[#070c17] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#111827] px-3 py-2">
              <span className="font-bold text-xs text-[#d97706] font-mono">
                ALPHA &mdash; Claude 3.7 Output
              </span>
              <button
                onClick={() => {
                  onSelectWinner(alphaCode);
                  onClose();
                }}
                className="flex items-center gap-1 rounded bg-[#d97706] px-3 py-1 text-xs font-bold text-slate-950 hover:brightness-110 transition-all cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Merge Alpha into Editor</span>
              </button>
            </div>
            <pre className="flex-1 overflow-auto p-3 text-[11px] font-mono text-[#cbd5e1] leading-relaxed">
              <code>{alphaCode}</code>
            </pre>
          </div>

          {/* Beta Card */}
          <div className="flex flex-col rounded-xl border border-[#00d4ff]/40 bg-[#070c17] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#111827] px-3 py-2">
              <span className="font-bold text-xs text-[#00d4ff] font-mono">
                BETA &mdash; Gemini 2.5 Pro Output
              </span>
              <button
                onClick={() => {
                  onSelectWinner(betaCode);
                  onClose();
                }}
                className="flex items-center gap-1 rounded bg-[#00d4ff] px-3 py-1 text-xs font-bold text-slate-950 hover:brightness-110 transition-all cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Merge Beta into Editor</span>
              </button>
            </div>
            <pre className="flex-1 overflow-auto p-3 text-[11px] font-mono text-[#cbd5e1] leading-relaxed">
              <code>{betaCode}</code>
            </pre>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs text-[#64748b]">
          <span>Tip: You can edit or run either version directly in the Monaco Code Editor.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-[#2a3a52] text-white hover:bg-[#1e293b]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
