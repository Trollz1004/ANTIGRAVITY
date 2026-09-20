/**
 * Model review before approval (specs/010-social-publish-pipeline, unit 2).
 *
 * A social proposal that has already passed the mechanical checks
 * (compliance, and — for youandinotai — the adult-venue + business-only
 * gates) is queued for a headless Claude Code CLI review against
 * config/social-review-rubric.md. The CLI is the ONLY reviewer: this module
 * never scores copy itself, it only shells out, parses a strict JSON
 * verdict, and applies it.
 *
 *   approve -> proposal -> APPROVED (actor "fable-lane (claude review)"),
 *              then executed by its adapter — but only under the daily cap
 *              (2 per brand per America/New_York calendar day).
 *   reject  -> proposal -> REJECTED, reasons recorded.
 *   CLI unavailable / timeout / unparsable output -> left PROPOSED for a
 *              human; never guessed, never silently dropped.
 *
 * Every review call is audited via the injected `auditFn`, whatever the
 * outcome. This module never pushes, merges, or deletes anything — Rule 5.
 */
import { spawn as nodeSpawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

export const REVIEW_ACTOR = 'fable-lane (claude review)';
export const REVIEW_MODEL = 'sonnet';
export const REVIEW_MAX_TURNS = 3;
export const REVIEW_TIMEOUT_MS = 90000;
export const DAILY_CAP_PER_BRAND = 2;
export const AUTO_REVIEW_ENV = 'JARVIS_AUTO_REVIEW_SOCIAL';
export const AUTO_REVIEW_VALUE = 'fable';

/** True only when JARVIS_AUTO_REVIEW_SOCIAL is exactly "fable" (case-insensitive). */
export function autoReviewEnabled(envValue) {
  return String((envValue && envValue(AUTO_REVIEW_ENV)) || '').trim().toLowerCase() === AUTO_REVIEW_VALUE;
}

/** America/New_York calendar day for `date`, formatted YYYY-MM-DD. */
export function nyDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

/** How many of `brand`'s social proposals this review lane already approved today (NY). */
export function reviewedTodayCount(proposals, brand, { now = () => new Date() } = {}) {
  const day = nyDay(now());
  return (proposals || []).filter((p) => p
    && p.source === 'social' && p.brand === brand
    && ['APPROVED', 'EXECUTED'].includes(p.state)
    && p.reviewActor === REVIEW_ACTOR
    && p.reviewedAt && nyDay(new Date(p.reviewedAt)) === day
  ).length;
}

/** True when the mechanical checks server.mjs already computed all passed. */
export function passesMechanicalChecks(checks) {
  const c = checks || {};
  if (!c.compliance || c.compliance.pass !== true) return false;
  if (c.adultVenue && c.adultVenue.pass !== true) return false;
  if (c.businessOnly && c.businessOnly.pass !== true) return false;
  return true;
}

export function buildReviewPrompt({ rubric, proposal }) {
  return [
    String(rubric || '').trim(),
    '',
    'Review this proposed social post against the rubric above. Respond with',
    'ONLY a single JSON object of the exact shape',
    '{"approve": true|false, "reasons": ["short reason", "..."]} — no markdown',
    'fencing, no prose outside the JSON object.',
    '',
    `Brand: ${proposal.brand}`,
    `Platform: ${proposal.platform}`,
    `Title: ${proposal.title || '(none)'}`,
    'Body:',
    proposal.body || '',
  ].join('\n');
}

/** Pull the first {...} JSON object out of the CLI's stdout. Returns null on anything unparsable. */
export function parseVerdict(stdout) {
  const text = String(stdout || '');
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  let j;
  try { j = JSON.parse(m[0]); } catch { return null; }
  if (typeof j.approve !== 'boolean') return null;
  const reasons = Array.isArray(j.reasons) ? j.reasons.map(String) : (j.reasons ? [String(j.reasons)] : []);
  return { approve: j.approve, reasons };
}

/**
 * Spawn the official, headless Claude Code CLI to review one proposal.
 * `claude -p --model sonnet --max-turns 3`, shell:false, no permission
 * flags, 90s timeout. Never throws — every outcome resolves to
 * {status:'approved'|'rejected'|'unavailable', reasons, raw}.
 */
export function runClaudeReview({
  proposal, rubricPath, spawnImpl = nodeSpawn, timeoutMs = REVIEW_TIMEOUT_MS,
  readFile = readFileSync, model = REVIEW_MODEL, maxTurns = REVIEW_MAX_TURNS,
} = {}) {
  return new Promise((resolvePromise) => {
    let rubric;
    try { rubric = readFile(rubricPath, 'utf8'); }
    catch (e) {
      return resolvePromise({ status: 'unavailable', reasons: ['rubric unreadable: ' + String((e && e.message) || e)], raw: '' });
    }

    const prompt = buildReviewPrompt({ rubric, proposal });
    let child;
    try {
      child = spawnImpl('claude', ['-p', '--model', model, '--max-turns', String(maxTurns)], { shell: false });
    } catch (e) {
      return resolvePromise({ status: 'unavailable', reasons: ['claude CLI unavailable: ' + String((e && e.message) || e)], raw: '' });
    }

    let out = '';
    let err = '';
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { child.kill(); } catch {}
      resolvePromise({ status: 'unavailable', reasons: ['review timed out after ' + timeoutMs + 'ms'], raw: out });
    }, timeoutMs);

    if (child.stdout) child.stdout.on('data', (d) => { out += String(d); });
    if (child.stderr) child.stderr.on('data', (d) => { err += String(d); });
    child.on('error', (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolvePromise({ status: 'unavailable', reasons: ['claude CLI error: ' + String((e && e.message) || e)], raw: out });
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        return resolvePromise({ status: 'unavailable', reasons: ['claude CLI exited ' + code + (err ? ': ' + err.slice(0, 300) : '')], raw: out });
      }
      const verdict = parseVerdict(out);
      if (!verdict) {
        return resolvePromise({ status: 'unavailable', reasons: ['could not parse a JSON verdict from the CLI output'], raw: out });
      }
      resolvePromise({ status: verdict.approve ? 'approved' : 'rejected', reasons: verdict.reasons, raw: out });
    });

    try {
      if (child.stdin) { child.stdin.write(prompt); child.stdin.end(); }
    } catch { /* a stdin write failure surfaces via 'error'/'close' above */ }
  });
}

