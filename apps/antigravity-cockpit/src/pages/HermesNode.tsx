import React from 'react';
import { Icon } from '../icons';

interface RoutingDiagramProps {
  hermesOn: boolean;
}

function RoutingDiagram({ hermesOn }: RoutingDiagramProps) {
  return (
    <svg viewBox="0 0 720 360" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="hg-route" x1="0" x2="1">
          <stop offset="0" stopColor="#714B67" stopOpacity="0.0"/>
          <stop offset="0.5" stopColor="#b3a2bf" stopOpacity="1"/>
          <stop offset="1" stopColor="#714B67" stopOpacity="0.0"/>
        </linearGradient>
        <radialGradient id="hg-glow" cx="0.5" cy="0.5">
          <stop offset="0" stopColor="#b3a2bf" stopOpacity="0.7"/>
          <stop offset="1" stopColor="#b3a2bf" stopOpacity="0"/>
        </radialGradient>
        <filter id="hg-blur"><feGaussianBlur stdDeviation="1.2"/></filter>
      </defs>

      {/* Sources (left) */}
      {([
        { y: 60,  label: '#mission-control', sub: 'Operator chat',    color: '#f4f0f8' },
        { y: 150, label: 'Telegram bridge',   sub: 'Inbound @joshua', color: '#58a8e0' },
        { y: 240, label: 'Discord bridge',    sub: 'Multi-server',    color: '#8d7fd4' },
        { y: 330, label: 'Webhooks',          sub: 'GitHub · Square', color: '#e6a93a' },
      ] as const).map((s, i) => (
        <g key={i}>
          <rect x="20" y={s.y - 22} width="160" height="44" rx="12" fill="#1a0e26" stroke="rgba(255,255,255,0.12)"/>
          <circle cx="38" cy={s.y} r="5" fill={s.color}/>
          <text x="54" y={s.y - 3} fill="#f4f0f8" fontFamily="Inter" fontSize="11" fontWeight="700">{s.label}</text>
          <text x="54" y={s.y + 11} fill="#8c7d9d" fontFamily="JetBrains Mono" fontSize="8" letterSpacing="1">{s.sub.toUpperCase()}</text>
        </g>
      ))}

      {/* Hermes node (center) */}
      <g>
        <circle cx="360" cy="195" r="58" fill="url(#hg-glow)"/>
        <rect x="296" y="165" width="128" height="60" rx="18"
          fill={hermesOn ? '#2a1235' : '#1a0e26'}
          stroke={hermesOn ? '#b3a2bf' : 'rgba(255,255,255,0.18)'}
          strokeWidth="1.5"
        />
        <text x="360" y="192" textAnchor="middle" fill={hermesOn ? '#ffffff' : '#b9adc6'} fontFamily="JetBrains Mono" fontWeight="800" fontSize="13" letterSpacing="1">HERMES</text>
        <text x="360" y="208" textAnchor="middle" fill={hermesOn ? '#b3a2bf' : '#5e5170'} fontFamily="JetBrains Mono" fontWeight="700" fontSize="9" letterSpacing="2">NODE 9020 · OPENCLAW</text>
        {hermesOn && (
          <circle cx="312" cy="180" r="3" fill="#3fbf72">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite"/>
          </circle>
        )}
      </g>

      {/* Targets (right) */}
      {([
        { y: 50,  label: 'Opus',   sub: 'Cloud · claude-opus-4-5', color: '#b3a2bf' },
        { y: 130, label: 'Gemini', sub: 'Cloud · 2.5-pro',         color: '#58a8e0' },
        { y: 210, label: 'Gemma4', sub: 'Local · ollama:11434',    color: '#3fbf72' },
        { y: 290, label: 'Codex',  sub: 'Local · oss-coder',       color: '#e6a93a' },
      ] as const).map((t, i) => (
        <g key={i}>
          <rect x="540" y={t.y - 22} width="160" height="44" rx="12" fill="#1a0e26" stroke="rgba(255,255,255,0.12)"/>
          <circle cx="558" cy={t.y} r="5" fill={t.color}/>
          <text x="574" y={t.y - 3} fill="#f4f0f8" fontFamily="Inter" fontSize="11" fontWeight="700">{t.label}</text>
          <text x="574" y={t.y + 11} fill="#8c7d9d" fontFamily="JetBrains Mono" fontSize="8" letterSpacing="1">{t.sub.toUpperCase()}</text>
        </g>
      ))}

      {/* Routes sources → hermes */}
      {[60, 150, 240, 330].map((y, i) => (
        <path
          key={'l' + i}
          d={`M 180 ${y} C 240 ${y}, 270 195, 296 195`}
          stroke={hermesOn ? 'url(#hg-route)' : 'rgba(255,255,255,0.08)'}
          strokeWidth="1.6"
          fill="none"
        />
      ))}
      {/* Routes hermes → targets */}
      {[50, 130, 210, 290].map((y, i) => (
        <path
          key={'r' + i}
          d={`M 424 195 C 460 195, 480 ${y}, 540 ${y}`}
          stroke={hermesOn ? 'url(#hg-route)' : 'rgba(255,255,255,0.08)'}
          strokeWidth="1.6"
          fill="none"
        />
      ))}

      {/* Animated dots — only when hermes is on */}
      {hermesOn && [
        { d: 'M 180 60 C 240 60, 270 195, 296 195',   dur: '2.2s', delay: '0s' },
        { d: 'M 180 150 C 240 150, 270 195, 296 195', dur: '2.4s', delay: '0.6s' },
        { d: 'M 180 240 C 240 240, 270 195, 296 195', dur: '2s',   delay: '1.1s' },
        { d: 'M 424 195 C 460 195, 480 50, 540 50',   dur: '2.3s', delay: '0.4s' },
        { d: 'M 424 195 C 460 195, 480 130, 540 130', dur: '2.0s', delay: '0.9s' },
        { d: 'M 424 195 C 460 195, 480 210, 540 210', dur: '2.6s', delay: '1.4s' },
      ].map((p, i) => (
        <g key={'p' + i}>
          <path id={`hpath-${i}`} d={p.d} fill="none" stroke="none"/>
          <circle r="3" fill="#b3a2bf">
            <animateMotion dur={p.dur} repeatCount="indefinite" begin={p.delay}>
              <mpath href={`#hpath-${i}`}/>
            </animateMotion>
          </circle>
        </g>
      ))}
    </svg>
  );
}

