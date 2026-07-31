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
  /** Named executor: 'auto' (provider order) | 'ornith' | 'fcc-opus'. */
  executor?: string;
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
