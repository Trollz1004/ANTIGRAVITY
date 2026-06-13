"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, AlertTriangle, CheckCircle2, Circle, Clock, ExternalLink,
  GitBranch, GitMerge, Loader2, Power, RefreshCcw, RotateCw, Send, Shield,
  ShieldAlert, ShieldCheck, Sparkles, Terminal, Wifi, Wrench, XCircle, Zap,
} from "lucide-react";
import {
  CATEGORY_META, STATUS_COLORS, fetchEvents, fetchHealth, fetchTickets,
  dispatchTicket, planAllRepairs, repairMerge, repairPush, repairSubAgent,
  type HealthCategory, type HealthCheck, type HealthSnapshot, type Level,
  type RepairTicket, fmtAgo, fmtTime,
} from "@/lib/sentry";

// ── SENTRY DASHBOARD ────────────────────────────────────────────
//
// Visual green/red status grid for every check emitted by the
// health-aggregator. Includes a "one-click repair" panel for every
// red check (push, merge, sub-agent) plus a "Run All" panic button
// that POSTs /repair/plan to queue repairs for every red check at once.
//
// Two display modes:
//   - "full"     : command-center tab layout (kiosk-friendly, dark UI)
//   - "kiosk"    : full-screen sentry (no chrome, big numbers, auto-refresh)

export type SentryMode = "full" | "kiosk";

export default function SentryDashboard({ mode = "full" }: { mode?: SentryMode }) {
  const [health, setHealth] = useState<HealthSnapshot | null>(null);
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [repairBusy, setRepairBusy] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showTickets, setShowTickets] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [events, setEvents] = useState<Array<{ ts: string; event: string; payload?: unknown }>>([]);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const [h, t, e] = await Promise.all([fetchHealth(), fetchTickets(), fetchEvents()]);
      setHealth(h);
      setTickets(t.tickets);
      setEvents(e.events);
      setLastSync(Date.now());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  // Auto-refresh every 5s (10s in kiosk to be gentler on a public display)
  useEffect(() => {
    refresh();
    if (!autoRefresh) return;
    const ms = mode === "kiosk" ? 10_000 : 5_000;
    const id = setInterval(refresh, ms);
    return () => clearInterval(id);
  }, [refresh, autoRefresh, mode]);

  const onRunAllReds = useCallback(async () => {
    if (!health) return;
    if (!window.confirm(
      `Queue + auto-dispatch repairs for ALL ${health.counts.red} red checks?`
    )) return;
    setRepairBusy("plan");
    try {
      await planAllRepairs(true);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRepairBusy(null);
    }
  }, [health, refresh]);

  const onPush = useCallback(async (reason: string) => {
    setRepairBusy("push");
    try {
      await repairPush({ reason });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRepairBusy(null);
    }
  }, [refresh]);

  const onMerge = useCallback(async (reason: string) => {
    setRepairBusy("merge");
    try {
      await repairMerge({ reason });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRepairBusy(null);
    }
  }, [refresh]);

  const onSubAgent = useCallback(async (target: string, objective: string) => {
    setRepairBusy(`sub-agent:${target}`);
    try {
      await repairSubAgent({ target, objective, reason: `sub-agent repair of ${target}` });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRepairBusy(null);
    }
  }, [refresh]);

  const onDispatch = useCallback(async (ticketId: string) => {
    setDispatching(prev => new Set(prev).add(ticketId));
    try {
      await dispatchTicket(ticketId);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDispatching(prev => {
        const next = new Set(prev);
        next.delete(ticketId);
        return next;
      });
    }
  }, [refresh]);

  const onQuickSubAgent = useCallback((categoryName: string) => {
    const objective = window.prompt(
      `Spawn sub-agent to repair category "${categoryName}".\n` +
      `Describe the objective in one sentence:`
    );
    if (!objective) return;
    onSubAgent(`sentry:${categoryName}`, objective);
  }, [onSubAgent]);

  // Derived values
  const overallIcon = useMemo(() => {
    if (!health) return <Activity className="w-6 h-6" />;
    if (health.overall === "green") return <ShieldCheck className="w-6 h-6" />;
    if (health.overall === "yellow") return <Shield className="w-6 h-6" />;
    return <ShieldAlert className="w-6 h-6" />;
  }, [health]);

  const overallBg = useMemo(() => {
    if (!health) return STATUS_COLORS.yellow;
    return STATUS_COLORS[health.overall];
  }, [health]);

  // Per-category view
  const activeCat = useMemo<HealthCategory | null>(() => {
    if (!health || !activeCategory) return null;
    return health.categories.find(c => c.name === activeCategory) ?? null;
  }, [health, activeCategory]);

  // Compact full-screen mode (no command-center chrome)
  if (mode === "kiosk") {
    return (
      <KioskSentry
        health={health}
        tickets={tickets}
        events={events}
        error={error}
        lastSync={lastSync}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        onRunAllReds={onRunAllReds}
        onPush={onPush}
        onMerge={onMerge}
        onSubAgent={onSubAgent}
        onDispatch={onDispatch}
        onQuickSubAgent={onQuickSubAgent}
        onRefresh={refresh}
        repairBusy={repairBusy}
        dispatching={dispatching}
      />
    );
  }

  // Standard full-mode (tab inside command-center)
  return (
    <div className="space-y-4" ref={ref}>
      <SentryHeader
        health={health}
        error={error}
        lastSync={lastSync}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        onRefresh={refresh}
        onRunAllReds={onRunAllReds}
        repairBusy={repairBusy}
      />

      {health && (
        <>
          <SentryCounts counts={health.counts} overall={health.overall} />

          <SentryGrid
            categories={health.categories}
            active={activeCategory}
            onSelect={setActiveCategory}
            onQuickRepair={onQuickSubAgent}
            repairBusy={repairBusy}
          />

          {activeCat && (
            <SentryCategoryDetail
              category={activeCat}
              onPush={onPush}
              onMerge={onMerge}
              onSubAgent={onSubAgent}
              onDispatch={onDispatch}
              onClose={() => setActiveCategory(null)}
              repairBusy={repairBusy}
              dispatching={dispatching}
              tickets={tickets}
            />
          )}

          <SentryTicketPanel
            tickets={tickets}
            open={showTickets}
            onToggle={() => setShowTickets(v => !v)}
            onDispatch={onDispatch}
            dispatching={dispatching}
          />

          <SentryEventPanel
            events={events}
            open={showEvents}
            onToggle={() => setShowEvents(v => !v)}
          />
        </>
      )}

      {!health && !error && (
        <div className="text-center py-16 text-slate-500">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" />
          <p className="text-xs font-bold">Loading health snapshot…</p>
        </div>
      )}
    </div>
  );
}

