import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OPERATIONAL_BRIDGE_TARGET_IDS } from './bridge.js';
import { OfficialVoteEngine, type OfficialBridgeIdentityResolver } from './official-vote-engine.js';

function workspace(): { root: string; eventFile: string; rosterPath: string } {
  const root = mkdtempSync(join(tmpdir(), 'mc-vote-engine-'));
  return { root, eventFile: join(root, 'events.ndjson'), rosterPath: join(root, 'roster.json') };
}

function resolver(accountId = 'official-account'): OfficialBridgeIdentityResolver {
  return { resolve: async (platform) => ({ platform, accountId }) };
}

describe('official vote engine', () => {
  it('keeps official vote handling outside the general operational bridge target set and module imports', () => {
    expect(OPERATIONAL_BRIDGE_TARGET_IDS).toEqual(['hermes', 'openclaw']);
    const engineSource = readFileSync(new URL('./official-vote-engine.ts', import.meta.url), 'utf8');
    const routeSource = readFileSync(new URL('./official-vote-routes.ts', import.meta.url), 'utf8');
    for (const source of [engineSource, routeSource]) {
      expect(source).not.toMatch(/from '\.\/(bridge|omniroute)\.js'/);
      expect(source).not.toContain('forwardOperationalPrompt');
    }
  });

  it('rejects a submitted identity that differs from the server-resolved official bridge identity', async () => {
    const files = workspace();
    const engine = new OfficialVoteEngine({ ...files, resolver: resolver() });
    await expect(engine.submit({ platform: 'gemini', voterIdentity: 'different-account', subject: 'change-1', decision: 'approve' }))
      .rejects.toMatchObject({ code: 'OFFICIAL_IDENTITY_MISMATCH' });
    rmSync(files.root, { recursive: true, force: true });
  });

  it('appends immutable non-binding events while no signed roster exists', async () => {
    const files = workspace();
    const engine = new OfficialVoteEngine({ ...files, resolver: resolver(), now: () => new Date('2026-08-19T00:00:00.000Z') });
    const event = await engine.submit({ platform: 'gemini', voterIdentity: 'official-account', subject: 'change-1', decision: 'approve' });
    const stored = JSON.parse(readFileSync(files.eventFile, 'utf8').trim());
    expect(event).toMatchObject({ actor: 'official-account', platform: 'gemini', subject: 'change-1', decision: 'approve', binding: false, timestamp: '2026-08-19T00:00:00.000Z' });
    expect(stored).toEqual(event);
    expect(Object.isFrozen(event)).toBe(true);
    expect(engine.events()).toHaveLength(1);
    rmSync(files.root, { recursive: true, force: true });
  });

  it('enables binding only after a valid Joshua-signed roster exists and rejects identities outside it', async () => {
    const files = workspace();
    writeFileSync(files.rosterPath, JSON.stringify({ version: 1, signoff: { authority: 'joshua', signedAt: '2026-08-19T00:00:00.000Z' }, members: [{ platform: 'gemini', accountId: 'official-account' }] }));
    const engine = new OfficialVoteEngine({ ...files, resolver: resolver() });
    expect(engine.rosterStatus()).toEqual({ state: 'signed', bindingEnabled: true });
    await expect(engine.submit({ platform: 'gemini', voterIdentity: 'official-account', subject: 'change-2', decision: 'reject' })).resolves.toMatchObject({ binding: true });
    const outsider = new OfficialVoteEngine({ ...files, resolver: resolver('outside-account') });
    await expect(outsider.submit({ platform: 'gemini', voterIdentity: 'outside-account', subject: 'change-3', decision: 'abstain' }))
      .rejects.toMatchObject({ code: 'ROSTER_MEMBER_REQUIRED' });
    rmSync(files.root, { recursive: true, force: true });
  });
});
