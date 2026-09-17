import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  Download,
  KeyRound,
  Laptop,
  ArrowRight,
  ShieldCheck,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { LicenseRecord } from '../types';

interface LicenseSuccessModalProps {
  license: LicenseRecord | null;
  onClose: () => void;
  onLaunchWorkstation: () => void;
}

export const LicenseSuccessModal: React.FC<LicenseSuccessModalProps> = ({
  license,
  onClose,
  onLaunchWorkstation,
}) => {
  const [copied, setCopied] = useState(false);

  if (!license) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(license.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-2xl border border-[#00d4ff]/40 bg-[#0f172a] p-6 sm:p-8 shadow-2xl shadow-[#00d4ff]/20 animate-in fade-in zoom-in-95">
        {/* Top Success Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00e676]/20 border border-[#00e676]/40 text-[#00e676] shadow-lg shadow-[#00e676]/20">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Subscription Activated!
          </h2>
          <p className="mt-1 text-sm text-[#94a3b8]">
            Welcome to <span className="text-[#00d4ff] font-semibold">{license.tier === 'enterprise' ? 'OpusPawClaw Enterprise' : 'OpusPawClaw Pro'}</span>
          </p>
        </div>

        {/* License Key Card */}
        <div className="mt-6 rounded-xl border border-[#2a3a52] bg-[#090e1a] p-4">
          <div className="flex items-center justify-between text-xs text-[#94a3b8] mb-1.5">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <KeyRound className="h-3.5 w-3.5 text-[#ffb300]" />
              Your Licensed Activation Key
            </span>
            <span className="rounded bg-[#00e676]/10 px-2 py-0.5 text-[10px] font-mono text-[#00e676]">
              STATUS: ACTIVE
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-lg border border-[#1e293b] bg-[#111827] px-3 py-2.5">
            <code className="font-mono text-base font-bold tracking-wider text-[#00d4ff] break-all">
              {license.key}
            </code>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 rounded-md bg-[#1a2332] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#23334d] hover:text-[#00d4ff] transition-colors shrink-0"
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
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-[#64748b]">
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3 text-[#38bdf8]" />
              Sent to: {license.customerEmail}
            </span>
            <span>Cloudflare Edge verified</span>
          </div>
        </div>

        {/* Download Links Section */}
        <div className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] mb-2.5">
            Desktop Downloads (v2.4 Production Build)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={() => alert(`Downloading OpusPawClaw for Windows (Installer .exe)`)}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#2a3a52] bg-[#111827] py-2.5 px-3 text-xs font-medium text-white hover:border-[#00d4ff] hover:bg-[#1a2332] transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-[#00d4ff]" />
              <span>Windows (.exe)</span>
            </button>

            <button
              onClick={() => alert(`Downloading OpusPawClaw for macOS (.dmg Apple Silicon / Intel)`)}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#2a3a52] bg-[#111827] py-2.5 px-3 text-xs font-medium text-white hover:border-[#00d4ff] hover:bg-[#1a2332] transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-[#e040fb]" />
              <span>macOS (.dmg)</span>
            </button>

            <button
              onClick={() => alert(`Downloading OpusPawClaw for Linux (.AppImage)`)}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#2a3a52] bg-[#111827] py-2.5 px-3 text-xs font-medium text-white hover:border-[#00d4ff] hover:bg-[#1a2332] transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-[#ffb300]" />
              <span>Linux (.AppImage)</span>
            </button>
          </div>
        </div>

        {/* Launch Web App Button */}
        <div className="mt-6 pt-4 border-t border-[#1e293b] flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              onClose();
              onLaunchWorkstation();
            }}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#0284c7] py-3 text-sm font-bold text-white shadow-lg shadow-[#00d4ff]/25 hover:brightness-110 transition-all cursor-pointer"
          >
            <Laptop className="h-4 w-4" />
            <span>Launch Active Workstation Now</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-[#2a3a52] text-xs font-medium text-[#8ba3c7] hover:text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
