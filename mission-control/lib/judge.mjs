/**
 * Judge Lanes (Phase D, unit 1) — a `code.review` proposal is a normal
 * `lib/proposals.mjs` record (source: 'judge') carrying a server-computed,
 * read-only `git diff --stat` and a `verdicts` map keyed by lane
 * ('claude'/'codex'). No model is called here: verdicts are posted by the
 * judges' own official-CLI sessions hitting POST /api/judge/:id/verdict.
 * When both lanes approve, the proposal becomes APPROVED and waits for the
 * founder's existing inbox approve control (lib/inbox.mjs) to EXECUTE it.
 * Disagreement moves it to JUDGED and stays flagged rather than resolving
 * itself.
 *
 * Pure-ish: `exec`, `now`, and the repo list are all injected so tests never
 * touch a real checkout or the clock.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

export const LANES = ['claude', 'codex'];
export const JUDGE_KINDS = ['code.review', 'bridge.run'];

export function defaultExec(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
}

/** A bare branch name (no "..") is diffed against main via a three-dot (merge-base) range. */
export function normalizeRange(range) {
  const r = String(range || '').trim();
  if (!r) throw new Error('range is required');
  return r.includes('..') ? r : `main...${r}`;
}

/** Parse `git diff --stat`'s trailing summary line, e.g. "3 files changed, 12 insertions(+), 4 deletions(-)". */
export function parseDiffStat(statText) {
  const text = String(statText || '');
  const m = /(\d+)\s+files? changed(?:,\s*(\d+)\s+insertions?\(\+\))?(?:,\s*(\d+)\s+deletions?\(-\))?/.exec(text);
  return {
    files: m ? Number(m[1]) : 0,
    insertions: m && m[2] ? Number(m[2]) : 0,
    deletions: m && m[3] ? Number(m[3]) : 0,
  };
}

/**
 * Read-only `git diff --stat <range>` against `repoPath`. Never mutates the
 * checkout (no fetch, no checkout, no merge) — a stat diff only.
 */
export function computeDiffStat({ repoPath, range, exec = defaultExec }) {
  const normalized = normalizeRange(range);
  let out;
  try {
    out = exec(repoPath, ['diff', '--stat', normalized]);
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e), range: normalized };
  }
  const lines = out.split(/\r?\n/).filter((l) => l.length > 0);
  const statText = lines.slice(0, 200).join('\n');
  return { ok: true, range: normalized, statText, ...parseDiffStat(out) };
}

/**
 * Create a `code.review` proposal. `repos` is the same `[{id, path}]` shape
 * server.mjs already uses for the git panel (Phase B); an unknown repo id is
 * a 400, never a silent fallback to some other checkout.
 */
export function createReviewProposal({ store, repos, body, exec }) {
  const repo = (repos || []).find((r) => r.id === body.repo);
  if (!repo) return { status: 400, body: { error: 'unknown repo: ' + body.repo } };
  if (!body.range) return { status: 400, body: { error: 'range is required' } };
  const diff = computeDiffStat({ repoPath: repo.path, range: body.range, exec });
  if (!diff.ok) return { status: 400, body: { error: 'git diff failed: ' + diff.error } };
  const initialVerdicts = { claude: { state: 'pending', reasoning: '', ts: null }, codex: { state: 'pending', reasoning: '', ts: null } };
  const rec = store.create({
    source: 'judge', kind: 'code.review', brand: null, platform: null,
    title: body.title || `${body.repo} ${diff.range}`,
    body: diff.statText,
    repo: body.repo, range: diff.range,
    diffStat: { files: diff.files, insertions: diff.insertions, deletions: diff.deletions },
    verdicts: initialVerdicts,
  });
  return { status: 201, body: { proposal: rec } };
}

/** True once both lanes have voted and they do not agree. */
export function computeDisagreement(verdicts) {
  if (!verdicts) return false;
  const states = LANES.map((l) => verdicts[l] && verdicts[l].state).filter((s) => s === 'approve' || s === 'reject');
  if (states.length < LANES.length) return false;
  return new Set(states).size > 1;
}

/** GET /api/judge/feed payload: every judge-kind proposal with a live disagreement flag. */
export function buildJudgeFeed({ store }) {
  const items = store.list()
    .filter((p) => p.source === 'judge' && JUDGE_KINDS.includes(p.kind))
    .map((p) => ({ ...p, disagreement: computeDisagreement(p.verdicts) }));
  return { items, count: items.length, at: new Date().toISOString() };
}

/** Append one verdict to data/audit/YYYY-MM-DD.jsonl — never throws past the caller. */
export function appendJudgeAudit({ dir, record, now = () => new Date() }) {
  try {
    mkdirSync(dir, { recursive: true });
    const file = join(dir, now().toISOString().slice(0, 10) + '.jsonl');
    appendFileSync(file, JSON.stringify({ at: now().toISOString(), ...record }) + '\n', 'utf8');
  } catch { /* an audit-write failure must never block the verdict itself */ }
}

/**
 * POST /api/judge/:id/verdict. `tokens` is `{claude, codex}` resolved by the
 * caller from JARVIS_JUDGE_TOKEN_CLAUDE / JARVIS_JUDGE_TOKEN_CODEX so this
 * module never reads env itself.
 *   - the named lane's token unset in env -> 503, never says what to set it to.
 *   - token missing/wrong for that lane    -> 401.
 *   - unknown id                            -> 404.
 *   - unknown lane/verdict                  -> 400.
 */
export function postVerdict({ store, id, lane, verdict, reasoning, token, tokens, auditDir, now = () => new Date() }) {
  if (!LANES.includes(lane)) return { status: 400, body: { error: 'unknown lane: ' + lane } };
  if (!['approve', 'reject'].includes(verdict)) return { status: 400, body: { error: 'unknown verdict: ' + verdict } };
  const expected = tokens && tokens[lane];
  if (!expected) {
    return { status: 503, body: { error: `judge token not configured — set JARVIS_JUDGE_TOKEN_${lane.toUpperCase()} in the repo .env (one line; the value is never shown here)` } };
  }
  if (!token || token !== expected) {
    return { status: 401, body: { error: 'unauthorized: missing or incorrect x-judge-token for lane ' + lane } };
  }
  const proposal = store.get(id);
  if (!proposal) return { status: 404, body: { error: 'not found' } };
  if (!(proposal.source === 'judge' && JUDGE_KINDS.includes(proposal.kind))) {
    return { status: 400, body: { error: 'not a judge proposal: ' + id } };
  }

  const at = now().toISOString();
  const verdicts = { ...(proposal.verdicts || {}), [lane]: { state: verdict, reasoning: reasoning || '', ts: at } };
  const disagreement = computeDisagreement(verdicts);
  const bothApprove = LANES.every((l) => verdicts[l] && verdicts[l].state === 'approve');
  const bothVoted = LANES.every((l) => verdicts[l] && (verdicts[l].state === 'approve' || verdicts[l].state === 'reject'));
  let state = proposal.state;
  if (bothApprove) state = 'APPROVED';
  else if (bothVoted) state = 'JUDGED';

  const updated = store.transition(id, { verdicts, state });
  appendJudgeAudit({ dir: auditDir, record: { id, lane, verdict, reasoning: reasoning || '', disagreement }, now });
  return { status: 200, body: { proposal: { ...updated, disagreement } } };
}
