import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as sentry from '../lib/sentry.mjs'

// mission-control/tests/fixtures/ is gitignored (runtime scratch space, not
// checked-in data — see the *-tmp dirs other suites use the same way), so the
// registry this suite probes is generated fresh per run, not read from disk.
const FIXTURE_REGISTRY = {
  groups: [
    {
      name: 'Group A',
      targets: [
        { id: 'up-with-identity', label: 'Up target', kind: 'http', url: 'http://fixture.invalid/up', identity: 'OK-MARKER', fix: 'x' },
        { id: 'wrong-service', label: 'Wrong service target', kind: 'http', url: 'http://fixture.invalid/wrong', identity: 'OK-MARKER', fix: 'x' },
        { id: 'no-fix', label: 'Not configured target', kind: 'http', url: 'http://fixture.invalid/nofix', identity: 'OK-MARKER', fix: null },
      ],
    },
    {
      name: 'Group B',
      targets: [
        { id: 'auth-target', label: 'Auth-gated target', kind: 'http', url: 'http://fixture.invalid/auth', authEnv: 'FIXTURE_TOKEN', fix: 'x' },
      ],
    },
  ],
};

// A throwaway repo dir per test run, so envValue() (which reads <repo>/.env)
// never touches the real C:\ANTIGRAVITY\.env, and a throwaway targets.json so
// probeSnapshot never touches the real mission-control/config/sentry-targets.json.
let repoNoEnv, repoWithEnv, FIXTURE

beforeEach(() => {
  sentry.clearSentryCache()
  repoNoEnv = mkdtempSync(join(tmpdir(), 'sentry-test-noenv-'))
  repoWithEnv = mkdtempSync(join(tmpdir(), 'sentry-test-env-'))
  writeFileSync(join(repoWithEnv, '.env'), 'FIXTURE_TOKEN=abc123\n')
  FIXTURE = join(repoNoEnv, 'sentry-targets.fixture.json')
  writeFileSync(FIXTURE, JSON.stringify(FIXTURE_REGISTRY))
})

afterEach(() => {
  rmSync(repoNoEnv, { recursive: true, force: true })
  rmSync(repoWithEnv, { recursive: true, force: true })
})

/** Routes the fixture's four http targets to canned responses; the real network is never touched. */
function installFetch({ authStatus = 401 } = {}) {
  const calls = []
  globalThis.fetch = async (url, opts = {}) => {
    calls.push({ url: String(url), headers: opts.headers || {} })
    const text = (body, status = 200) => ({ status, text: async () => body });
    if (String(url).includes('/up')) return text('service says OK-MARKER, all good');
    if (String(url).includes('/wrong')) return text('this is some other service entirely');
    if (String(url).includes('/nofix')) throw new Error('ECONNREFUSED');
    if (String(url).includes('/auth')) {
      if (!opts.headers || !opts.headers.authorization) throw new Error('no auth header sent');
      return text('authed body', authStatus);
    }
    throw new Error('unexpected url in test: ' + url);
  };
  return calls;
}

