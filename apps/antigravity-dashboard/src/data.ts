import type {
  Agent,
  FeedRow,
  Mission,
  NavItem,
  RevenueBucket,
  Token,
} from "./types";

// ---------------------------------------------------------------------
// Agent fleet — Tier 1 (orchestrators) + Tier 2 (workers).
// Mirrors the doctrine: Nous + Gemini lead, with Hermes, Codex, etc.
// ---------------------------------------------------------------------

export const ORCHESTRATORS: Agent[] = [
  {
    id: "nous",
    name: "Nous Pro",
    role: "Chief of Staff",
    vendor: "Nous Portal",
    kind: "hermes",
    tier: "T1",
    status: "live",
    state: "ORCHESTRATING · 4 workers",
    body: "Routing Paperweight tasks · supervising Codex tests · drafting brief for Gemma4.",
    tags: ["LEAD", "LIVE"],
    busy: true,
    delegating: ["codex", "gemma", "pi", "grok"],
    taskLoad: 17,
  },
  {
    id: "gemini",
    name: "Gemini",
    role: "Co-Orchestrator",
    vendor: "Google",
    kind: "gemini",
    tier: "T1",
    status: "live",
    state: "STRATEGIZING · 2 streams",
    body: "Cross-referencing semantic memory · drafting Q3 OKR · feeding Cupid worker.",
    tags: ["CO-LEAD", "LIVE"],
    busy: true,
    delegating: ["cupid", "perplexity"],
    taskLoad: 14,
  },
];

export const WORKERS: Agent[] = [
  {
    id: "hermes",
    name: "Hermes",
    role: "Router · 9020",
    vendor: "Local",
    kind: "hermes",
    tier: "T2",
    status: "live",
    state: "STREAMING · 12 hops/s",
    body: "$ ollama run gemma4 → routing to local fleet.",
    tags: ["9020", "OPENCLAW"],
    busy: true,
    leadBy: "nous",
    taskLoad: 22,
  },
  {
    id: "codex",
    name: "Codex",
    role: "Coder",
    vendor: "OpenAI",
    kind: "codex",
    tier: "T2",
    status: "busy",
    state: "RUNNING TESTS",
    body: "pnpm test --filter paperclip-runtime · 14/16 pass.",
    tags: ["BUSY", "OSS"],
    busy: true,
    leadBy: "nous",
    taskLoad: 19,
  },
  {
    id: "gemma",
    name: "Gemma4",
    role: "Local Worker · 32B",
    vendor: "Google · Ollama",
    kind: "gemma",
    tier: "T2",
    status: "idle",
    state: "STANDBY",
    body: "Ollama · awaiting moderation overflow tonight.",
    tags: ["IDLE", "OLLAMA"],
    busy: false,
    leadBy: "nous",
    taskLoad: 4,
  },
  {
    id: "grok",
    name: "Grok",
    role: "Code Architect",
    vendor: "xAI",
    kind: "codex",
    tier: "T2",
    status: "live",
    state: "DRAFTING · paperclip-runtime",
    body: "Implementing handoff protocol v2 — race-condition review pending.",
    tags: ["LIVE", "ARCH"],
    busy: true,
    leadBy: "nous",
    taskLoad: 12,
  },
  {
    id: "cupid",
    name: "Cupid",
    role: "Ad Ops Worker",
    vendor: "ANTIGRAVITY",
    kind: "cupid",
    tier: "T2",
    status: "busy",
    state: "PUBLISHING · 12 ads",
    body: "Meta creative refresh · 4 placements live.",
    tags: ["RUN", "ADS"],
    busy: true,
    leadBy: "gemini",
    taskLoad: 16,
  },
  {
    id: "perplexity",
    name: "Perplexity",
    role: "Research · Deep",
    vendor: "Perplexity",
    kind: "perplexity",
    tier: "T2",
    status: "live",
    state: "SEARCHING · 14 sources",
    body: "Indexing court filings · payments compliance review.",
    tags: ["LIVE", "RESEARCH"],
    busy: true,
    leadBy: "gemini",
    taskLoad: 9,
  },
];

export const AGENTS: Agent[] = [...ORCHESTRATORS, ...WORKERS];

// ---------------------------------------------------------------------
// Tokenomics — the 4-DAO token set per design_guidelines.json
// ---------------------------------------------------------------------

export const TOKENS: Token[] = [
  {
    symbol: "LOVE",
    name: "Love DAO",
    color: "#EF4444",
    supplyCap: 2_500_000,
    circulating: 1_240_000,
    treasury: 980_000,
    burned: 280_000,
    price: 0.142,
    delta24h: 4.2,
  },
  {
    symbol: "UKID",
    name: "Until-No-Kid-In-Need",
    color: "#3B82F6",
    supplyCap: 2_500_000,
    circulating: 980_000,
    treasury: 1_320_000,
    burned: 200_000,
    price: 0.087,
    delta24h: -1.8,
  },
  {
    symbol: "GREEN",
    name: "Green Pool",
    color: "#10B981",
    supplyCap: 2_500_000,
    circulating: 1_650_000,
    treasury: 720_000,
    burned: 130_000,
    price: 0.214,
    delta24h: 2.1,
  },
  {
    symbol: "AGRAV",
    name: "Anti-Gravity",
    color: "#F59E0B",
    supplyCap: 2_500_000,
    circulating: 1_410_000,
    treasury: 870_000,
    burned: 220_000,
    price: 0.331,
    delta24h: 6.4,
  },
];

// ---------------------------------------------------------------------
// Revenue engine — 10 buckets per design_guidelines.json
// ---------------------------------------------------------------------

