import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '../icons';
import {
  fetchAgentFleet,
  fetchIncomePulse,
  type AgentSummary,
  type IncomePulse,
} from '../lib/missionMcpClient';

// ─── Sparkline ─────────────────────────────────────────────

interface SparkProps {
  values: number[];
  color?: string;
  height?: number;
}

function Spark({ values, color = '', height = 64 }: SparkProps) {
  const w = 280;
  const h = height;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - 6 - ((v - min) / span) * (h - 12);
    return [x, y] as [number, number];
  });
  const line = pts.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');
  const fill = line + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg className={'spark ' + color} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path className="fill" d={fill}/>
      <path className="line" d={line}/>
    </svg>
  );
}

// ─── Agent data ────────────────────────────────────────────

interface Agent {
  id: string;
  name: string;
  role: string;
  kind: 'opus' | 'gemini' | 'hermes' | 'codex' | 'gemma';
  status: 'live' | 'busy' | 'idle';
  state: string;
  body: string;
  tags: [string, string][];
  busy?: boolean;
}

const ORCHESTRATORS: Agent[] = [
  {
    id: 'opus', name: 'Opus', role: 'Chief of Staff · Anthropic', kind: 'opus', status: 'live',
    state: 'ORCHESTRATING · 4 workers',
    body: 'Routing Paperweight tasks · supervising Codex tests · drafting brief for Gemma4.',
    tags: [['opus','LEAD'], ['live','LIVE']], busy: true,
  },
  {
    id: 'gemini', name: 'Gemini', role: 'Co-Orchestrator · Google', kind: 'gemini', status: 'live',
    state: 'STRATEGIZING · 2 streams',
    body: 'Cross-referencing semantic memory · drafting Q3 OKR · feeding Cupid worker.',
    tags: [['bridge','CO-LEAD'], ['live','LIVE']], busy: true,
  },
];

const WORKERS: Agent[] = [
  { id: 'hermes',      name: 'Hermes',      role: 'Router · 9020',       kind: 'hermes', status: 'live', state: 'STREAMING · 12 hops/s', body: '$ ollama run opus → routing to local fleet.', tags: [['live','9020'], ['bridge','OPENCLAW']], busy: true },
  { id: 'codex',       name: 'Codex',        role: 'Coder · OSS',          kind: 'codex',  status: 'busy', state: 'RUNNING TESTS',          body: 'pnpm test --filter runtime · 14/16 pass',        tags: [['busy','BUSY']],                            busy: true },
  { id: 'gemma',       name: 'Gemma4',       role: 'Local Worker · 32B',   kind: 'gemma',  status: 'idle', state: 'STANDBY',                body: 'Ollama · awaiting moderation overflow tonight.',   tags: [['idle','IDLE']] },
  { id: 'pi',          name: 'Pi',           role: 'Conversational',       kind: 'gemma',  status: 'idle', state: 'LISTENING',              body: 'Watching #mission-control for context cues.',      tags: [['idle','IDLE']] },
  { id: 'cupid',       name: 'Cupid',        role: 'Ad Ops Worker',        kind: 'codex',  status: 'busy', state: 'PUBLISHING · 12 ads',    body: 'Meta creative refresh · 4 placements live.',       tags: [['busy','RUN']],                             busy: true },
  { id: 'perplexity',  name: 'Perplexity',   role: 'Research · Deep',      kind: 'gemma',  status: 'live', state: 'SEARCHING · 14 sources', body: 'Indexing court filings · charity compliance.',     tags: [['live','LIVE']],                            busy: true },
];

function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div className={'agent-card ' + (agent.busy ? 'is-busy' : '')}>
      <div className="agent-head">
        <div className={'agent-glyph ' + agent.kind}>
          {agent.kind === 'opus'   && <Icon.Brain size={18}/>}
          {agent.kind === 'gemini' && <Icon.Sparkles size={18}/>}
          {agent.kind === 'hermes' && <Icon.Hermes size={18}/>}
          {agent.kind === 'codex'  && <Icon.Terminal size={18}/>}
          {agent.kind === 'gemma'  && <Icon.Cpu size={18}/>}
        </div>
        <div>
          <div className="agent-name">{agent.name}</div>
          <div className="agent-role">{agent.role}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span className={'status-dot ' + agent.status}/>
        </div>
      </div>
      <div className="agent-body">{agent.body}</div>
      <div className="agent-foot">
        <div style={{ display: 'flex', gap: 6 }}>
          {agent.tags.map(([cls, label]) => (
            <span key={label} className={'tag ' + cls}>{label}</span>
          ))}
        </div>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>{agent.state}</span>
      </div>
    </div>
  );
}

