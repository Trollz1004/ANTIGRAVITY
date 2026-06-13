// ── SENTRY DASHBOARD TYPES & API CLIENT ────────────────────────
//
// Talks to the FastAPI health-aggregator service (default
// http://127.0.0.1:11436). The command-center app proxies these calls
// through /api/sentry/* to avoid browser CORS pain in the kiosk build.
//
// The aggregator is the source of truth — DO NOT re-implement probe
// logic in the UI. This file is a thin transport + render-model layer.
//
// Repair actions map onto three "one-click" playbooks:
//   - push       : commit + push local changes (GitHub CI retry / hook)
//   - merge      : merge a PR / reconcile a branch
//   - sub-agent  : hand the work to an autonomous repair sub-agent
//   - run        : run a pre-classified playbook (SSH restart, portproxy, etc.)

export type Level = "green" | "yellow" | "red";

export interface HealthCheck {
  name: string;
  status: Level;
  summary: string;
  data?: Record<string, unknown>;
}

export interface HealthCategory {
  name: string;
  status: Level;
  checks: HealthCheck[];
}

export interface HealthSnapshot {
  captured_at: string;
  overall: Level;
  counts: { green: number; yellow: number; red: number };
  categories: HealthCategory[];
  events_tail?: Array<{ ts: string; event: string; payload?: unknown }>;
}

export type RepairKind =
  | "lan_bind"
  | "container_restart"
  | "service_ping"
  | "public_surface"
  | "vault_resync"
  | "manual"
  | "push"
  | "merge"
  | "sub_agent";

export type RepairStatus = "queued" | "running" | "ok" | "failed" | "rejected";

export interface RepairTicket {
  id: string;
  action: {
    target: string;
    kind: RepairKind;
    reason: string;
    playbook: string;
    command: string[];
    ssh_target: string | null;
    metadata: Record<string, unknown>;
  };
  status: RepairStatus;
  created_at: string;
  updated_at: string;
  notes: string[];
}

// ── API endpoints (proxied through Next.js /api/sentry/*) ──────

const BASE = "/api/sentry";

export async function fetchHealth(): Promise<HealthSnapshot> {
  const r = await fetch(`${BASE}/health`, { cache: "no-store" });
  if (!r.ok) throw new Error(`health fetch failed: ${r.status}`);
  return r.json();
}

export async function fetchEvents(): Promise<{ captured_at: string; events: Array<{ ts: string; event: string; payload?: unknown }> }> {
  const r = await fetch(`${BASE}/events`, { cache: "no-store" });
  if (!r.ok) throw new Error(`events fetch failed: ${r.status}`);
  return r.json();
}

export async function fetchTickets(): Promise<{ captured_at: string; tickets: RepairTicket[] }> {
  const r = await fetch(`${BASE}/tickets`, { cache: "no-store" });
  if (!r.ok) throw new Error(`tickets fetch failed: ${r.status}`);
  return r.json();
}

// ── One-click repair actions ──────────────────────────────────
//
// "Run All Reds" → POST /repair/plan (queues one ticket per red check)
// "Repair One"  → POST /repair (single named ticket with explicit kind)
// "Dispatch"    → POST /repair/tickets/{id}/dispatch (run the queued work)
// "Push/Merge"  → POST /repair with kind=push|merge (delegated sub-agent)

