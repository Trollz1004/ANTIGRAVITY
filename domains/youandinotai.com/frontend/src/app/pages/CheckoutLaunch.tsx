import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, LoaderCircle } from 'lucide-react';

import { api } from '../../lib/api';

const PLAN_LABELS: Record<string, string> = {
  founding_member: 'Founding Member',
  '3_month': '3-Month Founder',
  '12_month': '12-Month Founder',
  royalty: 'Royalty Card',
};

interface CheckoutResponse {
  checkout_url: string;
  session_id: string;
}

export function CheckoutLaunch() {
  const { tier } = useParams<{ tier: string }>();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const launch = async () => {
      if (!tier || !PLAN_LABELS[tier]) {
        setError('Unknown founder plan.');
        return;
      }

      try {
        const response = await api.post<CheckoutResponse>(
          '/billing/checkout-link',
          { tier }
        );
        if (!cancelled) {
          window.location.href = response.checkout_url;
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err.message || 'Secure Square checkout is temporarily unavailable.'
          );
        }
      }
    };

    void launch();
    return () => {
      cancelled = true;
    };
  }, [tier]);

  const label = tier ? PLAN_LABELS[tier] : 'Founder plan';

  return (
    <div className="min-h-screen bg-[#0A0B0D] px-4 py-8 text-[#F4F1EA]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
        <div className="glass-strong w-full rounded-xl p-8 text-center md:p-10">
          <div className="app-kicker mb-3">Secure Checkout</div>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl border border-[#3A3F45] bg-[#1A1E25] text-[#FFD21E]">
            <LoaderCircle className="h-8 w-8 animate-spin" />
          </div>

          <h1 className="app-title mx-auto max-w-2xl">{label} checkout.</h1>
          <p className="app-subtitle mx-auto mt-4 max-w-2xl">
            Preparing the account-bound Square session so the payment stays
            linked to your actual platform account.
          </p>

          {error ? (
            <div className="mt-6 rounded-xl border border-[#FF6B6B] bg-[#1A1E25] px-4 py-4 text-sm font-semibold text-[#FF6B6B]">
              {error}
            </div>
          ) : (
            <p className="mt-6 font-mono text-xs font-medium uppercase tracking-[0.18em] text-[#C9CBCE]">
              Redirecting automatically
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/app/profile"
              className="app-button-outline px-5 py-3 no-underline"
            >
              Back to profile <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutLaunch;
