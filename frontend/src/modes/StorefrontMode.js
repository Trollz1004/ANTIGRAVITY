import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { ExternalLink, Sprout, Trash2, Tag, ShoppingBag, AlertCircle, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * StorefrontMode — public-facing catalogue + admin manage surface.
 *
 * Doctrine compliance:
 *  - "contractual revenue payout" wording only (no payment/).
 *  - Honest empty state: empty catalogue renders a starter-seed CTA, not
 *    a fabricated grid of fake products.
 *  - Square hosted checkout = primary processor (no PCI risk on our box).
 *  - Runway pulse pinned at the top so visitors see the real burn state.
 */
export function StorefrontMode() {
  const [site, setSite] = useState(null);
  const [products, setProducts] = useState([]);
  const [runway, setRunway] = useState(null);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, r, a] = await Promise.all([
        axios.get(`${API}/public/site`).then((x) => x.data),
        axios.get(`${API}/public/products`).then((x) => x.data),
        axios.get(`${API}/public/runway`).then((x) => x.data),
        axios
          .get(`${API}/auth/status`, { withCredentials: true })
          .then((x) => x.data)
          .catch(() => ({})),
      ]);
      setSite(s);
      setProducts(p.products || []);
      setRunway(r);
      setAdmin(!!a?.signed_in);
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message || 'load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const seedStarter = async () => {
    setBusy(true);
    setErr('');
    try {
      await axios.post(`${API}/public/products/seed`, {}, { withCredentials: true });
      await load();
    } catch (e) {
      setErr(e?.response?.data?.detail || 'seed failed — sign in as admin first');
    } finally {
      setBusy(false);
    }
  };

  const removeProduct = async (id) => {
    if (!window.confirm('Remove this SKU?')) return;
    setBusy(true);
    setErr('');
    try {
      await axios.delete(`${API}/public/products/${id}`, { withCredentials: true });
      await load();
    } catch (e) {
      setErr(e?.response?.data?.detail || 'delete failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="storefront-mode" className="h-full overflow-y-auto bg-[#0a0f1a] text-[#e8f0ff]">
      <div className="max-w-6xl mx-auto px-8 py-10">
        <header className="flex items-start gap-4 flex-wrap mb-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag size={14} className="text-[#00e676]" />
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#00e676] font-bold">
                Public Storefront · Square + Stripe hosted
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{site?.name || 'OpusPawClaw'}</h1>
            <p className="text-sm text-[#6b82a6] mt-1">{site?.tagline}</p>
            <p className="text-[10px] tracking-widest uppercase mt-2 text-[#e040fb] font-bold">{site?.mission_tag}</p>
          </div>
          <RunwayCard runway={runway} site={site} />
        </header>

        {err && (
          <div
            data-testid="storefront-error"
            className="mb-6 px-4 py-3 rounded-md border border-[#ff1744]/40 bg-[#ff1744]/10 text-[#ff5572] text-xs flex items-center gap-2"
          >
            <AlertCircle size={14} /> {err}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-[#6b82a6] text-xs">
            <Loader2 size={14} className="animate-spin" /> loading catalogue…
          </div>
        ) : products.length === 0 ? (
          <EmptyCatalogue admin={admin} onSeed={seedStarter} busy={busy} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} admin={admin} onDelete={() => removeProduct(p.id)} />
            ))}
          </div>
        )}

        <footer className="mt-12 pt-6 border-t border-[#2a3a52] text-[10px] text-[#4a5568] tracking-widest uppercase">
          contractual revenue payout · 10% hard cap stacked · FL §496.405 compliant · receipts only
        </footer>
      </div>
    </div>
  );
}

