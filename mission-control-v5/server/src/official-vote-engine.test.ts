import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { OPERATIONAL_BRIDGE_TARGET_IDS } from './bridge.js';
import {
  JUDGE_LANES,
  OfficialVoteEngine,
  type OfficialBridgeIdentityResolver,
} from './official-vote-engine.js';

const cleanup: string[] = [];

function workspace(): { root: string; eventFile: string; rosterPath: string } {
  const root = mkdtempSync(join(tmpdir(), 'mc-vote-engine-'));
  cleanup.push(root);
  return { root, eventFile: join(root, 'events.ndjson'), rosterPath: join(root, 'roster.json') };
}

function resolver(actualModel = 'ACCOUNT_TIER_HIGHEST_REASONING', accountId = 'official-account'): OfficialBridgeIdentityResolver {
  return {
    resolve: async (platform) => ({
      platform,
      accountId,
      officialClient: 'Official Test Client',
      state: 'AVAILABLE',
      actualModel: platform === 'openai-codex' ? actualModel : 'ACCOUNT_TIER_HIGHEST_REASONING',
    }),
  };
}

afterEach(() => {
  for (const root of cleanup.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('official judge engine', () => {
  it('keeps judge handling outside operational bridges and routed model adapters', () => {
    expect(OPERATIONAL_BRIDGE_TARGET_IDS).toEqual(['hermes', 'openclaw', 'opencode']);
    const engineSource = readFileSync(new URL('./official-vote-engine.ts', import.meta.url), 'utf8');
    const routeSource = readFileSync(new URL('./official-vote-routes.ts', import.meta.url), 'utf8');
    for (const source of [engineSource, routeSource]) {
      expect(source).not.toMatch(/from '\.\/(bridge|omniroute)\.js'/);
      expect(source).not.toContain('forwardOperationalPrompt');
    }
  });

  it('exposes exactly the five approved independent lanes', () => {
    expect(JUDGE_LANES.map((lane) => lane.platform)).toEqual([
      'claude',
      'gemini',
      'github-copilot',
      'grok',
      'openai-codex',
    ]);
    expect(JUDGE_LANES.find((lane) => lane.platform === 'openai-codex')?.requestedModel).toBe('gpt-5.6-sol');
  });

  it('blocks Codex when the authenticated official client cannot verify gpt-5.6-sol', async () => {
    const engine = new OfficialVoteEngine({ ...workspace(), resolver: resolver('other-model') });
    const lane = await engine.laneStatus('openai-codex');
    expect(lane.state).toBe('BLOCKED');
    expect(lane.actualModel).toBe('other-model');
  });

  it('rejects a submitted identity that differs from the server-resolved official identity', async () => {
    const engine = new OfficialVoteEngine({ ...workspace(), resolver: resolver() });
    await expect(
      engine.submit({
        platform: 'gemini',
        voterIdentity: 'different-account',
        subject: 'change-1',
        decision: 'approve',
        requestedModel: 'ACCOUNT_TIER_HIGHEST_REASONING',
        actualModel: 'ACCOUNT_TIER_HIGHEST_REASONING',
        evidenceSummary: 'TEST_ONLY',
      }),
    ).rejects.toMatchObject({ code: 'OFFICIAL_IDENTITY_MISMATCH' });
  });

  it('writes immutable advisory evidence and never elevates a model ballot into repository authority', async () => {
    const files = workspace();
    writeFileSync(
      files.rosterPath,
      JSON.stringify({
        version: 2,
        signoff: { authority: 'joshua', signedAt: '2026-08-19T00:00:00.000Z' },
        members: [{ platform: 'openai-codex', accountId: 'official-account' }],
      }),
      'utf8',
    );
    const engine = new OfficialVoteEngine({
      ...files,
      resolver: resolver('gpt-5.6-sol'),
      now: () => new Date('2026-08-19T00:00:00.000Z'),
    });
    const event = await engine.submit({
      platform: 'openai-codex',
      voterIdentity: 'official-account',
      subject: 'review-packet-hash',
      decision: 'approve',
      requestedModel: 'gpt-5.6-sol',
      actualModel: 'gpt-5.6-sol',
      evidenceSummary: 'TEST_ONLY',
    });
    const stored = JSON.parse(readFileSync(files.eventFile, 'utf8').trim());

    expect(event).toMatchObject({
      actor: 'ACCOUNT_AUTHENTICATED',
      platform: 'openai-codex',
      requestedModel: 'gpt-5.6-sol',
      actualModel: 'gpt-5.6-sol',
      binding: false,
      timestamp: '2026-08-19T00:00:00.000Z',
    });
    expect(stored).toEqual(event);
    expect(Object.isFrozen(event)).toBe(true);
    expect(engine.rosterStatus()).toEqual({ state: 'signed', bindingEnabled: false });
  });
});
