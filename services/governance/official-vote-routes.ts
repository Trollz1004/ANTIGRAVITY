import type { Express } from 'express';
import {
  OFFICIAL_PLATFORM_IDS,
  OfficialVoteEngine,
  OfficialVoteError,
  type OfficialBridgeIdentityResolver,
  type OfficialPlatformId,
  type VoteDecision,
} from './official-vote-engine.js';

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
 * Official judges are independent from workers, OmniRoute, provider APIs, and
 * general operational bridges. Until a dedicated official-client identity
 * resolver is installed, every lane truthfully reports NOT CONFIGURED.
 */
export function registerOfficialVoteRoutes(app: Express, options: OfficialVoteRouteOptions = {}): void {
  const resolver = options.resolver ?? new UnavailableOfficialBridgeResolver();
  const engine = options.engine ?? new OfficialVoteEngine({ resolver });

  app.get('/api/official-votes/status', async (_req, res) => {
    const lanes = await Promise.all(OFFICIAL_PLATFORM_IDS.map((platform) => engine.laneStatus(platform)));
    res.json({ roster: engine.rosterStatus(), lanes });
  });

  app.get('/api/official-votes/view', async (_req, res) => {
    const events = engine.events();
    const seats = await Promise.all(OFFICIAL_PLATFORM_IDS.map((platform) => engine.laneStatus(platform)));
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
        requestedModel: req.body?.requestedModel,
        actualModel: req.body?.actualModel,
        evidenceSummary: req.body?.evidenceSummary,
      });
      res.status(201).json({ event });
    } catch (error) {
      if (error instanceof OfficialVoteError) {
        const status = error.code === 'OFFICIAL_IDENTITY_UNAVAILABLE' ? 503 : 409;
        res.status(status).json({ error: error.code });
        return;
      }
      res.status(400).json({ error: 'INVALID_OFFICIAL_JUDGE_SUBMISSION' });
    }
  });
}
