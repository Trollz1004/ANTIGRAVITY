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

  it('lists exactly the six read-only tools', async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([...MCP_TOOL_NAMES].sort());
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
});
