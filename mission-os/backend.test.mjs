import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { safeResolveRepoPath, readRepoFile, MAX_REPO_FILE_BYTES } from './live-tabs-backend.mjs';
import { handleMissionRequest, isLoopbackAddress } from './server.mjs';

const source = fs.readFileSync(new URL('./server.mjs', import.meta.url), 'utf8');

function invokeMissionHandler({ method = 'GET', url = '/', remoteAddress = '127.0.0.1', headers = {}, body = null }) {
  const chunks = body ? [Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))] : [];
  const req = Object.assign(Readable.from(chunks), {
    method,
    url,
    headers: { host: '127.0.0.1:3130', ...headers },
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
  return handleMissionRequest(req, res).then(() => ({
    statusCode,
    headers: responseHeaders,
    body: responseBody ? JSON.parse(responseBody) : null,
  }));
}

test('startup does not fabricate health or versions', () => {
  assert.doesNotMatch(source, /listening: true|version: 'agy 1\.4\.0'|version: 'Claude Code 2\.1\.278'/);
});

test('dispatch never bypasses permissions or passes user input into cmd', () => {
  assert.doesNotMatch(source, /--dangerously-skip-permissions|--always-approve/);
  assert.doesNotMatch(source, /spawn\(isCmd \? 'cmd.exe'/);
});

test('server is loopback-only and guards request origin', () => {
  assert.doesNotMatch(source, /\.listen\(PORT, '0\.0\.0\.0'/);
  assert.match(source, /guardRequest\(req/);
  assert.equal(isLoopbackAddress('127.0.0.1'), true);
  assert.equal(isLoopbackAddress('::1'), true);
  assert.equal(isLoopbackAddress('192.168.0.50'), false);
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

    // Sibling traversal refused
    assert.equal(safeResolveRepoPath('../repo-sibling/escape.txt', repoDir), null);
    const siblingRes = readRepoFile('../repo-sibling/escape.txt', MAX_REPO_FILE_BYTES, repoDir);
    assert.equal(siblingRes.ok, false);
    assert.equal(siblingRes.status, 403);

    // Env, key, credential, and restricted folder files refused
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

    // Normal file allowed and cap stays 512 KB
    assert.equal(MAX_REPO_FILE_BYTES, 512 * 1024);
    const normalRes = readRepoFile('README.md', MAX_REPO_FILE_BYTES, repoDir);
    assert.equal(normalRes.ok, true);
    assert.equal(normalRes.status, 200);
    assert.equal(normalRes.content, 'Normal documentation content');
  } finally {
    fs.rmSync(baseTmp, { recursive: true, force: true });
  }
});

test('Finding 8: non-loopback request to /api/wheel is refused and cross-origin POST to /api/bridge/verify is refused', async () => {
  for (const preGuardRoute of ['/api/wheel', '/api/marketing/plans', '/api/live/agents', '/api/mos-state.json']) {
    const lanRes = await invokeMissionHandler({
      method: 'GET',
      url: preGuardRoute,
      remoteAddress: '192.168.0.99',
    });
    assert.equal(lanRes.statusCode, 403, `Expected non-loopback ${preGuardRoute} to be refused`);
  }

  const crossOriginVerify = await invokeMissionHandler({
    method: 'POST',
    url: '/api/bridge/verify',
    remoteAddress: '127.0.0.1',
    headers: {
      host: '127.0.0.1:3130',
      origin: 'https://evil.example',
      'content-type': 'application/json',
    },
    body: { node: 't5500', lane: 'hermes' },
  });
  assert.equal(crossOriginVerify.statusCode, 403);
});
