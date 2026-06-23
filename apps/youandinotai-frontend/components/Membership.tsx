'use client';

import React, { useState } from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';

import { MEMBERSHIP_PLANS } from '../lib/constants';

export default function Membership({ isDarkMode }: { isDarkMode: boolean }) {
  const [acceptedCookies, setAcceptedCookies] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [confirmedAdult, setConfirmedAdult] = useState(false);
  const canCheckout = acceptedCookies && acceptedTerms && confirmedAdult;

  function cardClass(featured: boolean): string {
    if (featured) {
      return isDarkMode
        ? 'bg-slate-950/70 border-blue-500 ring-1 ring-blue-500/40'
        : 'bg-blue-50/60 border-blue-500 ring-1 ring-blue-500/40';
    }
    return isDarkMode
      ? 'bg-slate-950/50 border-slate-800 hover:border-blue-500'
      : 'bg-slate-50 border-slate-200 hover:border-blue-400';
  }

  return (
    <section
      id="membership"
      className={`w-full min-w-0 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border ${
        isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3 mb-2">
        <Sparkles size={20} className="text-blue-500 shrink-0 mt-1" />
        <h2 className="min-w-0 text-xl md:text-2xl font-black italic tracking-tight leading-tight break-words">
          BECOME A FOUNDING MEMBER
        </h2>
      </div>
      <p className={`min-w-0 max-w-3xl leading-relaxed mb-8 break-words ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
        Pick a plan and check out securely through Square. Membership buys
        platform access, verification support, safety features, account support,
        and launch-year product value.
      </p>

      <div
        id="checkout-consent"
        className={`mb-6 rounded-[1.6rem] border p-5 ${
          isDarkMode
            ? 'border-slate-800 bg-slate-950/55'
            : 'border-slate-200 bg-orange-50'
        }`}
      >
        <div className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-blue-500">
          Required before checkout
        </div>
        <div
          className={`space-y-3 text-sm font-semibold ${
            isDarkMode ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={acceptedCookies}
              onChange={(event) => setAcceptedCookies(event.target.checked)}
              className="mt-1 h-4 w-4 accent-blue-500"
            />
            <span>
              I understand strictly necessary cookies are used for checkout,
              sign-in, fraud prevention, and account safety.{' '}
              <a href="/cookies" className="font-black underline underline-offset-4">
                Cookie Policy
              </a>
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="mt-1 h-4 w-4 accent-blue-500"
            />
            <span>
              I accept the{' '}
              <a href="/terms" className="font-black underline underline-offset-4">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="font-black underline underline-offset-4">
                Privacy Policy
              </a>
              .
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={confirmedAdult}
              onChange={(event) => setConfirmedAdult(event.target.checked)}
              className="mt-1 h-4 w-4 accent-blue-500"
            />
            <span>
              I confirm I am at least 18 years old and understand Square will
              process the membership or verification purchase.
            </span>
          </label>
        </div>
        {!canCheckout && (
          <p className={`mt-4 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            Select all three boxes to open Square checkout.
          </p>
        )}
      </div>

      <div className="grid w-full min-w-0 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {MEMBERSHIP_PLANS.map((plan) => (
          <a
            key={plan.id}
            href={canCheckout ? plan.url : '#checkout-consent'}
            target={canCheckout ? '_blank' : undefined}
            rel={canCheckout ? 'noopener noreferrer' : undefined}
            aria-disabled={!canCheckout}
            onClick={(event) => {
              if (!canCheckout) {
                event.preventDefault();
                document
                  .getElementById('checkout-consent')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
            className={`group flex min-w-0 flex-col p-6 rounded-3xl border transition-all ${
              canCheckout
                ? 'hover:-translate-y-1'
                : 'cursor-not-allowed opacity-60'
            } ${cardClass(
              plan.featured,
            )}`}
          >
            {plan.featured && (
              <span className="self-start mb-3 px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white rounded-full">
                Most Popular
              </span>
            )}
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight">{plan.price}</span>
              <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {plan.cadence}
              </span>
            </div>
            <p className="text-sm font-bold mt-3">{plan.name}</p>
            <p className={`text-sm mt-2 flex-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{plan.blurb}</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-black text-blue-500 group-hover:gap-2 transition-all">
              {canCheckout ? 'Check out' : 'Review terms first'}
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </a>
        ))}
      </div>

      <p className={`text-xs mt-6 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        Payments are processed by Square. You will be taken to a secure
        Square-hosted checkout page after confirming the required terms.
      </p>
    </section>
  );
}
