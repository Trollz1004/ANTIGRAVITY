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
  seats: [
    { id: 'gemini', name: 'Gemini CLI', platform: 'google-gemini', label: 'Gemini Pro (Max Reasoning)', state: 'AVAILABLE', actualModel: 'gemini-1.5-pro' },
    { id: 'claude', name: 'Claude Code', platform: 'anthropic-claude', label: 'Claude (Max Tier)', state: 'AVAILABLE', actualModel: 'claude-3-opus' },
    { id: 'grok', name: 'Grok', platform: 'xai-grok', label: 'Grok (Max Reasoning)', state: 'AVAILABLE', actualModel: 'grok-reasoning' },
    { id: 'copilot', name: 'GitHub Copilot', platform: 'github-copilot', label: 'Copilot (Capable Model)', state: 'AVAILABLE', actualModel: 'gpt-4o' },
    { id: 'codex', name: 'OpenAI Codex', platform: 'openai-codex', label: 'OpenAI (Max Reasoning)', state: 'AVAILABLE', actualModel: 'o1' }
  ],
  ballots: [],
  events: [],
};

interface CouncilPanelProps {
  load?: () => Promise<OfficialVoteView>;
}

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
      setError(null);
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
          <span className={`brain-card__status ${view?.roster?.bindingEnabled ? 'council-seat__state--up' : 'council-seat__state--not-configured'}`}>
            {view?.roster?.bindingEnabled ? 'ROSTER SIGNED' : 'ROSTER PENDING'}
          </span>
          <button className="btn" onClick={() => void refresh()} disabled={loading}>
            {loading ? 'CHECKING…' : 'REFRESH STATUS'}
          </button>
        </div>
      </div>

      {error && <div className="notice notice--error">{error}</div>}

      <div className="council__grid">
        {(view?.seats ?? []).map((seat) => (
          <div key={seat.platform} className="council-seat">
            <div className="council-seat__top">
              <span className={`dot ${STATE_CLASS[seat.state] ?? 'dot--idle'}`} />
              <strong className="council-seat__name">{seat.name ?? seat.label ?? seat.platform}</strong>
            </div>
            <div className="council-seat__meta">
              <span>PLATFORM: {seat.platform}</span>
              <span>MODEL: {seat.actualModel ?? seat.requestedModel ?? 'default'}</span>
              <span>STATE: {seat.state}</span>
              {seat.lastVote && <span>LAST VOTE: {seat.lastVote}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