export const REVENUE_BUCKETS: RevenueBucket[] = [
  { id: 1, name: "Ad Creative",        value: 14_280, streams: 12, compounding: true,  trend: 0.62 },
  { id: 2, name: "Brand Licensing",    value:  9_740, streams:  4, compounding: true,  trend: 0.34 },
  { id: 3, name: "Affiliate Network",  value:  7_120, streams: 18, compounding: true,  trend: 0.18 },
  { id: 4, name: "Content Syndication",value:  6_980, streams:  9, compounding: false, trend: 0.11 },
  { id: 5, name: "Subscription Rail",  value:  5_460, streams:  3, compounding: true,  trend: 0.24 },
  { id: 6, name: "Data Licensing",     value:  4_310, streams:  2, compounding: true,  trend: 0.41 },
  { id: 7, name: "Tool Marketplace",   value:  3_870, streams:  7, compounding: true,  trend: 0.08 },
  { id: 8, name: "Consulting",         value:  2_640, streams:  5, compounding: false, trend: -0.04 },
  { id: 9, name: "Partner Programs",    value:  1_980, streams:  3, compounding: false, trend: 0.12 },
  { id: 10,name: "Royalty Pool",       value:  1_120, streams:  2, compounding: true,  trend: 0.07 },
];

// ---------------------------------------------------------------------
// Activity log seed
// ---------------------------------------------------------------------

export const SEED_LOG: FeedRow[] = [
  { t: "11:42:01", who: "nous",   msg: "Delegated → ", accent: "Hermes", after: ': "audit Paperweight task router for race conditions"' },
  { t: "11:41:58", who: "hermes", msg: "POST /api/paperweight · 200 OK · task PAPA-241 created" },
  { t: "11:41:32", who: "gemini", msg: "Analyzed Q3 OKR draft · 4 alignment gaps flagged" },
  { t: "11:40:55", who: "user",   msg: 'cmd: "summarize today\'s commits across paperclip-runtime"' },
  { t: "11:40:12", who: "hermes", msg: "BRIDGE telegram://chat/joshua → broadcast to #mission-control" },
  { t: "11:39:48", who: "nous",   msg: "Memory snapshot persisted → orchestration ledger" },
  { t: "11:39:02", who: "system", msg: "Self-Improving Agent loop · iteration 47 complete" },
];

// ---------------------------------------------------------------------
// Missions (Paperweight-style tasks)
// ---------------------------------------------------------------------

export const MISSIONS: Mission[] = [
  { id: "PAPA-241", title: "Audit Paperweight task router for race conditions", status: "active",  owner: "nous",   progress: 64, tag: "paperweight" },
  { id: "PAPA-240", title: "Q3 OKR draft — alignment review",                  status: "active",  owner: "gemini", progress: 38, tag: "strategy" },
  { id: "PAPA-239", title: "Refresh Meta creatives (4 placements)",            status: "active",  owner: "cupid",  progress: 82, tag: "growth" },
  { id: "PAPA-238", title: "Payments compliance review batch",             status: "blocked", owner: "perplexity", progress: 22, tag: "compliance" },
  { id: "PAPA-237", title: "Paperclip-runtime handoff protocol v2",            status: "active",  owner: "grok", progress: 51, tag: "engineering" },
  { id: "PAPA-236", title: "Local fleet Ollama warmup · gemma4:32b",           status: "queued",  owner: "hermes", progress:  0, tag: "infra" },
  { id: "PAPA-235", title: "Bridge Telegram → #mission-control",              status: "done",    owner: "hermes", progress: 100, tag: "comms" },
  { id: "PAPA-234", title: "Memory: episodic → semantic promotion",           status: "done",    owner: "nous",   progress: 100, tag: "memory" },
];

// ---------------------------------------------------------------------
// Nav
// ---------------------------------------------------------------------

export const NAV: NavItem[] = [
  { group: "Orchestration", id: "dashboard",  label: "Mission Control", icon: "LayoutDashboard", badge: "LIVE" },
  { group: "Orchestration", id: "fleet",      label: "Agent Fleet",     icon: "Users" },
  { group: "Orchestration", id: "hermes",     label: "Hermes Node",     icon: "Workflow",        badge: "9020" },
  { group: "Orchestration", id: "comms",      label: "Comms Gateway",   icon: "Radio" },
  { group: "Orchestration", id: "paperweight",label: "Paperweight",     icon: "StickyNote",       badge: "8" },
  { group: "Engine",        id: "revenue",    label: "Revenue Engine",  icon: "Banknote" },
  { group: "Engine",        id: "tokens",     label: "Tokenomics",      icon: "Coins" },
  { group: "System",        id: "settings",   label: "Settings",        icon: "Settings" },
];

// ---------------------------------------------------------------------
// Sparkline generators (deterministic, looks live when animated)
// ---------------------------------------------------------------------

export function makeSparkline(
  base: number,
  points: number,
  seed = 1,
  amplitude = 0.18,
): number[] {
  const out: number[] = [];
  let v = base;
  // tiny mulberry32 PRNG
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < points; i++) {
    const drift = (rand() - 0.45) * amplitude * base;
    v = Math.max(base * 0.4, v + drift);
    out.push(Math.round(v));
  }
  return out;
}

// ---------------------------------------------------------------------
// Kids-funded counter — ticks up while the dashboard is open.
// Source: design_guidelines.json ("MissionTicker" + "ticker" motion).
// ---------------------------------------------------------------------

export const KIDS_FUNDED_START = 10_482;
