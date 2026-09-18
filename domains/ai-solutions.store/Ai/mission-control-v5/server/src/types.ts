export type Mode = 'speed' | 'reasoning';
export type Column = 'NOW' | 'NEXT' | 'BLOCKED' | 'DONE';
export type TaskStatus = 'queued' | 'running' | 'done' | 'error';

export interface AgentDef {
  id: string;
  name: string;
  category: string;
  description: string;
  /** One-line summary of the harness's native arsenal, shown on the library card. */
  harness?: string;
  /** Brain-hub journal platform id — read on task start, written on task end. */
  platformId?: string;
  /** Executor chain the orchestrator's own reasoning (plan/validate) runs on. */
  brainExecutor?: string;
}

export interface CategoryDef {
  id: string;
  label: string;
}

/** One orchestration phase record — kept on the result for full auditability. */
export interface PhaseNote {
  phase: 'plan' | 'work' | 'validate' | 'journal' | 'deliver';
  detail: string;
  ms?: number;
}

/** Where a finished task's files actually landed. Null workspace = text only. */
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
  /** Orchestration trail: plan → work → validate → journal. */
  phases?: PhaseNote[];
}

export interface SwarmTask {
  id: string;
  title: string;
  prompt: string;
  agentIds: string[];
  mode: Mode;
  /** Named executor: 'auto' (provider order) | 'ornith' | 'judge'. */
  executor?: string;
  column: Column;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  results: AgentResult[];
  error?: string;
  /** Set once the task finishes: what was written to disk and committed. */
  artifacts?: TaskArtifacts;
}

export interface ProviderInfo {
  id: string;
  configured: boolean;
  speedModel: string | null;
  reasoningModel: string | null;
}
