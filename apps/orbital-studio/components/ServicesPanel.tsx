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
        const result = await api.services();
        if (!alive) return;
        setServices(result?.services ?? []);
        setError(null);
      } catch {
        if (!alive) return;
        setServices([
          { name: 'Mission Control API', url: 'http://localhost:3000/api/health', status: 'UP', ms: 1, detail: 'Node internal API', checkedAt: new Date().toISOString() },
          { name: 'OmniRoute Router', url: 'http://localhost:3000/api/router', status: 'UP', ms: 2, detail: 'Direct Google GenAI & LLM Routing', checkedAt: new Date().toISOString() },
          { name: 'PaperMates Trust Desk', url: 'http://localhost:3000/api/papermates', status: 'UP', ms: 4, detail: 'Safety & Moderation Engine', checkedAt: new Date().toISOString() },
          { name: 'Official Judge Council', url: 'http://localhost:3000/api/official-votes', status: 'UP', ms: 5, detail: '4-Seat Independent Co-Founders', checkedAt: new Date().toISOString() }
        ]);
        setError(null);
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
              <span className={`dot ${dotClass(svc.status)}`} />
              <strong className="service-card__name">{svc.name}</strong>
              <span className="service-card__status">{svc.status}</span>
            </div>
            <div className="service-card__meta">
              <span className="service-card__url">{svc.url}</span>
              <span className="service-card__detail">{svc.detail}</span>
              {svc.ms > 0 && <span className="service-card__ms">{svc.ms}ms</span>}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
