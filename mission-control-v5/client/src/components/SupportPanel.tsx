import { useEffect, useState } from 'react';
import { api } from '../api';
import type { SupportCase, SupportCaseStatus, SupportPriority } from '../types';

const PRIORITIES: SupportPriority[] = ['low', 'normal', 'high', 'urgent'];
const NEXT_STATUS: Record<SupportCaseStatus, SupportCaseStatus | null> = {
  open: 'assigned',
  assigned: 'waiting',
  waiting: 'resolved',
  resolved: null,
};

function priorityBadge(priority: SupportPriority): string {
  if (priority === 'urgent') return 'badge badge--error';
  if (priority === 'high') return 'badge badge--amber';
  return 'badge';
}

function statusDot(status: SupportCaseStatus): string {
  if (status === 'resolved') return 'dot dot--green';
  if (status === 'open') return 'dot dot--red';
  return 'dot dot--amber dot--pulse';
}

/**
 * Dedicated view over the control-store support queue — the same redacted
 * case store the Control Center reads. No payment, identity, or credential
 * content belongs in a case; the store is local by design.
 */
export default function SupportPanel() {
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [summary, setSummary] = useState('');
  const [priority, setPriority] = useState<SupportPriority>('normal');
  const [submitting, setSubmitting] = useState(false);

  const refresh = async () => {
    try {
      const { cases: next } = await api.supportCases();
      setCases(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    void refresh();
    const poll = window.setInterval(() => void refresh(), 15_000);
    return () => window.clearInterval(poll);
  }, []);

  const submit = async () => {
    if (!subject.trim() || !summary.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.createSupportCase({ source: 'local', subject: subject.trim(), summary: summary.trim(), priority });
      setSubject('');
      setSummary('');
      setPriority('normal');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const advance = async (c: SupportCase) => {
    const next = NEXT_STATUS[c.status];
    if (!next) return;
    try {
      await api.updateSupportCase(c.id, { status: next });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const open = cases.filter((c) => c.status !== 'resolved').length;

  return (
    <div className="panel">
      <h2 className="panel__title">SUPPORT QUEUE</h2>
      <p className="panel__subtitle">
        Local redacted case store shared with the Control Center — no payment, identity, or credential content.
      </p>
      {error && <div className="kanban__empty">SUPPORT API ERROR: {error}</div>}

      <div className="panel__section">
        <h3>NEW CASE</h3>
        <div className="service-grid">
          <input className="input" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <input
            className="input"
            placeholder="Summary — what happened, what surface, what the customer needs"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
          <div className="quick-actions">
            {PRIORITIES.map((p) => (
              <button key={p} className={`btn ${priority === p ? 'btn--active' : ''}`} onClick={() => setPriority(p)}>
                {p.toUpperCase()}
              </button>
            ))}
            <button
              className="btn"
              disabled={!subject.trim() || !summary.trim() || submitting}
              onClick={() => void submit()}
            >
              {submitting ? 'FILING…' : 'FILE CASE'}
            </button>
          </div>
        </div>
      </div>

      <div className="panel__section">
        <h3>QUEUE — {open} OPEN / {cases.length} TOTAL</h3>
        {cases.length === 0 && <div className="kanban__empty">NO CASES FILED.</div>}
        {cases.length > 0 && (
          <div className="service-grid">
            {cases.map((c) => (
              <div key={c.id} className="service-card">
                <span className={statusDot(c.status)} title={c.status} />
                <span>
                  <strong>{c.subject}</strong> — {c.summary}
                  {c.assignee ? ` · assignee: ${c.assignee}` : ''}
                </span>
                <span className={priorityBadge(c.priority)}>{c.priority.toUpperCase()}</span>
                <span className="badge">{c.source.toUpperCase()}</span>
                <span className="result__meta">
                  {c.status.toUpperCase()} · {new Date(c.createdAt).toLocaleString()}
                </span>
                {NEXT_STATUS[c.status] && (
                  <button className="btn" onClick={() => void advance(c)}>
                    → {NEXT_STATUS[c.status]!.toUpperCase()}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
