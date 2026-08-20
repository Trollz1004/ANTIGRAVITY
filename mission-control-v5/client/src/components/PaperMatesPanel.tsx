import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type { PaperMatesOverview, PaperMatesTrustCase, PaperMatesTrustKind, PaperMatesTrustSeverity, Tab } from '../types';

type Props = { onNavigate: (tab: Tab) => void };

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function stateTone(state: string): string {
  if (state === 'resolved' || state === 'prototype') return 'green';
  if (state === 'limited' || state === 'urgent') return 'red';
  if (state === 'NOT CONFIGURED') return 'idle';
  return 'gold';
}

export default function PaperMatesPanel({ onNavigate }: Props) {
  const [overview, setOverview] = useState<PaperMatesOverview | null>(null);
  const [cases, setCases] = useState<PaperMatesTrustCase[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<PaperMatesTrustKind>('report');
  const [severity, setSeverity] = useState<PaperMatesTrustSeverity>('moderate');
  const [subject, setSubject] = useState('');
  const [summary, setSummary] = useState('');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [overviewResult, trustResult] = await Promise.all([api.paperMatesOverview(), api.paperMatesTrust()]);
      setOverview(overviewResult);
      setCases(trustResult.cases);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createCase = async (event: FormEvent) => {
    event.preventDefault();
    if (!subject.trim() || !summary.trim()) return;
    setSaving(true);
    try {
      await api.createPaperMatesTrust({ kind, severity, subject, summary, reference: reference || undefined, appealAvailable: true });
      setSubject('');
      setSummary('');
      setReference('');
      setKind('report');
      setSeverity('moderate');
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const moveCase = async (id: string, state: 'needs_review' | 'resolved' | 'appealed') => {
    await api.updatePaperMatesTrust(id, { state });
    await refresh();
  };

  const unresolved = cases.filter((item) => item.state !== 'resolved').length;
  const policyGated = overview?.launchItems.filter((item) => item.state !== 'prototype').length ?? 0;

  return (
    <main className="papermates">
      <section className="papermates__hero">
        <div className="papermates__orbit-art" aria-hidden="true"><span /><i /><b /></div>
        <div className="papermates__hero-copy">
          <button className="pm-back" type="button" onClick={() => onNavigate('control')}>← CONTROL CENTER</button>
          <span className="label pm-label">PAPERMATES / PRODUCT OPERATIONS</span>
          <h1>Paper<span>Mates</span></h1>
          <p className="papermates__tagline">You&amp;i, watched over by AI—through clear choices, accountable review, and human help.</p>
          <div className="papermates__chips"><span>ADULT-ONLY SCOPE</span><span>NO SILENT ACTIONS</span><span>HUMAN REVIEW</span></div>
        </div>
        <aside className="papermates__hero-note"><span className="label">Support route</span><b>{overview?.aiSupport.state ?? 'LOADING'}</b><p>{overview?.aiSupport.detail ?? 'Loading the approved routing boundary.'}</p><small>Draft assistance is not configured and cannot send customer messages.</small></aside>
      </section>

      {error && <div className="notice notice--error">PAPERMATES DATA ERROR: {error}</div>}

      <section className="pm-summary" aria-label="PaperMates status summary">
        <article><span className="label">Trust queue</span><strong>{unresolved}</strong><small>redacted cases awaiting closure</small></article>
        <article><span className="label">Launch gates</span><strong>{policyGated}</strong><small>policy or backend dependencies</small></article>
        <article><span className="label">Validated skills</span><strong>{overview?.skills.length ?? '—'}</strong><small>loaded review and operations capabilities</small></article>
        <article><span className="label">Core rule</span><strong>0</strong><small>automatic bans, messages, or external model calls</small></article>
      </section>

      <section className="pm-grid">
        <article className="pm-panel pm-panel--wide">
          <header><div><span className="label">Ten additions</span><h2>Launch readiness</h2></div><span className="pm-micro">PROTOTYPE STATUS IS NOT RELEASE STATUS</span></header>
          <div className="pm-launch-grid">{overview?.launchItems.map((item, index) => <div className="pm-launch-card" key={item.id}><span className="pm-number">{String(index + 1).padStart(2, '0')}</span><div><b>{item.label}</b><small>{item.dependency}</small></div><em className={`pm-state pm-state--${stateTone(item.state)}`}>{item.state}</em></div>) ?? <p className="control-empty">LOADING LAUNCH READINESS…</p>}</div>
        </article>

        <article className="pm-panel">
          <header><div><span className="label">Safety toolkit</span><h2>Built to support choice</h2></div></header>
          <div className="pm-safety-list">
            <div><span className="pm-glyph">18+</span><p><b>Adult Gate</b><small>Declared age, terms, and consent before a profile begins.</small></p></div>
            <div><span className="pm-glyph">◎</span><p><b>Cookie choices</b><small>Non-essential preferences remain opt-in and revisable.</small></p></div>
            <div><span className="pm-glyph">!</span><p><b>Report and Block</b><small>Specific reports, immediate user-controlled block, review and appeal path.</small></p></div>
            <div><span className="pm-glyph">◌</span><p><b>Bot Check</b><small>Explainable signal state—never an automatic accusation or safety guarantee.</small></p></div>
            <div><span className="pm-glyph">↗</span><p><b>Check-In and Circle Date</b><small>Optional plans with explicit consent; no automatic location or contact sharing.</small></p></div>
          </div>
        </article>

        <article className="pm-panel pm-panel--wide">
          <header><div><span className="label">Trust operations</span><h2>Redacted review queue</h2></div><span className="pm-micro">SIGNAL ≠ VERDICT</span></header>
          <div className="pm-trust-layout">
            <form className="pm-trust-form" onSubmit={createCase}>
              <p>Record only the minimum redacted context needed for a human review. Do not enter credentials, payment data, identity documents, full messages, or private location history.</p>
              <div className="pm-fields"><select className="input" value={kind} onChange={(event) => setKind(event.target.value as PaperMatesTrustKind)} aria-label="Trust case type"><option value="report">User report</option><option value="bot-check">Bot Check signal</option><option value="check-in">Check-in concern</option><option value="circle-date">Circle Date concern</option></select><select className="input" value={severity} onChange={(event) => setSeverity(event.target.value as PaperMatesTrustSeverity)} aria-label="Trust case severity"><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
              <input className="input" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Redacted subject" maxLength={140} required />
              <textarea className="textarea" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Redacted summary and observable concern—not a factual accusation." maxLength={900} required />
              <input className="input" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Optional redacted evidence reference" maxLength={160} />
              <button className="btn btn--primary" type="submit" disabled={saving}>{saving ? 'SAVING…' : 'CREATE REVIEW CASE'}</button>
            </form>
            <div className="pm-cases">{cases.length === 0 && <p className="control-empty">NO TRUST CASES RECORDED.</p>}{cases.slice(0, 8).map((item) => <article className="pm-case" key={item.id}><div className="pm-case__top"><span className={`dot dot--${stateTone(item.severity)}`} /><b>{item.subject}</b><em className={`pm-state pm-state--${stateTone(item.state)}`}>{item.state}</em></div><small>{item.kind.toUpperCase()} · {item.severity.toUpperCase()} · {formatTime(item.updatedAt)}</small><p>{item.summary}</p>{item.reference && <code>{item.reference}</code>}<footer>{item.state === 'received' && <button className="btn" type="button" onClick={() => void moveCase(item.id, 'needs_review')}>Start review</button>}{item.state === 'needs_review' && <button className="btn" type="button" onClick={() => void moveCase(item.id, 'resolved')}>Resolve</button>}{item.appealAvailable && item.state === 'limited' && <button className="btn" type="button" onClick={() => void moveCase(item.id, 'appealed')}>Mark appealed</button>}<span>{item.appealAvailable ? 'APPEAL PATH AVAILABLE' : 'NO APPEAL STATE'}</span></footer></article>)}</div>
          </div>
        </article>

        <article className="pm-panel">
          <header><div><span className="label">Skill deck</span><h2>Validated capabilities</h2></div></header>
          <div className="pm-skills">{overview?.skills.map((skill) => <div key={skill.id}><span className="dot dot--green" /><b>{skill.id}</b><small>{skill.description}</small></div>) ?? <p className="control-empty">LOADING SKILLS…</p>}</div>
        </article>

        <article className="pm-panel">
          <header><div><span className="label">Launch voice</span><h2>Quiet, specific, accountable</h2></div></header>
          <blockquote>“Built quietly for more intentional introductions. Clear controls stay louder than marketing.”</blockquote>
          <p className="pm-copy-note">Founding Signal is a limited, contextual launch benefit—not a promise of a match, reply, safety check, review, or donation. Public community-benefit claims remain disabled until their terms and ledger are published.</p>
          <button className="btn" type="button" onClick={() => onNavigate('control')}>RETURN TO CONTROL CENTER</button>
        </article>
      </section>
    </main>
  );
}
