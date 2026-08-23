export type Mode = 'speed' | 'reasoning';
export type Column = 'NOW' | 'NEXT' | 'BLOCKED' | 'DONE';
export type TaskStatus = 'queued' | 'running' | 'done' | 'error';
export type Tab = 'control' | 'papermates' | 'graphy' | 'library' | 'swarm' | 'board' | 'services' | 'brain' | 'bridge' | 'council' | 'dateapp' | 'support' | 'preview';

export interface AgentDef {
  id: string;
  name: string;
  category: string;
  description: string;
  harness?: string;
  platformId?: string;
  brainExecutor?: string;
}

export interface CategoryDef {
  id: string;
  label: string;
}

export interface PhaseNote {
  phase: 'plan' | 'work' | 'validate' | 'judge' | 'journal' | 'deliver';
  detail: string;
  ms?: number;
}

export interface TaskArtifacts {
  workspace: string | null;
  files: string[];
  skipped: { path: string; why: string }[];
  committed: boolean;
  pushed: boolean;
  note: string;
}

export interface AgentResult {
  agentId: string;
  status: 'pending' | 'running' | 'done' | 'error';
  provider?: string;
  model?: string;
  output?: string;
  error?: string;
  ms?: number;
  phases?: PhaseNote[];
}

export interface SwarmTask {
  id: string;
  title: string;
  prompt: string;
  agentIds: string[];
  mode: Mode;
  executor?: string;
  column: Column;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  results: AgentResult[];
  error?: string;
  artifacts?: TaskArtifacts;
}

export interface ProviderInfo {
  id: string;
  configured: boolean;
  speedModel: string | null;
  reasoningModel: string | null;
}

export interface ExecutorInfo {
  id: string;
  label: string;
  description: string;
  chain: { provider: string; model: string }[];
}

export interface ServiceStatus {
  name: string;
  url: string;
  openUrl?: string;
  lanReachable?: boolean;
  status: 'UP' | 'DOWN' | 'WRONG SERVICE' | 'AUTH MISSING' | 'AUTH REJECTED' | 'NOT CONFIGURED';
  ms: number;
  detail: string;
  checkedAt?: string;
  expectedServiceMarker?: string;
}

export interface ControlAlert {
  id: string;
  kind: 'service-down' | 'service-recovered' | 'service-state-change';
  subject: string;
  previousState: ServiceStatus['status'];
  state: ServiceStatus['status'];
  detail: string;
  createdAt: string;
  acknowledgedAt: string | null;
}

export type SupportPriority = 'low' | 'normal' | 'high' | 'urgent';
export type SupportCaseStatus = 'open' | 'assigned' | 'waiting' | 'resolved';

