import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import type { ControlAlert, Health, OfficialVoteView, ServiceStatus, SupportCase, SwarmTask, Tab } from '../types';

type Props = {
  health: Health | null;
  tasks: SwarmTask[];
  onNavigate: (tab: Tab) => void;
};

function tone(status: ServiceStatus['status']): string {
  if (status === 'UP') return 'green';
  if (status === 'DOWN') return 'red';
  if (status === 'NOT CONFIGURED') return 'idle';
  return 'amber';
}

function formatTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ControlCenter({ health, tasks, onNavigate }: Props) {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [alerts, setAlerts] = useState<ControlAlert[]>([]);
  const [supportCases, setSupportCases] = useState<SupportCase[]>([]);
  const [judgeView, setJudgeView] = useState<OfficialVoteView | null>(null);
  const [repoNodes, setRepoNodes] = useState(0);
  const [repoBuiltAt, setRepoBuiltAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [summary, setSummary] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [busy, setBusy] = useState(false);
  const knownAlertIds = useRef(new Set<string>());
  const initializedAlerts = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const [serviceResult, alertResult, supportResult, voteResult, graphResult] = await Promise.all([
        api.services(),
        api.controlAlerts(),
        api.supportCases(),
        api.officialVoteView(),
        api.knowledgeGraph(),
      ]);
      setServices(serviceResult.services);
      setAlerts(alertResult.alerts);
      setSupportCases(supportResult.cases);
      setJudgeView(voteResult);
      setRepoNodes(graphResult.nodes.length);
      setRepoBuiltAt(graphResult.builtAt);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const poll = window.setInterval(() => void refresh(), 15_000);
    return () => window.clearInterval(poll);
  }, [refresh]);

  useEffect(() => {
    const unacknowledged = alerts.filter((alert) => !alert.acknowledgedAt);
    if (!initializedAlerts.current) {
      unacknowledged.forEach((alert) => knownAlertIds.current.add(alert.id));
      initializedAlerts.current = true;
      return;
    }
    const fresh = unacknowledged.filter((alert) => !knownAlertIds.current.has(alert.id));
    fresh.forEach((alert) => knownAlertIds.current.add(alert.id));
    if (fresh.length > 0 && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const alert = fresh[0];
      new Notification(`Mission Control: ${alert.subject}`, { body: `${alert.previousState} → ${alert.state}: ${alert.detail}` });
    }
  }, [alerts]);

  const acknowledge = async (id: string) => {
    await api.acknowledgeAlert(id);
    await refresh();
  };

  const submitCase = async (event: FormEvent) => {
    event.preventDefault();
    if (!subject.trim() || !summary.trim()) return;
    setBusy(true);
    try {
      await api.createSupportCase({ source: 'local', subject, summary, priority });
      setSubject('');
      setSummary('');
      setPriority('normal');
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const resolveCase = async (id: string) => {
    await api.updateSupportCase(id, { status: 'resolved' });
    await refresh();
  };

  const requestNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    await Notification.requestPermission();
  };

  const activeTasks = tasks.filter((task) => task.status === 'running' || task.status === 'queued').length;
  const blockedTasks = tasks.filter((task) => task.column === 'BLOCKED').length;
  const unresolvedCases = supportCases.filter((item) => item.status !== 'resolved').length;
  const alertCount = alerts.filter((item) => !item.acknowledgedAt).length;
  const blockedJudges = judgeView?.seats.filter((seat) => seat.state !== 'AVAILABLE').length ?? 0;

  return (
    <div className="control-center">
      <section className="control-center__toolbar">
        <div>
          <span className="label">Single operator view</span>
          <h1>Control Center</h1>
          <p>One truthful view of work, service identity, support operations, repository context, and advisory judging.</p>
        </div>
        <div className="control-center__actions">
          <button className="btn" type="button" onClick={() => void requestNotifications()}>Enable desktop notices</button>
          <button className="btn btn--primary" type="button" onClick={() => void refresh()}>Refresh verified state</button>
        </div>
      </section>

      <section className="control-summary" aria-label="Immediate operational summary">
        <article className="control-stat"><span className="label">Live work</span><strong>{activeTasks}</strong><span>{blockedTasks} blocked</span><button type="button" onClick={() => onNavigate('board')}>Open board →</button></article>
        <article className="control-stat"><span className="label">Service alerts</span><strong>{alertCount}</strong><span>{services.filter((service) => service.status === 'DOWN').length} verified down</span><button type="button" onClick={() => onNavigate('services')}>Open health →</button></article>
        <article className="control-stat"><span className="label">Support queue</span><strong>{unresolvedCases}</strong><span>local redacted cases</span><button type="button" onClick={() => document.getElementById('support-queue')?.scrollIntoView({ behavior: 'smooth' })}>Open queue →</button></article>
        <article className="control-stat"><span className="label">Judge lanes</span><strong>{blockedJudges}</strong><span>not currently available</span><button type="button" onClick={() => onNavigate('council')}>Open council →</button></article>
      </section>

      {error && <div className="notice notice--error">CONTROL CENTER DATA ERROR: {error}</div>}

      <section className="control-grid">
        <article className="control-panel control-panel--wide">
          <div className="control-panel__head"><div><span className="label">Verified service identity</span><h2>System health</h2></div><button className="btn" type="button" onClick={() => onNavigate('services')}>Full health view</button></div>
          <div className="control-services">
            {services.length === 0 && <p className="control-empty">NO SERVICE OBSERVATION YET — STARTUP IS NOT IMPLIED.</p>}
            {services.map((service) => <div className="control-service" key={service.name}><span className={`dot dot--${tone(service.status)}${service.status === 'DOWN' ? ' dot--pulse' : ''}`} /><div><b>{service.name}</b><small>{service.detail}</small></div><strong className={`control-status control-status--${tone(service.status)}`}>{service.status}</strong><span className="mono">{service.status === 'UP' ? `${service.ms}ms` : '—'}</span></div>)}
          </div>
        </article>

        <article className="control-panel">
          <div className="control-panel__head"><div><span className="label">Repository</span><h2>Canonical source</h2></div><button className="btn" type="button" onClick={() => onNavigate('brain')}>Search repo</button></div>
          <div className="control-facts"><div><span>Indexed nodes</span><b>{repoNodes || '—'}</b></div><div><span>Index built</span><b>{formatTime(repoBuiltAt)}</b></div><div><span>Manifest</span><b>Sanitized</b></div></div>
          <p className="control-note">Repo visibility is source-indexed. Secrets, populated environment files, build output, and arbitrary local files remain excluded.</p>
        </article>

        <article className="control-panel">
          <div className="control-panel__head"><div><span className="label">Independent official review</span><h2>Judge availability</h2></div><button className="btn" type="button" onClick={() => onNavigate('council')}>Evidence</button></div>
          <div className="control-judges">{judgeView?.seats.map((seat) => <div key={seat.platform}><span className={`dot dot--${seat.state === 'AVAILABLE' ? 'green' : seat.state === 'NOT CONFIGURED' ? 'idle' : 'amber'}`} /><b>{seat.label}</b><small>{seat.state} · {seat.actualModel ?? seat.requestedModel}</small></div>) ?? <p className="control-empty">OFFICIAL JUDGE STATUS NOT LOADED.</p>}</div>
        </article>

        <article className="control-panel">
          <div className="control-panel__head"><div><span className="label">Contextual drill-downs</span><h2>Work orchestration</h2></div><span className="pill">NO SECOND DASHBOARD</span></div>
          <p className="control-note">Use specialist views from this single Control Center to select agents, configure a governed swarm, inspect knowledge relationships, or review bridge status.</p>
          <div className="control-center__actions">
            <button className="btn" type="button" onClick={() => onNavigate('library')}>Open agent library</button>
            <button className="btn btn--primary" type="button" onClick={() => onNavigate('swarm')}>Open swarm setup</button>
            <button className="btn" type="button" onClick={() => onNavigate('graphy')}>Inspect graph</button>
            <button className="btn" type="button" onClick={() => onNavigate('bridge')}>Review bridge</button>
          </div>
        </article>

        <article className="control-panel control-panel--papermates">
          <div className="control-panel__head"><div><span className="label">Date app operations</span><h2>PaperMates</h2></div><span className="pill">TRUST-LED</span></div>
          <p className="control-note">You&amp;i, watched over by AI—through clear choices, report and block controls, Bot Check states, optional check-ins, Circle Date coordination, and accountable human review.</p>
          <div className="control-facts control-facts--two"><div><span>Support route</span><b>Not configured</b></div><div><span>Trust actions</span><b>Human review</b></div></div>
          <button className="btn btn--primary" type="button" onClick={() => onNavigate('papermates')}>Open PaperMates →</button>
        </article>

        <article className="control-panel control-panel--wide">
          <div className="control-panel__head"><div><span className="label">State transitions only</span><h2>Notification center</h2></div><span className="mono">{alertCount} UNACKNOWLEDGED</span></div>
          <div className="control-alerts">{alerts.length === 0 && <p className="control-empty">NO SERVICE STATE TRANSITIONS RECORDED.</p>}{alerts.slice(0, 8).map((alert) => <div className="control-alert" key={alert.id}><span className={`dot dot--${alert.state === 'UP' ? 'green' : alert.state === 'DOWN' ? 'red' : 'amber'}`} /><div><b>{alert.subject}: {alert.previousState} → {alert.state}</b><small>{alert.detail} · {formatTime(alert.createdAt)}</small></div>{alert.acknowledgedAt ? <span className="control-ack">ACKNOWLEDGED</span> : <button className="btn" type="button" onClick={() => void acknowledge(alert.id)}>Acknowledge</button>}</div>)}</div>
        </article>

        <article className="control-panel" id="support-queue">
          <div className="control-panel__head"><div><span className="label">Customer support administration</span><h2>Local support queue</h2></div><span className="pill">No external delivery</span></div>
          <form className="control-support-form" onSubmit={submitCase}><input className="input" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Redacted case subject" maxLength={140} required /><textarea className="textarea" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Internal, redacted summary only — no payment, identity, or credential data." maxLength={900} required /><div><select className="input" value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)} aria-label="Case priority"><option value="low">Low priority</option><option value="normal">Normal priority</option><option value="high">High priority</option><option value="urgent">Urgent priority</option></select><button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Create local case'}</button></div></form>
          <div className="control-cases">{supportCases.slice(0, 6).map((item) => <div className="control-case" key={item.id}><div><b>{item.subject}</b><small>{item.priority.toUpperCase()} · {item.status.toUpperCase()} · {formatTime(item.updatedAt)}</small><p>{item.summary}</p></div>{item.status !== 'resolved' && <button className="btn" type="button" onClick={() => void resolveCase(item.id)}>Resolve</button>}</div>)}{supportCases.length === 0 && <p className="control-empty">NO LOCAL SUPPORT CASES. CONNECTORS ARE NOT IMPLIED.</p>}</div>
        </article>

        <article className="control-panel">
          <div className="control-panel__head"><div><span className="label">Guardrails</span><h2>What this console will not do</h2></div></div>
          <ul className="control-guardrails"><li>Starting a runtime requires explicit authorization.</li><li>Official judge lanes remain independent and advisory.</li><li>Customer messages, payments, and Plaid sessions are not delivered from this view.</li><li>Git delivery stays under the authorized judge workflow.</li></ul>
          <div className="control-health-line">MISSION CONTROL API: <b>{health?.service === 'mission-control' ? 'IDENTIFIED' : 'NOT VERIFIED'}</b></div>
        </article>
      </section>
    </div>
  );
}
