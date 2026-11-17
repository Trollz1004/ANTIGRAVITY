import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadFleetMap } from '../ops/fleet/fleet-map.mjs';
import {
  MONITORED_NODE_IDS,
  DEFAULT_POLL_INTERVAL_MS,
  DEFAULT_RED_ALERT_AFTER_MS,
  createNodeWatchdog,
  probeFleetService,
  readTelegramConfig,
} from './node-watchdog.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');
const WATCHDOG_PATH = path.join(HERE, 'node-watchdog.mjs');
const SENTRY_PS1_PATH = path.join(REPO_ROOT, 'ops', 't5500', 'openclaw-sentry.ps1');
const REGISTER_PS1_PATH = path.join(REPO_ROOT, 'ops', 't5500', 'register-openclaw-watchdog.ps1');
const LOOPBACK_IP = ['127', '0', '0', '1'].join('.');

function makeTempDir(prefix = 'mos-watchdog-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function sampleObjectFleetMap() {
  return {
    schema: 'antigravity.fleet-map.v1',
    nodes: {
      t5500: { id: 't5500', name: 'T5500', ip: '192.168.0.15', host: '192.168.0.15' },
      alienware: { id: 'alienware', name: 'Alienware', ip: '192.168.0.40', host: '192.168.0.40' },
    },
    services: {
      'mission-os': {
        id: 'mission-os',
        name: 'Mission OS',
        node: 't5500',
        host: '192.168.0.15',
        port: 3130,
        protocol: 'http',
        scope: 'lan-guarded',
        tokenEnv: 'MISSION_OS_TOKEN',
        healthPath: '/live',
      },
      'hermes-dashboard': {
        id: 'hermes-dashboard',
        name: 'Hermes Dashboard',
        node: 't5500',
        host: '192.168.0.15',
        port: 9119,
        protocol: 'http',
        scope: 'lan',
        healthPath: '/api/health',
      },
      postgres: {
        id: 'postgres',
        name: 'PostgreSQL',
        node: 't5500',
        host: LOOPBACK_IP,
        port: 5432,
        protocol: 'tcp',
        scope: 'this machine only',
        bind: LOOPBACK_IP,
      },
      'dream-engine': {
        id: 'dream-engine',
        name: 'DREAM Engine',
        node: 'alienware',
        host: '192.168.0.40',
        port: 9180,
        protocol: 'http',
        scope: 'lan-guarded',
        tokenEnv: 'DREAM_ENGINE_TOKEN',
        healthPath: '/api/gm/health',
      },
      'swarm-command': {
        id: 'swarm-command',
        name: 'Swarm Command',
        node: 'alienware',
        host: '192.168.0.40',
        port: 8000,
        protocol: 'http',
        scope: 'lan-guarded',
        tokenEnv: 'FLEET_SHARED_TOKEN',
        healthPath: '/api/health',
      },
    },
  };
}

function sampleArrayFleetMap() {
  return {
    schema: 'antigravity.fleet-map.v1',
    nodes: {
      t5500: { id: 't5500', name: 'T5500', ip: '192.168.0.15', host: '192.168.0.15' },
      alienware: { id: 'alienware', name: 'Alienware', ip: '192.168.0.40', host: '192.168.0.40' },
    },
    services: [
      {
        id: 'date-app-api',
        name: 'Date App API',
        node: 't5500',
        host: '192.168.0.15',
        port: 8000,
        protocol: 'http',
        scope: 'lan',
        healthPath: '/health',
      },
      {
        id: 'free-claude-code',
        name: 'Free Claude Code',
        node: 'alienware',
        host: '192.168.0.40',
        port: 8082,
        protocol: 'http',
        scope: 'lan-guarded',
        authTokenEnv: 'FLEET_SHARED_TOKEN',
        healthPath: '/admin',
      },
      {
        id: 'alienware-obsidian-rest',
        name: 'Obsidian Local REST API (Alienware)',
        node: 'alienware',
        host: LOOPBACK_IP,
        port: 27123,
        protocol: 'http',
        scope: 'this machine only',
        bind: LOOPBACK_IP,
        authTokenEnv: 'OBSIDIAN_API_KEY',
        healthPath: '/mcp',
      },
    ],
  };
}