function RunwayCard({ runway, site }) {
  if (!runway) return null;
  const tone = runway.emergent_key_configured ? '#00e676' : '#ff1744';
  const kidsUsd = site?.totals?.kids_fund_usd ?? 0;
  return (
    <div
      data-testid="storefront-runway-card"
      className="bg-[#111827] border border-[#2a3a52] rounded-lg px-5 py-3 min-w-[260px]"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone, boxShadow: `0 0 8px ${tone}` }} />
        <span className="text-[9px] tracking-[0.25em] uppercase font-bold" style={{ color: tone }}>
          {runway.compute_tier}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <Cell
          label="default model"
          value={`${runway.default_bridge.provider}/${runway.default_bridge.model.replace('gemini-', '')}`}
        />
        <Cell label="runway" value={`${runway.runway_days}d`} />
        <Cell label="committed" value={`$${Number(runway.committed_usd).toFixed(2)}`} />
        <Cell label="kids fund" value={`$${Number(kidsUsd).toFixed(2)}`} />
      </div>
      <p className="text-[9px] text-[#6b82a6] mt-2 italic">{runway.note}</p>
    </div>
  );
}

function Cell({ label, value }) {
  return (
    <div>
      <div className="text-[8px] tracking-[0.25em] uppercase text-[#4a5568]">{label}</div>
      <div className="mono text-xs font-bold text-[#e8f0ff]">{value}</div>
    </div>
  );
}

function EmptyCatalogue({ admin, onSeed, busy }) {
  return (
    <div
      data-testid="storefront-empty"
      className="border border-dashed border-[#2a3a52] rounded-lg px-8 py-12 text-center"
    >
      <Sprout size={28} className="mx-auto text-[#00e676] mb-3" />
      <h2 className="text-lg font-bold mb-2">Honest empty state · no SKUs yet</h2>
      <p className="text-sm text-[#6b82a6] max-w-md mx-auto mb-5">
        No fabricated products.{' '}
        {admin
          ? 'Seed the 4 starter SKUs and paste real Square checkout URLs from your dashboard.'
          : 'Sign in as admin to seed starter SKUs.'}
      </p>
      {admin && (
        <button
          data-testid="storefront-seed-btn"
          onClick={onSeed}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#00e676]/15 border border-[#00e676]/40 text-[#00e676] text-xs font-bold uppercase tracking-widest hover:bg-[#00e676]/25 disabled:opacity-50"
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Sprout size={12} />} seed 4 starter SKUs
        </button>
      )}
    </div>
  );
}

function ProductCard({ p, admin, onDelete }) {
  const url = p.square_checkout_url || '';
  const placeholderUrl = url.includes('SET-THIS-IN-');
  const processorLabel = 'buy via Square';
  const accentClasses = 'bg-[#00d4ff]/15 border border-[#00d4ff]/40 text-[#00d4ff] hover:bg-[#00d4ff]/25';
  return (
    <div
      data-testid={`storefront-product-${p.id}`}
      className="bg-[#111827] border border-[#2a3a52] rounded-lg overflow-hidden flex flex-col hover:border-[#00d4ff]/40 transition-colors"
    >
      {p.image_data_uri ? (
        <img src={p.image_data_uri} alt={p.title} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-[#1a2332] to-[#0a0f1a] flex items-center justify-center">
          <Tag size={28} className="text-[#2a3a52]" />
        </div>
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold leading-tight">{p.title}</h3>
          <span className="mono text-sm font-bold text-[#00e676] shrink-0">${Number(p.price_usd).toFixed(2)}</span>
        </div>
        <p className="text-xs text-[#6b82a6] flex-1">{p.description}</p>
        {p.sku && <div className="text-[9px] tracking-widest uppercase text-[#4a5568]">sku · {p.sku}</div>}
        {placeholderUrl && admin && (
          <div className="text-[9px] text-[#ffb300] italic">
            ⚠ checkout URL is a placeholder — paste real Square link in admin edit.
          </div>
        )}
        <div className="flex items-center gap-2 mt-2">
          <a
            data-testid={`storefront-buy-${p.id}`}
            href={p.square_checkout_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-colors ${
              placeholderUrl
                ? 'bg-[#2a3a52]/40 border border-[#2a3a52] text-[#4a5568] cursor-not-allowed'
                : accentClasses
            }`}
            onClick={(e) => placeholderUrl && e.preventDefault()}
          >
            {processorLabel} <ExternalLink size={10} />
          </a>
          {admin && (
            <button
              data-testid={`storefront-delete-${p.id}`}
              onClick={onDelete}
              className="p-2 rounded-md bg-[#ff1744]/10 border border-[#ff1744]/30 text-[#ff5572] hover:bg-[#ff1744]/20"
              title="Remove SKU"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
