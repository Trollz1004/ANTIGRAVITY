// Domain types for the ANTIGRAVITY Command Center dashboard.
// All data shown is live but the underlying "live" source is
// synthesized in src/lib/synth.ts. Replace those functions with
// real WebSocket / REST calls to wire to actual services.

export type AgentStatus = "live" | "busy" | "idle" | "offline";

export type AgentTier = "T1" | "T2";

export type AgentKind =
  | "opus"
  | "gemini"
  | "hermes"
  | "codex"
  | "gemma"
  | "cupid"
  | "perplexity"
  | "claude";

export interface Agent {
  id: string;
  name: string;
  role: string;
  vendor: string;
  kind: AgentKind;
  tier: AgentTier;
  status: AgentStatus;
  state: string;
  body: string;
  tags: string[];
  busy: boolean;
  /** Agents this one is delegating to. */
  delegating?: string[];
  /** The orchestrator that supervises this worker (Tier 2 only). */
  leadBy?: string;
  /** Current task load out of 25. */
  taskLoad: number;
}

export type TokenSymbol = "LOVE" | "UKID" | "GREEN" | "AGRAV";

export interface Token {
  symbol: TokenSymbol;
  name: string;
  color: string; // hex
  supplyCap: number; // 2_500_000
  circulating: number;
  treasury: number;
  burned: number;
  price: number; // USD
  delta24h: number; // -100..100
}

export interface RevenueBucket {
  id: number;
  name: string;
  value: number; // $ earned
  streams: number; // # of sub-streams
  compounding: boolean;
  trend: number; // -1..1
}

export interface FeedRow {
  t: string; // HH:MM:SS
  who: "opus" | "gemini" | "hermes" | "codex" | "gemma" | "user" | "system";
  msg: string;
  accent?: string;
  after?: string;
}

export type PageId =
  | "dashboard"
  | "fleet"
  | "revenue"
  | "tokens"
  | "comms"
  | "paperweight"
  | "hermes"
  | "settings";

export interface NavItem {
  id: PageId;
  label: string;
  icon: string;
  badge?: string;
  group: string;
}

export interface Mission {
  id: string;
  title: string;
  status: "active" | "queued" | "blocked" | "done";
  owner: string;
  progress: number; // 0..100
  tag: string;
}
