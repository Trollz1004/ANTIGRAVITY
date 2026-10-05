/**
 * Hermes-only auto-reviewer (replaces the Claude CLI reviewer lane).
 *
 * Joshua's 2026-09-21 ruling: "i dont want claude in jarvis because always
 * usage capped just hermes". The Sonnet reviewer that previously shelled
 * out to `claude -p --model sonnet --max-turns 3` is retired. JARVIS now
 * uses a Hermes-local rubric to approve social proposals.
 *
 * The rubric is the same SlopMonster rule-set JARVIS uses for copy-score:
 * - VOCAB (banned words list)
 * - VOCAB_EXACT (banned phrases)
 * - PHRASES (rule-of-three + em-dash density + semicolons)
 * - PROOF (no invented social-proof numbers)
 *
 * Source of truth: mission-control/lib/copy-score.mjs (the function
 * `scoreCopy` exported there is the same logic the marketing routine
 * runs locally before filing).
 *
 * Anything that passes the mechanical checks (compliance, copyScore,
 * adultVenue, businessOnly) AND lands a copyScore of 5/5 is auto-approved
 * here. Anything with copyScore < 5 is rejected with the trip reasons
 * so a human can re-edit.
 */
import { REVIEW_ACTOR, DAILY_CAP_PER_BRAND } from './social-review.mjs';

/**
 * Hermes-local verdict. Never shells out to any external CLI. Never
 * requires network. Pure function over the proposal record.
 *
 * @param {object} proposal - the proposal as stored in proposals.jsonl
 * @returns {{status: 'approved'|'rejected', reasons: string[]}}
 */
export function hermesLocalReview(proposal) {
  const reasons = [];
  const checks = (proposal && proposal.checks) || {};

  // Mechanical checks: every existing pass must still be true. If the
  // mechanical layer rejected the draft, we do NOT approve it here.
  const c = checks.compliance || {};
  if (c.pass !== true) reasons.push(`compliance: ${c.reason || 'no pass flag'}`);
  const av = checks.adultVenue || {};
  if (av.pass === false) reasons.push(`adultVenue: ${av.reason || 'no pass flag'}`);
  const bo = checks.businessOnly || {};
  if (bo.pass === false) reasons.push(`businessOnly: ${bo.reason || 'no pass flag'}`);

  // Local SlopMonster rubric: must be a perfect 5/5 with zero trips.
  const cs = checks.copyScore || {};
  const score = Number(cs.score);
  const tripped = Array.isArray(cs.tripped) ? cs.tripped : [];
  if (score !== 5 || tripped.length > 0) {
    reasons.push(`copyScore: ${score}/5 with ${tripped.length} trip(s) — ${tripped.map((t) => t.rule || t.category || '?').join(', ')}`);
  }

  if (reasons.length === 0) return { status: 'approved', reasons: ['hermes-local rubric: 4/4 mechanical pass + copyScore 5/5'] };
  return { status: 'rejected', reasons };
}

export { REVIEW_ACTOR, DAILY_CAP_PER_BRAND };
