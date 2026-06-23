/**
 * mission-mcp HTTP client
 * Streamable HTTP (MCP protocol) at http://127.0.0.1:3901/mcp
 *
 * Auth: set VITE_MISSION_MCP_TOKEN in .env.local if mission-mcp requires a bearer membership record.
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
  created_at: number;    // Unix ms
  updated_at: number;    // Unix ms
  completed_at?: number; // Unix ms — set when status transitions to done (686e8ed)
}

/**
 * Agent row as returned by mission-mcp list_agents (686e8ed).
 * Returns [] when no agents are registered.
 */
export interface AgentRow {
  id: string;
  model: string;
  pid: number | null;
  last_heartbeat: number | null; // Unix ms
  meta: Record<string, unknown>;
  registered_at: number; // Unix ms
}

/** Agent summary shown in the fleet panel */
export interface AgentSummary {
  agentId: string;
  model: string;
  lastHeartbeat: number | null;
  registeredAt: number;
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
 * Fetch live agent fleet via native list_agents tool (686e8ed).
 * Returns [] when no agents are registered — honest empty state.
 * Falls back to { ok: false } if mission-mcp is unreachable.
 */
export async function fetchAgentFleet(): Promise<{ ok: boolean; agents: AgentSummary[]; error?: string }> {
  const r = await mcpCall<AgentRow[]>('list_agents', {});
  if (!r.ok || !r.data) {
    return { ok: false, agents: [], error: r.error };
  }

  const now = Date.now();
  // An agent is "active" if it sent a heartbeat within the last 60 seconds
  const ACTIVE_THRESHOLD_MS = 60_000;

  const agents: AgentSummary[] = r.data.map(a => ({
    agentId: a.id,
    model: a.model,
    lastHeartbeat: a.last_heartbeat,
    registeredAt: a.registered_at,
    status: (a.last_heartbeat && now - a.last_heartbeat < ACTIVE_THRESHOLD_MS)
      ? 'active'
      : 'idle',
  }));

  // Sort: active first, then by most-recent heartbeat
  agents.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
    return (b.lastHeartbeat ?? 0) - (a.lastHeartbeat ?? 0);
  });

  return { ok: true, agents };
}

/**
 * Compute income-engine task pulse using server-side tag filter (686e8ed).
 * Uses since_ms to fetch only the last 7 days for the velocity window,
 * plus a separate total-count call without since_ms for the summary stats.
 *
 * Falls back gracefully — if 0 tasks returned, metrics are all 0.
 */
export async function fetchIncomePulse(): Promise<{ ok: boolean; pulse: IncomePulse; error?: string }> {
  const empty: IncomePulse = {
    totalTasks: 0, completedCount: 0, inProgressCount: 0,
    pendingCount: 0, completedLast7d: 0, dailyVelocity: 0,
    completionSpark: [0, 0, 0, 0, 0, 0, 0],
  };

  const now = Date.now();
  const since7d = now - SEVEN_DAYS_MS;

  // Two parallel calls: all income-engine tasks (totals) + last-7d only (velocity)
  const [allResult, recentResult] = await Promise.all([
    mcpCall<TaskRow[]>('list_tasks', { tag: 'income-engine' }),
    mcpCall<TaskRow[]>('list_tasks', { tag: 'income-engine', since_ms: since7d }),
  ]);

  if (!allResult.ok || !allResult.data) {
    return { ok: false, pulse: empty, error: allResult.error };
  }

  const ieTasks = allResult.data;

  if (ieTasks.length === 0) {
    return { ok: true, pulse: empty };
  }

  const completed  = ieTasks.filter(t => t.status === 'done');
  const inProgress = ieTasks.filter(t => t.status === 'in_progress');
  const pending    = ieTasks.filter(t => t.status === 'pending');

  // Velocity sparkline uses completed_at (accurate since 686e8ed).
  // recent window comes from the since_ms-filtered call; fall back to allResult
  // if the recent call failed (backward compat).
  const recentTasks = (recentResult.ok && recentResult.data) ? recentResult.data : ieTasks;
  const completedRecent = recentTasks.filter(t => t.status === 'done');

  // Build sparkline: completions-per-day for last 7 days (idx 0 = oldest, 6 = today)
  // Use completed_at for accuracy; fall back to updated_at for rows that predate 686e8ed.
  const spark = Array(7).fill(0) as number[];
  for (const t of completedRecent) {
    const ts = t.completed_at ?? t.updated_at;
    const daysAgo = Math.floor((now - ts) / (24 * 60 * 60 * 1000));
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
