import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as ops from './ops-backend.mjs';

test('origin, Host, and MISSION_OS_TOKEN guard enforces same-origin on loopback/192.168.0.15 and constant-time token auth on LAN/API calls', () => {
  assert.equal(typeof ops.guardRequest, 'function');
  assert.equal(typeof ops.verifyMissionOsToken, 'function');

  const req = (headers, method = 'POST', remoteAddress = '127.0.0.1', url = '/api/wheel') => ({
    headers,
    method,
    url,
    socket: { remoteAddress },
  });

  // Foreign Host or cross-origin POST rejected with 403
  assert.equal(
    ops.guardRequest(req({ host: '127.0.0.1:3130', origin: 'https://evil.example', 'content-type': 'application/json' }), 3130),
    403
  );
  assert.equal(ops.guardRequest(req({ host: 'evil.example:3130' }, 'GET'), 3130), 403);
  assert.equal(ops.guardRequest(req({ host: '127.0.0.1:3130', 'content-type': 'application/json' }), 3130), 403);

  // Same-origin permitted on loopback AND 192.168.0.15:3130 when caller is local
  assert.equal(
    ops.guardRequest(
      req({ host: '127.0.0.1:3130', origin: 'http://127.0.0.1:3130', 'content-type': 'application/json' }),
      3130
    ),
    0
  );
  assert.equal(
    ops.guardRequest(
      req({ host: '192.168.0.15:3130', origin: 'http://192.168.0.15:3130', 'content-type': 'application/json' }),
      3130
    ),
    0
  );

  // Non-loopback client when MISSION_OS_TOKEN is unconfigured -> 503 (never opens .env files)
  const tmpEnvDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mos-no-dotenv-'));
  try {
    fs.writeFileSync(path.join(tmpEnvDir, '.env'), 'MISSION_OS_TOKEN=from-disk-must-be-ignored\n', 'utf8');
    assert.equal(ops.readMissionOsToken({ env: {}, repoRoot: tmpEnvDir }), '');
    assert.equal(
      ops.guardRequest(
        req({ host: '192.168.0.15:3130', 'x-mission-os-token': 'from-disk-must-be-ignored' }, 'GET', '192.168.0.40'),
        3130,
        { env: {}, repoRoot: tmpEnvDir }
      ),
      503
    );
  } finally {
    fs.rmSync(tmpEnvDir, { recursive: true, force: true });
  }

  assert.equal(
    ops.guardRequest(
      req({ host: '192.168.0.15:3130' }, 'GET', '192.168.0.40'),
      3130,
      { env: { MISSION_OS_TOKEN: '' } }
    ),
    503
  );

  // Non-loopback client without token or with wrong token -> 401
  const tokenEnv = { MISSION_OS_TOKEN: 'super-secret-mission-os-token-2026' };
  assert.equal(
    ops.guardRequest(req({ host: '192.168.0.15:3130' }, 'GET', '192.168.0.40'), 3130, { env: tokenEnv }),
    401
  );
  assert.equal(
    ops.guardRequest(
      req({ host: '192.168.0.15:3130', 'x-mission-os-token': 'wrong-token' }, 'GET', '192.168.0.40'),
      3130,
      { env: tokenEnv }
    ),
    401
  );

  // Non-loopback client with valid X-Mission-OS-Token or Authorization: Bearer -> 0
  assert.equal(
    ops.guardRequest(
      req({ host: '192.168.0.15:3130', 'x-mission-os-token': 'super-secret-mission-os-token-2026' }, 'GET', '192.168.0.40'),
      3130,
      { env: tokenEnv }
    ),
    0
  );
  assert.equal(
    ops.guardRequest(
      req({ host: '192.168.0.15:3130', 'x-mission-os-token': 'fleet-shared-tok' }, 'GET', '192.168.0.40'),
      3130,
      { env: { FLEET_SHARED_TOKEN: 'fleet-shared-tok' } }
    ),
    0
  );

  // Loopback callers on /api/v1/* and other routes succeed without 503/401 when no token is configured
  assert.equal(
    ops.guardRequest(req({ host: '127.0.0.1:3130' }, 'GET', '127.0.0.1', '/api/v1/status'), 3130, { env: {} }),
    0
  );
  assert.equal(
    ops.guardRequest(
      req({ host: '127.0.0.1:3130', origin: 'http://127.0.0.1:3130', 'content-type': 'application/json' }, 'POST', '127.0.0.1', '/api/v1/status'),
      3130,
      { env: {} }
    ),
    0
  );
  assert.equal(
    ops.guardRequest(
      req(
        {
          host: '192.168.0.15:3130',
          authorization: 'Bearer super-secret-mission-os-token-2026',
          'content-type': 'application/json',
        },
        'POST',
        '192.168.0.40'
      ),
      3130,
      { env: tokenEnv }
    ),
    0
  );

  // Even with valid token, foreign browser Origin is still refused with 403
  assert.equal(
    ops.guardRequest(
      req(
        {
          host: '192.168.0.15:3130',
          origin: 'https://evil.example',
          'x-mission-os-token': 'super-secret-mission-os-token-2026',
          'content-type': 'application/json',
        },
        'POST',
        '192.168.0.40'
      ),
      3130,
      { env: tokenEnv }
    ),
    403
  );
});

test('browser URL validator rejects executable schemes and credentials', () => {
  assert.equal(typeof ops.browserURL, 'function');
  for (const s of ['file:///C:/secret', 'javascript:alert(1)', 'http://u:p@example.com', 'data:text/html,x']) {
    assert.throws(() => ops.browserURL(s));
  }
  assert.equal(ops.browserURL('https://example.com/'), 'https://example.com/');
});

test('all read views return sourced envelopes with no invented activity', async () => {
  assert.equal(typeof ops.readOps, 'function');
  for (const view of [
    'board',
    'memory',
    'node',
    'logs',
    'support',
    'hermes',
    'settings',
    'browser',
    'video',
    'youtube',
    'marketing',
    'ecosystem',
  ]) {
    const v = await ops.readOps(view, {
      root: 'C:/ANTIGRAVITY',
      state: async () => ({ services: [] }),
      bridges: async () => ({ bridges: [] }),
    });
    assert.equal(typeof v.ok, 'boolean', view);
    assert.ok(v.generated, view);
    assert.ok(v.source, view);
    assert.ok(Array.isArray(v.items), view);
  }
});
