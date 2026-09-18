import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  CreditCard,
  Landmark,
  QrCode,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { api } from '../../lib/api';

type Rail = 'square' | 'paypal' | 'paypal_qr' | 'cashapp' | 'plaid';

/** Public PayPal managed QR links decoded from Telegram screenshots 2026-08-04 */
export const PAYPAL_QR = {
  primary: {
    label: 'Joshua Coleman',
    href: 'https://www.paypal.com/qrcodes/managed/f5e4ef25-cf72-45e5-b093-21263d76eeec',
    image: '/payments/paypal-joshua-coleman-qr.jpg',
  },
  tipJar: {
    label: 'Tip Jar',
    href: 'https://www.paypal.com/qrcodes/managed/e1b0e1e7-ff93-4173-92ac-c2a2c23795ca',
    image: '/payments/paypal-tip-jar-qr.jpg',
  },
} as const;

/**
 * Multi-rail checkout picker.
 * Square = primary (live). PayPal API + QR / Cash App / Plaid.
 * STRIPE IS HARD-BANNED on dating surface.
 */
export function PayMethods() {
  const [rail, setRail] = useState<Rail>('square');
  const [tier, setTier] = useState('founding_member');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [qrWhich, setQrWhich] = useState<'primary' | 'tipJar'>('primary');

  const launch = async () => {
    setBusy(true);
    setMsg('');
    try {
      if (rail === 'paypal_qr') {
        window.open(PAYPAL_QR[qrWhich].href, '_blank', 'noopener,noreferrer');
        setMsg(
          'Opened PayPal QR link. Prefer Square for account-bound memberships.'
        );
        return;
      }
      if (rail === 'square') {
        const res = await api.post<{ checkout_url: string }>(
          '/billing/checkout-link',
          {
            tier,
          }
        );
        window.location.href = res.checkout_url;
        return;
      }
      if (rail === 'paypal') {
        try {
          const res = await api.post<{ approve_url: string }>(
            '/billing/paypal/create-order',
            {
              tier,
            }
          );
          window.location.href = res.approve_url;
          return;
        } catch {
          // API not configured — fall through to managed QR
          window.open(PAYPAL_QR.primary.href, '_blank', 'noopener,noreferrer');
          setMsg(
            'PayPal API not configured — opened Joshua Coleman QR receive link instead.'
          );
          return;
        }
      }
      if (rail === 'cashapp') {
        const res = await api.post<{ checkout_url: string }>(
          '/billing/cashapp/checkout',
          {
            tier,
          }
        );
        window.location.href = res.checkout_url;
        return;
      }
      if (rail === 'plaid') {
        const res = await api.post<{ link_token: string }>(
          '/billing/plaid/link-token',
          {}
        );
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

  const rails: {
    id: Rail;
    name: string;
    icon: typeof CreditCard;
    note: string;
  }[] = [
    {
      id: 'square',
      name: 'Square',
      icon: CreditCard,
      note: 'Primary · cards + Apple/Google Pay via Square',
    },
    {
      id: 'paypal',
      name: 'PayPal checkout',
      icon: Wallet,
      note: 'API order when env set · else QR receive link',
    },
    {
      id: 'paypal_qr',
      name: 'PayPal QR',
      icon: QrCode,
      note: 'Scan. Pay. Go. · Joshua Coleman + Tip Jar',
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

  const activeQr = PAYPAL_QR[qrWhich];

  return (
    <div className="km-page mx-auto max-w-lg px-4 py-5">
      <div className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--km-accent)]">
        Payments
      </div>
      <h1 className="text-2xl font-semibold">Checkout rails</h1>
      <p className="mt-2 text-sm text-[var(--km-muted)]">
        Dating surface uses Square, PayPal, Cash App Business, and optional
        Plaid verification.
        <span className="font-semibold text-[#f87171]">
          {' '}
          Stripe is not used here.
        </span>
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

      {rail === 'paypal_qr' && (
        <section className="km-card km-card-glow mt-5 p-4">
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              className={`km-pill flex-1 ${qrWhich === 'primary' ? 'ring-1 ring-[var(--km-accent)]' : ''}`}
              onClick={() => setQrWhich('primary')}
            >
              PayPal
            </button>
            <button
              type="button"
              className={`km-pill flex-1 ${qrWhich === 'tipJar' ? 'ring-1 ring-[var(--km-accent)]' : ''}`}
              onClick={() => setQrWhich('tipJar')}
            >
              Tip Jar
            </button>
          </div>
          <div className="text-center text-sm font-semibold">
            {activeQr.label}
          </div>
          <img
            src={activeQr.image}
            alt={`${activeQr.label} PayPal QR`}
            className="mx-auto mt-3 max-h-80 w-auto rounded-2xl border border-[var(--km-border)]"
          />
          <a
            href={activeQr.href}
            target="_blank"
            rel="noreferrer"
            className="km-btn-ghost mt-3 w-full justify-center no-underline text-sm"
          >
            Open PayPal link
          </a>
          <p className="mt-2 text-center text-xs text-[var(--km-muted)]">
            Scan. Pay. Go.
          </p>
        </section>
      )}

      {rail !== 'plaid' && rail !== 'paypal_qr' && (
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
        {busy
          ? 'Starting…'
          : rail === 'plaid'
            ? 'Start Plaid verify'
            : rail === 'paypal_qr'
              ? `Open ${activeQr.label} PayPal`
              : `Pay with ${rail}`}
      </button>

      {msg && (
        <div className="mt-4 rounded-2xl border border-[var(--km-border)] bg-[var(--km-surface-2)] px-4 py-3 text-sm">
          {msg}
        </div>
      )}

      <div className="km-card mt-6 flex gap-3 p-4 text-sm text-[var(--km-muted)]">
        <ShieldCheck className="shrink-0 text-emerald-400" size={18} />
        <div>
          Account-bound sessions for Square stay linked to your login email.
          Affiliate traffic must enter via{' '}
          <a
            className="text-[var(--km-accent)] underline"
            href="https://trollz1004.github.io/youandinotai-links/?ref=clean-repo"
          >
            the public landing
          </a>
          . PayPal QRs are receive links for soft-open / tips; memberships
          prefer Square.
        </div>
      </div>

      <Link
        to="/app/preorder"
        className="km-btn-ghost mt-4 inline-flex no-underline"
      >
        Back to pre-order
      </Link>
    </div>
  );
}

export default PayMethods;
