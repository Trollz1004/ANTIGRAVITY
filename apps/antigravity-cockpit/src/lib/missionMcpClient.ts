/**
 * mission-mcp HTTP client
 * Streamable HTTP (MCP protocol) at http://127.0.0.1:3901/mcp
 *
 * Auth: set VITE_MISSION_MCP_TOKEN in .env.local if mission-mcp requires a bearer token.
 * The UI fails gracefully if the server is unreachable — stub data is shown instead.
 *
 * Wire protocol:
 *   POST /mcp  {jsonrpc:"2.0", id:1, method:"tools/call", params:{name, arguments}}
 *   Response:  {result:{content:[{type:"text",text:"<json>"}]}} | {error:{message}}
 *   The server may also respond with SSE (text/event-stream); we parse both.
 */

export const MCP_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MISSION_MCP_URL)
  ? import.meta.env.VITE_MISSION_MCP_URL as string
  : 'http://127.0.0.1:3901/mcp';

export const MCP_TOKEN = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MISSION_MCP_TOKEN)
  ? import.meta.env.VITE_MISSION_MCP_TOKEN as string
  : '';

export function buildHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    // mission-mcp StreamableHTTP transport requires Accept to include text/event-stream
    'Accept': 'application/json, text/event-stream',
  };
  if (MCP_TOKEN) h['Authorization'] = `Bearer ${MCP_TOKEN}`;
  return h;
}

export interface McpCallResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

/**
 * Parse a raw response body from mission-mcp.
 * The server uses StreamableHTTP — it may return:
 *   - plain JSON:  { result: { content: [{type:"text", text:"<json>"}] } }
 *   - SSE stream:  lines like "data: {…}\n\n"
 *
 * Returns the parsed inner result value T, or throws.
 */
export function parseMcpBody<T>(body: string, contentType: string): T {
  let envelope: { result?: { content?: { type: string; text: string }[] }; error?: { message?: string } };

  if (contentType.includes('text/event-stream')) {
    // Pull first `data: {...}` line
    const dataLine = body.split('\n').find(l => l.startsWith('data: '));
    if (!dataLine) throw new Error('SSE response had no data line');
    envelope = JSON.parse(dataLine.slice('data: '.length)) as typeof envelope;
  } else {
    envelope = JSON.parse(body) as typeof envelope;
  }

  if (envelope.error) {
    throw new Error(envelope.error.message ?? 'mcp error');
  }

  const content = envelope.result?.content ?? [];
  if (content.length === 0) {
    // Some tools return an empty content array — treat as empty list/object
    return [] as unknown as T;
  }
  return JSON.parse(content[0].text) as T;
}

/**
 * Call a mission-mcp tool by name.
 * Returns { ok: false, error } gracefully if the server is unreachable or returns an error.
 */
