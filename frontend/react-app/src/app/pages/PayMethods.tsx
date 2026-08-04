import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, CreditCard, Landmark, ShieldCheck, Wallet } from 'lucide-react';
import { api } from '../../lib/api';

type Rail = 'square' | 'paypal' | 'cashapp' | 'plaid';

/**
 * Multi-rail checkout picker.
 * Square = primary (live). PayPal / Cash App / Plaid = configured when env present.
 * STRIPE IS HARD-BANNED on dating surface.
 */
export function PayMethods() {
  const [rail, setRail] = useState<Rail>('square');
  const [tier, setTier] = useState('founding_member');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const launch = async () => {
    setBusy(true);
    setMsg('');
    try {
      if (rail === 'square') {
        const res = await api.post<{ checkout_url: string }>('/billing/checkout-link', {
          tier,
        });
        window.location.href = res.checkout_url;
        return;
      }
      if (rail === 'paypal') {
        const res = await api.post<{ approve_url: string }>('/billing/paypal/create-order', {
          tier,
        });
        window.location.href = res.approve_url;
        return;
      }
      if (rail === 'cashapp') {
        const res = await api.post<{ checkout_url: string }>('/billing/cashapp/checkout', {
          tier,
        });
        window.location.href = res.checkout_url;
        return;
      }
      if (rail === 'plaid') {
        const res = await api.post<{ link_token: string }>('/billing/plaid/link-token', {});
        setMsg(
          `Plaid Link token ready (${res.link_token.slice(0, 12)}…). Wire Plaid Link JS in production build to open the bank UI.`
        );
        return;
      }
    } catch (err: any) {
      setMsg(err?.message || 'Checkout unavailable for this rail right now.');
    } finally {
      setBusy(false);
    }
  };

  const rails: { id: Rail; name: string; icon: typeof CreditCard; note: string }[] = [
    {
      id: 'square',
      name: 'Square',
      icon: CreditCard,
      note: 'Primary · cards + Apple/Google Pay via Square',
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: Wallet,
      note: 'Alternate checkout when PAYPAL_* env set',
    },
    {
      id: 'cashapp',
      name: 'Cash App',
      icon: Banknote,
      note: 'Cash App Business / Square Cash App rail',
    },
    {
      id: 'plaid',
      name: 'Plaid verify',
      icon: Landmark,
      note: 'Bank identity / account verification (not card charge)',
    },
  ];

  return (
    <div className="km-page mx-auto max-w-lg px-4 py-5">
      <div className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--km-accent)]">
        Payments
      </div>
      <h1 className="text-2xl font-semibold">Checkout rails</h1>
      <p className="mt-2 text-sm text-[var(--km-muted)]">
        Dating surface uses Square, PayPal, Cash App Business, and optional Plaid verification.
        <span className="font-semibold text-[#f87171]"> Stripe is not used here.</span>
      </p>

      <div className="mt-5 grid gap-2">
        {rails.map(r => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRail(r.id)}
            className={`km-card flex items-center gap-3 p-4 text-left transition ${
              rail === r.id ? 'ring-1 ring-[var(--km-accent)]' : ''
            }`}
          >
            <r.icon size={20} className="text-[var(--km-accent)]" />
            <div>
              <div className="font-semibold">{r.name}</div>
              <div className="text-xs text-[var(--km-muted)]">{r.note}</div>
            </div>
          </button>
        ))}
      </div>

      {rail !== 'plaid' && (
        <label className="mt-5 block text-xs text-[var(--km-muted)]">
          Plan tier
          <select
            className="km-input mt-1"
            value={tier}
            onChange={e => setTier(e.target.value)}
          >
            <option value="founding_member">Founding Member $14.99/mo</option>
            <option value="3_month">3-Month $39.99</option>
            <option value="12_month">12-Month $99.99</option>
            <option value="royalty">Elite Card $2,500</option>
          </select>
        </label>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={launch}
        className="km-btn-gradient mt-5 w-full justify-center disabled:opacity-50"
      >
        {busy ? 'Starting…' : rail === 'plaid' ? 'Start Plaid verify' : `Pay with ${rail}`}
      </button>

      {msg && (
        <div className="mt-4 rounded-2xl border border-[var(--km-border)] bg-[var(--km-surface-2)] px-4 py-3 text-sm">
          {msg}
        </div>
      )}

      <div className="km-card mt-6 flex gap-3 p-4 text-sm text-[var(--km-muted)]">
        <ShieldCheck className="shrink-0 text-emerald-400" size={18} />
        <div>
          Account-bound sessions for Square stay linked to your login email. Affiliate traffic must
          enter via{' '}
          <a className="text-[var(--km-accent)] underline" href="https://trollz1004.github.io/youandinotai-links/?ref=clean-repo">
            the public landing
          </a>
          .
        </div>
      </div>

      <Link to="/app/preorder" className="km-btn-ghost mt-4 inline-flex no-underline">
        Back to pre-order
      </Link>
    </div>
  );
}

export default PayMethods;
