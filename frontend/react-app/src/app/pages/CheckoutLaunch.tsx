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
    <div className="mesh-gradient min-h-screen px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
        <div className="glass-strong glass-highlight yellow-glow w-full rounded-[2px] p-8 text-center md:p-10">
          <div className="app-kicker mb-3">Secure Checkout</div>
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[2px] border border-[#ffd700] bg-[#1e1e1e] text-[#ffd700]">
            <LoaderCircle className="h-8 w-8 animate-spin" />
          </div>

          <h1 className="app-title mx-auto max-w-2xl">
            {label.toLowerCase()} checkout.
          </h1>
          <p className="app-subtitle mx-auto mt-4 max-w-2xl">
            Preparing the account-bound Square session so the payment stays
            linked to your actual platform account instead of a generic public
            link.
          </p>

          {error ? (
            <div className="mt-6 rounded-[2px] border border-[#ff2a2a] bg-[#1e1e1e] px-4 py-4 text-sm font-semibold text-[#ededed]">
              {error}
            </div>
          ) : (
            <p className="mono mt-6 text-sm font-bold uppercase tracking-[0.18em] text-[#a1a1aa]">
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
