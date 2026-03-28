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
        const response = await api.post<CheckoutResponse>('/billing/checkout-link', { tier });
        if (!cancelled) {
          window.location.href = response.checkout_url;
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Secure Square checkout is temporarily unavailable.');
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
    <div className="min-h-screen app-bg-premium text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full glass-strong rounded-3xl p-8 text-center border border-white/10">
        <div className="w-16 h-16 mx-auto rounded-full bg-pink-500/10 flex items-center justify-center mb-5">
          <LoaderCircle className="w-7 h-7 text-pink-400 animate-spin" />
        </div>
        <h1 className="text-3xl font-black mb-3">{label}</h1>
        <p className="text-gray-300 leading-relaxed">
          Preparing your secure account-bound Square checkout. This keeps the payment tied to your
          YouAndiNotAi account instead of sending you to an anonymous public payment link.
        </p>
        {error ? (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : (
          <p className="mt-6 text-sm text-gray-400">You will be redirected automatically.</p>
        )}
        <div className="mt-6 flex justify-center">
          <Link
            to="/app/profile"
            className="inline-flex items-center gap-2 text-pink-300 hover:text-white transition-colors no-underline"
          >
            Back to profile <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
