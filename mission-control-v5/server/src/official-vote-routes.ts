import type { Express } from 'express';
import {
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
 * Official votes use this module only. It imports neither the operational bridge
 * module nor any model-routing client, so those paths cannot be selected here.
 */
export function registerOfficialVoteRoutes(app: Express, options: OfficialVoteRouteOptions = {}): void {
  const engine = options.engine ?? new OfficialVoteEngine({ resolver: options.resolver ?? new UnavailableOfficialBridgeResolver() });

  app.get('/api/official-votes/status', (_req, res) => {
    res.json({ roster: engine.rosterStatus() });
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
