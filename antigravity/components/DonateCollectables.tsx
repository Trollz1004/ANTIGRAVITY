import React from 'react';
import { Heart, Gift, ExternalLink, CreditCard } from 'lucide-react';

export default function DonateCollectables({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Heart className="w-8 h-8 text-rose-500" />
          Donate & Collectables
        </h2>
        <p className={`mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Support Shriners Children&apos;s Hospitals directly or purchase exclusive digital collectables. 100% of proceeds go to charity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Direct Donation */}
        <div className={`p-8 rounded-3xl border relative overflow-hidden ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-xl shadow-rose-900/5'}`}>
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-6 shadow-inner">
            <Heart className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Direct Donation</h3>
          <p className={`mb-6 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Make a direct, tax-deductible donation to Shriners Children&apos;s Hospitals. Your contribution helps provide life-changing care to children regardless of the families&apos; ability to pay.
          </p>
          <a 
            href="https://donate.lovetotherescue.org/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full py-3 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors gap-2"
          >
            Donate to Shriners <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Collectables */}
        <div className={`p-8 rounded-3xl border relative overflow-hidden ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-xl shadow-purple-900/5'}`}>
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6 shadow-inner">
            <Gift className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Digital Collectables</h3>
          <p className={`mb-6 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Purchase exclusive AI-generated digital collectables (NFTs) on the Base network. 100% of the initial sale and all secondary royalties are routed to the OMEGA charity wallet.
          </p>
          <button className="inline-flex items-center justify-center w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors gap-2">
            View Collection <CreditCard className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
