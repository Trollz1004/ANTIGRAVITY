import React, { useState } from 'react';
import { ShieldCheck, GraduationCap, ArrowRight, Lock, CheckCircle2, HeartHandshake } from 'lucide-react';

interface AgeGateModalProps {
  isOpen: boolean;
  onConfirmAdult: (allocation?: 'pediatric' | 'pac') => void;
  onSelectKidsMode: () => void;
}

export const AgeGateModal: React.FC<AgeGateModalProps> = ({
  isOpen,
  onConfirmAdult,
  onSelectKidsMode,
}) => {
  const [selectedAlloc, setSelectedAlloc] = useState<'pediatric' | 'pac' | undefined>(undefined);

  if (!isOpen) return null;

  const handleProceed = () => {
    if (selectedAlloc) {
      try {
        localStorage.setItem('opus_platform_contribution', selectedAlloc);
        console.log('[OpusPawClaw Onboarding] Platform contribution preference recorded locally:', {
          allocation: selectedAlloc,
          timestamp: new Date().toISOString(),
          context: 'onboarding_age_gate',
        });
      } catch {}
    }
    onConfirmAdult(selectedAlloc);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-lg">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#2a3a52] bg-[#0f172a] p-6 sm:p-8 text-center shadow-2xl shadow-[#00d4ff]/10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30 shadow-lg shadow-[#00d4ff]/10">
          <ShieldCheck className="h-8 w-8" />
        </div>

        <h2 className="mt-4 text-2xl font-bold text-white tracking-tight">
          Welcome to OpusPawClaw
        </h2>

        <p className="mt-2 text-xs text-[#94a3b8] leading-relaxed">
          OpusPawClaw is a professional dual-agent developer workstation featuring multi-model
          orchestration, terminal shells, and code execution. (COPPA compliance)
        </p>

        {/* Optional Contribution Allocation */}
        <div className="mt-5 text-left rounded-xl border border-[#2a3a52] bg-[#090e1a] p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <HeartHandshake className="h-3.5 w-3.5 text-[#00d4ff]" />
              Platform Contribution Allocation (Optional)
            </span>
            <span className="text-[10px] text-[#00e676] bg-[#00e676]/10 px-2 py-0.5 rounded font-mono">
              OPTIONAL
            </span>
          </div>
          <p className="text-[11px] text-[#64748b]">
            Select your preference for the 10% platform contribution. This choice is optional and does not affect core product functionality.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSelectedAlloc(selectedAlloc === 'pediatric' ? undefined : 'pediatric')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                selectedAlloc === 'pediatric'
                  ? 'border-[#00d4ff] bg-[#00d4ff]/15 text-white'
                  : 'border-[#1e293b] bg-[#111827] text-[#94a3b8] hover:border-[#2a3a52]'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Pediatric Medical Care</span>
                {selectedAlloc === 'pediatric' && <CheckCircle2 className="h-3 w-3 text-[#00d4ff]" />}
              </div>
              <div className="text-[10px] text-[#64748b] mt-0.5">Direct care for children</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedAlloc(selectedAlloc === 'pac' ? undefined : 'pac')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                selectedAlloc === 'pac'
                  ? 'border-[#ffb300] bg-[#ffb300]/15 text-white'
                  : 'border-[#1e293b] bg-[#111827] text-[#94a3b8] hover:border-[#2a3a52]'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Free Market Advocacy</span>
                {selectedAlloc === 'pac' && <CheckCircle2 className="h-3 w-3 text-[#ffb300]" />}
              </div>
              <div className="text-[10px] text-[#64748b] mt-0.5">Political Action Committee</div>
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <button
            onClick={handleProceed}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#0284c7] py-3 text-sm font-bold text-white shadow-lg shadow-[#00d4ff]/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <span>I am 18 or older &mdash; Launch OpusPawClaw</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={onSelectKidsMode}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#00e676]/40 bg-[#00e676]/10 py-2.5 text-sm font-semibold text-[#00e676] hover:bg-[#00e676]/20 transition-all cursor-pointer"
          >
            <GraduationCap className="h-4 w-4" />
            <span>Under 18? Take me to PawClaw Sandbox</span>
          </button>
        </div>

        <div className="mt-4 text-[10px] text-[#64748b]">
          Preferences are logged securely and locally on this device.
        </div>
      </div>
    </div>
  );
};
