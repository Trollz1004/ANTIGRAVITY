import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveDomainsServerBind } from '../domains-server/server.mjs';
import { resolveFrontendBind } from '../../domains/youandinotai.com/frontend/bind.mjs';
import { resolveMissionOsBind, handleMissionRequest } from '../../mission-os/server.mjs';
import { Readable } from 'node:stream';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');
const KEEPALIVE_PATH = path.join(HERE, 'keepalive.ps1');
const HERMES_SUPPORT_PATH = path.join(HERE, 'hermes-support.ps1');
const TAB_DATEAPP_CMD = path.join(REPO_ROOT, 'scripts', 'fables-house', 'tab-dateapp.cmd');
const TAB_DATEAPP_API_PS1 = path.join(REPO_ROOT, 'scripts', 'fables-house', 'tab-dateapp-api.ps1');
const START_MISSION_CONTROL_PS1 = path.join(REPO_ROOT, 'scripts', 'start-mission-control.ps1');

const keepaliveSrc = fs.readFileSync(KEEPALIVE_PATH, 'utf8').replace(/^\uFEFF/, '');
const hermesSupportSrc = fs.readFileSync(HERMES_SUPPORT_PATH, 'utf8').replace(/^\uFEFF/, '');

function invokeMissionLoopback(urlPath) {
  const req = Object.assign(Readable.from([]), {
    method: 'GET',
    url: urlPath,
    headers: { host: ['127.0.0.1', '3130'].join(':') },
    socket: { remoteAddress: '127.0.0.1', localPort: 3130 },
  });
  let statusCode = 200;
  let body = '';
  const res = {
    headersSent: false,
    writeHead(code) {
      statusCode = code;
      this.headersSent = true;
    },
    end(payload = '') {
      body += String(payload || '');
    },
  };
  return handleMissionRequest(req, res).then(() => ({ statusCode, body }));
}

test('keepalive.ps1 stages: ollama, postgres, and redis variables and arguments bind loopback with no FLEET_SHARED_TOKEN', () => {
  // ollama stage sets OLLAMA_HOST to loopback port 11434 when FLEET_SHARED_TOKEN is unset
  assert.match(
    keepaliveSrc,
    /\$ollamaBind\s*=\s*if\s*\(\$fleetToken\)\s*\{\s*'0\.0\.0\.0'\s*\}\s*else\s*\{\s*\$loopbackHost\s*\}/,
  );
  assert.match(keepaliveSrc, /\$env:OLLAMA_HOST\s*=\s*\(\$ollamaBind\s*\+\s*':11434'\)/);

  // postgres stage probes 127.0.0.1:5432 and starts ANTIGRAVITY Postgres or pg_ctl.exe hidden
  assert.match(keepaliveSrc, /pg_isready\.exe[\s\S]*?-h\s+127\.0\.0\.1\s+-p\s+5432/);
  assert.match(
    keepaliveSrc,
    /Start-Process\s+-FilePath\s+\(Join-Path\s+\$PgBin\s+'pg_ctl\.exe'\)[\s\S]*?-WindowStyle\s+Hidden/,
  );

  // redis stage binds 127.0.0.1:6379 hidden
  assert.match(
    keepaliveSrc,
    /ArgumentList\s+@\('--bind',\s*'127\.0\.0\.1',\s*'--port',\s*'6379'[\s\S]*?-WindowStyle\s+Hidden/,
  );
});

test('keepalive.ps1 domains stage: DOMAINS_SERVER_HOST values (both main and old 4d226122 watchdog) are accepted by resolveDomainsServerBind with no token and probe requires bookingNotices in /health', () => {
  assert.match(
    keepaliveSrc,
    /Get-FleetServiceUrl\s+-ServiceId\s+'domains-server'\s+-PathSuffix\s+'\/health'\)\s+6\s+'bookingNotices'/,
  );
  assert.match(
    keepaliveSrc,
    /\$env:DOMAINS_SERVER_HOST\s*=\s*if\s*\(\$fleetToken\)\s*\{\s*Get-FleetBindHost\s+-ServiceId\s+'domains-server'\s*\}\s*else\s*\{\s*\$loopbackHost\s*\}/,
  );
  assert.match(keepaliveSrc, /\$env:DOMAINS_SERVER_PORT\s*=\s*\[string\]\$DomainsSvc\.port/);

  // Main keepalive.ps1 with no FLEET_SHARED_TOKEN sets DOMAINS_SERVER_HOST=127.0.0.1
  assert.deepEqual(
    resolveDomainsServerBind(
      { DOMAINS_SERVER_HOST: '127.0.0.1', DOMAINS_SERVER_PORT: '9160' },
      { port: 9160, warn: () => {} },
    ),
    ['127.0.0.1'],
  );

  // Old running keepalive.ps1 (4d226122) sets DOMAINS_SERVER_HOST=127.0.0.1,192.168.0.15 with no token
  assert.deepEqual(
    resolveDomainsServerBind({ DOMAINS_SERVER_HOST: '127.0.0.1,192.168.0.15' }, { port: 9160, warn: () => {} }),
    ['127.0.0.1', '192.168.0.15'],
  );

  // Fleet bind 0.0.0.0 with no token also never throws
  assert.deepEqual(resolveDomainsServerBind({ DOMAINS_SERVER_HOST: '0.0.0.0' }, { port: 9160, warn: () => {} }), [
    '0.0.0.0',
  ]);
});

