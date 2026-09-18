import React from 'react';
import { Check, Zap, Shield, Sparkles, CreditCard, ArrowRight } from 'lucide-react';
import { PRICING_TIERS } from '../data/products';

interface PricingSectionProps {
  onOpenCheckout: (tier: 'pro' | 'enterprise') => void;
  onLaunchWorkstation: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  onOpenCheckout,
  onLaunchWorkstation,
}) => {
  return (
    <section id="pricing" className="py-24 bg-[#0a0f1a] relative border-t border-[#1e293b]">
      {/* Background glow behind Pro */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[400px] w-[500px] rounded-full bg-[#00d4ff]/10 blur-[140px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ffb300]/30 bg-[#ffb300]/10 px-3 py-1 text-xs font-semibold text-[#ffb300] mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Transparent, Provider-Agnostic Pricing
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Choose your engine. Scale your output.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#94a3b8]">
            Bring your own API keys for zero markup, or use our pooled enterprise proxy
            for instant turn-key orchestration across all frontier models.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {PRICING_TIERS.map((tier) => {
            const isPro = tier.id === 'pro';
            return (
              <div
                key={tier.id}
                className={`relative flex flex-col justify-between rounded-2xl p-7 sm:p-8 transition-all duration-300 ${
                  isPro
                    ? 'border-2 border-[#00d4ff] bg-gradient-to-b from-[#111c30] to-[#0d1526] shadow-2xl shadow-[#00d4ff]/20 scale-105 z-10'
                    : 'border border-[#2a3a52] bg-[#111827]/80 hover:border-[#38bdf8]/40'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#00d4ff] to-[#e040fb] px-4 py-1 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-md">
                    {tier.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
                    {isPro ? (
                      <Zap className="h-6 w-6 text-[#00d4ff]" />
                    ) : tier.id === 'enterprise' ? (
                      <Shield className="h-6 w-6 text-[#ffb300]" />
                    ) : (
                      <span className="text-xs font-mono text-[#64748b]">BYOK</span>
                    )}
                  </div>

                  <p className="mt-3 text-sm text-[#94a3b8] min-h-[40px]">
                    {tier.description}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white">
                      {tier.price}
                    </span>
                    <span className="text-sm font-medium text-[#64748b]">
                      {tier.period}
                    </span>
                  </div>

                  {/* Feature list */}
                  <div className="mt-8 space-y-3.5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                      Included capabilities
                    </div>
                    {tier.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                            isPro
                              ? 'bg-[#00d4ff]/20 text-[#00d4ff]'
                              : 'bg-[#2a3a52] text-[#94a3b8]'
                          }`}
                        >
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                        <span className="text-xs sm:text-sm text-[#cbd5e1] leading-tight">
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#1e293b]">
                  {tier.id === 'starter' ? (
                    <button
                      onClick={onLaunchWorkstation}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#2a3a52] bg-[#1a2332] py-3 text-sm font-semibold text-white hover:bg-[#233045] hover:border-[#38bdf8]/50 transition-all cursor-pointer"
                    >
                      <span>Download Free (Starter)</span>
                    </button>
                  ) : tier.id === 'pro' ? (
                    <button
                      onClick={() => onOpenCheckout('pro')}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00d4ff] via-[#0284c7] to-[#e040fb] py-3 text-sm font-bold text-white shadow-lg shadow-[#00d4ff]/25 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Start Pro Trial — $24/mo</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenCheckout('enterprise')}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#ffb300]/40 bg-[#ffb300]/10 py-3 text-sm font-semibold text-[#ffb300] hover:bg-[#ffb300]/20 transition-all cursor-pointer"
                    >
                      <span>Upgrade to Enterprise ($79/mo)</span>
                    </button>
                  )}

                  <div className="mt-2.5 text-center text-[11px] text-[#64748b]">
                    {tier.id === 'starter'
                      ? 'No card required • Unlimited local Ollama'
                      : isPro
                      ? 'Secure Stripe payment • Instant license key'
                      : 'Team seats • Dedicated private proxy'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
