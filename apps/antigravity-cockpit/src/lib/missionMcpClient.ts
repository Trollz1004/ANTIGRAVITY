/**
 * mission-mcp HTTP client
 * Streamable HTTP endpoint at http://127.0.0.1:3901/mcp
 *
 * Auth: set VITE_MISSION_MCP_TOKEN in .env.local if mission-mcp requires a bearer token.
 * The UI fails gracefully if the server is unreachable — stub data is shown instead.
 */

const MCP_BASE_URL = import.meta.env.VITE_MISSION_MCP_URL ?? 'http://127.0.0.1:3901/mcp';
const MCP_TOKEN    = import.meta.env.VITE_MISSION_MCP_TOKEN ?? '';

function buildHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
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
 * Generic JSON-RPC-style call to mission-mcp.
 * Returns { ok: false, error } gracefully if the server is unreachable.
 */
export async function mcpCall<T = unknown>(
  method: string,
  params: Record<string, unknown> = {},
): Promise<McpCallResult<T>> {
  try {
    const res = await fetch(MCP_BASE_URL, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status} ${res.statusText}` };
    }
    const json = await res.json() as { result?: T; error?: { message?: string } };
    if (json.error) {
      return { ok: false, error: json.error.message ?? 'mcp error' };
    }
    return { ok: true, data: json.result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `mission-mcp not reachable: ${msg}` };
  }
}

// ─── Typed surface helpers (stubbed until mission-mcp defines these routes) ──

export interface AgentStatus {
  id: string;
  name: string;
  status: 'live' | 'busy' | 'idle' | 'error';
  state: string;
}

export interface RevenuePulse {
  total14d: number;
  delta: number;
  earmarked: number;
}

/** Fetch agent fleet status from mission-mcp. Falls back to undefined on failure. */
export async function fetchAgentFleet(): Promise<AgentStatus[] | undefined> {
  const r = await mcpCall<AgentStatus[]>('tools/agent_fleet');
  return r.ok ? r.data : undefined;
}

/** Fetch revenue pulse from mission-mcp. Falls back to undefined on failure. */
export async function fetchRevenuePulse(): Promise<RevenuePulse | undefined> {
  const r = await mcpCall<RevenuePulse>('tools/revenue_pulse');
  return r.ok ? r.data : undefined;
}