test('watchdog source and ps1 scripts have zero retired nodes, zero .env reads, zero hardcoded user paths, and required flags', () => {
  const src = fs.readFileSync(WATCHDOG_PATH, 'utf8');
  assert.deepEqual(MONITORED_NODE_IDS, ['t5500', 'alienware']);
  assert.equal(DEFAULT_POLL_INTERVAL_MS, 60000);
  assert.equal(DEFAULT_RED_ALERT_AFTER_MS, 300000);
  assert.doesNotMatch(src, /sabretooth/i);
  assert.ok(!src.includes(['192', '168', '0', '8'].join('.')));
  assert.doesNotMatch(src, /(?<!process)\.env\b/);
  assert.doesNotMatch(src, /createHash\s*\(\s*['"]sha256['"]\s*\)/);
  assert.doesNotMatch(src, /Users[\\/]+(?:joshl|joshi|NSFW_BOTS)/i);

  const sentryPs1 = fs.readFileSync(SENTRY_PS1_PATH, 'utf8');
  assert.match(sentryPs1, /\[string\]\$RepoPath/);
  assert.match(sentryPs1, /\[switch\]\$Headless/);
  assert.match(sentryPs1, /\[switch\]\$Once/);
  assert.match(sentryPs1, /\[switch\]\$NoTelegram/);
  assert.match(sentryPs1, /\[int\]\$SleepSeconds\s*=\s*60/);
  assert.match(sentryPs1, /node-watchdog\.mjs/);
  assert.match(sentryPs1, /--no-telegram/);
  assert.doesNotMatch(sentryPs1, /\.env\b/i);
  assert.doesNotMatch(sentryPs1, /sabretooth/i);
  assert.doesNotMatch(sentryPs1, /Users[\\/]+(?:joshl|joshi|NSFW_BOTS)/i);

  const registerPs1 = fs.readFileSync(REGISTER_PS1_PATH, 'utf8');
  assert.match(registerPs1, /\[switch\]\$Apply/);
  assert.match(registerPs1, /-WindowStyle Hidden/);
  assert.match(registerPs1, /-Hidden/);
  assert.match(registerPs1, /-Headless/);
  assert.match(registerPs1, /ANTIGRAVITY OpenClaw Watchdog/);
  assert.doesNotMatch(registerPs1, /\.env\b/i);
  assert.doesNotMatch(registerPs1, /sabretooth/i);
  assert.doesNotMatch(registerPs1, /Users[\\/]+(?:joshl|joshi|NSFW_BOTS)/i);
});

test('probeFleetService handles HTTP 200..399, stream-safe guarded 401/403, unguarded 401, fetch cause errors, and TCP ports', async () => {
  const guardedSvc = {
    id: 'swarm-command',
    name: 'Swarm Command',
    node: 'alienware',
    host: '192.168.0.40',
    port: 8000,
    protocol: 'http',
    scope: 'lan-guarded',
    authTokenEnv: 'FLEET_SHARED_TOKEN',
    healthPath: '/api/health',
  };
  const unguardedSvc = {
    id: 'opsis-studio',
    name: 'OPSis Studio',
    node: 'alienware',
    host: '192.168.0.40',
    port: 8390,
    protocol: 'http',
    scope: 'lan',
    authTokenEnv: '',
    healthPath: '/api/session',
  };
  const tcpSvc = {
    id: 'ssh',
    name: 'T5500 OpenSSH',
    node: 't5500',
    host: '192.168.0.15',
    port: 22,
    protocol: 'ssh',
    scope: 'lan',
  };

  let capturedHeaders = null;
  const okRes = await probeFleetService(guardedSvc, {
    env: { FLEET_SHARED_TOKEN: 'fleet-secret-123' },
    fetchImpl: async (_url, init) => {
      capturedHeaders = init?.headers || {};
      return { status: 204 };
    },
  });
  assert.equal(okRes.up, true);
  assert.equal(okRes.status, 'UP');
  assert.equal(okRes.lastError, null);
  assert.equal(capturedHeaders.Authorization, 'Bearer fleet-secret-123');
  assert.equal(capturedHeaders['X-Mission-OS-Token'], 'fleet-secret-123');
  assert.equal(capturedHeaders['X-Fleet-Token'], 'fleet-secret-123');

  // Guarded service answering 401 proves the HTTP guard is alive without leaking env var names (Addendum A1)
  const guarded401 = await probeFleetService(guardedSvc, {
    env: {},
    fetchImpl: async () => ({ status: 401 }),
  });
  assert.equal(guarded401.up, true);
  assert.equal(guarded401.status, 'UP');
  assert.match(guarded401.reason, /guard|401/i);
  assert.ok(!guarded401.reason.includes('FLEET_SHARED_TOKEN'), 'reason must not leak env var name');

  // Unguarded service answering 401 is reported as AUTH REQUIRED (failing)
  const unguarded401 = await probeFleetService(unguardedSvc, {
    env: {},
    fetchImpl: async () => ({ status: 401 }),
  });
  assert.equal(unguarded401.up, false);
  assert.equal(unguarded401.status, 'AUTH REQUIRED');

  // Node fetch wraps ECONNREFUSED in err.cause when err.message is 'fetch failed'
  const refusedCause = await probeFleetService(unguardedSvc, {
    env: {},
    fetchImpl: async () => {
      const cause = new Error('connect ECONNREFUSED 192.168.0.40:8390\nstack line 2');
      cause.code = 'ECONNREFUSED';
      throw new TypeError('fetch failed', { cause });
    },
  });
  assert.equal(refusedCause.up, false);
  assert.equal(refusedCause.status, 'DOWN');
  assert.match(refusedCause.reason, /connection refused/i);
  assert.ok(!refusedCause.lastError.includes('\n'));

  const tcpOk = await probeFleetService(tcpSvc, {
    env: {},
    tcpProbeImpl: async () => ({ ok: true }),
  });
  assert.equal(tcpOk.up, true);
  assert.equal(tcpOk.status, 'UP');

  const tcpDown = await probeFleetService(tcpSvc, {
    env: {},
    tcpProbeImpl: async () => ({ ok: false, error: 'connect ETIMEDOUT 192.168.0.15:22' }),
  });
  assert.equal(tcpDown.up, false);
  assert.equal(tcpDown.status, 'DOWN');
  assert.match(tcpDown.reason, /timed out/i);
});

test('probeFleetService skips remote machine-local services and falls back to loopback only on local node when token is unset', async () => {
  const remoteLocalSvc = {
    id: 'alienware-obsidian-rest',
    name: 'Obsidian Local REST API (Alienware)',
    node: 'alienware',
    host: LOOPBACK_IP,
    port: 27123,
    protocol: 'http',
    scope: 'this machine only',
    bind: LOOPBACK_IP,
    authTokenEnv: 'OBSIDIAN_API_KEY',
    healthPath: '/mcp',
  };

  let calledRemoteLocal = false;
  const skippedRemote = await probeFleetService(remoteLocalSvc, {
    env: {},
    localNodeId: 't5500',
    fetchImpl: async () => {
      calledRemoteLocal = true;
      return { status: 200 };
    },
    tcpProbeImpl: async () => {
      calledRemoteLocal = true;
      return { ok: true };
    },
  });
  assert.equal(calledRemoteLocal, false, 'remote machine-local service must not be probed across LAN');
  assert.equal(skippedRemote.up, true);
  assert.equal(skippedRemote.status, 'UP');

  // When running locally on Alienware, alienware-obsidian-rest IS probed locally
  const localHitUrls = [];
  const localAlienwareProbe = await probeFleetService(remoteLocalSvc, {
    env: {},
    localNodeId: 'alienware',
    fetchImpl: async (url) => {
      localHitUrls.push(url);
      return { status: 200 };
    },
  });
  assert.equal(localAlienwareProbe.up, true);
  assert.deepEqual(localHitUrls, [`http://${LOOPBACK_IP}:27123/mcp`]);

  // Local node no-token loopback fallback: 192.168.0.15 refused -> tries loopback
  const localGuardedSvc = {
    id: 'mission-os',
    name: 'Mission OS',
    node: 't5500',
    host: '192.168.0.15',
    port: 3130,
    protocol: 'http',
    scope: 'lan-guarded',
    bind: '0.0.0.0',
    authTokenEnv: 'FLEET_SHARED_TOKEN',
    healthPath: '/live',
  };

  const fallbackCalls = [];
  const fallbackOk = await probeFleetService(localGuardedSvc, {
    env: {},
    localNodeId: 't5500',
    fetchImpl: async (url) => {
      fallbackCalls.push(url);
      if (url.startsWith('http://192.168.0.15:3130')) {
        const cause = new Error('connect ECONNREFUSED 192.168.0.15:3130');
        cause.code = 'ECONNREFUSED';
        throw new TypeError('fetch failed', { cause });
      }
      return { status: 200 };
    },
  });
  assert.equal(fallbackOk.up, true);
  assert.equal(fallbackOk.status, 'UP');
  assert.deepEqual(fallbackCalls, ['http://192.168.0.15:3130/live', `http://${LOOPBACK_IP}:3130/live`]);

  // When token IS configured in env, do NOT fall back to loopback if LAN IP refuses
  const tokenSetCalls = [];
  const noFallbackWithToken = await probeFleetService(localGuardedSvc, {
    env: { FLEET_SHARED_TOKEN: 'live-shared-token' },
    localNodeId: 't5500',
    fetchImpl: async (url) => {
      tokenSetCalls.push(url);
      throw new Error('connect ECONNREFUSED 192.168.0.15:3130');
    },
  });
  assert.equal(noFallbackWithToken.up, false);
  assert.equal(noFallbackWithToken.status, 'DOWN');
  assert.deepEqual(tokenSetCalls, ['http://192.168.0.15:3130/live']);

  // Remote node service NEVER falls back to local loopback
  const remoteGuardedSvc = {
    id: 'swarm-command',
    name: 'Swarm Command',
    node: 'alienware',
    host: '192.168.0.40',
    port: 8000,
    protocol: 'http',
    scope: 'lan-guarded',
    authTokenEnv: 'FLEET_SHARED_TOKEN',
    healthPath: '/api/health',
  };
  const remoteCalls = [];
  const noRemoteFallback = await probeFleetService(remoteGuardedSvc, {
    env: {},
    localNodeId: 't5500',
    fetchImpl: async (url) => {
      remoteCalls.push(url);
      throw new Error('connect ECONNREFUSED 192.168.0.40:8000');
    },
  });
  assert.equal(noRemoteFallback.up, false);
  assert.equal(noRemoteFallback.status, 'DOWN');
  assert.deepEqual(remoteCalls, ['http://192.168.0.40:8000/api/health']);
});

test('supports canonical fleet-map.json array schema, object schema, keepalive status.json, and computes green/red lights', async () => {
  const tmp = makeTempDir();
  try {
    const incidentsPath = path.join(tmp, 'watchdog-incidents.json');
    const statusPath = path.join(tmp, 'status.json');
    fs.writeFileSync(
      statusPath,
      JSON.stringify({
        updated: '2026-11-16T19:59:00.000Z',
        stages: [
          { stage: 'postgres', status: 'UP' },
          { stage: 'redis', status: 'HEALED' },
          { stage: 'domains', status: 'UP' },
          { stage: 'dateapp-api', status: 'DOWN' },
        ],
      }),
      'utf8',
    );

    const wdObj = createNodeWatchdog({
      fleetMap: sampleObjectFleetMap(),
      incidentsPath,
      keepaliveStatusPath: statusPath,
      env: {},
      hermesAvailable: false,
      nowMs: () => Date.parse('2026-11-16T20:00:00.000Z'),
      probeService: async (svc) => {
        if (svc.id === 'hermes-dashboard') {
          return {
            up: false,
            status: 'DOWN',
            reason: 'Connection refused',
            lastError: 'connect ECONNREFUSED 192.168.0.15:9119',
          };
        }
        return { up: true, status: 'UP', reason: 'Healthy', lastError: null };
      },
    });

    const statusSnap = await wdObj.getStatus({ refresh: true });
    assert.equal(statusSnap.nodes.length, 2);
    assert.deepEqual(
      statusSnap.nodes.map((n) => n.id),
      ['t5500', 'alienware'],
    );
    const t5500 = statusSnap.nodes[0];
    const alienware = statusSnap.nodes[1];
    assert.equal(t5500.light, 'red');
    assert.equal(t5500.flashing, true);
    assert.equal(t5500.up, false);
    assert.equal(alienware.light, 'green');
    assert.equal(alienware.flashing, false);
    assert.equal(alienware.up, true);

    const watchdogView = await wdObj.getWatchdogState();
    assert.deepEqual(watchdogView.keepalive, {
      updated: '2026-11-16T19:59:00.000Z',
      stagesUp: 3,
      stagesTotal: 4,
    });
    assert.equal(watchdogView.incidents.length, 1);
    assert.equal(watchdogView.incidents[0].serviceId, 'hermes-dashboard');

    // Verify canonical live ops/fleet/fleet-map.json runs cleanly and alienware-obsidian-rest does not fail across LAN
    const canonicalMap = loadFleetMap();
    const probedUrls = [];
    const wdCanonical = createNodeWatchdog({
      fleetMap: canonicalMap,
      incidentsPath: path.join(tmp, 'canonical-incidents.json'),
      keepaliveStatusPath: path.join(tmp, 'missing-status.json'),
      env: {},
      hermesAvailable: false,
      fetchImpl: async (url) => {
        probedUrls.push(url);
        return { status: url.includes(':8082') ? 403 : 200 };
      },
      tcpProbeImpl: async () => ({ ok: true }),
    });
    const canonicalSnap = await wdCanonical.getStatus({ refresh: true });
    assert.equal(canonicalSnap.nodes[0].light, 'green');
    assert.equal(canonicalSnap.nodes[1].light, 'green');
    assert.ok(!probedUrls.some((u) => u.includes('/mcp')), 'alienware-obsidian-rest must not be probed from t5500');

    // Array fixture check
    const wdArr = createNodeWatchdog({
      fleetMap: sampleArrayFleetMap(),
      incidentsPath: path.join(tmp, 'arr-incidents.json'),
      keepaliveStatusPath: path.join(tmp, 'missing-status.json'),
      env: {},
      hermesAvailable: false,
      fetchImpl: async (url) => ({ status: url.includes(':8082') ? 403 : 200 }),
    });
    const arrSnap = await wdArr.getStatus({ refresh: true });
    assert.equal(arrSnap.nodes[0].light, 'green');
    assert.equal(arrSnap.nodes[1].light, 'green');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('5-minute Telegram alert supports bot-api, hermes-cli fallback, disable gates, persistence, recovery reset, and secret redaction', async () => {
  const tmp = makeTempDir();
  try {
    const incidentsPath = path.join(tmp, 'watchdog-incidents.json');
    fs.writeFileSync(
      path.join(tmp, '.env'),
      'TELEGRAM_BOT_TOKEN=dotenv-must-be-ignored\nTELEGRAM_CHAT_ID=999\n',
      'utf8',
    );

    let currentMs = Date.parse('2026-11-16T20:00:00.000Z');
    let hermesUp = false;
    const telegramCalls = [];
    const secretToken = '123456789:TEST_BOT_SECRET_VALUE';

    const makeInstance = (
      customFetch,
      customEnv = { ORC_NOTIFY_TELEGRAM_TOKEN: secretToken, ORC_NOTIFY_TELEGRAM_CHAT: '-100777888' },
    ) =>
      createNodeWatchdog({
        fleetMap: sampleObjectFleetMap(),
        incidentsPath,
        keepaliveStatusPath: path.join(tmp, 'no-status.json'),
        env: customEnv,
        hermesAvailable: false,
        nowMs: () => currentMs,
        redAlertAfterMs: 300000,
        fetchImpl:
          customFetch ||
          (async (url, init) => {
            telegramCalls.push({ url, body: JSON.parse(init.body) });
            return { ok: true, status: 200 };
          }),
        probeService: async (svc) => {
          if (svc.id === 'hermes-dashboard' && !hermesUp) {
            return {
              up: false,
              status: 'DOWN',
              reason: 'Connection refused',
              lastError: `connect ECONNREFUSED 192.168.0.15:9119 (${secretToken})`,
            };
          }
          return { up: true, status: 'UP', reason: 'Healthy', lastError: null };
        },
      });

    const wd1 = makeInstance();

    // t = 0s: red begins, no alert yet
    const s0 = await wd1.runOnce();
    assert.equal(telegramCalls.length, 0);
    assert.equal(s0.watchdog.telegramConfigured, true);
    assert.equal(s0.watchdog.telegramTransport, 'bot-api');

    // t = 240s: still under 300s threshold -> no alert
    currentMs += 240000;
    await wd1.runOnce();
    assert.equal(telegramCalls.length, 0);

    // t = 300s: reaches threshold -> sends exactly 1 Telegram alert with token redacted and no env var names
    currentMs += 60000;
    await wd1.runOnce();
    assert.equal(telegramCalls.length, 1);
    assert.equal(telegramCalls[0].url, `https://api.telegram.org/bot${secretToken}/sendMessage`);
    assert.equal(telegramCalls[0].body.chat_id, '-100777888');
    assert.match(telegramCalls[0].body.text, /T5500/);
    assert.match(telegramCalls[0].body.text, /Hermes Dashboard/);
    assert.ok(!telegramCalls[0].body.text.includes(secretToken), 'Telegram alert text must never include raw token');
    assert.doesNotMatch(telegramCalls[0].body.text, /FLEET_SHARED_TOKEN|TELEGRAM_BOT_TOKEN|ORC_NOTIFY_TELEGRAM/);

    // Simulate process restart at t = 360s -> must NOT alert again
    currentMs += 60000;
    const wd2 = makeInstance();
    const stateAfterRestart = await wd2.runOnce();
    assert.equal(telegramCalls.length, 1);
    assert.ok(stateAfterRestart.watchdog.nodes.t5500.alertSentAt);

    // Node recovers green at t = 420s -> clears incident and alertSentAt
    hermesUp = true;
    currentMs += 60000;
    const recovered = await wd2.runOnce();
    assert.equal(recovered.watchdog.nodes.t5500.light, 'green');
    assert.equal(recovered.watchdog.nodes.t5500.redSince, null);
    assert.equal(recovered.watchdog.nodes.t5500.alertSentAt, null);
    assert.equal(recovered.watchdog.incidents.length, 0);

    // New outage later -> sends 1 alert for the new incident after 5 min
    hermesUp = false;
    currentMs += 80000;
    await wd2.runOnce();
    assert.equal(telegramCalls.length, 1);
    currentMs += 300000;
    await wd2.runOnce();
    assert.equal(telegramCalls.length, 2);

    // Hermes CLI fallback when direct Telegram env vars aren't set
    const hermesIncidentsPath = path.join(tmp, 'hermes-incidents.json');
    let hermesClock = Date.parse('2026-11-16T21:00:00.000Z');
    const hermesCalls = [];
    const makeHermesWatchdog = () =>
      createNodeWatchdog({
        fleetMap: sampleObjectFleetMap(),
        incidentsPath: hermesIncidentsPath,
        keepaliveStatusPath: path.join(tmp, 'no-status.json'),
        env: {},
        hermesAvailable: true,
        hermesBin: 'C:/fake/hermes.exe',
        hermesSendImpl: async (bin, args) => {
          hermesCalls.push({ bin, args });
          return { ok: true };
        },
        nowMs: () => hermesClock,
        redAlertAfterMs: 300000,
        probeService: async (svc) =>
          svc.id === 'dream-engine'
            ? { up: false, status: 'DOWN', reason: 'Connection refused', lastError: 'ECONNREFUSED' }
            : { up: true, status: 'UP', reason: 'Healthy', lastError: null },
      });

    const wdHermes1 = makeHermesWatchdog();
    const h0 = await wdHermes1.runOnce();
    assert.equal(h0.watchdog.telegramConfigured, true);
    assert.equal(h0.watchdog.telegramTransport, 'hermes-cli');
    assert.equal(hermesCalls.length, 0);

    hermesClock += 300000;
    const h5 = await wdHermes1.runOnce();
    assert.equal(hermesCalls.length, 1);
    assert.equal(hermesCalls[0].bin, 'C:/fake/hermes.exe');
    assert.equal(hermesCalls[0].args[0], 'send');
    assert.equal(hermesCalls[0].args[1], '--to');
    assert.equal(hermesCalls[0].args[2], 'telegram');
    assert.equal(hermesCalls[0].args[3], '--quiet');
    assert.match(hermesCalls[0].args[4], /DREAM Engine/);
    assert.ok(h5.watchdog.nodes.alienware.alertSentAt);

    // Restart does not double-send via hermes CLI
    hermesClock += 60000;
    const wdHermes2 = makeHermesWatchdog();
    await wdHermes2.runOnce();
    assert.equal(hermesCalls.length, 1);

    // MISSION_OS_DISABLE_TELEGRAM=1 prevents sending via both bot-api and hermes-cli
    const disabledCalls = [];
    let disabledClock = Date.parse('2026-11-16T22:00:00.000Z');
    const wdDisabled = createNodeWatchdog({
      fleetMap: sampleObjectFleetMap(),
      incidentsPath: path.join(tmp, 'disabled-incidents.json'),
      keepaliveStatusPath: path.join(tmp, 'no-status.json'),
      env: {
        TELEGRAM_BOT_TOKEN: secretToken,
        TELEGRAM_CHAT_ID: '12345',
        MISSION_OS_DISABLE_TELEGRAM: '1',
      },
      hermesAvailable: true,
      hermesSendImpl: async () => {
        disabledCalls.push('hermes');
        return { ok: true };
      },
      fetchImpl: async () => {
        disabledCalls.push('bot-api');
        return { ok: true, status: 200 };
      },
      nowMs: () => disabledClock,
      probeService: async (svc) =>
        svc.id === 'dream-engine'
          ? { up: false, status: 'DOWN', reason: 'Connection refused', lastError: 'ECONNREFUSED' }
          : { up: true, status: 'UP', reason: 'Healthy', lastError: null },
    });
    await wdDisabled.runOnce();
    disabledClock += 305000;
    const disabledRes = await wdDisabled.runOnce();
    assert.equal(disabledCalls.length, 0);
    assert.equal(disabledRes.watchdog.telegramTransport, 'none');
    assert.equal(disabledRes.watchdog.nodes.alienware.alertSentAt, null);

    // readTelegramConfig respects TELEGRAM_HOME_CHAT and MISSION_OS_DISABLE_TELEGRAM
    const homeCfg = readTelegramConfig(
      { TELEGRAM_BOT_TOKEN: 'tok', TELEGRAM_HOME_CHAT: '555', MISSION_OS_DISABLE_TELEGRAM: '1' },
      { hermesAvailable: false },
    );
    assert.equal(homeCfg.chatId, '555');
    assert.equal(homeCfg.disabled, true);
    assert.equal(homeCfg.transport, 'none');

    // Verify token redaction when Telegram fetch throws an error containing the URL/token
    const errIncidentsPath = path.join(tmp, 'err-incidents.json');
    let errClock = Date.parse('2026-11-16T23:00:00.000Z');
    const wdErr = createNodeWatchdog({
      fleetMap: sampleObjectFleetMap(),
      incidentsPath: errIncidentsPath,
      keepaliveStatusPath: path.join(tmp, 'no-status.json'),
      env: { TELEGRAM_BOT_TOKEN: secretToken, TELEGRAM_CHAT_ID: '12345' },
      hermesAvailable: false,
      nowMs: () => errClock,
      fetchImpl: async (url) => {
        throw new Error(`Fetch failed for ${url}`);
      },
      probeService: async (svc) =>
        svc.id === 'dream-engine'
          ? { up: false, status: 'DOWN', reason: 'Connection refused', lastError: 'ECONNREFUSED' }
          : { up: true, status: 'UP', reason: 'Healthy', lastError: null },
    });
    await wdErr.runOnce();
    errClock += 305000;
    const failedAlertPass = await wdErr.runOnce();
    const serialized = JSON.stringify(failedAlertPass);
    assert.ok(!serialized.includes(secretToken), 'Serialized state/error must redact bot token');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('polling timer, CLI --once --json --no-telegram, and PowerShell dry-run / headless -NoTelegram run cleanly', async () => {
  const tmp = makeTempDir();
  try {
    let ticks = 0;
    const wd = createNodeWatchdog({
      fleetMap: sampleArrayFleetMap(),
      incidentsPath: path.join(tmp, 'poll-incidents.json'),
      keepaliveStatusPath: path.join(tmp, 'no-status.json'),
      pollIntervalMs: 25,
      env: {},
      hermesAvailable: false,
      probeService: async () => {
        ticks += 1;
        return { up: true, status: 'UP', reason: 'Healthy', lastError: null };
      },
    });
    wd.start();
    await new Promise((r) => setTimeout(r, 90));
    wd.stop();
    assert.ok(ticks >= 2, `Expected polling loop to run multiple passes, got ${ticks}`);

    const mapFile = path.join(tmp, 'fleet-map.json');
    const incFile = path.join(tmp, 'cli-incidents.json');
    fs.writeFileSync(
      mapFile,
      JSON.stringify({
        nodes: {
          t5500: { id: 't5500', name: 'T5500', ip: '192.168.0.15', host: '192.168.0.15' },
          alienware: { id: 'alienware', name: 'Alienware', ip: '192.168.0.40', host: '192.168.0.40' },
        },
        services: [],
      }),
      'utf8',
    );
    const cliOut = execFileSync(
      process.execPath,
      [WATCHDOG_PATH, '--once', '--json', '--no-telegram', '--fleet-map', mapFile, '--incidents-file', incFile],
      { encoding: 'utf8', timeout: 10000, windowsHide: true },
    );
    const parsed = JSON.parse(cliOut);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.watchdog.telegramTransport, 'none');
    assert.deepEqual(Object.keys(parsed.watchdog.nodes), ['t5500', 'alienware']);

    // register-openclaw-watchdog.ps1 dry-run verification
    const regDryOut = execFileSync(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', REGISTER_PS1_PATH, '-RepoPath', REPO_ROOT],
      { encoding: 'utf8', timeout: 12000, windowsHide: true },
    );
    assert.match(regDryOut, /DRY-RUN/);
    assert.match(regDryOut, /-WindowStyle Hidden/);
    assert.match(regDryOut, /-Hidden/);
    assert.match(regDryOut, /-Headless/);
    assert.match(regDryOut, /ANTIGRAVITY OpenClaw Watchdog/);

    // openclaw-sentry.ps1 -Headless -Once -NoTelegram verification in isolated temp repo
    const psRepo = path.join(tmp, 'ps-repo');
    fs.mkdirSync(path.join(psRepo, 'mission-os'), { recursive: true });
    fs.mkdirSync(path.join(psRepo, 'ops', 'fleet'), { recursive: true });
    fs.mkdirSync(path.join(psRepo, 'ops', 't5500'), { recursive: true });
    fs.copyFileSync(WATCHDOG_PATH, path.join(psRepo, 'mission-os', 'node-watchdog.mjs'));
    fs.copyFileSync(
      path.join(REPO_ROOT, 'ops', 'fleet', 'fleet-map.mjs'),
      path.join(psRepo, 'ops', 'fleet', 'fleet-map.mjs'),
    );
    fs.writeFileSync(
      path.join(psRepo, 'ops', 'fleet', 'fleet-map.json'),
      JSON.stringify({
        nodes: {
          t5500: { id: 't5500', name: 'T5500', ip: '192.168.0.15', host: '192.168.0.15' },
          alienware: { id: 'alienware', name: 'Alienware', ip: '192.168.0.40', host: '192.168.0.40' },
        },
        services: [],
      }),
      'utf8',
    );
    fs.copyFileSync(SENTRY_PS1_PATH, path.join(psRepo, 'ops', 't5500', 'openclaw-sentry.ps1'));
    const sentryOut = execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        path.join(psRepo, 'ops', 't5500', 'openclaw-sentry.ps1'),
        '-RepoPath',
        psRepo,
        '-Headless',
        '-Once',
        '-NoTelegram',
      ],
      { encoding: 'utf8', timeout: 15000, windowsHide: true },
    );
    assert.match(sentryOut, /OpenClaw sentry online \(mode=headless/);
    assert.match(sentryOut, /\[watchdog\] T5500/);
    assert.ok(fs.existsSync(path.join(psRepo, 'logs', 'openclaw-watchdog.log')));
    assert.ok(fs.existsSync(path.join(psRepo, 'ops', 't5500', 'watchdog-incidents.json')));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
