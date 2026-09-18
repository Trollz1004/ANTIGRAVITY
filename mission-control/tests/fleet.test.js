import { describe, it, expect } from 'vitest'
import {
  lastJournalEntry, readHarnessJournal, resolveOpenCodePort,
  fetchOmniUsage, buildFleet, OMNI_USAGE_CANDIDATES, HARNESSES,
} from '../lib/fleet.mjs'

describe('lib/fleet.mjs — lastJournalEntry', () => {
  it('reads the did: line and counts next: lines from the LAST entry only', () => {
    const text = `# State\n\n## 2026-08-24\n- did: old thing\n- next: old next\n\n## 2026-08-27 (opencode, x)\n- did: checked identity and inbox\n- verified: something\n- next: await assigned issue\n`;
    const e = lastJournalEntry(text);
    expect(e.heading).toBe('2026-08-27 (opencode, x)');
    expect(e.did).toBe('checked identity and inbox');
    expect(e.queueDepth).toBe(1);
  })

  it('returns null did: when the last entry has no did: line (never a guess)', () => {
    const text = `## 2026-08-24 — lane assigned\n- Task: ANT-78\n- Next: read this file\n`;
    const e = lastJournalEntry(text);
    expect(e.did).toBeNull();
  })

  it('returns null for an empty or headingless file', () => {
    expect(lastJournalEntry('')).toBeNull();
    expect(lastJournalEntry('no headings here')).toBeNull();
  })
})

describe('lib/fleet.mjs — readHarnessJournal', () => {
  it('honest about a missing STATE.md', () => {
    const r = readHarnessJournal('/nope/STATE.md', { exists: () => false });
    expect(r.ok).toBe(false);
    expect(r.currentTask).toBeNull();
    expect(r.error).toMatch(/not found/);
  })
  it('reads a real journal via injected fs', () => {
    const text = `## 2026-09-01\n- did: shipped the thing\n- next: ship the next thing\n`;
    const r = readHarnessJournal('/fake/STATE.md', { exists: () => true, readFile: () => text });
    expect(r.ok).toBe(true);
    expect(r.currentTask).toBe('shipped the thing');
    expect(r.queueDepth).toBe(1);
  })
})

describe('lib/fleet.mjs — resolveOpenCodePort', () => {
  it('null when nothing configures a port anywhere (OpenCode as of 2026-09-17)', () => {
    expect(resolveOpenCodePort({ envValue: () => '', harnessConfigDir: '/nope', exists: () => false })).toBeNull();
  })
  it('env override wins', () => {
    expect(resolveOpenCodePort({ envValue: (n) => (n === 'OPENCODE_PORT' ? '9999' : '') })).toBe('9999');
  })
  it('reads a harness-config yaml when present', () => {
    const r = resolveOpenCodePort({
      envValue: () => '', harnessConfigDir: '/cfg',
      exists: (p) => p.endsWith('opencode.yaml'),
      readFile: () => 'port: 8123\n',
    });
    expect(r).toBe('8123');
  })
})

describe('lib/fleet.mjs — fetchOmniUsage', () => {
  it('AUTH MISSING when no key is configured', async () => {
    const r = await fetchOmniUsage({ omniBase: 'http://x:1/v1', key: '' });
    expect(r.tokenSpendToday).toBeNull();
    expect(r.source).toBe('unavailable');
  })
  it('honestly unavailable when every candidate 404s (this gateway, confirmed 2026-09-17)', async () => {
    const fetchImpl = async () => ({ status: 404 });
    const r = await fetchOmniUsage({ omniBase: 'http://x:1/v1', key: 'k', fetchImpl, candidates: OMNI_USAGE_CANDIDATES });
    expect(r.tokenSpendToday).toBeNull();
    expect(r.source).toBe('unavailable');
  })
  it('reports a real number when a candidate answers 200 with a numeric field', async () => {
    const fetchImpl = async (url) => (url.endsWith('/v1/usage') ? { status: 200, json: async () => ({ tokenSpendToday: 42 }) } : { status: 404 });
    const r = await fetchOmniUsage({ omniBase: 'http://x:1/v1', key: 'k', fetchImpl });
    expect(r.tokenSpendToday).toBe(42);
    expect(r.source).toMatch(/\/v1\/usage$/);
  })
})

describe('lib/fleet.mjs — buildFleet', () => {
  it('three rows, honest NOT CONFIGURED for a harness with no probe target', async () => {
    const harnesses = [
      { lane: 'hermes', stateMdPath: '/h/STATE.md', probe: { url: 'http://x', host: 'x', port: 1 } },
      { lane: 'openclaw', stateMdPath: '/o/STATE.md', probe: { url: 'http://y', host: 'y', port: 2 } },
      { lane: 'opencode', stateMdPath: '/c/STATE.md', probe: null },
    ];
    const probeService = async (target) => (target.port === 1 ? { reachable: true } : { reachable: false });
    const r = await buildFleet({
      harnesses, probeService, omni: { base: 'http://x/v1', key: '' },
      journalOpts: { exists: () => false },
    });
    expect(r.rows.length).toBe(3);
    const byLane = Object.fromEntries(r.rows.map((x) => [x.lane, x]));
    expect(byLane.hermes.status).toBe('UP');
    expect(byLane.openclaw.status).toBe('DOWN');
    expect(byLane.opencode.status).toBe('NOT CONFIGURED');
    expect(byLane.opencode.tokenSpendToday).toBeNull();
    expect(byLane.opencode.source).toBe('unavailable');
  })
})

describe('lib/fleet.mjs — HARNESSES constant', () => {
  it('lists the three lanes in the documented order', () => {
    expect(HARNESSES).toEqual(['hermes', 'openclaw', 'opencode']);
  })
})
