import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Crown, Shield, Sparkles, Zap } from 'lucide-react';

const LANDING = 'https://youandinotai.com/?ref=clean-repo';
const AFFILIATE_BASE = 'https://youandinotai.com/';

const PLANS = [
  {
    id: 'bot_shield',
    name: 'Bot-Shield',
    price: '$1',
    blurb: 'Human checkpoint badge. Required for full trust signals.',
    checkout: '/app/verify',
    rail: 'Square',
    highlight: false,
  },
  {
    id: 'founding_member',
    name: 'Founding Member',
    price: '$14.99/mo',
    blurb: 'Locked founder rate. Account-bound checkout.',
    checkout: '/app/checkout/founding_member',
    rail: 'Square · PayPal · Cash App',
    highlight: true,
  },
  {
    id: '3_month',
    name: '3-Month Founder',
    price: '$39.99',
    blurb: 'Short-term founder access, one payment.',
    checkout: '/app/checkout/3_month',
    rail: 'Square · PayPal · Cash App',
    highlight: false,
  },
  {
    id: '12_month',
    name: '12-Month Founder',
    price: '$99.99',
    blurb: 'Best value for full-year founder access.',
    checkout: '/app/checkout/12_month',
    rail: 'Square · PayPal · Cash App',
    highlight: false,
  },
  {
    id: 'elite',
    name: 'Elite Card',
    price: '$2,500',
    blurb: 'Premium founder product. Private terms at checkout.',
    checkout: '/app/checkout/royalty',
    rail: 'Square',
    highlight: false,
  },
] as const;

export function PreOrder() {
  const [copied, setCopied] = useState(false);
  const [affCode, setAffCode] = useState('elite');

  const affiliateUrl = `${AFFILIATE_BASE}?ref=${encodeURIComponent(affCode || 'clean-repo')}`;

  const copyAff = async () => {
    try {
      await navigator.clipboard.writeText(affiliateUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="km-page mx-auto max-w-2xl px-4 py-5">
      <div className="mb-2 flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--km-accent)]">
        <Crown size={14} /> Live · Founder Plans
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">Founder Plans</h1>
      <p className="mt-2 text-sm text-[var(--km-muted)]">
        Verified-human dating is live now. Complete your{' '}
        <strong className="text-[var(--km-text)]">$1 Bot-Shield</strong> human
        check first, then choose a locked founder rate. Payments: Square primary
        · PayPal · Cash App Business. No Stripe.
      </p>

      <section className="km-card km-card-glow mt-6 p-5">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--km-muted)]">
          Live Status
        </div>
        <div className="mt-3 text-2xl font-semibold">
          We&apos;re live — Founder Plans active.
        </div>
        <a
          href={LANDING}
          target="_blank"
          rel="noreferrer"
          className="km-btn-gradient mt-5 w-full justify-center no-underline"
        >
          <Zap size={16} /> Open public landing (affiliate-safe)
        </a>
      </section>

      <section className="mt-6 grid gap-3">
        {PLANS.map(p => (
          <div
            key={p.id}
            className={`km-card p-4 ${p.highlight ? 'ring-1 ring-[var(--km-accent)]/50' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 font-semibold">
                  {p.highlight && (
                    <Sparkles size={16} className="text-[var(--km-accent)]" />
                  )}
                  {p.name}
                </div>
                <div className="mt-1 text-xl font-semibold">{p.price}</div>
                <p className="mt-1 text-sm text-[var(--km-muted)]">{p.blurb}</p>
                <div className="mt-2 text-[0.65rem] uppercase tracking-wider text-[var(--km-muted)]">
                  {p.rail}
                </div>
              </div>
              <Link
                to={p.checkout}
                className="km-btn-gradient shrink-0 no-underline text-sm"
              >
                {p.id === 'bot_shield' ? 'Verify now' : 'Select plan'}
              </Link>
            </div>
          </div>
        ))}
      </section>

      <section className="km-card mt-6 p-5">
        <div className="flex items-center gap-2 font-semibold">
          <Shield size={16} className="text-[var(--km-accent)]" /> Elite
          affiliate link
        </div>
        <p className="mt-2 text-sm text-[var(--km-muted)]">
          Share the landing with <code>?ref=</code> — never raw square short
          links (ref gets stripped on redirect).
        </p>
        <label className="mt-3 block text-xs text-[var(--km-muted)]">
          Your ref code
          <input
            value={affCode}
            onChange={e =>
              setAffCode(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))
            }
            className="km-input mt-1"
            placeholder="clean-repo"
          />
        </label>
        <div className="mt-3 break-all rounded-xl bg-[var(--km-surface-2)] px-3 py-2 text-xs">
          {affiliateUrl}
        </div>
        <button type="button" className="km-btn-ghost mt-3" onClick={copyAff}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied' : 'Copy affiliate URL'}
        </button>
      </section>

      <Link
        to="/app/pay"
        className="km-btn-ghost mt-4 inline-flex no-underline"
      >
        Payment methods & verification
      </Link>
    </div>
  );
}

export default PreOrder;
