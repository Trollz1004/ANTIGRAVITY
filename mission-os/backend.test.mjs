import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { safeResolveRepoPath, readRepoFile, MAX_REPO_FILE_BYTES } from './live-tabs-backend.mjs';
import { HOST, PORT, handleMissionRequest, isLoopbackAddress, resolveMissionOsBind } from './server.mjs';

const source = fs.readFileSync(new URL('./server.mjs', import.meta.url), 'utf8');

function invokeMissionHandler({ method = 'GET', url = '/', remoteAddress = '127.0.0.1', headers = {}, body = null }) {
  const chunks = body ? [Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))] : [];
  const req = Object.assign(Readable.from(chunks), {
    method,
    url,
    headers: { host: '192.168.0.15:3130', ...headers },
    socket: { remoteAddress },
  });
  let statusCode = 200;
  let responseHeaders = {};
  let responseBody = '';
  const res = {
    headersSent: false,
    writeHead(code, hdrs = {}) {
      statusCode = code;
      responseHeaders = hdrs;
      this.headersSent = true;
    },
    end(payload = '') {
      responseBody += String(payload || '');
    },
  };
  return handleMissionRequest(req, res).then(() => {
    let parsed = null;
    try {
      parsed = responseBody ? JSON.parse(responseBody) : null;
    } catch {
      parsed = responseBody;
    }
    return {
      statusCode,
      headers: responseHeaders,
      body: parsed,
    };
  });
}

test('startup does not fabricate health or versions and contains zero hardcoded user paths or retired nodes', () => {
  assert.doesNotMatch(source, /listening: true|version: 'agy 1\.4\.0'|version: 'Claude Code 2\.1\.278'/);
  assert.doesNotMatch(source, /Users[\\/]+(?:joshl|joshi|NSFW_BOTS)/i);
  assert.doesNotMatch(source, /sabretooth/i);
});