export async function planAllRepairs(autoDispatch = false): Promise<{
  scanned_at: string;
  submitted: RepairTicket[];
}> {
  const r = await fetch(`${BASE}/repair/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ auto_dispatch: autoDispatch }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`repair plan failed: ${r.status}`);
  return r.json();
}

export interface SubmitRepairInput {
  target: string;
  kind: RepairKind;
  reason: string;
  playbook: string;
  command: string[];
  ssh_target?: string | null;
  metadata?: Record<string, unknown>;
  auto_dispatch?: boolean;
}

export async function submitRepair(input: SubmitRepairInput): Promise<RepairTicket> {
  const r = await fetch(`${BASE}/repair`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target: input.target,
      kind: input.kind,
      reason: input.reason,
      playbook: input.playbook,
      command: input.command,
      ssh_target: input.ssh_target ?? null,
      metadata: input.metadata ?? {},
      auto_dispatch: input.auto_dispatch ?? true,
    }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`repair submit failed: ${r.status}`);
  return r.json();
}

export async function dispatchTicket(ticketId: string): Promise<RepairTicket> {
  const r = await fetch(`${BASE}/tickets/${encodeURIComponent(ticketId)}/dispatch`, {
    method: "POST",
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`dispatch failed: ${r.status}`);
  return r.json();
}

// ── Push / Merge / Sub-agent shortcuts ─────────────────────────
//
// These build the right RepairAction shape for common "one-click"
// scenarios. They each submit + dispatch in a single call so the
// button click is a true one-click action.

export function repairPush(opts: { reason: string; branch?: string }): Promise<RepairTicket> {
  return submitRepair({
    target: opts.branch ? `git:push:${opts.branch}` : "git:push:current",
    kind: "push",
    reason: opts.reason,
    playbook: "git-push",
    command: opts.branch
      ? ["git", "push", "origin", opts.branch, "--follow-tags"]
      : ["git", "push", "--follow-tags"],
    auto_dispatch: true,
    metadata: { branch: opts.branch ?? null, action: "push" },
  });
}

export function repairMerge(opts: { reason: string; branch?: string; pr_number?: number }): Promise<RepairTicket> {
  return submitRepair({
    target: opts.pr_number ? `pr:${opts.pr_number}:merge` : `branch:${opts.branch ?? "current"}:merge`,
    kind: "merge",
    reason: opts.reason,
    playbook: "github-merge",
    command: opts.branch
      ? ["git", "checkout", opts.branch, "&&", "git", "merge", "--no-ff", "main"]
      : ["git", "merge", "--no-ff"],
    auto_dispatch: true,
    metadata: { branch: opts.branch ?? null, pr_number: opts.pr_number ?? null, action: "merge" },
  });
}

export function repairSubAgent(opts: { reason: string; target: string; objective: string }): Promise<RepairTicket> {
  return submitRepair({
    target: `sub-agent:${opts.target}`,
    kind: "sub_agent",
    reason: opts.reason,
    playbook: "sub-agent-dispatch",
    // The sub-agent invocation is a marker command; the dispatch handler
    // routes this into the existing cross-agent handoff skill.
    command: ["hermes", "delegate", "--objective", opts.objective, "--target", opts.target],
    auto_dispatch: true,
    metadata: { target: opts.target, objective: opts.objective, action: "sub-agent" },
  });
}

// ── Display helpers ────────────────────────────────────────────

export const STATUS_COLORS: Record<Level, { bg: string; text: string; ring: string; dot: string; label: string }> = {
  green: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    ring: "ring-emerald-500/40",
    dot: "bg-emerald-400",
    label: "GREEN",
  },
  yellow: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    ring: "ring-amber-500/40",
    dot: "bg-amber-400",
    label: "YELLOW",
  },
  red: {
    bg: "bg-red-500/15",
    text: "text-red-400",
    ring: "ring-red-500/40",
    dot: "bg-red-500",
    label: "RED",
  },
};

export function fmtTime(iso: string | undefined | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function fmtAgo(iso: string | undefined | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0 || Number.isNaN(ms)) return "—";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// Map category name → human label + emoji for the sentry grid.
export const CATEGORY_META: Record<string, { label: string; icon: string; description: string }> = {
  nodes: { label: "Nodes", icon: "🖧", description: "Sabretooth + T5500 host health" },
  t5500_services: { label: "T5500 Services", icon: "🛠", description: "LAN-bound ports on T5500" },
  cloudflare_pages: { label: "Cloudflare Pages", icon: "☁", description: "Public surfaces (youandinotai, etc.)" },
  hermes_router: { label: "Hermes Router", icon: "⚡", description: "Hermes + Anthropic key audit" },
  mission_mcp: { label: "Mission MCP", icon: "🛰", description: "Mission control MCP server" },
  github_ci: { label: "GitHub CI", icon: "⌥", description: "Repo workflows + open PRs" },
  revenue_today: { label: "Revenue", icon: "$", description: "Today's revenue core status" },
  vault_health: { label: "Vault", icon: "🔐", description: "Sabretooth vault + Graph sync" },
  paperweight_audit: { label: "Paperweight", icon: "📋", description: "Paperweight compliance audit" },
  graphify: { label: "Graphify", icon: "∿", description: "Graphify output pipeline" },
};
