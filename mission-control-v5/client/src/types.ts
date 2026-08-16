export type Mode = 'speed' | 'reasoning';
export type Column = 'NOW' | 'NEXT' | 'BLOCKED' | 'DONE';
export type TaskStatus = 'queued' | 'running' | 'done' | 'error';
export type Tab = 'graphy' | 'library' | 'swarm' | 'board' | 'services' | 'brain' | 'bridge';

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
  status: 'up' | 'down';
  ms: number;
  detail: string;
}

export interface Health {
  ok: boolean;
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

export interface BrainTool {
  name: string;
  description: string;
  inputSchema: unknown;
}

export interface BrainAskResult {
  result: unknown;
  tool: string;
  ms: number;
}

export interface BrainPiecesStatus {
  up: boolean;
  url: string;
  session: string | null;
  tools: number;
}

export interface BrainState {
  platforms: BrainPlatform[];
  piecesUp: boolean;
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

export type BridgeMessage = {
  sender: 'user' | 'fcc-claude' | 'openclaw';
  text: string;
  timestamp: string;
};

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