// ── HEADER ──────────────────────────────────────────────────────

function SentryHeader({
  health, error, lastSync, autoRefresh, setAutoRefresh, onRefresh,
  onRunAllReds, repairBusy,
}: {
  health: HealthSnapshot | null;
  error: string | null;
  lastSync: number | null;
  autoRefresh: boolean;
  setAutoRefresh: (v: boolean) => void;
  onRefresh: () => void;
  onRunAllReds: () => void;
  repairBusy: string | null;
}) {
  const c = health ? STATUS_COLORS[health.overall] : STATUS_COLORS.yellow;

  return (
    <header className={`flex flex-wrap items-center gap-3 p-4 rounded-2xl border ${c.bg} ${c.ring} ring-1`}>
      <div className={`p-3 rounded-xl ${c.bg} ${c.text}`}>
        <Shield className="w-6 h-6" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className={`text-base sm:text-lg font-black uppercase tracking-tight ${c.text}`}>
            Sentry Mode
          </h2>
          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${c.bg} ${c.text} ring-1 ${c.ring}`}>
            {c.label}
          </span>
          {lastSync && (
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              · synced {fmtAgo(new Date(lastSync).toISOString())}
            </span>
          )}
        </div>
        <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
          {health
            ? `${health.categories.length} categories · ${health.counts.green}G · ${health.counts.yellow}Y · ${health.counts.red}R`
            : "Connecting to health-aggregator…"}
        </p>
        {error && (
          <p className="text-[10px] text-red-400 mt-1">⚠ {error}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={onRunAllReds}
          disabled={!health || health.counts.red === 0 || repairBusy !== null}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
            !health || health.counts.red === 0
              ? "bg-slate-800/40 text-slate-500 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20"
          }`}
        >
          {repairBusy === "plan" ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          Run All Reds
        </button>
        <button
          onClick={onRefresh}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all active:scale-95"
          title="Refresh now"
        >
          <RotateCw size={14} />
        </button>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`p-2 rounded-xl transition-all active:scale-95 ${
            autoRefresh ? "bg-emerald-600/30 text-emerald-300 ring-1 ring-emerald-500/40" : "bg-slate-800 text-slate-500"
          }`}
          title={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
        >
          <Power size={14} />
        </button>
      </div>
    </header>
  );
}

