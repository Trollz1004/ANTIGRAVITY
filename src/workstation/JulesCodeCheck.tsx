import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { JulesScanResult } from '../types';
import { runJulesCodeCheck } from '../lib/checkout';

interface JulesCodeCheckProps {
  codeSnippet: string;
  onCodePatched?: (newCode: string) => void;
  onDismiss?: () => void;
}

export const JulesCodeCheck: React.FC<JulesCodeCheckProps> = ({
  codeSnippet,
  onCodePatched,
  onDismiss,
}) => {
  const [status, setStatus] = useState<'prompt' | 'scanning' | 'complete' | 'dismissed'>('prompt');
  const [scanResult, setScanResult] = useState<JulesScanResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [patched, setPatched] = useState(false);

  if (status === 'dismissed') return null;

  const handleRunScan = async () => {
    setStatus('scanning');
    try {
      const result = await runJulesCodeCheck(codeSnippet);
      setScanResult(result);
      setStatus('complete');
    } catch (e) {
      setStatus('prompt');
    }
  };

  const handleApplyAutoFix = () => {
    // Apply automated remediation patch
    let fixed = codeSnippet;
    // Fix hardcoded secret if present
    fixed = fixed.replace(
      /'sk-[a-zA-Z0-9_-]{20,}'|"sk-[a-zA-Z0-9_-]{20,}"/g,
      'process.env.STRIPE_SECRET_KEY'
    );
    // Wrap async in try catch if missing
    if (fixed.includes('async function') && !fixed.includes('try {')) {
      fixed = fixed.replace(
        /(async function[^{]+\{)([\s\S]+?)(\}\s*$)/,
        '$1\n  try {\n  $2\n  } catch (error) {\n    console.error("Execution error:", error);\n    throw error;\n  }\n$3'
      );
    }
    setPatched(true);
    if (onCodePatched) {
      onCodePatched(fixed);
    }
    // Re-verify
    runJulesCodeCheck(fixed).then((res) => {
      setScanResult(res);
    });
  };

  return (
    <div className="mt-3 rounded-xl border border-[#2a3a52] bg-[#0c1424] p-3 sm:p-4 text-xs">
      {status === 'prompt' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">
                Would you like a free Enterprise-level CODE CHECK?
              </div>
              <div className="mt-0.5 text-[#94a3b8] text-[11px] leading-relaxed">
                The founder is personally providing this code security check as a complimentary service.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handleRunScan}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#0284c7] px-3.5 py-1.5 font-bold text-slate-950 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md shadow-[#00d4ff]/20"
            >
              <ShieldCheck className="h-4 w-4 fill-slate-950 text-white" />
              <span>Run Security Check</span>
            </button>
            <button
              onClick={() => {
                setStatus('dismissed');
                if (onDismiss) onDismiss();
              }}
              className="rounded-lg p-1.5 text-[#64748b] hover:bg-[#1a2332] hover:text-white transition-colors"
              title="Dismiss check"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {status === 'scanning' && (
        <div className="flex items-center gap-3 py-2 text-[#38bdf8]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <div>
            <div className="font-semibold text-white">
              Jules Security Engine analyzing AST & security boundaries...
            </div>
            <div className="text-[11px] text-[#64748b]">
              Auditing OWASP Top 10, secret detection, XSS sinks, memory leaks, and timing flaws
            </div>
          </div>
        </div>
      )}

      {status === 'complete' && scanResult && (
        <div>
          {/* Header result */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e293b] pb-2.5">
            <div className="flex items-center gap-2.5">
              {scanResult.status === 'approved' ? (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00e676]/20 text-[#00e676]">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f59e0b]/20 text-[#f59e0b]">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              )}
              <div>
                <span
                  className={`font-bold text-xs ${
                    scanResult.status === 'approved'
                      ? 'text-[#00e676]'
                      : 'text-[#f59e0b]'
                  }`}
                >
                  {scanResult.verifiedBadge || 'Jules Code Sentinel Advisory'}
                </span>
                <span className="text-[10px] text-[#64748b] ml-2 font-mono">
                  {scanResult.rulesChecked} rules in {scanResult.scanTimeMs}ms • Health Score: {scanResult.score}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {scanResult.status === 'failed' && !patched && (
                <button
                  onClick={handleApplyAutoFix}
                  className="flex items-center gap-1 rounded bg-[#00d4ff] px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-[#00d4ff]/90 transition-colors"
                >
                  <Wrench className="h-3 w-3" />
                  <span>1-Click Auto-Fix</span>
                </button>
              )}

              {patched && (
                <span className="rounded bg-[#00e676]/20 px-2 py-0.5 text-[10px] font-semibold text-[#00e676]">
                  Remediation Patch Applied
                </span>
              )}

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-[11px] text-[#8ba3c7] hover:text-white"
              >
                <span>{showDetails ? 'Hide details' : 'View checks'}</span>
                {showDetails ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>

          <p className="mt-2 text-[11px] text-[#cbd5e1] leading-relaxed">
            {scanResult.summary}
          </p>

          {/* Breakdown of checks */}
          {showDetails && (
            <div className="mt-3 space-y-1.5 pt-2 border-t border-[#1e293b]">
              {scanResult.checks.map((check) => (
                <div
                  key={check.id}
                  className={`rounded-lg p-2 flex items-start justify-between gap-2 border ${
                    check.passed
                      ? 'bg-[#111827]/40 border-[#1e293b] text-[#94a3b8]'
                      : 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#fca5a5]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold">
                      {check.passed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#00e676]" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-[#ef4444]" />
                      )}
                      <span className="font-mono text-[10px]">{check.id}</span>
                      <span>{check.name}</span>
                    </div>
                    <div className="text-[10px] mt-0.5 ml-5">{check.detail}</div>
                  </div>

                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono ${
                      check.passed
                        ? 'bg-[#00e676]/10 text-[#00e676]'
                        : 'bg-[#ef4444]/20 text-[#ef4444]'
                    }`}
                  >
                    {check.passed ? 'PASSED' : check.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
