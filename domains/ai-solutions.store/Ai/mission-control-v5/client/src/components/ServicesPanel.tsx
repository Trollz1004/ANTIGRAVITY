import { useEffect, useState } from 'react';
import { api } from '../api';
import type { ServiceStatus } from '../types';

function dotClass(status: ServiceStatus['status']): string {
  if (status === 'UP') return 'dot--green';
  if (status === 'WRONG SERVICE') return 'dot--amber';
  if (status === 'AUTH MISSING' || status === 'AUTH REJECTED') return 'dot--accent';
  if (status === 'NOT CONFIGURED') return 'dot--idle';
  return 'dot--red';
}

export default function ServicesPanel() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    const fetchServices = async () => {
      try {
        const { services: next } = await api.services();
        if (!alive) return;
        setServices(next);
        setError(null);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (alive) setLoaded(true);
      }
    };
    fetchServices();
    const poll = window.setInterval(fetchServices, 15_000);
    return () => {
      alive = false;
      window.clearInterval(poll);
    };
  }, []);

  return (
    <div className="services">
      <div className="services__toolbar">
        <span className="label">LIVE SERVICES</span>
        <span className="services__hint">Auto-refresh · 15s</span>
      </div>
      <div className="services__grid">
        {!loaded && <div className="services__empty">PROBING…</div>}
        {loaded && services.length === 0 && <div className="services__empty">NO SERVICES CONFIGURED</div>}
        {services.map((svc) => (
          <a
            key={svc.name}
            className={`service-card service-card--${svc.status.toLowerCase().replaceAll(' ', '-')}`}
            href={svc.openUrl ?? svc.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            <div className="service-card__top">
              <span
                className={`dot ${dotClass(svc.status)} ${
                  svc.status === 'DOWN' || svc.status === 'AUTH REJECTED' ? 'dot--pulse' : ''
                }`}
              />
              <span className="service-card__name">{svc.name}</span>
              <span className="service-card__status">{svc.status}</span>
            </div>
            <div className="service-card__url mono">{svc.openUrl ?? svc.url}</div>
            <div className="service-card__meta">
              <span className="mono">{svc.status === 'DOWN' || svc.status === 'NOT CONFIGURED' ? '—' : `${svc.ms}ms`}</span>
              <span className="service-card__detail mono">{svc.detail}</span>
              <span className="service-card__open">OPEN ↗</span>
            </div>
          </a>
        ))}
      </div>
      {error && <div className="notice notice--error">{error}</div>}
    </div>
  );
}
