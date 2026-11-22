import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { resolveMissionMcpBind, verifyTokenHeader, readMcpGuardToken } from '../src/http-bind.mjs';

const LOOPBACK = ['127', '0', '0', '1'].join('.');

test('resolveMissionMcpBind binds 127.0.0.1 with warning when token is unset, fails closed on explicit LAN bind, and binds 0.0.0.0 with token', () => {
  const warnings = [];
  const host = resolveMissionMcpBind({}, { port: 3901, warn: (m) => warnings.push(m) });
  assert.equal(host, LOOPBACK);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /MISSION_MCP_TOKEN/);
  assert.match(warnings[0], /MISSION_OS_TOKEN/);
  assert.doesNotMatch(warnings[0], /127\.0\.0\.1:\d+/);

  assert.throws(() => resolveMissionMcpBind({ MISSION_MCP_HOST: '0.0.0.0' }, { port: 3901, warn: () => {} }));
  assert.throws(() => resolveMissionMcpBind({ MISSION_MCP_HOST: '192.168.0.15' }, { port: 3901, warn: () => {} }));
  assert.equal(resolveMissionMcpBind({ MISSION_MCP_TOKEN: 'tok' }, { port: 3901, warn: () => {} }), '0.0.0.0');
  assert.equal(resolveMissionMcpBind({ MISSION_OS_TOKEN: 'tok' }, { port: 3901, warn: () => {} }), '0.0.0.0');
  assert.equal(resolveMissionMcpBind({ FLEET_SHARED_TOKEN: 'tok' }, { port: 3901, warn: () => {} }), '0.0.0.0');
  assert.equal(readMcpGuardToken({ FLEET_SHARED_TOKEN: ' shared-mcp ' }), 'shared-mcp');
});

test('mission-mcp HTTP mode binds 127.0.0.1 cleanly when no token is configured and enforces token when configured', async () => {
  let currentEnv = {};
  const warnings = [];
  const bindHost = resolveMissionMcpBind(currentEnv, { port: 3901, warn: (m) => warnings.push(m) });
  assert.equal(bindHost, LOOPBACK);
  assert.equal(warnings.length, 1);

  const server = http.createServer((req, res) => {
    const pathname = (req.url || '/').split('?')[0];
    if (req.method === 'GET' && pathname === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, name: 'mission-mcp' }));
      return;
    }
    if (req.method === 'POST' && pathname === '/mcp') {
      const check = verifyTokenHeader(req.headers, { env: currentEnv, remoteAddress: req.socket?.remoteAddress });
      if (!check.ok) {
        res.writeHead(check.status, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: check.error }));
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, result: 'loopback-mcp-ok' }));
      return;
    }
    res.writeHead(404).end();
  });

  await new Promise((r) => server.listen(0, bindHost, r));
  const addr = server.address();
  assert.equal(addr.address, LOOPBACK);
  const port = addr.port;

  try {
    const healthRes = await fetch(`http://${LOOPBACK}:${port}/health`);
    assert.equal(healthRes.status, 200);

    const mcpNoToken = await fetch(`http://${LOOPBACK}:${port}/mcp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    });
    assert.equal(mcpNoToken.status, 200, 'loopback POST /mcp must not return 503 when no token is configured');

    const nonLoopbackCheck = verifyTokenHeader({}, { env: currentEnv, remoteAddress: '192.168.0.40' });
    assert.equal(nonLoopbackCheck.ok, false);
    assert.equal(nonLoopbackCheck.status, 503);

    currentEnv = { MISSION_MCP_TOKEN: 'mcp-secret-2026' };
    assert.equal(resolveMissionMcpBind(currentEnv, { port: 3901, warn: () => {} }), '0.0.0.0');

    const unauthed = await fetch(`http://${LOOPBACK}:${port}/mcp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(unauthed.status, 401);

    const authed = await fetch(`http://${LOOPBACK}:${port}/mcp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-mission-os-token': 'mcp-secret-2026' },
      body: JSON.stringify({}),
    });
    assert.equal(authed.status, 200);
  } finally {
    await new Promise((r) => server.close(r));
  }
});
