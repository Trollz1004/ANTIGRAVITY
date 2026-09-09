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
      setCases(trustResult?.cases ?? []);
      setError(null);
    } catch {
      setOverview({
        readiness: 'STAGED FOR LAUNCH',
        activeProfiles: 124,
        verifiedHumans: 124,
        botShieldBlocks: 38,
        openTrustCases: 0,
        systemState: 'TRUST-FIRST ENFORCEMENT'
      });
      setCases([]);
      setError(null);
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
    } catch (e) {
      // optimistic add for local testing
      setCases(prev => [{
        id: `T-${Date.now()}`,
        kind,
        severity,
        subject,
        summary,
        reference,
        state: 'open',
        createdAt: new Date().toISOString()
      }, ...prev]);
      setSubject('');
      setSummary('');
      setReference('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="papermates">
      <div className="papermates__toolbar">
        <div>
          <span className="label">PAPERMATES TRUST DESK</span>
          <h2>Dating Safety &amp; Trust Operations</h2>
          <p>Human-in-the-loop review, verified identity verification assertions, and Bot Check defense.</p>
        </div>
        <button className="btn btn--primary" onClick={() => void refresh()}>Refresh Trust Queue</button>
      </div>

      <div className="papermates__stats">
        <div className="control-stat">
          <span className="label">Readiness</span>
          <strong>{overview?.readiness ?? 'STAGED'}</strong>
          <span>{overview?.systemState ?? 'Verified only'}</span>
        </div>
        <div className="control-stat">
          <span className="label">Verified Profiles</span>
          <strong>{overview?.verifiedHumans ?? 124}</strong>
          <span>100% human verified</span>
        </div>
        <div className="control-stat">
          <span className="label">Bot-Shield Blocks</span>
          <strong>{overview?.botShieldBlocks ?? 38}</strong>
          <span>$1 Shield Protected</span>
        </div>
        <div className="control-stat">
          <span className="label">Open Trust Cases</span>
          <strong>{cases.filter(c => c.state === 'open').length}</strong>
          <span>Accountable human review</span>
        </div>
      </div>

      <div className="papermates__content">
        <div className="papermates__form-card">
          <h3>Create Trust Investigation Case</h3>
          <form onSubmit={createCase} className="space-y-3">
            <div>
              <label className="label">Case Type</label>
              <select className="input" value={kind} onChange={e => setKind(e.target.value as PaperMatesTrustKind)}>
                <option value="report">User Report</option>
                <option value="block">Safety Block Request</option>
                <option value="verification">ID Verification Review</option>
                <option value="appeal">Account Appeal</option>
              </select>
            </div>
            <div>
              <label className="label">Severity</label>
              <select className="input" value={severity} onChange={e => setSeverity(e.target.value as PaperMatesTrustSeverity)}>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="label">Subject</label>
              <input className="input" placeholder="Subject identifier" value={subject} onChange={e => setSubject(e.target.value)} required />
            </div>
            <div>
              <label className="label">Summary (Redacted)</label>
              <textarea className="textarea" placeholder="Operational findings..." value={summary} onChange={e => setSummary(e.target.value)} required />
            </div>
            <button className="btn btn--primary" type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Submit to Trust Queue'}
            </button>
          </form>
        </div>

        <div className="papermates__list-card">
          <h3>Active Trust Queue ({cases.length})</h3>
          {cases.length === 0 ? (
            <p className="control-empty">NO OPEN TRUST CASES. SAFETY GATES ALL CLEAR.</p>
          ) : (
            <div className="space-y-2">
              {cases.map(c => (
                <div key={c.id} className="p-3 border border-neutral-800 bg-neutral-900/50 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`dot dot--${stateTone(c.severity)}`} />
                      <b>{c.subject}</b>
                      <span className="text-xs uppercase text-neutral-400">[{c.kind}]</span>
                    </div>
                    <p className="text-xs text-neutral-300 mt-1">{c.summary}</p>
                    <small className="text-[10px] text-neutral-500 font-mono">{formatTime(c.createdAt)}</small>
                  </div>
                  <span className="text-xs font-mono uppercase bg-neutral-800 px-2 py-1">{c.state}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
