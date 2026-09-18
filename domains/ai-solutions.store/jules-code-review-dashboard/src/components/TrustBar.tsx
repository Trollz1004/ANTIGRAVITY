import React from 'react';
import { ShieldCheck, Lock, Cpu, Server, CheckCircle2 } from 'lucide-react';

export const TrustBar: React.FC = () => {
  return (
    <div className="border-y border-[#1e293b] bg-[#0d1526]/90 py-8 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Item 1 */}
          <div className="flex items-center gap-4 rounded-xl border border-[#2a3a52]/60 bg-[#111827]/40 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                Powered by Claude, Gemini, GPT & more
              </div>
              <div className="text-xs text-[#94a3b8] mt-0.5">
                Frontier model orchestration with unified streaming API
              </div>
            </div>
          </div>

          {/* Item 2 */}
          <div className="flex items-center gap-4 rounded-xl border border-[#2a3a52]/60 bg-[#111827]/40 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/30">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                100% local-first architecture
              </div>
              <div className="text-xs text-[#94a3b8] mt-0.5">
                Your private API keys never leave your local machine
              </div>
            </div>
          </div>

          {/* Item 3 */}
          <div className="flex items-center gap-4 rounded-xl border border-[#2a3a52]/60 bg-[#111827]/40 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#e040fb]/10 text-[#e040fb] border border-[#e040fb]/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                Jules Enterprise Code Audits
              </div>
              <div className="text-xs text-[#94a3b8] mt-0.5">
                Automated security scanning & OWASP vulnerability prevention
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