/**
 * Full orchestration for one PROPOSED social proposal: review, then (only if
 * approved and under the daily cap) execute via the same adapter
 * server.mjs's approve action already uses. Every branch is audited and
 * every branch ends in a `store.transition` call or an explicit
 * "left PROPOSED" no-op — nothing here is ever silent.
 */
export async function reviewAndMaybeExecute({
  store, proposal, rubricPath, spawnImpl, readFile, execute, now = () => new Date(), auditFn = () => {},
}) {
  const verdict = await runClaudeReview({ proposal, rubricPath, spawnImpl, readFile });
  auditFn({
    kind: 'social-review', id: proposal.id, brand: proposal.brand, platform: proposal.platform,
    status: verdict.status, reasons: verdict.reasons,
  });

  if (verdict.status === 'unavailable') {
    return { proposal, action: 'left-proposed', reasons: verdict.reasons };
  }

  if (verdict.status === 'rejected') {
    const updated = store.transition(proposal.id, {
      state: 'REJECTED', reviewActor: REVIEW_ACTOR, reviewReasons: verdict.reasons, reviewedAt: now().toISOString(),
    });
    return { proposal: updated, action: 'rejected', reasons: verdict.reasons };
  }

  // approved by the model — the daily cap still gates execution
  const todayCount = reviewedTodayCount(store.list(), proposal.brand, { now });
  if (todayCount >= DAILY_CAP_PER_BRAND) {
    auditFn({
      kind: 'social-review-cap', id: proposal.id, brand: proposal.brand,
      reason: `daily cap of ${DAILY_CAP_PER_BRAND} per brand reached for ${nyDay(now())}`,
    });
    return { proposal, action: 'left-proposed', reasons: ['daily cap reached; left for a human'] };
  }

  const approvedRec = store.transition(proposal.id, {
    state: 'APPROVED', reviewActor: REVIEW_ACTOR, reviewReasons: verdict.reasons, reviewedAt: now().toISOString(),
  });
  let result;
  try { result = execute(approvedRec); } catch (e) { result = { ok: false, error: String((e && e.message) || e) }; }
  const finalRec = (result && result.ok)
    ? store.transition(proposal.id, { state: 'EXECUTED', evidence: result.path || result.url || null })
    : store.transition(proposal.id, { state: 'FAILED', evidence: (result && result.error) || 'adapter failed' });
  return { proposal: finalRec, action: (result && result.ok) ? 'executed' : 'failed', reasons: verdict.reasons };
}
