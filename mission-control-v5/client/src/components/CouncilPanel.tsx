import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type { OfficialVoteView, OfficialSeatState } from '../types';

const STATE_CLASS: Record<OfficialSeatState, string> = {
  AVAILABLE: 'council-seat__state--up',
  'CAPACITY LIMITED': 'council-seat__state--auth-missing',
  BLOCKED: 'council-seat__state--auth-rejected',
  'NOT CONFIGURED': 'council-seat__state--not-configured',
  'AUTH MISSING': 'council-seat__state--auth-missing',
  'AUTH REJECTED': 'council-seat__state--auth-rejected',
};

const EMPTY_VIEW: OfficialVoteView = {
  roster: { state: 'missing', bindingEnabled: false },
  seats: [],
  ballots: [],
  events: [],
};

interface CouncilPanelProps {
  load?: () => Promise<OfficialVoteView>;
}

/** Read-only official-seat view. It deliberately has no operational bridge dependency or ballot submit control. */
export default function CouncilPanel({ load = api.officialVoteView }: CouncilPanelProps) {
  const [view, setView] = useState<OfficialVoteView>(EMPTY_VIEW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setView(await load());
      setError(null);
    } catch {
      setView(EMPTY_VIEW);
      setError('OFFICIAL VOTE VIEW UNAVAILABLE');
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="council">
      <div className="council__toolbar">
        <div>
          <span className="label">INDEPENDENT JUDGES</span>
          <p className="council__hint">OFFICIAL ACCOUNT-AUTHENTICATED CLIENTS · ADVISORY EVIDENCE · NO ROUTED FALLBACKS</p>
        </div>
        <div className="council__toolbar-actions">
          <span className={`brain-card__status ${view.roster.bindingEnabled ? 'council-seat__state--up' : 'council-seat__state--not-configured'}`}>
            {view.roster.bindingEnabled ? 'ROSTER SIGNED' : 'ROSTER PENDING'}
          </span>
          <button className="btn" onClick={() => void refresh()} disabled={loading}>
            {loading ? 'CHECKING…' : 'REFRESH STATUS'}
          </button>
        </div>
      </div>

      {error && <div className="notice notice--error">{error}</div>}

      <section className="council__section" aria-labelledby="official-seats-heading">
        <div className="council__section-head">
          <h2 id="official-seats-heading">OFFICIAL SEATS</h2>
          <span className="mono">{view.seats.length} LANES · {view.seats.filter((seat) => seat.state === 'AVAILABLE').length} VERIFIED</span>
        </div>
        <div className="council__seat-grid">
          {view.seats.map((seat) => (
            <article className="council-seat" key={seat.platform}>
              <div className="council-seat__top">
                <span className={`dot ${STATE_CLASS[seat.state]}`} />
                <span className="council-seat__name">{seat.label}</span>
              </div>
              <span className={`council-seat__status ${STATE_CLASS[seat.state]}`}>{seat.state}</span>
              <p className="council-seat__detail">{seat.detail}</p>
              <p className="council-seat__detail">CLIENT · {seat.officialClient}</p>
              <p className="council-seat__detail">REQUESTED · {seat.requestedModel}</p>
              <p className="council-seat__detail">ACTUAL · {seat.actualModel ?? 'NOT VERIFIED'}</p>
            </article>
          ))}
          {view.seats.length === 0 && <p className="services__empty">NO OFFICIAL SEAT STATUS AVAILABLE</p>}
        </div>
      </section>

      <div className="council__columns">
        <section className="council__section" aria-labelledby="active-ballots-heading">
          <div className="council__section-head">
            <h2 id="active-ballots-heading">ACTIVE BALLOTS</h2>
            <span className="mono">{view.ballots.length} OPEN</span>
          </div>
          <div className="council__list">
            {view.ballots.map((ballot) => (
              <article className="council-ballot" key={ballot.id}>
                <div className="council-ballot__top">
                  <span className="mono">{ballot.id}</span>
                  <span className="brain-card__status">{ballot.status}</span>
                </div>
                <p>{ballot.subject}</p>
                <span className="council-ballot__meta">{ballot.decisions} RECORDED DECISION{ballot.decisions === 1 ? '' : 'S'}</span>
              </article>
            ))}
            {view.ballots.length === 0 && <p className="services__empty">NO ACTIVE BALLOTS</p>}
          </div>
        </section>

        <section className="council__section" aria-labelledby="decision-log-heading">
          <div className="council__section-head">
            <h2 id="decision-log-heading">IMMUTABLE DECISION LOG</h2>
            <span className="mono">READ ONLY</span>
          </div>
          <div className="council__list">
            {view.events.map((event) => (
              <article className="council-event" key={event.id}>
                <div className="council-event__top">
                  <span className="council-event__decision">{event.decision.toUpperCase()}</span>
                  <time className="mono">{event.timestamp}</time>
                </div>
                <p>{event.subject}</p>
                <span className="council-event__meta">{event.platform.toUpperCase()} · {event.officialClient} · {event.laneState}</span>
                <span className="council-event__meta">REQUESTED {event.requestedModel} · ACTUAL {event.actualModel}</span>
                <span className="council-event__meta">EVIDENCE · {event.evidenceSummary}</span>
              </article>
            ))}
            {view.events.length === 0 && <p className="services__empty">NO DECISIONS RECORDED</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
