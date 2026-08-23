import type {
  AgentDef,
  BrainCatalog,
  BrainJournal,
  BrainMcpStatus,
  BrainSkill,
  BrainState,
  CategoryDef,
  Column,
  Health,
  KnowledgeFilePreview,
  KnowledgeGraphData,
  KnowledgeSearchHit,
  Mode,
  ServiceStatus,
  BridgeStatus,
  BridgeTarget,
  OfficialVoteView,
  SubagentNode,
  SwarmTask,
  ControlAlert,
  SupportCase,
  SupportCaseStatus,
  SupportPriority,
  PaperMatesOverview,
  PaperMatesTrustCase,
  PaperMatesTrustKind,
  PaperMatesTrustSeverity,
  PaperMatesTrustState,
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
  services: () => request<{ services: ServiceStatus[]; alerts?: ControlAlert[] }>('/api/services'),
  controlAlerts: () => request<{ alerts: ControlAlert[] }>('/api/control/alerts'),
  acknowledgeAlert: (id: string) => request<{ alert: ControlAlert }>(`/api/control/alerts/${id}/ack`, { method: 'POST' }),
  supportCases: () => request<{ cases: SupportCase[] }>('/api/control/support'),
  createSupportCase: (input: { source?: 'local' | 'openclaw'; subject: string; summary: string; priority?: SupportPriority; assignee?: string }) =>
    request<{ supportCase: SupportCase }>('/api/control/support', { method: 'POST', body: JSON.stringify(input) }),
  updateSupportCase: (id: string, input: { status?: SupportCaseStatus; priority?: SupportPriority; assignee?: string; internalNote?: string }) =>
    request<{ supportCase: SupportCase }>(`/api/control/support/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  // ── PaperMates — static readiness and local redacted trust records ───────────
  paperMatesOverview: () => request<PaperMatesOverview>('/api/papermates/overview'),
  paperMatesTrust: () => request<{ cases: PaperMatesTrustCase[] }>('/api/papermates/trust'),
  createPaperMatesTrust: (input: { kind: PaperMatesTrustKind; severity: PaperMatesTrustSeverity; subject: string; summary: string; reference?: string; reviewer?: string; appealAvailable?: boolean }) =>
    request<{ trustCase: PaperMatesTrustCase }>('/api/papermates/trust', { method: 'POST', body: JSON.stringify(input) }),
  updatePaperMatesTrust: (id: string, input: { state?: PaperMatesTrustState; severity?: PaperMatesTrustSeverity; reviewer?: string; decisionNote?: string; appealAvailable?: boolean }) =>
    request<{ trustCase: PaperMatesTrustCase }>(`/api/papermates/trust/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  // ── Brain hub ────────────────────────────────────────────────────────────────
  brainState: () => request<BrainState>('/api/brain/state'),
  brainJournal: (platformId: string) => request<BrainJournal>(`/api/brain/journal/${platformId}`),
  brainWriteJournal: (platformId: string, content: string) =>
    request<{ bytes: number; truncated: boolean; updatedAt: string }>(`/api/brain/journal/${platformId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
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
  // ── Bridge hub (external AI CLI tools) ─────────────────────────────────────
  bridgeStatus: () => request<{ bridges: BridgeStatus[] }>('/api/bridge/status'),
  bridgeSend: (target: BridgeTarget, prompt: string) =>
    request<{ sender: string; text: string; timestamp: string }>(`/api/bridge/${target}`, {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),
  // ── Official vote view (read only; no operational bridge method is used) ────
  officialVoteView: () => request<OfficialVoteView>('/api/official-votes/view'),
  // ── Knowledge graph (repo as a navigable graph) ────────────────────────────
  knowledgeGraph: () => request<KnowledgeGraphData>('/api/knowledge/graph'),
  knowledgeSearch: (q: string) =>
    request<{ query: string; hits: KnowledgeSearchHit[] }>(`/api/knowledge/search?q=${encodeURIComponent(q)}`),
  knowledgeFile: (path: string) =>
    request<KnowledgeFilePreview>(`/api/knowledge/file?path=${encodeURIComponent(path)}`),
};

export function subscribeEvents(onEvent: () => void): () => void {
  const source = new EventSource('/api/events');
  source.onmessage = () => onEvent();
  source.onerror = () => {
    /* EventSource auto-reconnects */
  };
  return () => source.close();
}
