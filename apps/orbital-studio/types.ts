export type Mode = 'speed' | 'reasoning';
export type Column = 'NOW' | 'NEXT' | 'BLOCKED' | 'DONE';
export type TaskStatus = 'queued' | 'running' | 'done' | 'error';
export type Tab = 'control' | 'graphy' | 'gemini95' | 'ultracode' | 'pipeline' | 'odoo' | 'papermates' | 'library' | 'swarm' | 'board' | 'services' | 'brain' | 'bridge' | 'council';

export interface GalaxyPlanet {
  id: string;
  name: string;
  codename: string;
  role: string;
  color: string;
  glowColor: string;
  orbitRadius: number;
  orbitSpeed: number;
  size: number;
  joinedAt?: string;
  isCustom?: boolean;
  status: 'active' | 'synced' | 'standby';
  description: string;
  stats: {
    tasksRouted: number;
    latencyMs: number;
    reliability: string;
    tokenVolume: string;
  };
  connectedGraphNodes: string[];
}

export interface NodeHealthData {
  nodeId: 'sabretooth' | 'node-9020' | 't5500';
  name: string;
  ip: string;
  role: string;
  status: 'ONLINE' | 'STANDBY' | 'BUSY' | 'ISOLATED';
  os: string;
  cpuUsage: number;
  ramUsage: number;
  vramUsage: number;
  activeLanes: string[];
  lastPing: string;
  watchdogState: 'ENGAGED' | 'STANDBY' | 'ALERT';
  memoryLockStatus: 'PROTECTED (ACL + HOOK)' | 'UNLOCKED';
}

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
  phase: 'plan' | 'work' | 'validate' | 'journal' | 'deliver';
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

export interface Health {
  service?: string;
  version: string;
  edition: string;
  routerLive: boolean;
  providers: ProviderInfo[];
  uptime?: number;
}

export type ServiceState = 'UP' | 'DOWN' | 'WRONG SERVICE' | 'AUTH MISSING' | 'AUTH REJECTED' | 'NOT CONFIGURED';

export interface ServiceStatus {
  name: string;
  url: string;
  openUrl?: string;
  lanReachable?: boolean;
  status: ServiceState;
  ms: number;
  detail: string;
  checkedAt: string;
  expectedServiceMarker?: string;
}

export interface ControlAlert {
  id: string;
  kind: 'service-down' | 'service-recovered' | 'service-state-change';
  subject: string;
  previousState: ServiceState;
  state: ServiceState;
  detail: string;
  createdAt: string;
  acknowledgedAt?: string | null;
  acknowledged?: boolean;
}

export type SupportPriority = 'low' | 'normal' | 'high' | 'urgent';
export type SupportCaseStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportCase {
  id: string;
  source?: 'local' | 'openclaw';
  subject: string;
  summary: string;
  priority: SupportPriority;
  status: SupportCaseStatus;
  assignee?: string;
  internalNote?: string;
  createdAt: string;
  updatedAt?: string;
}

export type PaperMatesTrustKind = 'report' | 'block' | 'appeal' | 'verification';
export type PaperMatesTrustSeverity = 'low' | 'moderate' | 'urgent' | 'critical';
export type PaperMatesTrustState = 'open' | 'investigating' | 'resolved' | 'dismissed';

export interface PaperMatesTrustCase {
  id: string;
  kind: PaperMatesTrustKind;
  severity: PaperMatesTrustSeverity;
  subject: string;
  summary: string;
  reference?: string;
  state: PaperMatesTrustState;
  reviewer?: string;
  decisionNote?: string;
  appealAvailable?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PaperMatesOverview {
  readiness: string;
  activeProfiles: number;
  verifiedHumans: number;
  botShieldBlocks: number;
  openTrustCases: number;
  systemState: string;
}

export interface BrainState {
  memorySize: number;
  semanticNodes: number;
  episodicEntries: number;
  workingContexts: number;
  status: string;
}

export interface BrainJournal {
  platformId: string;
  content: string;
  updatedAt: string;
  bytes: number;
  truncated: boolean;
}

export interface BrainSkill {
  id: string;
  name: string;
  category: string;
  description: string;
  content?: string;
}

export interface BrainCatalog {
  skills: BrainSkill[];
  tasks: BrainSkill[];
}

export interface BrainMcpStatus {
  online: boolean;
  servers: Array<{ name: string; status: string; toolsCount: number }>;
}

export type BridgeTarget = 'FCC-Claude' | 'OpenClaw' | 'Tri-Agent Swarm';

export interface BridgeStatus {
  name: BridgeTarget;
  status: 'online' | 'offline' | 'busy';
  endpoint: string;
  latencyMs: number;
}

export type OfficialSeatState =
  | 'AVAILABLE'
  | 'CAPACITY LIMITED'
  | 'BLOCKED'
  | 'NOT CONFIGURED'
  | 'AUTH MISSING'
  | 'AUTH REJECTED';

export interface OfficialSeat {
  id?: string;
  name?: string;
  platform: string;
  label?: string;
  state: OfficialSeatState;
  requestedModel?: string;
  actualModel?: string;
  lastVote?: string;
}

export interface OfficialVoteView {
  roster: {
    state: string;
    bindingEnabled: boolean;
  };
  seats: OfficialSeat[];
  ballots: Array<{ id: string; title: string; status: string; outcome?: string }>;
  events: Array<{ id: string; timestamp: string; message: string }>;
}

export interface SubagentNode {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'offline';
  currentTask?: string;
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: string;
}

export interface KnowledgeGraphLink {
  source: string;
  target: string;
}

export interface KnowledgeGraphData {
  nodes: KnowledgeGraphNode[];
  links: KnowledgeGraphLink[];
  builtAt: string;
}

export interface KnowledgeSearchHit {
  path: string;
  score: number;
  snippet: string;
}

export interface KnowledgeFilePreview {
  path: string;
  content: string;
  size: number;
}