export interface SupportCase {
  id: string;
  source: 'local' | 'openclaw';
  subject: string;
  summary: string;
  priority: SupportPriority;
  status: SupportCaseStatus;
  assignee: string | null;
  internalNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PaperMatesTrustKind = 'report' | 'bot-check' | 'check-in' | 'circle-date';
export type PaperMatesTrustState = 'received' | 'needs_review' | 'limited' | 'resolved' | 'appealed';
export type PaperMatesTrustSeverity = 'low' | 'moderate' | 'high' | 'urgent';

export interface PaperMatesTrustCase {
  id: string;
  kind: PaperMatesTrustKind;
  state: PaperMatesTrustState;
  severity: PaperMatesTrustSeverity;
  subject: string;
  summary: string;
  reference: string | null;
  reviewer: string | null;
  decisionNote: string | null;
  appealAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaperMatesLaunchItem {
  id: string;
  label: string;
  state: 'prototype' | 'policy required' | 'backend required';
  dependency: string;
}

export interface PaperMatesSkill {
  id: string;
  description: string;
  state: 'VALIDATED';
}

export interface PaperMatesOverview {
  brand: string;
  aiSupport: { state: 'NOT CONFIGURED'; detail: string };
  launchItems: PaperMatesLaunchItem[];
  skills: PaperMatesSkill[];
}

export interface Health {
  ok: boolean;
  service?: 'mission-control';
  name: string;
  edition: string;
  version: string;
  routerLive: boolean;
  providers: ProviderInfo[];
  executors?: ExecutorInfo[];
  agents: number;
  categories: number;
  activeTasks: number;
  time: string;
}

export type SubagentHealth = 'green' | 'yellow' | 'red';

export interface SubagentNode {
  id: string;
  name: string;
  health: SubagentHealth;
  updatedAt: string;
  files: Record<'SOUL.md' | 'HEARTBEAT.md' | 'TOOLS.md' | 'SKILLS.md', string>;
}

// ── Brain hub ──────────────────────────────────────────────────────────────────
export interface BrainPlatform {
  id: string;
  label: string;
  statePath: string;
  maxChars: number;
  enabled: boolean;
  bytes: number;
  updatedAt: string | null;
}

export interface BrainJournal {
  content: string;
  updatedAt: string | null;
  bytes: number;
}

export type HumanToolState = 'configured' | 'unavailable' | 'not-configured';

export interface HumanToolStatus {
  id: 'repository' | 'graphy' | 'supabase' | 'obsidian';
  label: string;
  state: HumanToolState;
  detail: string;
  humanFacing: true;
  openUrl?: string;
}

export interface BrainState {
  platforms: BrainPlatform[];
  knowledge: { source: 'repository'; graphEndpoint: string; searchEndpoint: string };
  graphy: { agentsEndpoint: string; knowledgeEndpoint: string };
  obsidian: { status: 'not-configured' | 'configured' | 'unavailable' };
  humanTools: HumanToolStatus[];
}

// ── Brain catalog (monorepo skills + tasks) ───────────────────────────────────
export interface BrainSkill {
  id: string;
  label: string;
  category: string;
  description: string;
  tools: string[];
  path: string;
  body: string;
  kind: 'skill' | 'task';
}

export interface BrainCatalog {
  skills: BrainSkill[];
  categories: { id: string; label: string; count: number }[];
}

export interface BrainMcpStatus {
  endpoint: string;
  url: string;
  tools: number;
  toolNames: string[];
  sessions: number;
  authEnabled: boolean;
  protocolVersion: string;
  serverInfo: { name: string; version: string };
}

export type BridgeTarget = 'hermes' | 'openclaw' | 'opencode';

export interface BridgeStatus {
  id: BridgeTarget;
  label: string;
  kind: 'operational';
  state: 'ready' | 'unavailable' | 'not-configured';
  sendEnabled: boolean;
  lastSeen: string | null;
  detail: string;
}

export type BridgeMessage = {
  sender: string;
  text: string;
  timestamp: string;
};

export type OfficialPlatform = 'claude' | 'gemini' | 'github-copilot' | 'grok' | 'openai-codex';
export type OfficialSeatState =
  | 'AVAILABLE'
  | 'CAPACITY LIMITED'
  | 'BLOCKED'
  | 'NOT CONFIGURED'
  | 'AUTH MISSING'
  | 'AUTH REJECTED';

export interface OfficialSeat {
  platform: OfficialPlatform;
  label: string;
  officialClient: string;
  state: OfficialSeatState;
  requestedModel: string;
  actualModel: string | null;
  detail: string;
}

export interface ActiveBallot {
  id: string;
  subject: string;
  status: 'OPEN' | 'CLOSED';
  decisions: number;
}

export interface DecisionEvent {
  id: string;
  actor: string;
  platform: OfficialPlatform;
  officialClient: string;
  laneState: OfficialSeatState;
  requestedModel: string;
  actualModel: string;
  timestamp: string;
  subject: string;
  decision: 'approve' | 'reject' | 'abstain';
  evidenceSummary: string;
  binding: false;
}

export interface OfficialVoteView {
  roster: { state: 'missing' | 'invalid' | 'signed'; bindingEnabled: false };
  seats: OfficialSeat[];
  ballots: ActiveBallot[];
  events: DecisionEvent[];
}

// ── Knowledge graph (repo as a navigable graph) ──────────────────────────────
export interface KnowledgeNode {
  id: string;
  name: string;
  kind: 'root' | 'area' | 'dir' | 'file';
  ext?: string;
  size?: number;
  mtime?: string;
  description?: string;
  truncated?: number;
}

export interface KnowledgeLink {
  source: string;
  target: string;
}

export interface KnowledgeGraphData {
  nodes: KnowledgeNode[];
  links: KnowledgeLink[];
  builtAt: string;
  root: string;
}

export interface KnowledgeSearchHit {
  id: string;
  name: string;
  kind: KnowledgeNode['kind'];
  description?: string;
  score: number;
  via: string;
}

export interface KnowledgeFilePreview {
  path: string;
  size: number;
  mtime: string;
  truncated: boolean;
  content: string;
}

// ── Date App metrics (real production data) ─────────────────────────────────
export interface DateAppMetrics {
  health: {
    status: string;
    db_connected: boolean;
    redis_connected: boolean;
    square_connected: boolean;
    square_signature_configured: boolean;
    wallet_rails_proven: boolean;
    wallet_rails_status: string;
    payment_proof_labels: string[];
    user_count: number;
  };
  allocations: {
    customer_only?: { payments: number; gross_cents: number; reserve_cents: number; operating_cents: number };
    with_test?: { payments: number; gross_cents: number; reserve_cents: number; operating_cents: number };
  } | null;
  frontend: { url: string; reachable: boolean };
  public: { site: string; api: string };
}

