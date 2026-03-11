'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Wallet, Globe, Lock, Eye, RefreshCw, CheckCircle2 } from 'lucide-react';

interface WalletData {
  address: string;
  label: string;
  role: string;
  percentage: string;
  walletType: string;
  balanceEth: string;
  basescanUrl: string;
}

interface TransparencyResponse {
  wallets: WalletData[];
  contractTxCount: number;
  contractVerified: boolean;
  network: string;
  lastUpdated: string;
}

const FALLBACK_WALLETS: WalletData[] = [
  {
    address: '0x9855B75061D4c841791382998f0CE8B2BCC965A4',
    label: 'GospelDonation.sol',
    role: 'Revenue Router',
    percentage: 'Immutable 60/30/10',
    walletType: 'Verified Smart Contract',
    balanceEth: 'Unavailable',
    basescanUrl: 'https://basescan.org/address/0x9855B75061D4c841791382998f0CE8B2BCC965A4',
  },
  {
    address: '0x8d3dEADbE2b4B857A43331D459270B5eedC7084e',
    label: "Children's Medical Care",
    role: 'Charity Fund',
    percentage: '60%',
    walletType: 'Safe Wallet',
    balanceEth: 'Unavailable',
    basescanUrl: 'https://basescan.org/address/0x8d3dEADbE2b4B857A43331D459270B5eedC7084e',
  },
  {
    address: '0xe0a42f83900af719019eBeD3D9473BE8E8f2920b',
    label: 'Mission Infrastructure + AI Ops',
    role: 'Infrastructure Treasury',
    percentage: '30%',
    walletType: 'Safe Wallet',
    balanceEth: 'Unavailable',
    basescanUrl: 'https://basescan.org/address/0xe0a42f83900af719019eBeD3D9473BE8E8f2920b',
  },
  {
    address: '0x7c3E283119718395Ef5EfBAC4F52738C2018daA7',
    label: 'Founder Operations',
    role: 'Founder Ops',
    percentage: '10%',
    walletType: 'Founder Wallet',
    balanceEth: 'Unavailable',
    basescanUrl: 'https://basescan.org/address/0x7c3E283119718395Ef5EfBAC4F52738C2018daA7',
  },
];

const links = [
  { name: 'YouAndINotAI', url: 'https://youandinotai.com', label: 'Social platform' },
  { name: 'OnlineRecycle', url: 'https://onlinerecycle.org', label: 'E-waste resale' },
  { name: 'AI-Solutions Store', url: 'https://ai-solutions.store', label: 'OMEGA storefront' },
  { name: 'AiDoesItAll', url: 'https://aidoesitall.website', label: 'Transparency dashboard' },
];

export default function Transparency({ isDarkMode }: { isDarkMode: boolean }) {
  const [wallets, setWallets] = useState<WalletData[]>(FALLBACK_WALLETS);
  const [meta, setMeta] = useState({
    contractTxCount: 0,
    contractVerified: true,
    network: 'Base Mainnet (Chain ID: 8453)',
    lastUpdated: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch('/api/transparency', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Transparency sync failed');
        }

        const payload = (await response.json()) as TransparencyResponse;
        if (cancelled) {
          return;
        }

        setWallets(payload.wallets);
        setMeta({
          contractTxCount: payload.contractTxCount,
          contractVerified: payload.contractVerified,
          network: payload.network,
          lastUpdated: payload.lastUpdated,
        });
        setError(null);
      } catch {
        if (!cancelled) {
          setError('Live wallet sync unavailable. BaseScan links remain available.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    const intervalId = window.setInterval(load, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Eye className="w-8 h-8 text-blue-500" />
          Verified Transparency
        </h2>
        <p className={`mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Only tracked wallet data and public links are shown here. Anything unverified stays labeled as untracked.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-500" />
            On-Chain Wallets
          </h3>
          <div className="space-y-4">
            {wallets.map((wallet) => (
              <div
                key={wallet.address}
                className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}
              >
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div>
                    <h4 className="font-bold text-blue-500">{wallet.label}</h4>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      {wallet.role} • {wallet.percentage}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500">
                    {wallet.walletType}
                  </span>
                </div>

                <p className={`text-xs font-mono break-all mb-3 p-2 rounded-lg ${isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                  {wallet.address}
                </p>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className={`text-xs uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      Balance
                    </p>
                    <p className="text-lg font-black">{wallet.balanceEth} {wallet.balanceEth === 'Unavailable' ? '' : 'ETH'}</p>
                  </div>

                  <a
                    href={wallet.basescanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${isDarkMode ? 'border-slate-700 hover:border-blue-500 hover:bg-slate-900' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}`}
                  >
                    BaseScan <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
              <RefreshCw className={`w-5 h-5 text-blue-500 ${loading ? 'animate-spin' : ''}`} />
              Data Status
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Network</span>
                <span className="font-bold">{meta.network}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Contract verification</span>
                <span className="font-bold">{meta.contractVerified ? 'Verified' : 'Unverified'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Contract transactions</span>
                <span className="font-bold">{meta.contractTxCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Last refresh</span>
                <span className="font-bold">
                  {meta.lastUpdated ? new Date(meta.lastUpdated).toLocaleString() : 'Waiting for first sync'}
                </span>
              </div>
            </div>

            {error && (
              <p className="text-xs text-amber-500 mt-4">{error}</p>
            )}
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" />
              Platform Links
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {links.map((link) => (
                <a
                  key={link.url}
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
        </div>
      </div>

      <div className={`p-8 rounded-[2.5rem] text-center border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <Lock className="w-10 h-10 text-blue-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">Immutable Distribution</h3>
        <p className={`max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          ENIGMA-side revenue routing is locked at 60/30/10 on Base Mainnet.
          Public dashboard claims stay limited to verifiable addresses, balances, and tracked zeroes.
        </p>
      </div>
    </div>
  );
}
