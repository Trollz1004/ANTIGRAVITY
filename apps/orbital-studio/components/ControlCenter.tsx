import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import type { ControlAlert, Health, OfficialVoteView, ServiceStatus, SupportCase, SwarmTask, Tab } from '../types';
import {
  Sparkles,
  Tv,
  Orbit,
  Zap,
  ShoppingBag,
  Terminal,
  Shield,
  Layers,
  Activity,
  Play,
  RotateCw,
  Eye,
  Maximize2
} from 'lucide-react';

type Props = {
  health: Health | null;
  tasks: SwarmTask[];
  onNavigate: (tab: Tab) => void;
  onOpenScreensaver?: () => void;
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

export default function ControlCenter({ health, tasks, onNavigate, onOpenScreensaver }: Props) {
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
  const [pulseActive, setPulseActive] = useState(false);
  const [miniRotY, setMiniRotY] = useState(0);
  const knownAlertIds = useRef(new Set<string>());
  const initializedAlerts = useRef(false);

  // Mini canvas reference for real-time 3D orbital preview on Main Page
  const miniCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const miniAnimRef = useRef<number | null>(null);
  const isMiniDragging = useRef(false);
  const miniLastMouse = useRef({ x: 0, y: 0 });
  const miniRotYRef = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const [serviceResult, alertResult, supportResult, voteResult, graphResult] = await Promise.all([
        api.services(),
        api.controlAlerts(),
        api.supportCases(),
        api.officialVoteView(),
        api.knowledgeGraph(),
      ]);
      setServices(serviceResult?.services ?? []);
      setAlerts(alertResult?.alerts ?? []);
      setSupportCases(supportResult?.cases ?? []);
      setJudgeView(voteResult ?? null);
      setRepoNodes(graphResult?.nodes?.length ?? 0);
      setRepoBuiltAt(graphResult?.builtAt ?? null);
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
    const unacknowledged = (alerts ?? []).filter((alert) => !alert.acknowledgedAt);
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

  // Main Page 3D Mini Galaxy Canvas Engine
  useEffect(() => {
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const celestialBodies = [
      { id: 'core', name: 'C:\\ANTIGRAVITY', r: 0, color: '#00f2fe', glow: '#38bdf8', size: 16, tilt: 0, speed: 0 },
      { id: 'gemini', name: 'Google Gemini', r: 75, color: '#4285F4', glow: '#00e5ff', size: 14, tilt: 0.25, speed: 0.012 },
      { id: 'claude', name: 'Claude Code', r: 105, color: '#D97706', glow: '#F59E0B', size: 12, tilt: -0.3, speed: 0.009 },
      { id: 'crossfire', name: 'Crossfire Matrix', r: 135, color: '#EC4899', glow: '#F472B6', size: 13, tilt: 0.4, speed: 0.006 },
      { id: 'odoo', name: 'Odoo Commerce', r: 165, color: '#A855F7', glow: '#C084FC', size: 11, tilt: -0.2, speed: 0.0045 },
      { id: 't5500', name: 'T5500 Node', r: 195, color: '#38BDF8', glow: '#7DD3FC', size: 10, tilt: 0.35, speed: 0.0035 },
    ];

    const renderMini = () => {
      time += 0.015;
      if (!isMiniDragging.current) {
        miniRotYRef.current += 0.004;
      }

      const w = (canvas.width = canvas.parentElement?.clientWidth || 500);
      const h = (canvas.height = canvas.parentElement?.clientHeight || 280);
      const cx = w / 2;
      const cy = h / 2;

      // Dark Cosmic Canvas
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, w, h);

      // Starfield Dust
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 40; i++) {
        const sx = (Math.sin(i * 99 + time * 0.05) * 0.5 + 0.5) * w;
        const sy = (Math.cos(i * 33 + time * 0.03) * 0.5 + 0.5) * h;
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }

      // Orbital Rings
      celestialBodies.forEach((b) => {
        if (b.r > 0) {
          ctx.beginPath();
          ctx.ellipse(cx, cy, b.r, b.r * 0.38, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `${b.color}22`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // Project and Render Bodies
      const currentRot = miniRotYRef.current;
      const projected = celestialBodies.map((b, idx) => {
        const angle = time * b.speed * 60 + (idx * Math.PI * 2) / celestialBodies.length;
        const ox = Math.cos(angle) * b.r;
        const oz = Math.sin(angle) * b.r;
        const oy = Math.sin(angle) * b.r * Math.sin(b.tilt);

        const cosY = Math.cos(currentRot);
        const sinY = Math.sin(currentRot);
        const rx = ox * cosY - oz * sinY;
        const rz = ox * sinY + oz * cosY;

        const fov = 400;
        const p = fov / (fov + rz + 200);
        const px = cx + rx * p;
        const py = cy + (oy * 0.4 + rz * 0.35) * p;

        return { ...b, px, py, pz: rz, scale: p };
      });

      // Sort by depth
      projected.sort((a, b) => b.pz - a.pz);

      // Draw Synapse Lines to Core
      const core = projected.find((p) => p.id === 'core');
      if (core) {
        projected.forEach((p) => {
          if (p.id !== 'core') {
            ctx.beginPath();
            ctx.moveTo(core.px, core.py);
            ctx.lineTo(p.px, p.py);
            ctx.strokeStyle = `${p.color}35`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      }

      // Draw Bodies
      projected.forEach((p) => {
        const rad = p.size * p.scale;
        const isGemini = p.id === 'gemini';

        // Outer Aura
        const glowRad = rad * (isGemini ? 4.2 : 2.5);
        const grad = ctx.createRadialGradient(p.px, p.py, rad * 0.2, p.px, p.py, glowRad);
        
        if (isGemini) {
          grad.addColorStop(0, 'rgba(0, 229, 255, 0.9)');
          grad.addColorStop(0.3, 'rgba(66, 133, 244, 0.6)');
          grad.addColorStop(0.7, 'rgba(168, 85, 247, 0.3)');
          grad.addColorStop(1, 'transparent');
        } else {
          grad.addColorStop(0, `${p.glow}bb`);
          grad.addColorStop(1, 'transparent');
        }
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.px, p.py, glowRad, 0, Math.PI * 2);
        ctx.fill();

        // Gemini Special Rotating Starburst
        if (isGemini) {
          ctx.save();
          ctx.translate(p.px, p.py);
          ctx.rotate(time * 1.5);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur = 12;

          for (let s = 0; s < 2; s++) {
            ctx.rotate((Math.PI / 4) * s);
            ctx.beginPath();
            const starL = rad * 2.2;
            ctx.moveTo(0, -starL);
            ctx.quadraticCurveTo(0, 0, starL * 0.25, 0);
            ctx.quadraticCurveTo(0, 0, 0, starL);
            ctx.quadraticCurveTo(0, 0, -starL * 0.25, 0);
            ctx.quadraticCurveTo(0, 0, 0, -starL);
            ctx.fill();
          }
          ctx.restore();
        }

        // Central Body
        ctx.beginPath();
        ctx.arc(p.px, p.py, rad, 0, Math.PI * 2);
        ctx.fillStyle = isGemini ? '#00e5ff' : p.color;
        ctx.shadowColor = p.glow;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.font = `${isGemini ? 'bold 10px' : '500 9px'} sans-serif`;
        ctx.fillStyle = isGemini ? '#38bdf8' : '#cbd5e1';
        ctx.textAlign = 'center';
        ctx.fillText(p.name, p.px, p.py + rad + 11);
      });

      miniAnimRef.current = requestAnimationFrame(renderMini);
    };

    renderMini();

    return () => {
      if (miniAnimRef.current) cancelAnimationFrame(miniAnimRef.current);
    };
  }, []);

  const triggerSupernova = () => {
    setPulseActive(true);
    setTimeout(() => setPulseActive(false), 2000);
  };

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

  const activeTasks = (tasks ?? []).filter((task) => task.status === 'running' || task.status === 'queued').length;
  const blockedTasks = (tasks ?? []).filter((task) => task.column === 'BLOCKED').length;
  const unresolvedCases = (supportCases ?? []).filter((item) => item.status !== 'resolved').length;
  const alertCount = (alerts ?? []).filter((item) => !item.acknowledgedAt).length;
  const blockedJudges = judgeView?.seats?.filter((seat) => seat.state !== 'AVAILABLE').length ?? 0;

  return (
    <div className="control-center space-y-6">
      {/* 🌌 GEMINI GALACTIC EPICNESS COMMAND & 3D CELESTIAL CENTERPIECE */}
      <section className="relative overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 shadow-2xl">
        {/* Glow Halo Backdrop */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Gemini Epic Core Info & Launchpads */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
                GEMINI 2.5 FLASH · MULTIMODAL SUPREME
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-bold">
                100% INVARIANTS PASS
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-mono font-bold">
                10% MISSION RESERVE
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Gemini Galactic Mission Hub</span>
              <span className="text-sm px-2.5 py-1 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white font-mono font-bold shadow-lg shadow-pink-500/20">
                CO-FOUNDER SUITE
              </span>
            </h1>

            <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
              Visual intelligence, 3D spatial knowledge graph, Fable Ultracode prompt synthesis, and real-time Crossfire marketplace synchronization. Governed by unalterable doctrine from the single <code className="text-cyan-300 bg-slate-900/80 px-1.5 py-0.5 rounded font-mono">C:\ANTIGRAVITY</code> repository root.
            </p>

            {/* Quick Action Epic Launchpad Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => (onOpenScreensaver ? onOpenScreensaver() : onNavigate('graphy'))}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-500/30 transition-all hover:scale-105 active:scale-95"
              >
                <Tv className="w-4 h-4 text-pink-200" />
                <span>📺 Launch 3D AFK Screensaver [S]</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('graphy')}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs flex items-center gap-2 border border-cyan-500/30 transition-all"
              >
                <Orbit className="w-4 h-4 text-cyan-400" />
                <span>🌌 Full 3D Obsidian Graph</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('gemini95')}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs flex items-center gap-2 border border-amber-500/30 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>✨ Gemini 95 Vintage OS</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('ultracode')}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-xs flex items-center gap-2 border border-emerald-500/30 transition-all"
              >
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>⚡ Ultracode Studio</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('odoo')}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-semibold text-xs flex items-center gap-2 border border-purple-500/30 transition-all"
              >
                <ShoppingBag className="w-4 h-4 text-purple-400" />
                <span>🛍️ Odoo E-Commerce Hub</span>
              </button>

              <button
                type="button"
                onClick={triggerSupernova}
                className={`px-3 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  pulseActive
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 scale-110 shadow-lg shadow-cyan-500/50'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-cyan-400 border-cyan-500/20'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{pulseActive ? '💥 SUPERNOVA!' : 'Induce Pulse'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Embedded Real-time 3D Space Orbit Mini-Canvas */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full h-64 rounded-xl border border-cyan-500/30 bg-slate-950/80 relative overflow-hidden shadow-inner group">
              <canvas
                ref={miniCanvasRef}
                className="w-full h-full block cursor-grab active:cursor-grabbing"
                title="Drag to rotate 3D Space Graph"
                onMouseDown={(e) => {
                  isMiniDragging.current = true;
                  miniLastMouse.current = { x: e.clientX, y: e.clientY };
                }}
                onMouseMove={(e) => {
                  if (isMiniDragging.current) {
                    const deltaX = e.clientX - miniLastMouse.current.x;
                    miniRotYRef.current += deltaX * 0.008;
                    miniLastMouse.current = { x: e.clientX, y: e.clientY };
                  }
                }}
                onMouseUp={() => {
                  isMiniDragging.current = false;
                }}
              />

              {/* Floating Canvas Overlay Badges */}
              <div className="absolute top-2 left-2 pointer-events-none flex items-center gap-1.5 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-lg border border-cyan-500/30">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[10px] font-mono text-cyan-300 font-bold">REAL-TIME ORBIT 3D</span>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('graphy')}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 shadow transition-all"
                title="Expand to Fullscreen Graph"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                <span>Core: C:\ANTIGRAVITY</span>
                <span className="text-cyan-400 font-bold">Gemini Prismatic Core Active</span>
              </div>
            </div>

            {/* Live Visual Intelligence Metric Chips */}
            <div className="grid grid-cols-3 gap-2 w-full mt-3">
              <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-mono">VISION LATENCY</div>
                <div className="text-xs font-bold text-cyan-400 font-mono">14ms Raycast</div>
              </div>
              <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-mono">CONTEXT BUFFER</div>
                <div className="text-xs font-bold text-indigo-300 font-mono">2.0M Tokens</div>
              </div>
              <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-mono">CROSSLISTER SYNC</div>
                <div className="text-xs font-bold text-emerald-400 font-mono">6 Channels</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Single Operator Toolbar */}
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
        <article className="control-stat"><span className="label">Service alerts</span><strong>{alertCount}</strong><span>{(services ?? []).filter((service) => service.status === 'DOWN').length} verified down</span><button type="button" onClick={() => onNavigate('services')}>Open health →</button></article>
        <article className="control-stat"><span className="label">Support queue</span><strong>{unresolvedCases}</strong><span>local redacted cases</span><button type="button" onClick={() => document.getElementById('support-queue')?.scrollIntoView({ behavior: 'smooth' })}>Open queue →</button></article>
        <article className="control-stat"><span className="label">Judge lanes</span><strong>{blockedJudges}</strong><span>not currently available</span><button type="button" onClick={() => onNavigate('council')}>Open council →</button></article>
      </section>

      {error && <div className="notice notice--error">CONTROL CENTER DATA ERROR: {error}</div>}

      <section className="control-grid">
        <article className="control-panel control-panel--wide">
          <div className="control-panel__head"><div><span className="label">Verified service identity</span><h2>System health</h2></div><button className="btn" type="button" onClick={() => onNavigate('services')}>Full health view</button></div>
          <div className="control-services">
            {(services ?? []).length === 0 && <p className="control-empty">NO SERVICE OBSERVATION YET — STARTUP IS NOT IMPLIED.</p>}
            {(services ?? []).map((service) => <div className="control-service" key={service.name}><span className={`dot dot--${tone(service.status)}${service.status === 'DOWN' ? ' dot--pulse' : ''}`} /><div><b>{service.name}</b><small>{service.detail}</small></div><strong className={`control-status control-status--${tone(service.status)}`}>{service.status}</strong><span className="mono">{service.status === 'UP' ? `${service.ms}ms` : '—'}</span></div>)}
          </div>
        </article>

        <article className="control-panel">
          <div className="control-panel__head"><div><span className="label">Repository</span><h2>Canonical source</h2></div><button className="btn" type="button" onClick={() => onNavigate('brain')}>Search repo</button></div>
          <div className="control-facts"><div><span>Indexed nodes</span><b>{repoNodes || '—'}</b></div><div><span>Index built</span><b>{formatTime(repoBuiltAt)}</b></div><div><span>Manifest</span><b>Sanitized</b></div></div>
          <p className="control-note">Repo visibility is source-indexed. Secrets, populated environment files, build output, and arbitrary local files remain excluded.</p>
        </article>

        <article className="control-panel">
          <div className="control-panel__head"><div><span className="label">Independent official review</span><h2>Judge availability</h2></div><button className="btn" type="button" onClick={() => onNavigate('council')}>Evidence</button></div>
          <div className="control-judges">{judgeView?.seats?.map((seat) => <div key={seat.platform}><span className={`dot dot--${seat.state === 'AVAILABLE' ? 'green' : seat.state === 'NOT CONFIGURED' ? 'idle' : 'amber'}`} /><b>{seat.label ?? seat.platform}</b><small>{seat.state} · {seat.actualModel ?? seat.requestedModel ?? 'default'}</small></div>) ?? <p className="control-empty">OFFICIAL JUDGE STATUS NOT LOADED.</p>}</div>
        </article>

        <article className="control-panel">
          <div className="control-panel__head"><div><span className="label">Contextual drill-downs</span><h2>Work orchestration</h2></div><span className="pill">NO SECOND DASHBOARD</span></div>
          <p className="control-note">Use specialist views from this single Control Center to select agents, configure a governed swarm, inspect knowledge relationships, or review bridge status.</p>
          <div className="control-center__actions">
            <button className="btn" type="button" onClick={() => onNavigate('library')}>Open agent library</button>
            <button className="btn btn--primary" type="button" onClick={() => onNavigate('swarm')}>Open swarm setup</button>
            <button className="btn" type="button" onClick={() => onNavigate('graphy')}>Inspect graph</button>
            <button className="btn" type="button" onClick={() => onNavigate('gemini95')}>Gemini 95 OS</button>
            <button className="btn" type="button" onClick={() => onNavigate('ultracode')}>Ultracode Studio</button>
            <button className="btn" type="button" onClick={() => onNavigate('odoo')}>Odoo Commerce</button>
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
          <div className="control-alerts">{(alerts ?? []).length === 0 && <p className="control-empty">NO SERVICE STATE TRANSITIONS RECORDED.</p>}{(alerts ?? []).slice(0, 8).map((alert) => <div className="control-alert" key={alert.id}><span className={`dot dot--${alert.state === 'UP' ? 'green' : alert.state === 'DOWN' ? 'red' : 'amber'}`} /><div><b>{alert.subject}: {alert.previousState} → {alert.state}</b><small>{alert.detail} · {formatTime(alert.createdAt)}</small></div>{alert.acknowledgedAt ? <span className="control-ack">ACKNOWLEDGED</span> : <button className="btn" type="button" onClick={() => void acknowledge(alert.id)}>Acknowledge</button>}</div>)}</div>
        </article>

        <article className="control-panel" id="support-queue">
          <div className="control-panel__head"><div><span className="label">Customer support administration</span><h2>Local support queue</h2></div><span className="pill">No external delivery</span></div>
          <form className="control-support-form" onSubmit={submitCase}><input className="input" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Redacted case subject" maxLength={140} required /><textarea className="textarea" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Internal, redacted summary only — no payment, identity, or credential data." maxLength={900} required /><div><select className="input" value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)} aria-label="Case priority"><option value="low">Low priority</option><option value="normal">Normal priority</option><option value="high">High priority</option><option value="urgent">Urgent priority</option></select><button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Create local case'}</button></div></form>
          <div className="control-cases">{(supportCases ?? []).slice(0, 6).map((item) => <div className="control-case" key={item.id}><div><b>{item.subject}</b><small>{item.priority.toUpperCase()} · {item.status.toUpperCase()} · {formatTime(item.updatedAt)}</small><p>{item.summary}</p></div>{item.status !== 'resolved' && <button className="btn" type="button" onClick={() => void resolveCase(item.id)}>Resolve</button>}</div>)}{(supportCases ?? []).length === 0 && <p className="control-empty">NO LOCAL SUPPORT CASES. CONNECTORS ARE NOT IMPLIED.</p>}</div>
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
