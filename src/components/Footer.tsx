import React from 'react';
import { Layers, Github, Twitter, ShieldCheck, Heart } from 'lucide-react';
import { LegalModalType } from './LegalModals';

interface FooterProps {
  onOpenLegal: (type: LegalModalType) => void;
  onLaunchWorkstation: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenLegal,
  onLaunchWorkstation,
}) => {
  return (
    <footer className="border-t border-[#1e293b] bg-[#070b14] text-[#8ba3c7]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30">
                <Layers className="h-5 w-5" />
              </div>
              <span className="font-bold text-white text-base tracking-tight">
                AI SOLUTIONS STORE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#94a3b8] max-w-md leading-relaxed">
              Home of OpusPawClaw — the dual-agent AI workstation built for developers,
              creators, and technical founders. Powered by local-first privacy, multi-LLM
              orchestration, and Stripe billing.
            </p>
            <div className="text-xs text-[#64748b]">
              Operated by <strong className="text-white">Trash Or Treasure Online Recycler LLC</strong> (FL).
            </div>
          </div>

          {/* Navigation Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Platform & Tools
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onLaunchWorkstation}
                  className="hover:text-[#00d4ff] transition-colors"
                >
                  OpusPawClaw Desktop Workstation
                </button>
              </li>
              <li>
                <a href="#features" className="hover:text-[#00d4ff] transition-colors">
                  Dual-Agent Boss Mode
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-[#00d4ff] transition-colors">
                  Pro & Enterprise Pricing
                </a>
              </li>
              <li>
                <button
                  onClick={onLaunchWorkstation}
                  className="hover:text-[#00d4ff] transition-colors text-left"
                >
                  Jules Enterprise Code Check
                </button>
              </li>
              <li>
                <button
                  onClick={onLaunchWorkstation}
                  className="hover:text-[#00d4ff] transition-colors text-left text-[#00e676]"
                >
                  PawClaw Kids Sandbox
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Legal & Support
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onOpenLegal('privacy')}
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('terms')}
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('refund')}
                  className="hover:text-white transition-colors"
                >
                  Refund Policy (14 Days)
                </button>
              </li>
              <li>
                <a
                  href="mailto:support@aidoesitall.website"
                  className="hover:text-white transition-colors text-[#38bdf8]"
                >
                  support@aidoesitall.website
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#1e293b] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748b]">
          <div>
            &copy; {new Date().getFullYear()} Trash Or Treasure Online Recycler LLC. All rights reserved.
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com/youandinotai"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-[#00d4ff] transition-colors"
            >
              <Twitter className="h-4 w-4" />
              <span>@youandinotai</span>
            </a>
            <a
              href="https://github.com/Ai-Solutions-Store"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>Ai-Solutions-Store</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
