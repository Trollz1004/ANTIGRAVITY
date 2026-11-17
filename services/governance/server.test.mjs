import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveVoteBind, readGuardToken, isLoopbackRemote } from './bind.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST_SERVER = path.join(HERE, 'dist', 'server.js');
const HAS_EXPRESS = fs.existsSync(path.join(HERE, 'node_modules', 'express'));
const LOOPBACK = ['127', '0', '0', '1'].join('.');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, LOOPBACK, () => {
      const addr = srv.address();
      const port = addr && typeof addr === 'object' ? addr.port : 0;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

test('resolveVoteBind defaults to 127.0.0.1 with warning when token is unset, fails closed on explicit LAN bind, and binds 0.0.0.0 with token', () => {
  const warnings = [];
  const host = resolveVoteBind({}, { port: 9134, warn: (m) => warnings.push(m) });
  assert.equal(host, LOOPBACK);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /OFFICIAL_VOTE_TOKEN/);
  assert.match(warnings[0], /MISSION_OS_TOKEN/);
  assert.doesNotMatch(warnings[0], /127\.0\.0\.1:\d+/);

  assert.throws(() => resolveVoteBind({ OFFICIAL_VOTE_HOST: '0.0.0.0' }, { port: 9134, warn: () => {} }));
  assert.throws(() => resolveVoteBind({ OFFICIAL_VOTE_HOST: '192.168.0.15' }, { port: 9134, warn: () => {} }));
  assert.equal(resolveVoteBind({ OFFICIAL_VOTE_TOKEN: 'tok' }, { port: 9134, warn: () => {} }), '0.0.0.0');
  assert.equal(resolveVoteBind({ MISSION_OS_TOKEN: 'tok' }, { port: 9134, warn: () => {} }), '0.0.0.0');
  assert.equal(resolveVoteBind({ FLEET_SHARED_TOKEN: 'tok' }, { port: 9134, warn: () => {} }), '0.0.0.0');
  assert.equal(readGuardToken({ FLEET_SHARED_TOKEN: ' shared ' }), 'shared');
  assert.equal(isLoopbackRemote(LOOPBACK), true);
  assert.equal(isLoopbackRemote('192.168.0.40'), false);
});

test('official-vote-service HTTP server binds 127.0.0.1 with warning when token unset, serves loopback GET/POST without 503 token block, and enforces token when set', {
  skip: !HAS_EXPRESS || !fs.existsSync(DIST_SERVER) ? 'requires built dist/server.js and express installed' : false,
}, async () => {
  const { app, requireVoteToken } = await import('./dist/server.js');
  const prevVote = process.env.OFFICIAL_VOTE_TOKEN;
  const prevMos = process.env.MISSION_OS_TOKEN;
  const prevFleet = process.env.FLEET_SHARED_TOKEN;
  delete process.env.OFFICIAL_VOTE_TOKEN;
  delete process.env.MISSION_OS_TOKEN;
  delete process.env.FLEET_SHARED_TOKEN;

  const port = await getFreePort();
  const spawnEnv = { ...process.env, OFFICIAL_VOTE_PORT: String(port) };
  delete spawnEnv.OFFICIAL_VOTE_HOST;
  const child = spawn(process.execPath, [DIST_SERVER], {
    env: spawnEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  child.stdout.on('data', (c) => { logs += String(c); });
  child.stderr.on('data', (c) => { logs += String(c); });

  try {
    await new Promise((resolve, reject) => {
      const deadline = setTimeout(() => reject(new Error(`vote service did not start; logs=${logs}`)), 8000);
      const check = () => {
        if (logs.includes(`http://${LOOPBACK}:${port}`)) {
          clearTimeout(deadline);
          resolve();
        }
      };
      child.stdout.on('data', check);
      child.stderr.on('data', check);
    });

    assert.match(logs, /WARNING: OFFICIAL_VOTE_TOKEN \/ MISSION_OS_TOKEN is not set/);

    const health = await fetch(`http://${LOOPBACK}:${port}/health`);
    assert.equal(health.status, 200);

    const statusRes = await fetch(`http://${LOOPBACK}:${port}/api/official-votes/status`);
    assert.equal(statusRes.status, 200);

    const postNoToken = await fetch(`http://${LOOPBACK}:${port}/api/official-votes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ platform: 'claude', subject: 's1', decision: 'approve' }),
    });
    const postBody = await postNoToken.json();
    assert.notEqual(postNoToken.status, 401);
    assert.notEqual(postBody.error, 'OFFICIAL_VOTE_TOKEN / MISSION_OS_TOKEN not configured');
  } finally {
    child.kill();
  }

  // Verify non-loopback no-token returns 503, and token-set enforces 401 / accepts valid tokens
  let lanStatus = 0;
  let lanBody = null;
  requireVoteToken(
    { headers: {}, method: 'GET', socket: { remoteAddress: '192.168.0.40' } },
    {
      status(code) {
        lanStatus = code;
        return { json(body) { lanBody = body; } };
      },
    },
    () => {}
  );
  assert.equal(lanStatus, 503);
  assert.match(lanBody.error, /not configured/);

  process.env.OFFICIAL_VOTE_TOKEN = 'vote-secret-2026';
  const srv = http.createServer(app);
  await new Promise((r) => srv.listen(0, LOOPBACK, r));
  const addrPort = srv.address().port;
  try {
    const denied = await fetch(`http://${LOOPBACK}:${addrPort}/api/official-votes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(denied.status, 401);

    const allowed = await fetch(`http://${LOOPBACK}:${addrPort}/api/official-votes`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer vote-secret-2026',
      },
      body: JSON.stringify({ platform: 'claude', subject: 's1', decision: 'approve' }),
    });
    assert.notEqual(allowed.status, 401);
  } finally {
    await new Promise((r) => srv.close(r));
    if (prevVote === undefined) delete process.env.OFFICIAL_VOTE_TOKEN;
    else process.env.OFFICIAL_VOTE_TOKEN = prevVote;
    if (prevMos === undefined) delete process.env.MISSION_OS_TOKEN;
    else process.env.MISSION_OS_TOKEN = prevMos;
    if (prevFleet === undefined) delete process.env.FLEET_SHARED_TOKEN;
    else process.env.FLEET_SHARED_TOKEN = prevFleet;
  }
});