describe('probeSnapshot (identity-vs-port rule)', () => {
  it('reports UP only when the identity string is present in the body, not merely on a 200', async () => {
    installFetch();
    const snap = await sentry.probeSnapshot({ targetsPath: FIXTURE, repo: repoNoEnv, mcpPaths: [] });
    const byId = Object.fromEntries(snap.targets.map((t) => [t.id, t]));
    expect(byId['up-with-identity'].up).toBe(true);
    expect(byId['up-with-identity'].status).toBe('UP');
    expect(byId['up-with-identity'].detail).toMatch(/identity ok/);
  });

  it('a 200 response missing the identity string is WRONG SERVICE, never UP — a port answering is not health', async () => {
    installFetch();
    const snap = await sentry.probeSnapshot({ targetsPath: FIXTURE, repo: repoNoEnv, mcpPaths: [] });
    const wrong = snap.targets.find((t) => t.id === 'wrong-service');
    expect(wrong.up).toBe(false);
    expect(wrong.status).toBe('WRONG SERVICE');
    expect(wrong.detail).toMatch(/WRONG SERVICE/);
  });

  it('a target with fix: null that is down reports NOT CONFIGURED, not a plain DOWN', async () => {
    installFetch();
    const snap = await sentry.probeSnapshot({ targetsPath: FIXTURE, repo: repoNoEnv, mcpPaths: [] });
    const nofix = snap.targets.find((t) => t.id === 'no-fix');
    expect(nofix.up).toBe(false);
    expect(nofix.status).toBe('NOT CONFIGURED');
  });

  it('a fixable target that is down reports plain DOWN', async () => {
    installFetch();
    const snap = await sentry.probeSnapshot({ targetsPath: FIXTURE, repo: repoNoEnv, mcpPaths: [] });
    // wrong-service has a fix id, so its DOWN-shaped detail still classifies via
    // the WRONG SERVICE wording rather than falling through to plain DOWN — verified above.
    // Exercise the plain-DOWN path directly through verdictOf for a target with no such wording.
    expect(sentry.verdictOf({ fix: 'x' }, { up: false, detail: 'timeout' })).toBe('DOWN');
  });

  it('AUTH MISSING when the auth env var is not set in .env, AUTH REJECTED when the target rejects the credential it sent', async () => {
    installFetch({ authStatus: 401 });
    const missing = await sentry.probeSnapshot({ targetsPath: FIXTURE, repo: repoNoEnv, mcpPaths: [] });
    const authMissing = missing.targets.find((t) => t.id === 'auth-target');
    expect(authMissing.up).toBe(false);
    expect(authMissing.status).toBe('AUTH MISSING');
    expect(authMissing.detail).toMatch(/AUTH MISSING — FIXTURE_TOKEN/);

    const rejected = await sentry.probeSnapshot({ targetsPath: FIXTURE, repo: repoWithEnv, mcpPaths: [] });
    const authRejected = rejected.targets.find((t) => t.id === 'auth-target');
    expect(authRejected.up).toBe(false);
    expect(authRejected.status).toBe('AUTH REJECTED');
  });

  it('an accepted credential is reported UP', async () => {
    installFetch({ authStatus: 200 });
    const snap = await sentry.probeSnapshot({ targetsPath: FIXTURE, repo: repoWithEnv, mcpPaths: [] });
    expect(snap.targets.find((t) => t.id === 'auth-target').up).toBe(true);
  });

  it('every target carries latency, lastChecked and its parent group name', async () => {
    installFetch();
    const snap = await sentry.probeSnapshot({ targetsPath: FIXTURE, repo: repoNoEnv, mcpPaths: [] });
    const t = snap.targets.find((x) => x.id === 'up-with-identity');
    expect(typeof t.latencyMs).toBe('number');
    expect(t.lastChecked).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(t.group).toBe('Group A');
  });
});

describe('snapshot shape (groups, targets, byGroup, MCP servers)', () => {
  it('groups the fixture exactly as declared, plus an always-present MCP servers group', async () => {
    installFetch();
    const snap = await sentry.probeSnapshot({ targetsPath: FIXTURE, repo: repoNoEnv, mcpPaths: [] });
    const names = snap.groups.map((g) => g.name);
    expect(names).toEqual(['Group A', 'Group B', 'MCP servers']);
    expect(snap.byGroup['Group A']).toEqual({ up: 1, total: 3 }); // one UP, one WRONG SERVICE, one NOT CONFIGURED
    expect(snap.byGroup['Group B']).toEqual({ up: 0, total: 1 });
  });

  it('computes up/down/total across every target, fixture + MCP servers combined', async () => {
    installFetch();
    const snap = await sentry.probeSnapshot({ targetsPath: FIXTURE, repo: repoNoEnv, mcpPaths: [] });
    expect(snap.total).toBe(4); // MCP servers group is empty with no .mcp.json/.claude.json in the fixture repo
    expect(snap.up).toBe(1);
    expect(snap.down).toBe(3);
    expect(snap.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('getSentrySnapshot caching (the audit action)', () => {
  it('caches for 30s: a second call within the window does not re-probe', async () => {
    const calls = installFetch();
    await sentry.getSentrySnapshot({ targetsPath: FIXTURE, repo: repoNoEnv, mcpPaths: [] });
    const firstCallCount = calls.length;
    expect(firstCallCount).toBeGreaterThan(0);
    await sentry.getSentrySnapshot({ targetsPath: FIXTURE, repo: repoNoEnv, mcpPaths: [] });
    expect(calls.length).toBe(firstCallCount); // cache hit, no new network calls
  });

  it('force: true always re-probes, bypassing the cache — this is what the Audit button does', async () => {
    const calls = installFetch();
    await sentry.getSentrySnapshot({ targetsPath: FIXTURE, repo: repoNoEnv, mcpPaths: [] });
    const firstCallCount = calls.length;
    await sentry.getSentrySnapshot({ targetsPath: FIXTURE, repo: repoNoEnv, mcpPaths: [], force: true });
    expect(calls.length).toBe(firstCallCount * 2);
  });
});

describe('getSentrySummary', () => {
  it('returns the compact {up, down, total, byGroup} shape', async () => {
    installFetch();
    const summary = await sentry.getSentrySummary({ targetsPath: FIXTURE, repo: repoNoEnv, mcpPaths: [], force: true });
    expect(summary).toMatchObject({ up: 1, down: 3, total: 4 });
    expect(summary.byGroup['Group A']).toBeTruthy();
    expect(summary.groups).toBeUndefined(); // summary is the compact form, not the full snapshot
  });
});