interface HermesNodeProps {
  hermesOn: boolean;
  onToggle: () => void;
}

export function HermesNode({ hermesOn, onToggle }: HermesNodeProps) {
  return (
    <div className="page-anim">
      <div className="page-head">
        <div>
          <h1 className="page-title">Hermes <span className="accent">9020</span> Node</h1>
          <div className="page-sub">Local orchestration · OpenClaw · Ollama · Nous Research · 11435 router</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className={'tag outline ' + (hermesOn ? 'live' : 'idle')}>
            <span className={'status-dot ' + (hermesOn ? 'live' : 'idle')}/>
            {hermesOn ? 'STREAMING · 12 HOPS/S' : 'DORMANT · RESTORE GRAVITY'}
          </span>
          <span className="tag opus outline"><Icon.Shield size={11}/> TOS COMPLIANT</span>
        </div>
      </div>

      <div className="hermes-stage">
        {/* Left — toggle + identity */}
        <div className="hermes-mode-card">
          <div style={{ position: 'relative' }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.24em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>HERMES MODE</div>
            <div style={{ fontWeight: 900, fontSize: 42, lineHeight: 1, letterSpacing: '-0.04em', marginTop: 10 }}>
              {hermesOn ? <>Routing through <span style={{ color: 'var(--odoo-300)' }}>9020</span></> : <>Direct mode</>}
            </div>
            <div className="mono" style={{ fontSize: 11, lineHeight: 1.6, color: 'var(--ink-2)', marginTop: 14, letterSpacing: '0.04em' }}>
              {hermesOn
                ? 'All chat is broadcast to #mission-control and routed through the local OpenClaw fleet before egress to cloud models. Every hop is logged.'
                : 'Comms route directly to the active agent without local interception. Hermes will only watch for context updates.'}
            </div>

            <button className="hermes-big-toggle" onClick={onToggle}>
              {hermesOn ? <Icon.Bolt size={14}/> : <Icon.BoltOff size={14}/>}
              {hermesOn ? 'HERMES ACTIVE — DISENGAGE' : 'ENGAGE HERMES ROUTING'}
            </button>

            <hr className="divider-h" style={{ marginTop: 22 }}/>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['BACKEND',    '~/.hermes/openclaw/9020'],
                ['ROUTER',     'localhost:11435'],
                ['LOCAL POOL', 'Ollama · Gemma4 · Codex · Pi'],
                ['CLOUD POOL', 'Claude · Gemini · Perplexity'],
                ['POLICY',     'Transparent · 100% TOS · No hidden ctx'],
              ].map(([k, v]) => (
                <div key={k} className="mono" style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 9.5, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>{k}</span>
                  <span style={{ color: 'var(--ink)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — routing visualization */}
        <div className="routing-grid dotgrid">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, position: 'relative', zIndex: 1 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.24em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>LIVE ROUTING · 9020 → FLEET</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="tag live outline"><span className="status-dot live"/> 6 ROUTES</span>
              <span className="tag bridge outline"><Icon.Bolt size={11}/> 210MS P95</span>
            </div>
          </div>
          <RoutingDiagram hermesOn={hermesOn}/>
        </div>
      </div>

      <div className="bento" style={{ marginTop: 22 }}>
        <div className="card span-4">
          <div className="card-h">
            <div className="t"><Icon.Cpu size={12}/> NODE HEALTH</div>
            <span className={'tag ' + (hermesOn ? 'live' : 'idle')}>
              <span className={'status-dot ' + (hermesOn ? 'live' : 'idle')}/> {hermesOn ? 'LIVE' : 'IDLE'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'CPU',     cls: 'green', w: hermesOn ? '38%' : '6%',  v: hermesOn ? '38%'  : '6%' },
              { label: 'VRAM',    cls: 'sky',   w: hermesOn ? '78%' : '14%', v: hermesOn ? '78%'  : '14%' },
              { label: 'CONTEXT', cls: 'amber', w: hermesOn ? '52%' : '2%',  v: hermesOn ? '52%'  : '2%' },
              { label: 'HOPS / S', cls: '',     w: hermesOn ? '88%' : '4%',  v: hermesOn ? '12.4' : '0.0' },
              { label: 'QUEUE',    cls: '',     w: hermesOn ? '22%' : '0%',  v: hermesOn ? '3'    : '0' },
            ].map(b => (
              <div key={b.label} className={'bar-row ' + b.cls}>
                <span className="label">{b.label}</span>
                <div className="bar"><i style={{ width: b.w }}/></div>
                <span className="v">{b.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card span-5">
          <div className="card-h">
            <div className="t"><Icon.Terminal size={12}/> ROUTER LOG</div>
            <span className="tag opus">localhost:11435</span>
          </div>
          <div className="mono" style={{ fontSize: 11, lineHeight: 1.7, color: 'var(--ink-2)', maxHeight: 240, overflow: 'auto' }}>
            {hermesOn ? (
              <>
                <div><span style={{ color: 'var(--ink-4)' }}>11:42:08</span> <span style={{ color: 'var(--green)' }}>POST</span> /v1/chat/completions → claude-opus-4-5 <span style={{ color: 'var(--ink-4)' }}>200 · 184ms</span></div>
                <div><span style={{ color: 'var(--ink-4)' }}>11:42:05</span> <span style={{ color: 'var(--green)' }}>POST</span> /v1/route → gemma4:32b <span style={{ color: 'var(--ink-4)' }}>200 · 92ms</span></div>
                <div><span style={{ color: 'var(--ink-4)' }}>11:42:02</span> <span style={{ color: 'var(--sky)' }}>BRIDGE</span> telegram → #mission-control · 1 msg</div>
                <div><span style={{ color: 'var(--ink-4)' }}>11:41:58</span> <span style={{ color: 'var(--green)' }}>POST</span> /v1/chat/completions → gemini-2.5-pro <span style={{ color: 'var(--ink-4)' }}>200 · 312ms</span></div>
                <div><span style={{ color: 'var(--ink-4)' }}>11:41:42</span> <span style={{ color: 'var(--green)' }}>GET</span>  /ollama/healthz · 200 · 12ms</div>
                <div><span style={{ color: 'var(--ink-4)' }}>11:41:31</span> <span style={{ color: 'var(--odoo-300)' }}>HOOK</span> opus.reflect · iteration 47 · committed</div>
                <div><span style={{ color: 'var(--ink-4)' }}>11:41:14</span> <span style={{ color: 'var(--green)' }}>POST</span> /v1/embeddings → nomic-embed-text <span style={{ color: 'var(--ink-4)' }}>200 · 24ms</span></div>
                <div><span style={{ color: 'var(--ink-4)' }}>11:40:52</span> <span style={{ color: 'var(--amber)' }}>WARN</span> ctx window 92% on gemma4:32b · prune 2 oldest</div>
              </>
            ) : (
              <div style={{ color: 'var(--ink-4)' }}>
                <Icon.BoltOff size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }}/> Router idle. Press <strong style={{ color: 'var(--odoo-300)' }}>ENGAGE HERMES ROUTING</strong> to start streaming.
              </div>
            )}
          </div>
        </div>

        <div className="card span-3">
          <div className="card-h">
            <div className="t"><Icon.Sparkles size={12}/> HOOKS</div>
            <span className="tag opus">SKILL.md</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['sticky-routing',    'Reusable'],
              ['telegram-bridge',   'Reusable'],
              ['opus-reflect',      'Reusable'],
              ['memory-promote',    'Draft'],
              ['hermes-rate-limit', 'Idea'],
            ].map(([k, state]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-3)', border: '1px solid var(--line)', borderRadius: 10 }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>{k}</span>
                <span className={'tag ' + (state === 'Reusable' ? 'live' : state === 'Draft' ? 'busy' : 'idle')}>{state.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
