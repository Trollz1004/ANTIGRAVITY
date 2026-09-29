import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'node:http';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { checkMcpAuth, handleMcpRequest, MCP_TOOL_NAMES } from '../lib/mcp-server.mjs';

function readBody(req) {
  return new Promise((resolve) => { const chunks = []; req.on('data', (c) => chunks.push(c)); req.on('end', () => resolve(Buffer.concat(chunks))); });
}

const TOKEN = 'test-mcp-token-abc123';
const deps = {
  getHealth: async () => ({ overall: 'GREEN', ts: '2026-09-17T00:00:00Z' }),
  getTriggers: async () => [{ id: 't1', type: 'trigger' }],
  getProposals: async () => [{ id: 'p1', state: 'PROPOSED' }],
  getBridges: async () => ({ bridges: [{ id: 'claude', status: 'UP' }], at: '2026-09-17T00:00:00Z' }),
  listRunbooks: async () => [{ id: 'SABRETOOTH-NODE-RUNBOOK' }],
  readRunbook: async (name) => (name === 'SABRETOOTH-NODE-RUNBOOK' ? { ok: true, markdown: '# Runbook' } : { ok: false, error: 'not found' }),
  listStateRecords: async () => [{ id: 'NODE-STATE-2026-09-17' }],
  readStateRecord: async (name) => (name === 'NODE-STATE-2026-09-17' ? { ok: true, text: 'signed state text' } : { ok: false, error: 'not found' }),
  getBoardRoom: async () => ({
    lanes: [{ id: 'codex', status: 'UP', apiKey: 'sk-ant-fake1234' }],
    driftBoard: [{ repo: 'antigravity', branches: [{ name: 'main', class: 'LIVE' }], openPullRequests: 1 }],
    vote: { where: 'docs/VOTE.md' },
  }),
  getBackupHealth: async () => ({ overall: 'GREEN', ranAt: '2026-09-28T03:00:00Z', items: [{ id: 'state', status: 'GREEN', note: 'ok, mailed to ops@example.com' }] }),
  getHouseMap: async () => '# ultracode-house\n\nnodes, tools, MCP servers, dashboards, brains, memory, journals, lanes, rulings',
};

describe('checkMcpAuth', () => {
  it('503s honestly when no token is configured', () => {
    const r = checkMcpAuth({}, '');
    expect(r.status).toBe(503);
  });
  it('401s a missing or wrong bearer token', () => {
    expect(checkMcpAuth({}, TOKEN).status).toBe(401);
    expect(checkMcpAuth({ authorization: 'Bearer wrong' }, TOKEN).status).toBe(401);
  });
  it('accepts the exact configured token', () => {
    expect(checkMcpAuth({ authorization: `Bearer ${TOKEN}` }, TOKEN).ok).toBe(true);
  });
});

