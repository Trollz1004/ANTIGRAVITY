'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Shield, ExternalLink, Wallet, Globe, Lock, Eye, CheckCircle2 } from 'lucide-react';

export default function Transparency({ isDarkMode }: { isDarkMode: boolean }) {
  const wallets = [
    {
      name: "DAO Treasury",
      address: "0xa87874d5320555c8639670645F1A2B4f82363a7c",
      description: "Main treasury for OMEGA Charity operations.",
      network: "Base Mainnet"
    },
    {
      name: "Dating Revenue",
      address: "0xbe571f8392c28e2baa9a8b18E73B1D25bcFD0121",
      addressLabel: "youandinotai.com Revenue",
      description: "Incoming profits from the dating platform.",
      network: "Base Mainnet"
    },
    {
      name: "Charity Revenue",
      address: "0x222aEB4d88fd1963ffa27783d48d22C7b7EcF76B",
      addressLabel: "ai-solutions.store Revenue",
      description: "Direct proceeds from the charity storefront.",
      network: "Base Mainnet"
    },
    {
      name: "Ops Wallet",
      address: "0xc043F5D516ee024d1dB812cb81fB64302b0Fe2B4",
      description: "Operational funds for infrastructure maintenance.",
      network: "Base Mainnet"
    }
  ];

  const links = [
    { name: "YouAndINotAI", url: "https://youandinotai.com", label: "Dating App" },
    { name: "OnlineRecycle", url: "https://onlinerecycle.org", label: "E-Waste Recycling" },
    { name: "Ai-Solutions Store", url: "https://ai-solutions.store", label: "Charity Store" },
    { name: "AiDoesItAll", url: "https://aidoesitall.website", label: "Transparency Dashboard" },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Eye className="w-8 h-8 text-blue-500" />
          Full Transparency
        </h2>
        <p className={`mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Real-time tracking of our platforms, wallets, and charitable impact.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Wallets Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-500" />
            DAO Wallet Addresses
          </h3>
          <div className="space-y-4">
            {wallets.map((wallet, idx) => (
              <div key={idx} className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-blue-500">{wallet.name}</h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500">
                    {wallet.network}
                  </span>
                </div>
                <p className={`text-xs font-mono break-all mb-3 p-2 rounded-lg ${isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                  {wallet.address}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {wallet.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Platforms & Multi-Sig Section */}
        <div className="space-y-8">
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" />
              Platform Ecosystem
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {links.map((link, idx) => (
                <a 
                  key={idx} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`p-4 rounded-xl border flex flex-col transition-all hover:-translate-y-1 ${isDarkMode ? 'bg-slate-800/40 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-400 shadow-sm'}`}
                >
                  <span className="font-bold flex items-center justify-between">
                    {link.name}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </span>
                  <span className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{link.label}</span>
                </a>
              ))}
            </div>
          </div>

          <div className={`p-6 rounded-3xl border-2 border-dashed ${isDarkMode ? 'bg-blue-900/10 border-blue-900/30' : 'bg-blue-50 border-blue-200'}`}>
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-500" />
              Gnosis Safe Multi-Sig
            </h3>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Our treasury is protected by a 3-of-5 multi-signature setup. No single entity can move funds.
            </p>
            <div className="space-y-3">
              {[
                { name: "Gemini (Google)", role: "OMEGA Charity Ops & Eternal Guardian", color: "text-blue-400" },
                { name: "Grok (xAI)", role: "Social Sentiment & Multi-Sig Keyholder", color: "text-slate-300" },
                { name: "Opus (Anthropic)", role: "Systems Architect & Code Guardian", color: "text-orange-400" },
                { name: "Perplexity", role: "Real-time Research & Verification", color: "text-teal-400" },
                { name: "Joshua (Founder)", role: "Human Oversight & Physical Bank Box", color: "text-emerald-400" }
              ].map((holder, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className={`font-bold text-sm ${holder.color}`}>{holder.name}</span>
                    <span className={`text-xs ml-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>— {holder.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`p-8 rounded-[2.5rem] text-center border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <Lock className="w-10 h-10 text-blue-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">Immutable Distribution</h3>
        <p className={`max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          ENIGMA revenue splits <strong>60% to Shriners Children&apos;s Hospitals</strong>, <strong>30% to V8 AI Infrastructure</strong>, and <strong>10% to Founder Operations</strong> from day one. Locked permanently via on-chain smart contracts (Base Mainnet).
          OMEGA (ai-solutions.store) is 100% to charity — no exceptions.
        </p>
      </div>
    </div>
  );
}