// ── COUNTS BAR ──────────────────────────────────────────────────

function SentryCounts({ counts, overall }: { counts: HealthSnapshot["counts"]; overall: Level }) {
  const cells: { key: Level; label: string; n: number; Icon: typeof Shield }[] = [
    { key: "green", label: "Green", n: counts.green, Icon: CheckCircle2 },
    { key: "yellow", label: "Yellow", n: counts.yellow, Icon: AlertTriangle },
    { key: "red", label: "Red", n: counts.red, Icon: XCircle },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {cells.map(({ key, label, n, Icon }) => {
        const c = STATUS_COLORS[key];
        return (
          <div key={key} className={`p-3 rounded-xl border ${c.bg} ${c.ring} ring-1`}>
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${c.text}`} />
              <span className={`text-[10px] font-black uppercase tracking-wider ${c.text}`}>{label}</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-black ${c.text} tabular-nums leading-none mt-1.5`}>
              {n}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── GRID ────────────────────────────────────────────────────────

function SentryGrid({
  categories, active, onSelect, onQuickRepair, repairBusy,
}: {
  categories: HealthCategory[];
  active: string | null;
  onSelect: (name: string) => void;
  onQuickRepair: (cat: string) => void;
  repairBusy: string | null;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {categories.map(cat => {
        const meta = CATEGORY_META[cat.name] ?? { label: cat.name, icon: "•", description: "" };
        const c = STATUS_COLORS[cat.status];
        const isActive = active === cat.name;
        const isBusy = repairBusy === `sub-agent:sentry:${cat.name}`;

        return (
          <div
            key={cat.name}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              isActive
                ? `${c.bg} ${c.ring} ring-2 scale-[1.02]`
                : `${c.bg} ${c.ring} ring-1 hover:ring-2 hover:scale-[1.01]`
            }`}
            onClick={() => onSelect(cat.name)}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-lg">{meta.icon}</span>
              <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${c.bg} ${c.text} ring-1 ${c.ring}`}>
                {c.label}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs font-bold leading-tight">{meta.label}</p>
            <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">{cat.checks.length} check{cat.checks.length === 1 ? "" : "s"}</p>

            {/* One-click sub-agent button for any non-green category */}
            {cat.status !== "green" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickRepair(cat.name);
                }}
                disabled={isBusy}
                className={`mt-2 w-full flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider py-1 rounded-lg ${c.text} bg-black/30 hover:bg-black/50 transition-all active:scale-95 disabled:opacity-50`}
                title="Spawn a sub-agent to repair this category"
              >
                {isBusy ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />}
                Sub-Agent
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── CATEGORY DETAIL ─────────────────────────────────────────────

function SentryCategoryDetail({
  category, onPush, onMerge, onSubAgent, onDispatch, onClose,
  repairBusy, dispatching, tickets,
}: {
  category: HealthCategory;
  onPush: (reason: string) => void;
  onMerge: (reason: string) => void;
  onSubAgent: (target: string, objective: string) => void;
  onDispatch: (id: string) => void;
  onClose: () => void;
  repairBusy: string | null;
  dispatching: Set<string>;
  tickets: RepairTicket[];
  onRefresh?: () => void;
}) {
  const meta = CATEGORY_META[category.name] ?? { label: category.name, icon: "•", description: "" };
  const c = STATUS_COLORS[category.status];

  const redChecks = category.checks.filter(ch => ch.status === "red");
  const relatedTickets = tickets.filter(t =>
    t.action.metadata?.category === category.name ||
    t.action.target.includes(category.name) ||
    redChecks.some(rc => t.action.target.includes(rc.name))
  );

  return (
    <div className={`p-4 rounded-2xl border ${c.bg} ${c.ring} ring-1`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{meta.icon}</span>
            <h3 className="text-sm sm:text-base font-black uppercase tracking-tight">{meta.label}</h3>
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${c.bg} ${c.text} ring-1 ${c.ring}`}>
              {c.label}
            </span>
          </div>
          {meta.description && <p className="text-[10px] text-slate-400 mt-1">{meta.description}</p>}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
          title="Close"
        >
          <XCircle size={16} />
        </button>
      </div>

      {/* Global one-click actions for this category */}
      <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-slate-800">
        <button
          onClick={() => onPush(`${meta.label} repair push`)}
          disabled={repairBusy !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
        >
          {repairBusy === "push" ? <Loader2 size={11} className="animate-spin" /> : <GitBranch size={11} />}
          Push
        </button>
        <button
          onClick={() => onMerge(`${meta.label} repair merge`)}
          disabled={repairBusy !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
        >
          {repairBusy === "merge" ? <Loader2 size={11} className="animate-spin" /> : <GitMerge size={11} />}
          Merge
        </button>
        <button
          onClick={() => {
            const obj = window.prompt(`Sub-agent objective for "${meta.label}":`);
            if (obj) onSubAgent(`sentry:${category.name}`, obj);
          }}
          disabled={repairBusy !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
        >
          {repairBusy?.startsWith("sub-agent:sentry:") ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
          Sub-Agent
        </button>
      </div>

      {/* Individual checks */}
      <div className="space-y-1.5">
        {category.checks.map(check => (
          <CheckRow
            key={check.name}
            check={check}
            category={category.name}
            tickets={tickets}
            onDispatch={onDispatch}
            dispatching={dispatching}
            onPush={onPush}
            onMerge={onMerge}
            onSubAgent={onSubAgent}
            repairBusy={repairBusy}
          />
        ))}
      </div>

      {/* Tickets for this category */}
      {relatedTickets.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Related Tickets</p>
          <div className="space-y-1.5">
            {relatedTickets.map(t => (
              <TicketRow
                key={t.id}
                ticket={t}
                onDispatch={onDispatch}
                isDispatching={dispatching.has(t.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── CHECK ROW (with per-check repair buttons) ───────────────────

function CheckRow({
  check, category, tickets, onDispatch, dispatching, onPush, onMerge, onSubAgent, repairBusy,
}: {
  check: HealthCheck;
  category: string;
  tickets: RepairTicket[];
  onDispatch: (id: string) => void;
  dispatching: Set<string>;
  onPush: (reason: string) => void;
  onMerge: (reason: string) => void;
  onSubAgent: (target: string, objective: string) => void;
  repairBusy: string | null;
}) {
  const c = STATUS_COLORS[check.status];
  const matchingTicket = tickets.find(t =>
    t.action.target === `${category}:${check.name}` ||
    t.action.target.includes(check.name)
  );

  return (
    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${c.bg} ${c.ring} ring-1`}>
      <div className={`w-2.5 h-2.5 rounded-full ${c.dot} ${check.status === "red" ? "animate-pulse" : ""}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold leading-tight">{check.name}</p>
        <p className="text-[9px] text-slate-400 mt-0.5 truncate">{check.summary || "—"}</p>
      </div>

      {/* Per-check one-click actions */}
      {check.status === "red" && (
        <div className="flex items-center gap-1 shrink-0">
          {matchingTicket && (
            <button
              onClick={() => onDispatch(matchingTicket.id)}
              disabled={dispatching.has(matchingTicket.id) || matchingTicket.status === "running"}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
              title={`Dispatch ticket ${matchingTicket.id.slice(0, 8)}`}
            >
              {dispatching.has(matchingTicket.id) || matchingTicket.status === "running"
                ? <Loader2 size={9} className="animate-spin" />
                : <Send size={9} />}
              {matchingTicket.status === "queued" ? "Run" : matchingTicket.status === "running" ? "Running" : matchingTicket.status === "ok" ? "✓" : matchingTicket.status}
            </button>
          )}
          <button
            onClick={() => onPush(`${category}/${check.name}`)}
            disabled={repairBusy !== null}
            className="p-1 rounded-md bg-blue-600/40 hover:bg-blue-600/60 text-blue-200 transition-all active:scale-95 disabled:opacity-50"
            title="Push repair"
          >
            <GitBranch size={10} />
          </button>
          <button
            onClick={() => onMerge(`${category}/${check.name}`)}
            disabled={repairBusy !== null}
            className="p-1 rounded-md bg-violet-600/40 hover:bg-violet-600/60 text-violet-200 transition-all active:scale-95 disabled:opacity-50"
            title="Merge repair"
          >
            <GitMerge size={10} />
          </button>
          <button
            onClick={() => {
              const obj = window.prompt(`Sub-agent objective for "${check.name}":`);
              if (obj) onSubAgent(`sentry:${category}:${check.name}`, obj);
            }}
            disabled={repairBusy !== null}
            className="p-1 rounded-md bg-amber-600/40 hover:bg-amber-600/60 text-amber-200 transition-all active:scale-95 disabled:opacity-50"
            title="Spawn sub-agent"
          >
            <Sparkles size={10} />
          </button>
        </div>
      )}

      {check.status === "yellow" && (
        <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">Watch</span>
      )}
    </div>
  );
}

// ── TICKET ROW ──────────────────────────────────────────────────

function TicketRow({
  ticket, onDispatch, isDispatching,
}: {
  ticket: RepairTicket;
  onDispatch: (id: string) => void;
  isDispatching: boolean;
}) {
  const statusColors: Record<RepairTicket["status"], { bg: string; text: string; ring: string }> = {
    queued: { bg: "bg-blue-500/15", text: "text-blue-400", ring: "ring-blue-500/30" },
    running: { bg: "bg-amber-500/15", text: "text-amber-400", ring: "ring-amber-500/30" },
    ok: { bg: "bg-emerald-500/15", text: "text-emerald-400", ring: "ring-emerald-500/30" },
    failed: { bg: "bg-red-500/15", text: "text-red-400", ring: "ring-red-500/30" },
    rejected: { bg: "bg-slate-500/15", text: "text-slate-400", ring: "ring-slate-500/30" },
  };
  const sc = statusColors[ticket.status];
  const canDispatch = ticket.status === "queued" || ticket.status === "failed";

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg border ${sc.bg} ring-1 ${sc.ring}`}>
      <Wrench size={11} className={sc.text} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold truncate">{ticket.action.target}</p>
        <p className="text-[8px] text-slate-500 truncate">
          {ticket.action.playbook} · {ticket.action.kind} · {fmtAgo(ticket.created_at)}
        </p>
      </div>
      <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
        {ticket.status}
      </span>
      {canDispatch && (
        <button
          onClick={() => onDispatch(ticket.id)}
          disabled={isDispatching}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
        >
          {isDispatching ? <Loader2 size={9} className="animate-spin" /> : <Send size={9} />}
          Dispatch
        </button>
      )}
    </div>
  );
}

// ── TICKET PANEL ────────────────────────────────────────────────

function SentryTicketPanel({
  tickets, open, onToggle, onDispatch, dispatching,
}: {
  tickets: RepairTicket[];
  open: boolean;
  onToggle: () => void;
  onDispatch: (id: string) => void;
  dispatching: Set<string>;
}) {
  return (
    <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/40">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <Wrench size={14} className="text-slate-400" />
          <h3 className="text-xs font-black uppercase tracking-wider">Repair Tickets</h3>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {tickets.length}
          </span>
        </div>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-1.5 max-h-80 overflow-y-auto">
          {tickets.length === 0 ? (
            <p className="text-[10px] text-slate-500 italic text-center py-4">No tickets yet</p>
          ) : (
            tickets.map(t => (
              <TicketRow
                key={t.id}
                ticket={t}
                onDispatch={onDispatch}
                isDispatching={dispatching.has(t.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── EVENT PANEL ─────────────────────────────────────────────────

function SentryEventPanel({
  events, open, onToggle,
}: {
  events: Array<{ ts: string; event: string; payload?: unknown }>;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/40">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-slate-400" />
          <h3 className="text-xs font-black uppercase tracking-wider">Event Tail</h3>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {events.length}
          </span>
        </div>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-1 max-h-64 overflow-y-auto font-mono">
          {events.length === 0 ? (
            <p className="text-[10px] text-slate-500 italic text-center py-4">No events yet</p>
          ) : (
            events.slice(0, 50).map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-[9px]">
                <span className="text-slate-500 shrink-0 tabular-nums">{fmtTime(e.ts)}</span>
                <span className="text-slate-300 flex-1 break-all">
                  {e.event}
                  {e.payload ? " · " + JSON.stringify(e.payload).slice(0, 120) : ""}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── KIOSK MODE (full-screen) ────────────────────────────────────

function KioskSentry(props: {
  health: HealthSnapshot | null;
  tickets: RepairTicket[];
  events: Array<{ ts: string; event: string; payload?: unknown }>;
  error: string | null;
  lastSync: number | null;
  autoRefresh: boolean;
  setAutoRefresh: (v: boolean) => void;
  onRunAllReds: () => void;
  onPush: (reason: string) => void;
  onMerge: (reason: string) => void;
  onSubAgent: (target: string, objective: string) => void;
  onDispatch: (id: string) => void;
  onQuickSubAgent: (cat: string) => void;
  onRefresh: () => void;
  repairBusy: string | null;
  dispatching: Set<string>;
}) {
  const { health, error, lastSync, autoRefresh, setAutoRefresh, onRunAllReds, onRefresh, repairBusy, tickets, onDispatch, dispatching } = props;

  const overall = health?.overall ?? "yellow";
  const c = STATUS_COLORS[overall];
  const counts = health?.counts ?? { green: 0, yellow: 0, red: 0 };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 sm:p-6 font-sans">
      {/* BIG HEADER */}
      <div className={`rounded-3xl border-2 ${c.ring} ${c.bg} p-6 sm:p-8 mb-4`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${c.bg} ring-2 ${c.ring}`}>
              {overall === "green" ? <ShieldCheck className="w-12 h-12" /> :
                overall === "yellow" ? <Shield className="w-12 h-12" /> :
                  <ShieldAlert className="w-12 h-12" />}
            </div>
            <div>
              <h1 className={`text-4xl sm:text-6xl font-black uppercase tracking-tighter ${c.text}`}>
                {c.label}
              </h1>
              <p className="text-sm sm:text-base text-slate-400 mt-1">
                ANTIGRAVITY Sentry · {health?.categories.length ?? 0} categories
              </p>
              {lastSync && (
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                  Synced {fmtAgo(new Date(lastSync).toISOString())}
                </p>
              )}
              {error && <p className="text-xs text-red-400 mt-2">⚠ {error}</p>}
            </div>
          </div>

          <div className="flex gap-3">
            {(["green", "yellow", "red"] as Level[]).map(k => {
              const kc = STATUS_COLORS[k];
              return (
                <div key={k} className={`text-center px-4 py-2 rounded-xl ${kc.bg} ring-1 ${kc.ring}`}>
                  <div className={`text-3xl sm:text-5xl font-black tabular-nums ${kc.text}`}>{counts[k]}</div>
                  <div className={`text-[9px] font-black uppercase tracking-wider ${kc.text} mt-1`}>{kc.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={onRunAllReds}
          disabled={!health || health.counts.red === 0 || repairBusy !== null}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all active:scale-95 ${
            !health || health.counts.red === 0
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/30"
          }`}
        >
          {repairBusy === "plan" ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
          Run All Reds ({counts.red})
        </button>
        <button
          onClick={onRefresh}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all active:scale-95"
        >
          <RefreshCcw size={16} />
        </button>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`p-2 rounded-xl transition-all active:scale-95 ${
            autoRefresh ? "bg-emerald-600/30 text-emerald-300 ring-1 ring-emerald-500/40" : "bg-slate-800 text-slate-500"
          }`}
        >
          <Power size={16} />
        </button>
      </div>

      {/* CATEGORIES — LARGE */}
      {health && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {health.categories.map(cat => {
            const meta = CATEGORY_META[cat.name] ?? { label: cat.name, icon: "•", description: "" };
            const cc = STATUS_COLORS[cat.status];
            return (
              <div key={cat.name} className={`p-4 rounded-2xl border ${cc.bg} ${cc.ring} ring-1`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black uppercase tracking-tight truncate">{meta.label}</p>
                    <p className="text-[9px] text-slate-500">{cat.checks.length} checks</p>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${cc.bg} ${cc.text}`}>
                    {cc.label}
                  </span>
                </div>
                <div className="space-y-1">
                  {cat.checks.slice(0, 4).map(check => {
                    const chc = STATUS_COLORS[check.status];
                    return (
                      <div key={check.name} className="flex items-center gap-1.5 text-[10px]">
                        <div className={`w-1.5 h-1.5 rounded-full ${chc.dot}`} />
                        <span className="truncate flex-1">{check.name}</span>
                      </div>
                    );
                  })}
                  {cat.checks.length > 4 && (
                    <p className="text-[9px] text-slate-500">+{cat.checks.length - 4} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TICKETS — KIOSK BOTTOM */}
      {tickets.length > 0 && (
        <div className="mt-4 p-3 rounded-2xl border border-slate-800 bg-slate-900/60">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Active Tickets</p>
          <div className="space-y-1.5">
            {tickets.slice(0, 8).map(t => (
              <TicketRow
                key={t.id}
                ticket={t}
                onDispatch={onDispatch}
                isDispatching={dispatching.has(t.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