test('dispatch never bypasses permissions or passes user input into cmd', () => {
  assert.doesNotMatch(source, /--dangerously-skip-permissions|--always-approve/);
  assert.doesNotMatch(source, /spawn\(isCmd \? 'cmd.exe'/);
});

test('resolveMissionOsBind binds 127.0.0.1 with warning when token is unset, fails closed on explicit LAN bind without token, and binds 0.0.0.0 with token', () => {
  const warnings = [];
  const noTokenHost = resolveMissionOsBind({ env: {}, port: 3130, warn: (msg) => warnings.push(msg) });
  assert.equal(noTokenHost, '127.0.0.1');
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /MISSION_OS_TOKEN/);
  assert.doesNotMatch(warnings[0], /127\.0\.0\.1:\d+/);

  assert.throws(() => resolveMissionOsBind({ env: { MISSION_OS_HOST: '0.0.0.0' }, port: 3130, warn: () => {} }));
  assert.throws(() => resolveMissionOsBind({ env: { MISSION_OS_HOST: '192.168.0.15' }, port: 3130, warn: () => {} }));
  assert.equal(resolveMissionOsBind({ env: { MISSION_OS_TOKEN: 'tok' }, port: 3130, warn: () => {} }), '0.0.0.0');
  assert.equal(resolveMissionOsBind({ env: { FLEET_SHARED_TOKEN: 'tok' }, port: 3130, warn: () => {} }), '0.0.0.0');

  assert.ok(['127.0.0.1', '0.0.0.0'].includes(HOST));
  assert.equal(PORT, 3130);
  assert.match(source, /guardRequest\(req/);
  assert.equal(isLoopbackAddress('127.0.0.1'), true);
  assert.equal(isLoopbackAddress('::1'), true);
  assert.equal(isLoopbackAddress('192.168.0.40'), false);
});

test('loopback requests to mission-os guarded routes succeed cleanly without 503 when MISSION_OS_TOKEN is unset', async () => {
  const prevToken = process.env.MISSION_OS_TOKEN;
  const prevFleet = process.env.FLEET_SHARED_TOKEN;
  delete process.env.MISSION_OS_TOKEN;
  delete process.env.FLEET_SHARED_TOKEN;
  try {
    const res = await invokeMissionHandler({
      method: 'GET',
      url: '/api/mos-state.json',
      remoteAddress: '127.0.0.1',
      headers: { host: '127.0.0.1:3130' },
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body?.identity, 'mission-agent-os');
  } finally {
    if (prevToken === undefined) delete process.env.MISSION_OS_TOKEN;
    else process.env.MISSION_OS_TOKEN = prevToken;
    if (prevFleet === undefined) delete process.env.FLEET_SHARED_TOKEN;
    else process.env.FLEET_SHARED_TOKEN = prevFleet;
  }
});

test('Finding 5: safeResolveRepoPath and readRepoFile refuse sibling traversal and sensitive files while allowing normal files', () => {
  const baseTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mos-sec5-'));
  const repoDir = path.join(baseTmp, 'repo');
  const siblingDir = path.join(baseTmp, 'repo-sibling');
  fs.mkdirSync(repoDir, { recursive: true });
  fs.mkdirSync(siblingDir, { recursive: true });

  try {
    fs.writeFileSync(path.join(siblingDir, 'escape.txt'), 'sibling secret', 'utf8');
    fs.writeFileSync(path.join(repoDir, '.env'), 'DUMMY_KEY=dummy', 'utf8');
    fs.writeFileSync(path.join(repoDir, '.env.local'), 'DUMMY_KEY=dummy', 'utf8');
    fs.writeFileSync(path.join(repoDir, 'app.env'), 'DUMMY_KEY=dummy', 'utf8');
    fs.writeFileSync(path.join(repoDir, 'env-prod.json'), '{}', 'utf8');
    fs.writeFileSync(path.join(repoDir, 'server.pem'), 'pem', 'utf8');
    fs.writeFileSync(path.join(repoDir, 'private.key'), 'key', 'utf8');
    fs.writeFileSync(path.join(repoDir, 'id_ed25519'), 'ssh', 'utf8');
    fs.writeFileSync(path.join(repoDir, 'putty.ppk'), 'ppk', 'utf8');
    fs.writeFileSync(path.join(repoDir, 'service-credentials.json'), '{}', 'utf8');
    fs.writeFileSync(path.join(repoDir, 'my-secret.txt'), 'sec', 'utf8');
    fs.writeFileSync(path.join(repoDir, 'auth-token.txt'), 'tok', 'utf8');
    fs.mkdirSync(path.join(repoDir, '.git'), { recursive: true });
    fs.writeFileSync(path.join(repoDir, '.git', 'config'), 'gitconfig', 'utf8');
    fs.mkdirSync(path.join(repoDir, 'node_modules', 'pkg'), { recursive: true });
    fs.writeFileSync(path.join(repoDir, 'node_modules', 'pkg', 'index.js'), 'mod', 'utf8');
    fs.mkdirSync(path.join(repoDir, 'vault'), { recursive: true });
    fs.writeFileSync(path.join(repoDir, 'vault', 'note.md'), 'vault note', 'utf8');
    fs.writeFileSync(path.join(repoDir, 'README.md'), 'Normal documentation content', 'utf8');

    assert.equal(safeResolveRepoPath('../repo-sibling/escape.txt', repoDir), null);
    const siblingRes = readRepoFile('../repo-sibling/escape.txt', MAX_REPO_FILE_BYTES, repoDir);
    assert.equal(siblingRes.ok, false);
    assert.equal(siblingRes.status, 403);

    for (const deniedRel of [
      '.env',
      '.env.local',
      'app.env',
      'env-prod.json',
      'server.pem',
      'private.key',
      'id_ed25519',
      'putty.ppk',
      'service-credentials.json',
      'my-secret.txt',
      'auth-token.txt',
      '.git/config',
      'node_modules/pkg/index.js',
      'vault/note.md',
    ]) {
      const deniedRes = readRepoFile(deniedRel, MAX_REPO_FILE_BYTES, repoDir);
      assert.equal(deniedRes.ok, false, `Expected ${deniedRel} to be refused`);
      assert.equal(deniedRes.status, 403, `Expected 403 for ${deniedRel}`);
    }

    assert.equal(MAX_REPO_FILE_BYTES, 512 * 1024);
    const normalRes = readRepoFile('README.md', MAX_REPO_FILE_BYTES, repoDir);
    assert.equal(normalRes.ok, true);
    assert.equal(normalRes.status, 200);
    assert.equal(normalRes.content, 'Normal documentation content');
  } finally {
    fs.rmSync(baseTmp, { recursive: true, force: true });
  }
});

test('LAN token guard refuses unauthenticated non-loopback requests, permits valid MISSION_OS_TOKEN, and refuses cross-origin POST', async () => {
  const prevToken = process.env.MISSION_OS_TOKEN;
  process.env.MISSION_OS_TOKEN = 'test-mission-os-lan-token-999';
  try {
    for (const route of ['/api/wheel', '/api/marketing/plans', '/api/live/agents', '/api/mos-state.json', '/v1/models']) {
      const unauthed = await invokeMissionHandler({
        method: 'GET',
        url: route,
        remoteAddress: '192.168.0.40',
      });
      assert.equal(unauthed.statusCode, 401, `Expected unauthenticated LAN ${route} to return 401`);
    }

    const authedHeader = await invokeMissionHandler({
      method: 'GET',
      url: '/api/mos-state.json',
      remoteAddress: '192.168.0.40',
      headers: {
        host: '192.168.0.15:3130',
        'x-mission-os-token': 'test-mission-os-lan-token-999',
      },
    });
    assert.equal(authedHeader.statusCode, 200);
    assert.equal(authedHeader.body?.identity, 'mission-agent-os');

    const authedBearer = await invokeMissionHandler({
      method: 'GET',
      url: '/api/mos-state.json',
      remoteAddress: '192.168.0.40',
      headers: {
        host: '192.168.0.15:3130',
        authorization: 'Bearer test-mission-os-lan-token-999',
      },
    });
    assert.equal(authedBearer.statusCode, 200);

    process.env.MISSION_OS_TOKEN = '';
    const unconfigured = await invokeMissionHandler({
      method: 'GET',
      url: '/api/mos-state.json',
      remoteAddress: '192.168.0.40',
    });
    assert.equal(unconfigured.statusCode, 503);
  } finally {
    if (prevToken === undefined) delete process.env.MISSION_OS_TOKEN;
    else process.env.MISSION_OS_TOKEN = prevToken;
  }

  const crossOriginVerify = await invokeMissionHandler({
    method: 'POST',
    url: '/api/bridge/verify',
    remoteAddress: '127.0.0.1',
    headers: {
      host: '192.168.0.15:3130',
      origin: 'https://evil.example',
      'content-type': 'application/json',
    },
    body: { node: 't5500', lane: 'hermes' },
  });
  assert.equal(crossOriginVerify.statusCode, 403);
});