describe('handleMcpRequest — auth gate over real HTTP', () => {
  let server, port;
  beforeAll(async () => {
    server = createServer((req, res) => { void handleMcpRequest(req, res, { token: TOKEN, deps, readBody }); });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    port = server.address().port;
  });
  afterAll(() => new Promise((r) => server.close(r)));

  it('401s a request with no bearer token', async () => {
    const r = await fetch(`http://127.0.0.1:${port}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    expect(r.status).toBe(401);
  });

  it('503s when the server has no token configured', async () => {
    const s2 = createServer((req, res) => { void handleMcpRequest(req, res, { token: '', deps, readBody }); });
    await new Promise((r) => s2.listen(0, '127.0.0.1', r));
    const p2 = s2.address().port;
    const r = await fetch(`http://127.0.0.1:${p2}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    expect(r.status).toBe(503);
    await new Promise((res2) => s2.close(res2));
  });
});

describe('MCP handshake — a real SDK client against the real transport', () => {
  let server, port, client;
  beforeAll(async () => {
    server = createServer((req, res) => { void handleMcpRequest(req, res, { token: TOKEN, deps, readBody }); });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    port = server.address().port;
    const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`), {
      requestInit: { headers: { authorization: `Bearer ${TOKEN}` } },
    });
    client = new Client({ name: 'test-client', version: '1.0.0' });
    await client.connect(transport);
  });
  afterAll(async () => { try { await client.close(); } catch {} await new Promise((r) => server.close(r)); });

  it('lists exactly the nine read-only tools, including boardroom, backup_health and house_map', async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([...MCP_TOOL_NAMES].sort());
    expect(MCP_TOOL_NAMES).toHaveLength(9);
    for (const name of ['boardroom', 'backup_health', 'house_map']) expect(MCP_TOOL_NAMES).toContain(name);
  });

  it('node_health returns the live health JSON', async () => {
    const r = await client.callTool({ name: 'node_health', arguments: {} });
    const text = r.content[0].text;
    expect(JSON.parse(text).overall).toBe('GREEN');
  });

  it('bridges returns the bridge registry', async () => {
    const r = await client.callTool({ name: 'bridges', arguments: {} });
    expect(JSON.parse(r.content[0].text).bridges[0].id).toBe('claude');
  });

  it('runbook lists all runbooks with no name, and reads one by name', async () => {
    const list = await client.callTool({ name: 'runbook', arguments: {} });
    expect(JSON.parse(list.content[0].text)[0].id).toBe('SABRETOOTH-NODE-RUNBOOK');
    const one = await client.callTool({ name: 'runbook', arguments: { name: 'SABRETOOTH-NODE-RUNBOOK' } });
    expect(one.content[0].text).toBe('# Runbook');
  });

  it('state_record reads a signed record by name and is honest about a missing one', async () => {
    const one = await client.callTool({ name: 'state_record', arguments: { name: 'NODE-STATE-2026-09-17' } });
    expect(one.content[0].text).toBe('signed state text');
    const missing = await client.callTool({ name: 'state_record', arguments: { name: 'nope' } });
    expect(missing.isError).toBe(true);
  });

  it('triggers and proposals both answer', async () => {
    const triggers = await client.callTool({ name: 'triggers', arguments: {} });
    expect(JSON.parse(triggers.content[0].text)[0].id).toBe('t1');
    const proposals = await client.callTool({ name: 'proposals', arguments: {} });
    expect(JSON.parse(proposals.content[0].text)[0].id).toBe('p1');
  });

  it('boardroom returns the injected Board Room JSON with redaction applied', async () => {
    const r = await client.callTool({ name: 'boardroom', arguments: {} });
    expect(r.isError).toBeFalsy();
    const body = JSON.parse(r.content[0].text);
    expect(body.lanes[0].id).toBe('codex');
    expect(body.driftBoard[0].branches[0].class).toBe('LIVE');
    expect(body.vote.where).toBe('docs/VOTE.md');
    expect(body.lanes[0].apiKey).toBe('sk-a****');
    expect(r.content[0].text).not.toContain('boardroomsecret');
  });

  it('backup_health returns the injected backup JSON with redaction applied', async () => {
    const r = await client.callTool({ name: 'backup_health', arguments: {} });
    expect(r.isError).toBeFalsy();
    const body = JSON.parse(r.content[0].text);
    expect(body.overall).toBe('GREEN');
    expect(body.items[0].status).toBe('GREEN');
    expect(body.items[0].note).toContain('ops@****');
    expect(r.content[0].text).not.toContain('ops@example.com');
  });

  it('house_map returns the skill text as plain text, not JSON-wrapped', async () => {
    const r = await client.callTool({ name: 'house_map', arguments: {} });
    expect(r.isError).toBeFalsy();
    expect(r.content[0].text).toBe('# ultracode-house\n\nnodes, tools, MCP servers, dashboards, brains, memory, journals, lanes, rulings');
  });

  it('a string result is masked at this layer too: a bearer pasted into the map never leaves the process', async () => {
    const deps2 = { ...deps, getHouseMap: async () => 'attach: --header "Authorization: Bearer ghp_fakeTEST999PASTED"' };
    const s2 = createServer((req, res) => { void handleMcpRequest(req, res, { token: TOKEN, deps: deps2, readBody }); });
    await new Promise((r) => s2.listen(0, '127.0.0.1', r));
    const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${s2.address().port}/mcp`), { requestInit: { headers: { authorization: `Bearer ${TOKEN}` } } });
    const c2 = new Client({ name: 'test-client-2', version: '1.0.0' });
    await c2.connect(transport);
    try {
      const r = await c2.callTool({ name: 'house_map', arguments: {} });
      expect(r.isError).toBeFalsy();
      expect(r.content[0].text).not.toContain('ghp_fakeTEST999PASTED');
      expect(r.content[0].text).toContain('Authorization: Bearer ');
    } finally { try { await c2.close(); } catch {} await new Promise((r) => s2.close(r)); }
  });
});

describe('the three Board Room tools answer honestly when a dep is not wired', () => {
  let server, port, client;
  beforeAll(async () => {
    const bare = { getHealth: deps.getHealth };
    server = createServer((req, res) => { void handleMcpRequest(req, res, { token: TOKEN, deps: bare, readBody }); });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    port = server.address().port;
    const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`), {
      requestInit: { headers: { authorization: `Bearer ${TOKEN}` } },
    });
    client = new Client({ name: 'test-client', version: '1.0.0' });
    await client.connect(transport);
  });
  afterAll(async () => { try { await client.close(); } catch {} await new Promise((r) => server.close(r)); });

  it.each([
    ['boardroom', 'getBoardRoom'],
    ['backup_health', 'getBackupHealth'],
    ['house_map', 'getHouseMap'],
  ])('%s is an error naming the missing dep, never a throw', async (name, dep) => {
    const r = await client.callTool({ name, arguments: {} });
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain(dep);
    expect(r.content[0].text).toContain('not wired');
  });

  it('a dep that throws is an error result too', async () => {
    const s2 = createServer((req, res) => { void handleMcpRequest(req, res, { token: TOKEN, deps: { getBoardRoom: async () => { throw new Error('board read failed'); } }, readBody }); });
    await new Promise((r) => s2.listen(0, '127.0.0.1', r));
    const c2 = new Client({ name: 'test-client', version: '1.0.0' });
    await c2.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${s2.address().port}/mcp`), { requestInit: { headers: { authorization: `Bearer ${TOKEN}` } } }));
    const r = await c2.callTool({ name: 'boardroom', arguments: {} });
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain('board read failed');
    try { await c2.close(); } catch {}
    await new Promise((res2) => s2.close(res2));
  });
});
