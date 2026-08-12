import type {
  AgentDef,
  BrainAskResult,
  BrainCatalog,
  BrainJournal,
  BrainMcpStatus,
  BrainPiecesStatus,
  BrainSkill,
  BrainState,
  BrainTool,
  CategoryDef,
  Column,
  Health,
  Mode,
  ServiceStatus,
  SubagentNode,
  SwarmTask,
} from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  return body as T;
}

export const api = {
  health: () => request<Health>('/api/health'),
  agents: () => request<{ total: number; count: number; categories: CategoryDef[]; agents: AgentDef[] }>('/api/agents'),
  subagents: () => request<{ agents: SubagentNode[] }>('/api/subagents'),
  tasks: () => request<{ tasks: SwarmTask[] }>('/api/tasks'),
  createTask: (input: { title?: string; prompt: string; agentIds: string[]; mode: Mode; executor?: string }) =>
    request<{ task: SwarmTask }>('/api/tasks', { method: 'POST', body: JSON.stringify(input) }),
  moveTask: (id: string, column: Column) =>
    request<{ task: SwarmTask }>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ column }),
    }),
  retryTask: (id: string) => request<{ task: SwarmTask }>(`/api/tasks/${id}/retry`, { method: 'POST' }),
  deleteTask: (id: string) => request<void>(`/api/tasks/${id}`, { method: 'DELETE' }),
  services: () => request<{ services: ServiceStatus[] }>('/api/services'),
  // ── Brain hub ────────────────────────────────────────────────────────────────
  brainState: () => request<BrainState>('/api/brain/state'),
  brainJournal: (platformId: string) => request<BrainJournal>(`/api/brain/journal/${platformId}`),
  brainWriteJournal: (platformId: string, content: string) =>
    request<{ bytes: number; truncated: boolean; updatedAt: string }>(`/api/brain/journal/${platformId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  brainTools: () => request<{ tools: BrainTool[] }>('/api/brain/tools'),
  brainAsk: (input: { tool?: string; arguments?: unknown; query?: string }) =>
    request<BrainAskResult>('/api/brain/ask', { method: 'POST', body: JSON.stringify(input) }),
  brainPieces: () => request<BrainPiecesStatus>('/api/brain/pieces'),
  // ── Brain catalog (monorepo skills + tasks) ────────────────────────────────────
  brainCatalog: (q?: string, category?: string) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    const qs = params.toString();
    return request<BrainCatalog>(`/api/brain/catalog${qs ? `?${qs}` : ''}`);
  },
  brainCatalogEntry: (kind: 'skills' | 'tasks', id: string) => request<BrainSkill>(`/api/brain/catalog/${kind}/${id}`),
  brainMcpStatus: () => request<BrainMcpStatus>('/api/mcp/status'),
};

export function subscribeEvents(onEvent: () => void): () => void {
  const source = new EventSource('/api/events');
  source.onmessage = () => onEvent();
  source.onerror = () => {
    /* EventSource auto-reconnects */
  };
  return () => source.close();
}
