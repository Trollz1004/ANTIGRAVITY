import type { AgentDef, CategoryDef, Column, Health, Mode, ServiceStatus, SwarmTask } from './types';

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
  agents: () =>
    request<{ total: number; count: number; categories: CategoryDef[]; agents: AgentDef[] }>(
      '/api/agents',
    ),
  tasks: () => request<{ tasks: SwarmTask[] }>('/api/tasks'),
  createTask: (input: { title?: string; prompt: string; agentIds: string[]; mode: Mode }) =>
    request<{ task: SwarmTask }>('/api/tasks', { method: 'POST', body: JSON.stringify(input) }),
  moveTask: (id: string, column: Column) =>
    request<{ task: SwarmTask }>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ column }),
    }),
  retryTask: (id: string) =>
    request<{ task: SwarmTask }>(`/api/tasks/${id}/retry`, { method: 'POST' }),
  deleteTask: (id: string) => request<void>(`/api/tasks/${id}`, { method: 'DELETE' }),
  services: () => request<{ services: ServiceStatus[] }>('/api/services'),
};

export function subscribeEvents(onEvent: () => void): () => void {
  const source = new EventSource('/api/events');
  source.onmessage = () => onEvent();
  source.onerror = () => {
    /* EventSource auto-reconnects */
  };
  return () => source.close();
}
