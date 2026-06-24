import React from 'react';
import { CreditCard, ExternalLink, ShieldCheck } from 'lucide-react';

export default function SupportCollectables({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
          <ShieldCheck className="w-8 h-8 text-rose-500" />
          Membership Support
        </h2>
        <p className={`mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Manage membership, verification, support access, account safety, and platform checkout from one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Member support options */}
        <div
          className={`p-8 rounded-3xl border relative overflow-hidden ${
            isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-xl shadow-rose-900/5'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-6 shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Member Support</h3>
          <p className={`mb-6 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Get help with account access, profile safety, verification status, receipts, and membership questions.
          </p>
          <a
            href="/support"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full py-3 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors gap-2"
          >
            Open Support <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Checkout and verification */}
        <div
          className={`p-8 rounded-3xl border relative overflow-hidden ${
            isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-xl shadow-purple-900/5'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6 shadow-inner">
            <CreditCard className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Verification & Membership</h3>
          <p className={`mb-6 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Use Square checkout for membership and verification receipts. Keep your account status current so support
            can resolve issues faster.
          </p>
          <button className="inline-flex items-center justify-center w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors gap-2">
            Manage Checkout <CreditCard className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