test('keepalive.ps1 frontend stage: tab-dateapp.cmd variables are accepted by resolveFrontendBind with no token', () => {
  assert.match(keepaliveSrc, /scripts\\fables-house\\tab-dateapp\.cmd/);
  const cmdSrc = fs.readFileSync(TAB_DATEAPP_CMD, 'utf8');
  const hostMatch = cmdSrc.match(/^\s*set\s+"HOST=([^"\r\n]+)"/im);
  const portMatch = cmdSrc.match(/^\s*set\s+"PORT=([^"\r\n]+)"/im);
  const nodeEnvMatch = cmdSrc.match(/^\s*set\s+"NODE_ENV=([^"\r\n]+)"/im);

  assert.ok(hostMatch, 'tab-dateapp.cmd must set HOST');
  assert.ok(portMatch, 'tab-dateapp.cmd must set PORT');
  assert.equal(nodeEnvMatch?.[1], 'production');

  const resolvedHost = resolveFrontendBind(
    { HOST: hostMatch[1], PORT: portMatch[1], NODE_ENV: nodeEnvMatch[1] },
    { port: Number(portMatch[1]), bind: '0.0.0.0', warn: () => {} },
  );
  assert.equal(resolvedHost, hostMatch[1]);
});

test('keepalive.ps1 api stage: tab-dateapp-api.ps1 variables start uvicorn with no FLEET_SHARED_TOKEN', () => {
  assert.match(keepaliveSrc, /scripts\\fables-house\\tab-dateapp-api\.ps1/);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keepalive-api-bind-'));
  try {
    const vaultDir = path.join(tmpDir, '.antigravity-vault', 'vault-handoff', 'env-stash-from-documents');
    fs.mkdirSync(vaultDir, { recursive: true });
    fs.writeFileSync(
      path.join(vaultDir, '.env-not-for-github.txt'),
      'DATABASE_URL=sqlite+aiosqlite:///./test.db\n',
      'utf8',
    );

    const fakePy = path.join(tmpDir, 'fake-python.cmd');
    fs.writeFileSync(fakePy, '@echo off\r\necho PY_ARGS=%*\r\nexit /b 0\r\n', 'utf8');

    const rawScript = fs.readFileSync(TAB_DATEAPP_API_PS1, 'utf8');
    const patchedScript = rawScript.replace(
      /\$Python\s*=\s*Join-Path\s+\$RepoRoot\s+'backend\\\.venv\\Scripts\\python\.exe'/,
      `$Python = '${fakePy.replace(/'/g, "''")}'`,
    );
    const scriptCopy = path.join(REPO_ROOT, 'scripts', 'fables-house', '.tmp-keepalive-tab-dateapp-api.test.ps1');
    fs.writeFileSync(scriptCopy, patchedScript, 'utf8');

    try {
      const env = { ...process.env, USERPROFILE: tmpDir };
      delete env.FLEET_SHARED_TOKEN;
      delete env.DATEAPP_API_HOST;

      const res = spawnSync(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptCopy],
        { env, encoding: 'utf8', timeout: 15000, windowsHide: true },
      );
      const combined = `${res.stdout || ''}\n${res.stderr || ''}`;
      assert.equal(res.status, 0, `expected exit 0 without token; output=${combined}`);
      assert.match(combined, /PY_ARGS=-m uvicorn app\.main:app --host 127\.0\.0\.1 --port 8000/);
    } finally {
      fs.rmSync(scriptCopy, { force: true });
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('keepalive.ps1 mission-control and social-command-center stages: mission-os accepts startup variables with no token and passes both watchdog probes', async () => {
  assert.match(keepaliveSrc, /mission-os\\server\.mjs/);

  const prevMosToken = process.env.MISSION_OS_TOKEN;
  const prevFleetToken = process.env.FLEET_SHARED_TOKEN;
  delete process.env.MISSION_OS_TOKEN;
  delete process.env.FLEET_SHARED_TOKEN;
  try {
    // Direct node mission-os\server.mjs launch (MISSION_OS_HOST unset)
    assert.equal(resolveMissionOsBind({ env: {}, port: 3130, warn: () => {} }), '127.0.0.1');

    // Scheduled task / scripts/start-mission-control.ps1 launch (MISSION_OS_HOST=127.0.0.1 when token missing)
    const startMcSrc = fs.readFileSync(START_MISSION_CONTROL_PS1, 'utf8');
    assert.match(startMcSrc, /\$env:MISSION_OS_HOST\s*=\s*\$loopback/);
    assert.equal(
      resolveMissionOsBind({ env: { MISSION_OS_HOST: '127.0.0.1' }, port: 3130, warn: () => {} }),
      '127.0.0.1',
    );

    // Both keepalive probes on loopback port 3130 pass without token
    const mosState = await invokeMissionLoopback('/api/mos-state.json');
    assert.equal(mosState.statusCode, 200);
    assert.match(mosState.body, /mission-agent-os/);

    const mktPlans = await invokeMissionLoopback('/api/marketing/plans');
    assert.equal(mktPlans.statusCode, 200);
    assert.match(mktPlans.body, /social-command-center-v5/);
  } finally {
    if (prevMosToken === undefined) delete process.env.MISSION_OS_TOKEN;
    else process.env.MISSION_OS_TOKEN = prevMosToken;
    if (prevFleetToken === undefined) delete process.env.FLEET_SHARED_TOKEN;
    else process.env.FLEET_SHARED_TOKEN = prevFleetToken;
  }
});

test('keepalive.ps1 obsidian and hermes stages: loopback fallback works without FLEET_SHARED_TOKEN', () => {
  // obsidian probe must fall back to loopback port 27123 whenever the LAN IP probe fails, even if OBSIDIAN_REST_API_KEY is set
  assert.doesNotMatch(keepaliveSrc, /if\s*\(-not\s+\$ok\s+-and\s+-not\s+\$obsTok\)/);
  assert.match(keepaliveSrc, /if\s*\(-not\s+\$ok\)\s*\{\s*\$loopbackHost\s*=\s*'127\.0\.0\.1'/);

  // hermes-support.ps1 must fall back to 127.0.0.1 for Ollama (:11434) and DateApp API (:8000) when FLEET_SHARED_TOKEN is unset
  assert.match(hermesSupportSrc, /FLEET_SHARED_TOKEN/);
  assert.match(hermesSupportSrc, /127\.0\.0\.1/);
});
