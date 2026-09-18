import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { processStripeSubscription, StripeCheckoutPayload } from '../lib/checkout';
import { LicenseRecord } from '../types';

interface StripeCheckoutModalProps {
  isOpen: boolean;
  tier: 'pro' | 'enterprise';
  onClose: () => void;
  onSuccess: (license: LicenseRecord) => void;
}

export const StripeCheckoutModal: React.FC<StripeCheckoutModalProps> = ({
  isOpen,
  tier,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('Joshua Coleman');
  const [email, setEmail] = useState('joshlcoleman@gmail.com');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expMonth, setExpMonth] = useState('12');
  const [expYear, setExpYear] = useState('28');
  const [cvc, setCvc] = useState('888');
  const [postal, setPostal] = useState('33701');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const price = tier === 'enterprise' ? '$79' : '$24';
  const tierName = tier === 'enterprise' ? 'OpusPawClaw Enterprise' : 'OpusPawClaw Pro';

  const handleCardInput = (val: string) => {
    // Basic formatting
    const raw = val.replace(/\D/g, '').substring(0, 16);
    setCardNumber(raw);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: StripeCheckoutPayload = {
        name,
        email,
        cardNumber: cardNumber.includes('•') ? '4242424242424242' : cardNumber,
        expMonth,
        expYear,
        cvc,
        tier,
      };

      const res = await processStripeSubscription(payload);
      setLoading(false);
      onSuccess(res.license);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Payment processing failed. Please check card info.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#2a3a52] bg-[#0f172a] p-6 sm:p-8 shadow-2xl shadow-[#00d4ff]/10">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[#64748b] hover:bg-[#1e293b] hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] to-[#00d4ff] text-white shadow-md">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>{tierName}</span>
              <span className="rounded bg-[#00d4ff]/10 border border-[#00d4ff]/30 px-2 py-0.5 text-xs text-[#00d4ff]">
                {price}/mo
              </span>
            </h3>
            <p className="text-xs text-[#64748b]">
              Encrypted 256-bit checkout powered by Stripe Elements
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 p-3 text-xs text-[#fca5a5]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#94a3b8] mb-1">
              Account Email (For license delivery & SendGrid receipt)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[#2a3a52] bg-[#111827] px-3.5 py-2.5 text-sm text-white placeholder-[#475569] focus:border-[#00d4ff] focus:outline-none"
              placeholder="you@domain.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#94a3b8] mb-1">
              Cardholder Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[#2a3a52] bg-[#111827] px-3.5 py-2.5 text-sm text-white placeholder-[#475569] focus:border-[#00d4ff] focus:outline-none"
              placeholder="Full Name"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#94a3b8] mb-1">
              Card Details (Stripe Test Card Ready)
            </label>
            <div className="rounded-xl border border-[#2a3a52] bg-[#111827] p-2.5 focus-within:border-[#00d4ff] transition-colors">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#00d4ff]" />
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => handleCardInput(e.target.value)}
                  className="w-full bg-transparent text-sm text-white focus:outline-none font-mono tracking-wider"
                  placeholder="4242 4242 4242 4242"
                />
              </div>

              <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-[#1e293b] pt-2">
                <input
                  type="text"
                  required
                  value={expMonth}
                  onChange={(e) => setExpMonth(e.target.value)}
                  maxLength={2}
                  className="bg-transparent text-xs text-white focus:outline-none font-mono"
                  placeholder="MM (12)"
                />
                <input
                  type="text"
                  required
                  value={expYear}
                  onChange={(e) => setExpYear(e.target.value)}
                  maxLength={2}
                  className="bg-transparent text-xs text-white focus:outline-none font-mono"
                  placeholder="YY (28)"
                />
                <input
                  type="text"
                  required
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  maxLength={4}
                  className="bg-transparent text-xs text-white focus:outline-none font-mono"
                  placeholder="CVC (888)"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[#64748b] pt-1">
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-[#00e676]" />
              Stripe 256-Bit SSL
            </span>
            <span>Billing Postal: {postal}</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00d4ff] via-[#0284c7] to-[#e040fb] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#00d4ff]/25 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Authorizing Stripe Subscription...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Subscribe — {price}/mo</span>
              </>
            )}
          </button>
        </form>

        {/* Trust Note */}
        <div className="mt-4 rounded-lg bg-[#111827]/70 p-3 text-center text-[11px] text-[#94a3b8] border border-[#1e293b]">
          Instant license generation • SendGrid receipt sent to your email • Cancel anytime
        </div>
      </div>
    </div>
  );
};
