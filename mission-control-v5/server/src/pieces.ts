/**
 * PIECES — Long-Term Memory bridge.
 *
 * Pieces OS runs a streamable-HTTP MCP server locally (default
 * http://localhost:39300/model_context_protocol/2025-03-26/mcp). This module is
 * the server-side proxy that speaks the MCP handshake once and reuses the
 * session, so the browser never has to deal with mcp-session-id headers or CORS.
 *
 * Fail-closed like the rest of the stack: a missing/unreachable Pieces never
 * fabricates a memory answer — it throws PiecesError and the route surfaces it.
 *
 * No secrets here. The URL is env-configurable; nothing is logged beyond status.
 */
import { randomInt } from 'node:crypto';

export class PiecesError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const env = (key: string): string => (process.env[key] ?? '').trim();

export const PIECES_MCP_URL = env('PIECES_MCP_URL') || 'http://localhost:39300/model_context_protocol/2025-03-26/mcp';
export const PIECES_LTM_TOOL = env('PIECES_LTM_TOOL') || 'ask_pieces_ltm';

const CALL_TIMEOUT_MS = 120_000;
const PROTOCOL_VERSION = '2025-03-26';

interface McpResponse {
  json: any;
  sessionId: string | null;
  status: number;
  ok: boolean;
}

/**
 * Header-capturing POST. Variant of omniroute.postJson that keeps the
 * `mcp-session-id` response header and branches on content-type (plain JSON vs
 * SSE-framed JSON-RPC, which the MCP streamable transport can use).
 */
async function mcpPost(
  method: string,
  params: unknown,
  opts: { sessionId?: string | null; id?: number; timeoutMs?: number; notification?: boolean } = {},
): Promise<McpResponse> {
  const timeoutMs = opts.timeoutMs ?? CALL_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    };
    if (opts.sessionId) headers['mcp-session-id'] = opts.sessionId;
    const body: Record<string, unknown> = { jsonrpc: '2.0', method };
    if (opts.notification) {
      // notifications carry params but no id; no response is expected.
      if (params !== undefined) body.params = params;
    } else {
      body.id = opts.id ?? randomInt(1, 1_000_000);
      if (params !== undefined) body.params = params;
    }
    const res = await fetch(PIECES_MCP_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    const sessionId = res.headers.get('mcp-session-id');
    if (!res.ok) {
      throw new PiecesError('MCP_HTTP', `HTTP ${res.status}: ${text.slice(0, 400)}`);
    }
    const json = parseMcpBody(text, res.headers.get('content-type') ?? '', opts.id);
    return { json, sessionId, status: res.status, ok: true };
  } finally {
    clearTimeout(timer);
  }
}

function parseMcpBody(text: string, contentType: string, id?: number): any {
  if (contentType.includes('text/event-stream')) {
    // Collect `data:` payloads; return the JSON-RPC message matching our id
    // (or the last message if id is absent, e.g. notifications).
    const lines = text.split('\n');
    let last: any = null;
    for (const line of lines) {
      const m = line.match(/^data:\s*(.*)$/);
      if (!m) continue;
      try {
        const msg = JSON.parse(m[1]);
        if (id !== undefined && msg.id === id) return msg;
        last = msg;
      } catch {
        /* skip non-JSON keepalives */
      }
    }
    return last;
  }
  return JSON.parse(text);
}

// ── Session lifecycle ────────────────────────────────────────────────────────
let sessionId: string | null = null;
let sessionPromise: Promise<string> | null = null;

async function doInit(): Promise<string> {
  const r = await mcpPost('initialize', {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: 'mission-control', version: '5.0.0' },
  });
  if (!r.sessionId) {
    throw new PiecesError('NO_SESSION', 'Pieces MCP initialize returned no mcp-session-id header.');
  }
  // Best-effort initialized notification; ignore failure.
  try {
    await mcpPost('notifications/initialized', undefined, {
      sessionId: r.sessionId,
      notification: true,
      timeoutMs: 5_000,
    });
  } catch {
    /* notifications are fire-and-forget */
  }
  return r.sessionId;
}

export async function ensureSession(): Promise<string> {
  if (sessionId) return sessionId;
  if (sessionPromise) return sessionPromise;
  sessionPromise = doInit()
    .then((id) => {
      sessionId = id;
      return id;
    })
    .catch((err) => {
      // Allow the next caller to retry from scratch.
      sessionPromise = null;
      throw err;
    });
  return sessionPromise;
}

async function withSession<T>(fn: (sid: string) => Promise<T>): Promise<T> {
  let sid = await ensureSession();
  try {
    return await fn(sid);
  } catch (err) {
    // Re-init once on a session-level failure, then retry exactly once.
    if (err instanceof PiecesError && (err.code === 'MCP_HTTP' || err.code === 'NO_SESSION')) {
      sessionId = null;
      sessionPromise = null;
      sid = await ensureSession();
      return await fn(sid);
    }
    throw err;
  }
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: unknown;
}

export async function listTools(): Promise<McpTool[]> {
  return withSession(async (sid) => {
    const r = await mcpPost('tools/list', {}, { sessionId: sid });
    return (r.json?.result?.tools ?? []) as McpTool[];
  });
}

export async function callTool(name: string, args: unknown): Promise<unknown> {
  return withSession(async (sid) => {
    const r = await mcpPost('tools/call', { name, arguments: args ?? {} }, { sessionId: sid });
    const result = r.json?.result;
    if (r.json?.error) {
      throw new PiecesError('MCP_TOOL', `Pieces tool ${name} error: ${JSON.stringify(r.json.error).slice(0, 400)}`);
    }
    return result;
  });
}

/**
 * Lightweight liveness check for /api/services. Performs the initialize
 * roundtrip; does NOT cache the session (services ping should be independent).
 */
export async function pingPieces(timeoutMs = 9_000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(PIECES_MCP_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: { name: 'mc-ping', version: '1.0.0' },
        },
      }),
      signal: controller.signal,
    });
    if (!res.ok) return false;
    const text = await res.text();
    const json = parseMcpBody(text, res.headers.get('content-type') ?? '', 1);
    return Boolean(json?.result);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function piecesSessionId(): string | null {
  return sessionId;
}
