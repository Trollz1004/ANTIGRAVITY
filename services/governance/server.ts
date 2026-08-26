/**
 * Standalone official-vote service.
 *
 * Exists so mission-control-v5 can be retired without taking council ballots
 * with it. Paperclip does NOT cover ballots -- its only vote route is
 * /api/issues/{id}/feedback-votes, thumbs-up/down on an issue. See
 * agent-contracts/PAPERCLIP-COVERAGE-RULING-2026-08-26.md.
 *
 * NOT STARTED AUTOMATICALLY. Sabretooth already runs 15 services; this one goes
 * up deliberately, as part of the MC5 cutover, not as a side effect.
 */
import express from 'express';
import { registerOfficialVoteRoutes } from './official-vote-routes.js';

// 9134, deliberately. Sabretooth's live ports are mapped in
// docs/ops/NODE-AND-PORT-MAP.md -- 3151 is MC5 itself (do not take it while MC5
// still serves), 9133 is the DreamOps bridge, 9127 the NPC lab.
const PORT = Number(process.env.OFFICIAL_VOTE_PORT || 9134);

const app = express();
app.use(express.json());

// Same identity as MC5 reports, so a health check cannot confuse the two.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'official-vote-service', port: PORT });
});

registerOfficialVoteRoutes(app);

app.listen(PORT, '127.0.0.1', () => {
  // Bound to loopback: this is governance, not a public surface.
  console.log(`official-vote-service listening on http://127.0.0.1:${PORT}`);
  console.log(`state dir: ${process.env.MISSION_CONTROL_VOTE_STATE_DIR || `${process.cwd()}/.mission-control`}`);
});