// ─── Log feed ──────────────────────────────────────────────

interface LogRow {
  t: string;
  who: string;
  msg: string;
  accent?: string;
  after?: string;
}

const SEED_LOG: LogRow[] = [
  { t: '11:42:01', who: 'opus',   msg: 'Delegated → ', accent: 'Hermes', after: ': "audit task router for race conditions"' },
  { t: '11:41:58', who: 'hermes', msg: 'POST /api/paperweight · 200 OK · task PAPA-241 created' },
  { t: '11:41:32', who: 'gemini', msg: 'Analyzed Q3 OKR draft · 4 alignment gaps flagged' },
  { t: '11:40:55', who: 'user',   msg: 'cmd: "summarize today\'s commits"' },
  { t: '11:40:12', who: 'hermes', msg: 'BRIDGE telegram://chat/joshua → broadcast to #mission-control' },
  { t: '11:39:48', who: 'opus',   msg: 'Memory snapshot persisted → ~/memory/episodic/2026-05-12.json' },
  { t: '11:39:02', who: 'system', msg: 'Self-Improving Agent loop · iteration 47 complete' },
];

function LogFeed() {
  const [rows, setRows] = useState<LogRow[]>(SEED_LOG);
  useEffect(() => {
    const synthetic: LogRow[] = [
      { who: 'hermes', t: '', msg: 'GET /ollama/healthz · 200 · 12ms' },
      { who: 'opus',   t: '', msg: 'Reviewed sticky · ', accent: 'PAPA-238', after: ' · approved for dispatch' },
      { who: 'gemini', t: '', msg: 'Indexed conversation buffer · 1.2k tokens' },
      { who: 'hermes', t: '', msg: 'Routed prompt → claude-opus-4-5 (cloud)' },
      { who: 'system', t: '', msg: 'Memory: working → semantic promotion · 3 entries' },
    ];
    const id = setInterval(() => {
      const pick = synthetic[Math.floor(Math.random() * synthetic.length)];
      const now = new Date();
      const t = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      setRows(prev => [{ ...pick, t }, ...prev].slice(0, 14));
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="log">
      {rows.map((r, i) => (
        <div key={r.t + '-' + i} className="log-row">
          <span className="ts">{r.t}</span>
          <span className={'who ' + r.who}>{r.who.toUpperCase()}</span>
          <span className="msg">
            {r.msg}
            {r.accent && <span className="accent">{r.accent}</span>}
            {r.after && <span>{r.after}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── MCP connection status badge ───────────────────────────

type McpState = 'loading' | 'live' | 'offline';

function McpBadge({ state }: { state: McpState }) {
  if (state === 'loading') {
    return (
      <span className="tag" style={{ background: 'rgba(88,168,224,0.14)', color: 'var(--sky)' }}>
        <span className="status-dot" style={{ background: 'var(--sky)' }}/> MCP CONNECTING…
      </span>
    );
  }
  if (state === 'offline') {
    return (
      <span className="tag error" title="mission-mcp unreachable — showing stub data">
        OFFLINE · STUB DATA
      </span>
    );
  }
  return (
    <span className="tag live">
      <span className="status-dot live"/> MCP LIVE
    </span>
  );
}

// ─── Live fleet panel ───────────────────────────────────────

function LiveFleetPanel({ agents, mcpState, fleetSpark }: {
  agents: AgentSummary[];
  mcpState: McpState;
  fleetSpark: number[];
}) {
  const activeCount = agents.filter(a => a.status === 'active').length;
  const total = agents.length;

  if (mcpState !== 'offline' && total === 0 && mcpState !== 'loading') {
    return (
      <div className="card card--green span-4">
        <div className="card-h">
          <div className="t"><Icon.Network size={12}/> AGENT FLEET</div>
          <McpBadge state={mcpState}/>
        </div>
        <div className="kpi-row">
          <div className="kpi" style={{ fontSize: 28, color: 'var(--ink-3)' }}>—</div>
        </div>
        <div className="kpi-foot">no agents active yet</div>
        <div style={{ marginTop: 16 }}>
          <Spark values={fleetSpark} color="green" height={72}/>
        </div>
      </div>
    );
  }

  return (
    <div className="card card--green span-4">
      <div className="card-h">
        <div className="t"><Icon.Network size={12}/> AGENT FLEET</div>
        <McpBadge state={mcpState}/>
      </div>
      <div className="kpi-row">
        {mcpState === 'loading' ? (
          <div className="kpi" style={{ fontSize: 28, color: 'var(--ink-3)' }}>…</div>
        ) : (
          <>
            <div className="kpi">
              {activeCount}
              <span style={{ fontSize: 22, color: 'var(--ink-3)', marginLeft: 6 }}>/ {total}</span>
            </div>
            {activeCount > 0 && <div className="kpi-delta">{activeCount} active</div>}
          </>
        )}
      </div>
      <div className="kpi-foot">
        {mcpState === 'offline'
          ? '8 agents · stub data'
          : total === 0
            ? 'no agents in task board yet'
            : `${activeCount} active · ${total - activeCount} idle · live from mission-mcp`}
      </div>
      <div style={{ marginTop: 16 }}>
        <Spark values={fleetSpark} color="green" height={72}/>
      </div>
      {agents.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {agents.slice(0, 4).map(a => (
            <span key={a.agentId} className={'tag ' + (a.status === 'active' ? 'busy' : 'idle')} title={a.model}>
              {a.agentId.toUpperCase().slice(0, 12)}
            </span>
          ))}
        </div>
      )}
      {mcpState === 'offline' && (
        <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className="tag opus">OPUS LEAD</span>
          <span className="tag bridge">GEMINI CO-LEAD</span>
          <span className="tag live">HERMES 9020</span>
        </div>
      )}
    </div>
  );
}

// ─── Live income-engine pulse panel ────────────────────────

function LivePulsePanel({ pulse, mcpState }: { pulse: IncomePulse | null; mcpState: McpState }) {
  const stubRevenue = [128, 142, 130, 156, 168, 152, 188, 196, 184, 212, 226, 240, 232, 258, 274];

  return (
    <div className="card card--accent span-5">
      <div className="card-h">
        <div className="t"><Icon.Coins size={12}/> INCOME-ENGINE PULSE · 7D</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="t" style={{ color: 'var(--odoo-300)' }}>Genspark playbook tasks</div>
          <McpBadge state={mcpState}/>
        </div>
      </div>

      {mcpState === 'loading' && (
        <>
          <div className="kpi-row">
            <div className="kpi" style={{ fontSize: 28, color: 'var(--ink-3)' }}>…</div>
          </div>
          <div className="kpi-foot">connecting to mission-mcp</div>
          <div style={{ marginTop: 14 }}><Spark values={stubRevenue} color="" height={72}/></div>
        </>
      )}

      {mcpState === 'offline' && (
        <>
          <div className="kpi-row">
            <div className="kpi">$8,412</div>
            <div className="kpi-delta">+18.4%</div>
          </div>
          <div className="kpi-foot">⊙ Square primary · Stripe sunset path</div>
          <div style={{ marginTop: 14 }}><Spark values={stubRevenue} color="" height={72}/></div>
          <div className="bar-row" style={{ marginTop: 16 }}>
            <span className="label">→ EARMARKED</span>
            <div className="bar"><i style={{ width: '62%' }}/></div>
            <span className="v">$5.2K</span>
          </div>
        </>
      )}

      {mcpState === 'live' && pulse && (
        <>
          {pulse.totalTasks === 0 ? (
            <>
              <div className="kpi-row">
                <div className="kpi" style={{ fontSize: 28, color: 'var(--ink-3)' }}>—</div>
              </div>
              <div className="kpi-foot">no income-engine tasks seeded yet</div>
            </>
          ) : (
            <>
              <div className="kpi-row">
                <div className="kpi">{pulse.totalTasks}</div>
                <div className="kpi-delta">
                  {pulse.dailyVelocity > 0 ? `${pulse.dailyVelocity}/day` : 'no velocity yet'}
                </div>
              </div>
              <div className="kpi-foot">total tasks · task velocity = leading revenue indicator</div>
              <div style={{ marginTop: 14 }}>
                <Spark
                  values={pulse.completionSpark.some(v => v > 0) ? pulse.completionSpark : [0,0,0,0,0,0,1]}
                  color=""
                  height={72}
                />
              </div>
              <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { l: 'TOTAL', v: pulse.totalTasks, c: 'var(--ink)' },
                  { l: 'DONE', v: pulse.completedCount, c: 'var(--green)' },
                  { l: 'ACTIVE', v: pulse.inProgressCount + pulse.pendingCount, c: 'var(--amber)' },
                ].map(b => (
                  <div key={b.l} style={{ padding: '12px 14px', background: 'var(--bg-3)', border: '1px solid var(--line)', borderRadius: 12 }}>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>{b.l}</div>
                    <div style={{ fontWeight: 900, fontSize: 28, lineHeight: 1, color: b.c, marginTop: 6 }}>{b.v}</div>
                  </div>
                ))}
              </div>
              <div className="bar-row" style={{ marginTop: 16 }}>
                <span className="label">COMPLETE</span>
                <div className="bar">
                  <i style={{ width: `${Math.round((pulse.completedCount / pulse.totalTasks) * 100)}%` }}/>
                </div>
                <span className="v">{Math.round((pulse.completedCount / pulse.totalTasks) * 100)}%</span>
              </div>
            </>
          )}
          <div className="kpi-foot" style={{ marginTop: 10, color: 'var(--amber)', fontStyle: 'italic' }}>
            ILLUSTRATIVE · task velocity is leading indicator only
          </div>
        </>
      )}
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────

export function Dashboard() {
  // ── MCP live data state ──────────────────────────────────
  const [mcpState, setMcpState]     = useState<McpState>('loading');
  const [agents, setAgents]         = useState<AgentSummary[]>([]);
  const [pulse, setPulse]           = useState<IncomePulse | null>(null);
  const [fleetSpark, setFleetSpark] = useState<number[]>([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);

  const STUB_FLEET_SPARK  = [4, 5, 4, 6, 7, 6, 8, 7, 9, 10, 8, 11, 10, 12, 12];

  const loadLiveData = useCallback(async () => {
    const [fleetResult, pulseResult] = await Promise.all([
      fetchAgentFleet(),
      fetchIncomePulse(),
    ]);

    const eitherOnline = fleetResult.ok || pulseResult.ok;
    setMcpState(eitherOnline ? 'live' : 'offline');

    if (fleetResult.ok) {
      setAgents(fleetResult.agents);
      // Build a 15-point spark from live agent count (active agents per poll tick)
      const totalActive = fleetResult.agents.filter(a => a.status === 'active').length;
      setFleetSpark(prev => [...prev.slice(1), totalActive]);
    }

    if (pulseResult.ok) {
      setPulse(pulseResult.pulse);
    }
  }, []);

  // Initial load + 5s polling
  useEffect(() => {
    loadLiveData();
    const id = setInterval(loadLiveData, 5000);
    return () => clearInterval(id);
  }, [loadLiveData]);

  const givingArc  = [12, 18, 16, 24, 32, 28, 41, 48, 52, 61, 68, 74, 83, 92, 104];
  const displayFleetSpark = mcpState === 'offline' ? STUB_FLEET_SPARK : fleetSpark;

  return (
    <div className="page-anim">
      <div className="page-head">
        <div>
          <h1 className="page-title">Mission <span className="accent">Control</span></h1>
          <div className="page-sub">Operator · Joshua Coleman · Opus + Gemini orchestrating · Hermes streaming</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <McpBadge state={mcpState}/>
          <span className="tag live outline"><span className="status-dot live"/> ALL SYSTEMS NOMINAL</span>
          <span className="tag opus outline"><Icon.Brain size={11}/> OPUS + GEMINI LEAD</span>
        </div>
      </div>

      <div className="bento">

        {/* ── HERO · #UntilNoKidInNeed ─────────────────────────── */}
        <div className="card kids-hero span-12">
          <div className="kids-bg" aria-hidden="true">
            <svg viewBox="0 0 1200 220" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="kg" x1="0" x2="1">
                  <stop offset="0" stopColor="#714B67" stopOpacity="0.18"/>
                  <stop offset="1" stopColor="#e36a76" stopOpacity="0.12"/>
                </linearGradient>
                <linearGradient id="kg2" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="rgba(126,94,142,0.0)"/>
                  <stop offset="1" stopColor="rgba(126,94,142,0.3)"/>
                </linearGradient>
              </defs>
              <path d="M0,180 C150,160 250,90 400,110 C540,128 660,60 820,80 C960,98 1080,40 1200,60 L1200,220 L0,220 Z" fill="url(#kg)"/>
              <path d="M0,200 C200,180 300,140 480,150 C620,160 780,100 940,120 C1080,138 1140,80 1200,90 L1200,220 L0,220 Z" fill="url(#kg2)"/>
            </svg>
          </div>
          <div className="kids-content">
            <div className="kids-left">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.32em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>MISSION · ALWAYS-ON</span>
                <Icon.Heart size={11} style={{ color: 'var(--rose)' }}/>
                <span className="tag" style={{ background: 'rgba(230,169,58,0.14)', color: 'var(--amber)' }}>ILLUSTRATIVE</span>
              </div>
              <div className="kids-headline">
                #Until<span className="accent">No</span>KidIn<span className="accent">Need</span>
              </div>
              <div className="kids-sub">
                A portion of what this fleet earns — after taxes, fees, and operating costs — is designated for families who need medical care.
                Gravity keeps us grounded; AntiGravity tries to lift a kid up.
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button style={{ padding: '10px 18px', borderRadius: 999, background: 'linear-gradient(135deg, var(--odoo) 0%, #2a1235 100%)', border: '1px solid var(--odoo-300)', color: 'white', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px var(--odoo-glow)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Icon.Heart size={12}/> MEET THE PARTNERS
                </button>
                <button style={{ padding: '10px 18px', borderRadius: 999, background: 'transparent', border: '1px solid var(--line-2)', color: 'var(--ink)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Icon.Eye size={12}/> READ THE COMMITMENT
                </button>
              </div>
            </div>
            <div className="kids-stats">
              <div className="kids-stat">
                <div className="kids-stat-v">$10,482</div>
                <div className="kids-stat-l">EARMARKED FOR CARE · YTD</div>
                <div className="kids-stat-d up">+$640 THIS WEEK</div>
              </div>
              <div className="kids-stat">
                <div className="kids-stat-v">14</div>
                <div className="kids-stat-l">FAMILIES IN OUTREACH</div>
                <div className="kids-stat-d up">+2 THIS MONTH</div>
              </div>
              <div className="kids-stat">
                <div className="kids-stat-v">62<span style={{ fontSize: 22, color: 'var(--ink-3)' }}>%</span></div>
                <div className="kids-stat-l">OF NET PROCEEDS · TARGET</div>
                <div className="kids-stat-d">→ AICOLLAB4KIDS / OMEGA</div>
              </div>
              <div className="kids-stat kids-stat--spark">
                <div className="kids-stat-l">DESIGNATION ARC · 14D</div>
                <Spark values={givingArc} color="rose" height={72}/>
                <div className="kids-stat-d up">+182% QoQ</div>
              </div>
            </div>
          </div>
        </div>

        {/* Income-engine pulse — live from mission-mcp */}
        <LivePulsePanel pulse={pulse} mcpState={mcpState}/>

        {/* Agent fleet — live from mission-mcp task assignments */}
        <LiveFleetPanel agents={agents} mcpState={mcpState} fleetSpark={displayFleetSpark}/>

        {/* Node health */}
        <div className="card span-3">
          <div className="card-h">
            <div className="t"><Icon.Hermes size={12}/> 9020 NODE</div>
            <span className="status-dot live"/>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
            {[
              { label: 'CPU',     cls: 'green', w: '34%', v: '34%' },
              { label: 'VRAM',    cls: 'sky',   w: '78%', v: '78%' },
              { label: 'CONTEXT', cls: 'amber', w: '52%', v: '52%' },
              { label: 'HOPS / S', cls: '',     w: '88%', v: '12.4' },
            ].map(b => (
              <div key={b.label} className={'bar-row ' + b.cls}>
                <span className="label">{b.label}</span>
                <div className="bar"><i style={{ width: b.w }}/></div>
                <span className="v">{b.v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--line)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.16em', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
            <span>UPTIME 14d 6h</span>
            <span>OPENCLAW 0.9.3</span>
          </div>
        </div>

        {/* Orchestrators tier */}
        <div className="card span-12 tier-card">
          <div className="card-h">
            <div className="t"><Icon.Brain size={12}/> ORCHESTRATORS · TIER 1</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="tag opus outline">CLAUDE OPUS</span>
              <span className="tag bridge outline">GEMINI 2.5 PRO</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {ORCHESTRATORS.map(a => <AgentCard key={a.id} agent={a}/>)}
          </div>
        </div>

        {/* Workers tier */}
        <div className="card span-8">
          <div className="card-h">
            <div className="t"><Icon.Cpu size={12}/> WORKERS · TIER 2 · DELEGATED</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="tag outline"><Icon.Filter size={11}/> ALL</span>
              <span className="tag outline"><Icon.Refresh size={11}/> 5s</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {WORKERS.map(a => <AgentCard key={a.id} agent={a}/>)}
          </div>
        </div>

        {/* Live log */}
        <div className="card span-4">
          <div className="card-h">
            <div className="t"><Icon.Terminal size={12}/> LIVE TICKER</div>
            <span className="tag live"><span className="status-dot live"/> STREAMING</span>
          </div>
          <LogFeed/>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            <span><Icon.Eye size={10} style={{ display: 'inline', verticalAlign: '-1px' }}/> TRANSPARENT · NO HIDDEN CONTEXT</span>
            <span>TOS ✓</span>
          </div>
        </div>

        {/* Paperweight summary */}
        <div className="card span-6">
          <div className="card-h">
            <div className="t"><Icon.Paperweight size={12}/> PAPERWEIGHT · DELEGATIONS</div>
            <span className="tag opus">12 OPEN</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { l: 'INBOX',     v: 3,  c: 'var(--ink-2)' },
              { l: 'DELEGATED', v: 5,  c: 'var(--sky)' },
              { l: 'PROGRESS',  v: 4,  c: 'var(--amber)' },
              { l: 'COMPLETE',  v: 28, c: 'var(--green)' },
            ].map(b => (
              <div key={b.l} className="card card--flat card--inset" style={{ padding: 16 }}>
                <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>{b.l}</div>
                <div style={{ fontWeight: 900, fontSize: 32, lineHeight: 1, letterSpacing: '-0.04em', color: b.c, marginTop: 8 }}>{b.v}</div>
              </div>
            ))}
          </div>
          <hr className="divider-h"/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { id: 'PAPA-241', who: 'opus',   txt: 'Audit task router for race conditions', state: 'progress' },
              { id: 'PAPA-238', who: 'gemini', txt: 'Draft Q3 OKR alignment doc · YouAndINotAI', state: 'progress' },
              { id: 'PAPA-237', who: 'hermes', txt: 'Bridge Telegram inbound → #mission-control', state: 'done' },
            ].map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: 'var(--bg-3)', border: '1px solid var(--line)', borderRadius: 12 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{t.id}</span>
                <span className={'tag ' + (t.who === 'opus' ? 'opus' : t.who === 'gemini' ? 'bridge' : 'live')}>{t.who.toUpperCase()}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{t.txt}</span>
                <span className={'tag ' + (t.state === 'done' ? 'live' : 'busy')}>
                  {t.state === 'done' ? <Icon.Check size={11}/> : <Icon.Clock size={11}/>} {t.state.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bridges */}
        <div className="card span-3">
          <div className="card-h">
            <div className="t"><Icon.Layers size={12}/> BRIDGES</div>
          </div>
          <div className="bridges">
            <div className="bridge-card sky">
              <div className="h">
                <Icon.Telegram size={16}/>
                <span className="name">Telegram</span>
                <span className="tag live status">LISTENING</span>
              </div>
              <div className="meta">@joshua_coleman · 4 chats bridged · 12 msgs/day</div>
            </div>
            <div className="bridge-card indigo">
              <div className="h">
                <Icon.Discord size={16}/>
                <span className="name">Discord</span>
                <span className="tag live status">CONNECTED</span>
              </div>
              <div className="meta">3 servers · 7 channels mirrored</div>
            </div>
            <div className="bridge-card">
              <div className="h">
                <Icon.GitBranch size={16}/>
                <span className="name">GitHub</span>
                <span className="tag opus status">OPUS-WEBHOOK</span>
              </div>
              <div className="meta">enigma · omega · 9020 · antigravity</div>
            </div>
          </div>
        </div>

        {/* Self-improving loop */}
        <div className="card card--accent span-3">
          <div className="card-h">
            <div className="t"><Icon.Sparkles size={12}/> SELF-IMPROVING LOOP</div>
            <span className="tag opus">EPISODIC</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <div className="kpi" style={{ fontSize: 36, color: 'var(--odoo-200)' }}>47</div>
            <div className="kpi-foot">iterations · last 24h</div>
          </div>
          <hr className="divider-h"/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['SEMANTIC', '1.4K facts'],
              ['EPISODIC', '212 traces'],
              ['WORKING',  '14 buffers'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ink-2)' }}>
                <span className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
