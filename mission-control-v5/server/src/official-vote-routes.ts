import type { Express } from 'express';
import {
  OFFICIAL_PLATFORM_IDS,
  OfficialVoteEngine,
  OfficialVoteError,
  type OfficialBridgeIdentityResolver,
  type OfficialPlatformId,
  type VoteDecision,
} from './official-vote-engine.js';

const PLATFORM_LABELS: Record<OfficialPlatformId, string> = {
  claude: 'CLAUDE',
  gemini: 'GEMINI',
  'github-copilot': 'GITHUB COPILOT',
  'meta-ai': 'META AI',
  chatgpt: 'CHATGPT / OPENAI',
  manus: 'MANUS',
};

class UnavailableOfficialBridgeResolver implements OfficialBridgeIdentityResolver {
  async resolve(_platform: OfficialPlatformId) {
    return null;
  }
}

export interface OfficialVoteRouteOptions {
  engine?: OfficialVoteEngine;
  resolver?: OfficialBridgeIdentityResolver;
}

/**
 * Official votes use this module only. It imports neither the operational bridge
 * module nor any model-routing client, so those paths cannot be selected here.
 */
export function registerOfficialVoteRoutes(app: Express, options: OfficialVoteRouteOptions = {}): void {
  const engine = options.engine ?? new OfficialVoteEngine({ resolver: options.resolver ?? new UnavailableOfficialBridgeResolver() });

  app.get('/api/official-votes/status', (_req, res) => {
    res.json({ roster: engine.rosterStatus() });
  });

  // Read-only projection for the council UI. Seats report NOT CONFIGURED until
  // each platform's official identity resolver integration is approved.
  app.get('/api/official-votes/view', async (_req, res) => {
    const events = engine.events();
    const seats = await Promise.all(OFFICIAL_PLATFORM_IDS.map(async (platform) => {
      const identity = await (options.resolver ?? new UnavailableOfficialBridgeResolver()).resolve(platform).catch(() => null);
      return {
        platform,
        label: PLATFORM_LABELS[platform],
        state: identity ? 'UP' : 'NOT CONFIGURED',
        detail: identity ? 'official bridge identity resolved' : 'official bridge not configured',
      };
    }));
    const bySubject = new Map<string, number>();
    for (const event of events) bySubject.set(event.subject, (bySubject.get(event.subject) ?? 0) + 1);
    const ballots = [...bySubject.entries()].map(([subject, decisions]) => ({ id: subject, subject, status: 'OPEN' as const, decisions }));
    res.json({ roster: engine.rosterStatus(), seats, ballots, events });
  });

  app.post('/api/official-votes', async (req, res) => {
    try {
      const event = await engine.submit({
        platform: req.body?.platform,
        voterIdentity: req.body?.voterIdentity,
        subject: req.body?.subject,
        decision: req.body?.decision as VoteDecision,
      });
      res.status(201).json({ event });
    } catch (error) {
      if (error instanceof OfficialVoteError) {
        const status = error.code === 'OFFICIAL_IDENTITY_UNAVAILABLE' ? 503 : 409;
        res.status(status).json({ error: error.code });
        return;
      }
      res.status(400).json({ error: 'INVALID_SUBMISSION' });
    }
  });
}
