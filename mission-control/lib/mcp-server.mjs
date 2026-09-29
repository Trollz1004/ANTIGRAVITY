/**
 * JARVIS MCP endpoint (Phase F, unit 4) — a minimal, read-only Model Context
 * Protocol server over Streamable HTTP at POST /mcp on the same :9150 port,
 * so the Alienware node's own Claude session can read this node's real
 * state over the LAN. No write tools in this phase. Bearer-token gated on
 * JARVIS_MCP_TOKEN: 503 when unset (never says what to set it to), 401 when
 * wrong/missing.
 *
 * Every tool's output is redacted (lib/redact.mjs) before it leaves this
 * process — belt-and-suspenders with each data source's own field
 * selection. Every data read is injected via `deps` so this module never
 * touches disk/network itself and is fully testable with a real MCP client
 * over an in-memory HTTP server.
 */
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { redact, redactString } from './redact.mjs';

export const MCP_TOOL_NAMES = ['node_health', 'triggers', 'proposals', 'bridges', 'runbook', 'state_record', 'boardroom', 'backup_health', 'house_map'];

function textResult(value) {
  // A string result is masked too, so the promise above holds at this layer and
  // not only where server.mjs wires a reader.
  const text = typeof value === 'string' ? redactString(value) : JSON.stringify(redact(value), null, 2);
  return { content: [{ type: 'text', text }] };
}
function errorResult(message) {
  return { content: [{ type: 'text', text: String(message || 'error') }], isError: true };
}
/** A tool whose dep was never injected answers honestly instead of throwing. */
function notWired(dep) {
  return errorResult(`${dep} is not wired on this node`);
}

/** Build the read-only MCP server bound to `deps` (every live read injected, see server.mjs's wiring). */
export function createMcpServer(deps = {}) {
  const server = new McpServer({ name: 'jarvis-mcp', version: '1.0.0' }, { capabilities: { tools: {} } });

  server.registerTool('node_health', { description: 'The live health JSON for this node (the 30-minute heartbeat probe\'s own file).' }, async () => {
    try { return textResult(await deps.getHealth()); } catch (e) { return errorResult(String(e?.message || e)); }
  });

  server.registerTool('triggers', { description: 'ops/heartbeat/TRIGGERS.jsonl, parsed (read-only).' }, async () => {
    try { return textResult(await deps.getTriggers()); } catch (e) { return errorResult(String(e?.message || e)); }
  });

  server.registerTool('proposals', { description: 'The approval inbox\'s proposal list (read-only; no approve/reject/snooze here).' }, async () => {
    try { return textResult(await deps.getProposals()); } catch (e) { return errorResult(String(e?.message || e)); }
  });

  server.registerTool('bridges', { description: 'Bridge registry statuses (read-only; no run tool here).' }, async () => {
    try { return textResult(await deps.getBridges()); } catch (e) { return errorResult(String(e?.message || e)); }
  });

  server.registerTool('runbook', {
    description: 'List ops/runbook/*.md, or read one by name.',
    inputSchema: { name: z.string().optional().describe('a runbook filename to read; omit to list every runbook') },
  }, async ({ name } = {}) => {
    try {
      if (!name) return textResult(await deps.listRunbooks());
      const r = await deps.readRunbook(name);
      return r && r.ok ? textResult(r.markdown ?? r.text) : errorResult((r && r.error) || 'not found');
    } catch (e) { return errorResult(String(e?.message || e)); }
  });

  server.registerTool('state_record', {
    description: 'List docs/NODE-STATE-*.md signed state records, or read one by name (with its anchor).',
    inputSchema: { name: z.string().optional().describe('a state-record filename to read; omit to list every record') },
  }, async ({ name } = {}) => {
    try {
      if (!name) return textResult(await deps.listStateRecords());
      const r = await deps.readStateRecord(name);
      return r && r.ok ? textResult(r.text) : errorResult((r && r.error) || 'not found');
    } catch (e) { return errorResult(String(e?.message || e)); }
  });

  server.registerTool('boardroom', { description: 'The Board Room, the think tank of the mission (the House; the founder ClawX board is the Supreme Court): the five collab tracks (ON RECORD or NOT CONFIGURED), every AI platform lane with how it connects and its live status, the TRUST.md attestation of each seat (FILED or NOT FILED), the drift board (branches and open pull requests per repository, classified DEAD, STALE, LIVE or WORKING with per-lane drift badges), the affiliate links, and the founderBoard note naming the ClawX board as the only place a vote happens. Read-only.' }, async () => {
    try {
      if (typeof deps.getBoardRoom !== 'function') return notWired('getBoardRoom');
      return textResult(await deps.getBoardRoom());
    } catch (e) { return errorResult(String(e?.message || e)); }
  });

  server.registerTool('backup_health', { description: 'The last nightly backup run on this node from ops/heartbeat/backup-node.json: NOT CONFIGURED before the first run, RED on a corrupt file, STALE after 26 hours, else GREEN, YELLOW or RED with the per-item detail.' }, async () => {
    try {
      if (typeof deps.getBackupHealth !== 'function') return notWired('getBackupHealth');
      return textResult(await deps.getBackupHealth());
    } catch (e) { return errorResult(String(e?.message || e)); }
  });

  server.registerTool('house_map', { description: 'The ultracode-house skill text: the one map of nodes, tools, MCP servers, dashboards, brains, memory, journals, lanes and rulings. Read-only.' }, async () => {
    try {
      if (typeof deps.getHouseMap !== 'function') return notWired('getHouseMap');
      return textResult(await deps.getHouseMap());
    } catch (e) { return errorResult(String(e?.message || e)); }
  });

  return server;
}

/** 503 when unset, 401 when wrong/missing — never says what the token should be. */
export function checkMcpAuth(headers, token) {
  if (!token) return { ok: false, status: 503, error: 'JARVIS_MCP_TOKEN not configured — set it in the repo .env (one line; the value is never shown here)' };
  const presented = String((headers && headers.authorization) || '').replace(/^Bearer\s+/i, '').trim();
  if (!presented || presented !== token) return { ok: false, status: 401, error: 'unauthorized: missing or incorrect bearer token' };
  return { ok: true };
}

/**
 * POST /mcp handler. `req`/`res` are plain node:http IncomingMessage/
 * ServerResponse (this transport is a thin Node-http wrapper — no Express
 * required). One transport per request, stateless (no session id), so nothing
 * here needs to survive a server restart.
 */
export async function handleMcpRequest(req, res, { token, deps, readBody } = {}) {
  const auth = checkMcpAuth(req.headers, token);
  if (!auth.ok) {
    res.writeHead(auth.status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify({ error: auth.error }));
    return;
  }
  let parsedBody;
  try {
    const raw = readBody ? await readBody(req) : '';
    const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw || '');
    parsedBody = text ? JSON.parse(text) : undefined;
  } catch {
    res.writeHead(400, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify({ error: 'invalid JSON body' }));
    return;
  }
  const server = createMcpServer(deps);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => { try { transport.close(); } catch {} try { server.close(); } catch {} });
  await server.connect(transport);
  await transport.handleRequest(req, res, parsedBody);
}