export async function mcpCall<T = unknown>(
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<McpCallResult<T>> {
  try {
    const res = await fetch(MCP_BASE_URL, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: toolName, arguments: args },
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status} ${res.statusText}` };
    }
    const ct = res.headers.get('content-type') ?? '';
    const body = await res.text();
    const data = parseMcpBody<T>(body, ct);
    return { ok: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `mission-mcp not reachable: ${msg}` };
  }
}

// ─── Domain types ─────────────────────────────────────────────────────────────

/** A task row as returned by mission-mcp list_tasks */
export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'done' | 'failed' | 'blocked';
  priority: number;
  parent_task_id: string | null;
  assigned_agent_id: string | null;
  result: string | null;
  created_at: number;  // Unix ms
  updated_at: number;  // Unix ms
}

/** Agent derived from grouping tasks by assigned_agent_id */
export interface AgentSummary {
  agentId: string;
  taskCount: number;
  activeCount: number;   // pending + in_progress
  lastActivity: number;  // max updated_at ms
  status: 'active' | 'idle';
}

/** Income-engine pulse derived from tasks tagged income-engine */
export interface IncomePulse {
  totalTasks: number;
  completedCount: number;
  inProgressCount: number;
  pendingCount: number;
  /** Completed tasks in last 7 days */
  completedLast7d: number;
  /** Average completions per day over last 7 days */
  dailyVelocity: number;
  /** Sparkline: completed-per-day for last 7 days (oldest→newest) */
  completionSpark: number[];
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Derive a synthetic agent fleet by grouping all tasks by assigned_agent_id.
 * mission-mcp has no list_agents tool; task assignment is the proxy.
 *
 * Returns [] (not undefined) when there are no tasks — honest empty state.
 */
export async function fetchAgentFleet(): Promise<{ ok: boolean; agents: AgentSummary[]; error?: string }> {
  const r = await mcpCall<TaskRow[]>('list_tasks', { limit: 500 });
  if (!r.ok || !r.data) {
    return { ok: false, agents: [], error: r.error };
  }

  const tasks = r.data;
  const byAgent = new Map<string, TaskRow[]>();

  for (const t of tasks) {
    const key = t.assigned_agent_id ?? '__unassigned__';
    if (!byAgent.has(key)) byAgent.set(key, []);
    byAgent.get(key)!.push(t);
  }

  const agents: AgentSummary[] = [];
  for (const [agentId, agentTasks] of byAgent) {
    if (agentId === '__unassigned__') continue; // skip unassigned tasks
    const activeCount = agentTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
    const lastActivity = Math.max(...agentTasks.map(t => t.updated_at));
    agents.push({
      agentId,
      taskCount: agentTasks.length,
      activeCount,
      lastActivity,
      status: activeCount > 0 ? 'active' : 'idle',
    });
  }

  // Sort: active first, then by task count desc
  agents.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
    return b.taskCount - a.taskCount;
  });

  return { ok: true, agents };
}

/**
 * Compute income-engine task pulse from tasks whose description contains
 * the income-engine tag block seeded by seed-income-engine.py.
 *
 * Falls back gracefully — if 0 tasks returned, metrics are all 0.
 */
export async function fetchIncomePulse(): Promise<{ ok: boolean; pulse: IncomePulse; error?: string }> {
  const empty: IncomePulse = {
    totalTasks: 0, completedCount: 0, inProgressCount: 0,
    pendingCount: 0, completedLast7d: 0, dailyVelocity: 0,
    completionSpark: [0, 0, 0, 0, 0, 0, 0],
  };

  // Fetch all tasks (income-engine tasks don't have a distinct status filter;
  // we filter client-side by the tag block in description)
  const r = await mcpCall<TaskRow[]>('list_tasks', { limit: 500 });
  if (!r.ok || !r.data) {
    return { ok: false, pulse: empty, error: r.error };
  }

  // Filter to income-engine tagged tasks
  const ieTasks = r.data.filter(t =>
    t.description?.includes('"income-engine"') || t.description?.includes('income-engine-tags')
  );

  if (ieTasks.length === 0) {
    return { ok: true, pulse: empty };
  }

  const now = Date.now();
  const cutoff = now - SEVEN_DAYS_MS;

  const completed = ieTasks.filter(t => t.status === 'done');
  const inProgress = ieTasks.filter(t => t.status === 'in_progress');
  const pending = ieTasks.filter(t => t.status === 'pending');
  const completedRecent = completed.filter(t => t.updated_at >= cutoff);

  // Build sparkline: completions-per-day for last 7 days (day 0 = oldest)
  const spark = Array(7).fill(0) as number[];
  for (const t of completedRecent) {
    const daysAgo = Math.floor((now - t.updated_at) / (24 * 60 * 60 * 1000));
    const idx = 6 - Math.min(daysAgo, 6); // idx 6 = today
    spark[idx]++;
  }

  const dailyVelocity = completedRecent.length / 7;

  return {
    ok: true,
    pulse: {
      totalTasks: ieTasks.length,
      completedCount: completed.length,
      inProgressCount: inProgress.length,
      pendingCount: pending.length,
      completedLast7d: completedRecent.length,
      dailyVelocity: Math.round(dailyVelocity * 10) / 10,
      completionSpark: spark,
    },
  };
}

// ─── Legacy re-exports (keep Dashboard compiling during migration) ─────────────

/** @deprecated Use fetchAgentFleet() */
export type AgentStatus = AgentSummary;

/** @deprecated Use fetchIncomePulse() */
export interface RevenuePulse {
  total14d: number;
  delta: number;
  earmarked: number;
}
