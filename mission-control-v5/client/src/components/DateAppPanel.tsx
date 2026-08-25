import { useEffect, useState } from 'react';
import { api } from '../api';
import type { DateAppMetrics } from '../types';

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function ConnDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="service-card">
      <span className={`dot ${ok ? 'dot--green' : 'dot--red'}`} title={ok ? 'connected' : 'down'} />
      <span>{label}</span>
      <span className="result__meta">{ok ? 'CONNECTED' : 'DOWN'}</span>
    </div>
  );
}

/**
 * Real production numbers from the Date App backend, or an honest UNREACHABLE.
 * Nothing on this panel is sample data — an empty state means the probe failed,
 * not that a placeholder should be invented.
 */
export default function DateAppPanel() {
  const [metrics, setMetrics] = useState<DateAppMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const next = await api.dateappMetrics();
        if (!alive) return;
        setMetrics(next);
        setError(null);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (alive) setLoaded(true);
      }
    };
    void refresh();
    const poll = window.setInterval(() => void refresh(), 15_000);
    return () => {
      alive = false;
      window.clearInterval(poll);
    };
  }, []);

  if (!loaded) return <div className="panel">Probing Date App backend…</div>;

  const health = metrics?.health;
  const reachable = Boolean(health && health.status !== 'unreachable');

  return (
    <div className="panel">
      <h2 className="panel__title">DATE APP — YOUANDINOTAI</h2>
      <p className="panel__subtitle">
        Live backend metrics. Real production data only — an unreachable probe reports as unreachable.
      </p>
      {error && <div className="kanban__empty">METRICS ENDPOINT ERROR: {error}</div>}

      <div className="panel__section">
        <h3>BACKEND HEALTH</h3>
        {!reachable && <div className="kanban__empty">BACKEND UNREACHABLE — start the Date App API on :8000.</div>}
        {reachable && health && (
          <div className="service-grid">
            <div className="service-card">
              <span className={`dot ${health.status === 'ok' ? 'dot--green' : 'dot--amber'}`} />
              <span>API status</span>
              <span className="result__meta">{health.status.toUpperCase()}</span>
            </div>
            <ConnDot ok={health.db_connected} label="Database" />
            <ConnDot ok={health.redis_connected} label="Redis" />
            <ConnDot ok={health.square_connected} label="Square" />
            <ConnDot ok={health.square_signature_configured} label="Square webhook signature" />
            <div className="service-card">
              <span className={`dot ${health.wallet_rails_proven ? 'dot--green' : 'dot--amber'}`} />
              <span>Wallet rails</span>
              <span className="result__meta">{(health.wallet_rails_status || 'unknown').toUpperCase()}</span>
            </div>
            <div className="service-card">
              <span className="dot dot--green" />
              <span>Registered users</span>
              <span className="result__meta">{health.user_count}</span>
            </div>
          </div>
        )}
      </div>

      <div className="panel__section">
        <h3>PAYMENT ALLOCATIONS</h3>
        {!metrics?.allocations && <div className="kanban__empty">NO ALLOCATION SUMMARY AVAILABLE.</div>}
        {metrics?.allocations && (
          <div className="service-grid">
            {(['customer_only', 'with_test'] as const).map((key) => {
              const a = metrics.allocations?.[key];
              if (!a) return null;
              return (
                <div key={key} className="service-card">
                  <span className="badge">{key === 'customer_only' ? 'CUSTOMER' : 'WITH TEST'}</span>
                  <span>{a.payments} payment{a.payments === 1 ? '' : 's'}</span>
                  <span className="result__meta">
                    gross {money(a.gross_cents)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="panel__section">
        <h3>SURFACES</h3>
        <div className="quick-actions">
          <a className="btn" href={metrics?.frontend.url ?? 'http://localhost:3200'} target="_blank" rel="noreferrer">
            LOCAL FRONTEND :3200
          </a>
          <a className="btn" href="http://localhost:8000/docs" target="_blank" rel="noreferrer">
            API DOCS :8000
          </a>
          {metrics?.public && (
            <>
              <a className="btn" href={metrics.public.site} target="_blank" rel="noreferrer">
                PUBLIC SITE
              </a>
              <a className="btn" href={metrics.public.api} target="_blank" rel="noreferrer">
                PUBLIC API
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
