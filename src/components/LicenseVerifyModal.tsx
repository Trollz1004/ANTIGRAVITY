import React, { useState } from 'react';
import {
  X,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { verifyLicenseKey } from '../lib/checkout';
import { LicenseRecord } from '../types';

interface LicenseVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated?: (license: LicenseRecord) => void;
}

export const LicenseVerifyModal: React.FC<LicenseVerifyModalProps> = ({
  isOpen,
  onClose,
  onActivated,
}) => {
  const [inputKey, setInputKey] = useState('OPUS-PRO-DEMO-2026-X99F');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    license?: LicenseRecord;
    reason?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Simulate API call to POST https://api.aidoesitall.website/v1/verify-license
    await new Promise((resolve) => setTimeout(resolve, 600));

    const check = verifyLicenseKey(inputKey);
    setLoading(false);
    setResult(check);

    if (check.valid && check.license && onActivated) {
      onActivated(check.license);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#2a3a52] bg-[#0f172a] p-6 sm:p-7 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[#64748b] hover:bg-[#1e293b] hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffb300]/10 text-[#ffb300] border border-[#ffb300]/30">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              License Verification Engine
            </h3>
            <p className="text-xs text-[#64748b] font-mono">
              POST api.aidoesitall.website/v1/verify-license
            </p>
          </div>
        </div>

        <form onSubmit={handleVerify} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#94a3b8] mb-1.5">
              Enter License Activation Key
            </label>
            <input
              type="text"
              required
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="w-full rounded-xl border border-[#2a3a52] bg-[#111827] px-3.5 py-2.5 text-sm font-mono text-white placeholder-[#475569] focus:border-[#00d4ff] focus:outline-none uppercase"
              placeholder="OPUS-PRO-XXXX-XXXX-XXXX"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00d4ff] py-3 text-sm font-bold text-slate-950 hover:bg-[#00d4ff]/90 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Querying Cloudflare Edge License Database...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Verify License</span>
              </>
            )}
          </button>
        </form>

        {/* Verification Result */}
        {result && (
          <div className="mt-5">
            {result.valid ? (
              <div className="rounded-xl border border-[#00e676]/40 bg-[#00e676]/10 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#00e676]">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>License Confirmed Active!</span>
                </div>
                <div className="mt-2 text-xs space-y-1 font-mono text-[#cbd5e1]">
                  <div>Tier: {result.license?.tier.toUpperCase()}</div>
                  <div>Account: {result.license?.customerEmail}</div>
                  <div>Platform: {result.license?.platform}</div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 p-4 text-xs text-[#fca5a5]">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="h-4 w-4" />
                  <span>Validation Failed</span>
                </div>
                <p className="mt-1">{result.reason}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-[#1e293b] text-center text-xs text-[#64748b]">
          Use <code className="text-[#38bdf8]">OPUS-PRO-DEMO-2026-X99F</code> or subscribe to test.
        </div>
      </div>
    </div>
  );
};
