export type Mode = 'speed' | 'reasoning';
export type Column = 'NOW' | 'NEXT' | 'BLOCKED' | 'DONE';
export type TaskStatus = 'queued' | 'running' | 'done' | 'error';

export interface AgentDef {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface CategoryDef {
  id: string;
  label: string;
}

export interface AgentResult {
  agentId: string;
  status: 'pending' | 'running' | 'done' | 'error';
  provider?: string;
  model?: string;
  output?: string;
  error?: string;
  ms?: number;
}

export interface SwarmTask {
  id: string;
  title: string;
  prompt: string;
  agentIds: string[];
  mode: Mode;
  column: Column;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  results: AgentResult[];
  error?: string;
}

export interface ProviderInfo {
  id: string;
  configured: boolean;
  speedModel: string | null;
  reasoningModel: string | null;
}

export interface ServiceStatus {
  name: string;
  url: string;
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
  agents: number;
  categories: number;
  activeTasks: number;
  time: string;
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
