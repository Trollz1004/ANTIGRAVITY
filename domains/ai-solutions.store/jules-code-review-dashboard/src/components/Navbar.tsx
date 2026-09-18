import React, { useState } from 'react';
import { ViewMode } from '../types';
import {
  Layers,
  Sparkles,
  KeyRound,
  CreditCard,
  Grid,
  Laptop,
  CheckCircle2,
} from 'lucide-react';
import { getStoredLicenses } from '../lib/checkout';

interface NavbarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onOpenCheckout: (tier: 'pro' | 'enterprise') => void;
  onOpenLicenseVerify: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenCheckout,
  onOpenLicenseVerify,
}) => {
  const [activeLicenses] = useState(() => getStoredLicenses());
  const hasActiveLicense = activeLicenses.length > 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2a3a52]/80 bg-[#0a0f1a]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div
          id="nav-brand"
          onClick={() => onNavigate('store')}
          className="flex cursor-pointer items-center gap-3 group"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#00d4ff] via-[#6366f1] to-[#e040fb] p-[1.5px] shadow-lg shadow-[#00d4ff]/15 group-hover:shadow-[#00d4ff]/30 transition-all">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0a0f1a]">
              <Layers className="h-5 w-5 text-[#00d4ff]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white group-hover:text-[#00d4ff] transition-colors">
                AI SOLUTIONS STORE
              </span>
              <span className="rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 px-2 py-0.5 text-[10px] font-semibold text-[#00d4ff]">
                aidoesitall.website
              </span>
            </div>
            <p className="text-[11px] text-[#6b82a6] font-mono">
              OpusPawClaw Flagship Hub
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <button
            id="nav-btn-store"
            onClick={() => onNavigate('store')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentView === 'store'
                ? 'text-white bg-[#1a2332] border border-[#2a3a52]'
                : 'text-[#8ba3c7] hover:text-white hover:bg-[#1a2332]/50'
            }`}
          >
            Storefront
          </button>

          <button
            id="nav-btn-catalog"
            onClick={() => onNavigate('catalog')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentView === 'catalog'
                ? 'text-white bg-[#1a2332] border border-[#2a3a52]'
                : 'text-[#8ba3c7] hover:text-white hover:bg-[#1a2332]/50'
            }`}
          >
            <Grid className="h-4 w-4 text-[#e040fb]" />
            Products Catalog
          </button>

          <button
            id="nav-btn-workstation"
            onClick={() => onNavigate('workstation')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 relative ${
              currentView === 'workstation'
                ? 'text-white bg-gradient-to-r from-[#00d4ff]/20 to-[#e040fb]/20 border border-[#00d4ff]/40 shadow-sm shadow-[#00d4ff]/20'
                : 'text-[#00d4ff] hover:text-white hover:bg-[#1a2332]/50'
            }`}
          >
            <Laptop className="h-4 w-4 text-[#00d4ff]" />
            <span>Launch Workstation</span>
            <span className="flex h-2 w-2 rounded-full bg-[#00e676] animate-pulse" />
          </button>
        </nav>

        {/* Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="btn-verify-license"
            onClick={onOpenLicenseVerify}
            className="flex items-center gap-1.5 rounded-lg border border-[#2a3a52] bg-[#111827] px-3 py-1.5 text-xs font-medium text-[#8ba3c7] hover:border-[#38bdf8]/50 hover:text-white transition-colors"
            title="Verify License Key against api.aidoesitall.website"
          >
            <KeyRound className="h-3.5 w-3.5 text-[#ffb300]" />
            <span className="hidden sm:inline">Verify License</span>
            {hasActiveLicense && (
              <span className="flex items-center gap-1 text-[#00e676] font-semibold text-[10px]">
                <CheckCircle2 className="h-3 w-3" />
                Active
              </span>
            )}
          </button>

          <button
            id="btn-nav-gopro"
            onClick={() => onOpenCheckout('pro')}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#0284c7] px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#00d4ff]/20 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <CreditCard className="h-4 w-4 text-white" />
            <span>Go Pro — $24/mo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
