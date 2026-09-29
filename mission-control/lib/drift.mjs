/**
 * Drift board (2026-09-29, Joshua: "i need to catch my ais drift so i can earn
 * my drift badges"). Reads the GitHub REST API for each repo and classifies
 * every branch other than main, so a branch an AI left drifting is visible:
 *
 *   DEAD     nothing ahead of main (ahead_by 0): fully merged, should be deleted
 *   LIVE     an open pull request has that branch as its head
 *   STALE    unmerged, no pull request, last commit older than `staleDays`
 *   WORKING  everything else
 *
 * The lane is read off the branch prefix (claude/ and judge/ -> claude, codex/,
 * dependabot/, hermes/, opencode/, openclaw/, emergent/; anything else is
 * 'unknown'). The token is read by the server from .env and used here as a
 * bearer header; it never reaches the page, and without one the board says
 * NOT CONFIGURED and holds no rows.
 *
 * Honesty rules: a GitHub error (403 rate limit, 404) makes that repo DOWN with
 * the reason and no rows; a branch that cannot be compared (for example an
 * orphan branch with no common ancestor) is listed under `skipped`, never as a
 * row. The head commit date comes from the compare response; a DEAD branch has
 * no commits ahead, so its lastCommitAt is null rather than a second call.
 * Successful repos are cached in memory for five minutes (clearDriftCache()
 * resets it for tests); errors are never cached.
 *
 * Pure-ish: fetch and the clock are injected so tests never touch the network.
 */
import { createHash } from 'node:crypto';

export const DRIFT_REPOS = ['Trollz1004/ANTIGRAVITY', 'Trollz1004/dream-online'];
export const DRIFT_CACHE_MS = 5 * 60 * 1000;
export const NO_TOKEN_DETAIL = 'GITHUB_TOKEN not set; the drift board reads GitHub through the server and never from the page';

const API = 'https://api.github.com';
const DEFAULT_BRANCH = 'main';
const BRANCH_PAGE = 100;
const COMPARE_CONCURRENCY = 6;
const REQUEST_TIMEOUT_MS = 10000;
const DAY_MS = 24 * 60 * 60 * 1000;

const LANE_PREFIXES = [
  ['claude/', 'claude'], ['judge/', 'claude'], ['codex/', 'codex'], ['dependabot/', 'dependabot'],
  ['hermes/', 'hermes'], ['opencode/', 'opencode'], ['openclaw/', 'openclaw'], ['emergent/', 'emergent'],
];

const cache = new Map();

export function clearDriftCache() { cache.clear(); }

/** The lane a branch belongs to, by prefix. */
export function laneOfBranch(name) {
  const n = String(name || '').toLowerCase();
  for (const [prefix, lane] of LANE_PREFIXES) if (n.startsWith(prefix)) return lane;
  return 'unknown';
}

/** DEAD, LIVE, STALE or WORKING, in that order of precedence. */
export function classifyBranch({ aheadBy, pr, lastCommitAt, now, staleDays = 7 }) {
  if (aheadBy === 0) return 'DEAD';
  if (pr) return 'LIVE';
  const t = Date.parse(lastCommitAt);
  if (Number.isFinite(t) && now - t > staleDays * DAY_MS) return 'STALE';
  return 'WORKING';
}

// A GitHub failure carries its HTTP status so the caller can tell a rate limit
// (the whole repo is untrustworthy) from one branch that cannot be compared.
class GithubError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

async function githubGet(path, { token, fetchImpl }) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), REQUEST_TIMEOUT_MS);
  let r;
  try {
    r = await fetchImpl(API + path, {
      signal: c.signal,
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'User-Agent': 'jarvis-driftus' },
    });
  } catch (e) {
    throw new GithubError('GitHub unreachable: ' + String((e && e.message) || e), 0);
  } finally { clearTimeout(t); }
  const body = await r.json().catch(() => null);
  if (!(r.status >= 200 && r.status < 300)) {
    const why = body && body.message ? ': ' + String(body.message).slice(0, 200) : '';
    throw new GithubError('GitHub HTTP ' + r.status + ' for ' + path.split('?')[0] + why, r.status);
  }
  return body;
}

// Slashes in a branch name stay literal (compare/main...claude/x); everything else is escaped.
function encodeRef(name) { return String(name).split('/').map(encodeURIComponent).join('/'); }

// Bounded parallelism; the first error stops the other workers from starting more requests.
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  let failed = false;
  async function worker() {
    while (!failed && next < items.length) {
      const i = next++;
      try { out[i] = await fn(items[i]); } catch (e) { failed = true; throw e; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// Only a 404 (no common ancestor, ref gone) or 422 is about one branch; anything else
// (401, 403, 429, 5xx, a network failure) means the repo cannot be trusted.
const isBranchLocal = (e) => e.status === 404 || e.status === 422;

/** The commit date of a compare result's head: the last listed commit when the list is complete. */
function commitDate(commit) {
  const c = commit && commit.commit;
  return (c && ((c.committer && c.committer.date) || (c.author && c.author.date))) || null;
}

async function readRepo(repo, { token, fetchImpl, now, staleDays }) {
  const ctx = { token, fetchImpl };
  const [branchList, pulls] = await Promise.all([
    githubGet(`/repos/${repo}/branches?per_page=${BRANCH_PAGE}`, ctx),
    githubGet(`/repos/${repo}/pulls?state=open&per_page=50`, ctx),
  ]);
  const prByHead = new Map();
  for (const pr of Array.isArray(pulls) ? pulls : []) {
    const head = pr && pr.head;
    if (!head || !head.ref || !head.repo || String(head.repo.full_name).toLowerCase() !== repo.toLowerCase()) continue;
    if (!prByHead.has(head.ref)) prByHead.set(head.ref, { number: pr.number, title: pr.title, url: pr.html_url });
  }
  const others = (Array.isArray(branchList) ? branchList : []).filter((b) => b && b.name && b.name !== DEFAULT_BRANCH);
  const skipped = [];
  const compared = await mapLimit(others, COMPARE_CONCURRENCY, async (b) => {
    let cmp;
    try {
      cmp = await githubGet(`/repos/${repo}/compare/${DEFAULT_BRANCH}...${encodeRef(b.name)}`, ctx);
    } catch (e) {
      if (!isBranchLocal(e)) throw e;
      skipped.push({ name: b.name, detail: e.message });
      return null;
    }
    const aheadBy = Number(cmp && cmp.ahead_by) || 0;
    const behindBy = Number(cmp && cmp.behind_by) || 0;
    const commits = Array.isArray(cmp && cmp.commits) ? cmp.commits : [];
    let lastCommitAt = null;
    if (aheadBy > 0) {
      if (commits.length >= aheadBy) lastCommitAt = commitDate(commits[commits.length - 1]);
      else if (b.commit && b.commit.sha) {
        // The compare page was truncated (oldest commits first), so its last entry is not the head.
        try { lastCommitAt = commitDate(await githubGet(`/repos/${repo}/commits/${b.commit.sha}`, ctx)); }
        catch (e) { if (!isBranchLocal(e)) throw e; }
      }
    }
    return { name: b.name, aheadBy, behindBy, lastCommitAt };
  });
  const branches = [];
  const badges = {};
  for (const c of compared) {
    if (!c) continue;
    const pr = prByHead.get(c.name) || null;
    const lane = laneOfBranch(c.name);
    const status = classifyBranch({ aheadBy: c.aheadBy, pr, lastCommitAt: c.lastCommitAt, now: now(), staleDays });
    branches.push({ name: c.name, lane, status, aheadBy: c.aheadBy, behindBy: c.behindBy, lastCommitAt: c.lastCommitAt, pr });
    const tally = badges[lane] || (badges[lane] = { dead: 0, stale: 0, live: 0, working: 0 });
    tally[status.toLowerCase()] += 1;
  }
  return {
    repo, default: DEFAULT_BRANCH, branches, badges, skipped,
    truncated: (Array.isArray(branchList) ? branchList.length : 0) >= BRANCH_PAGE,
    fetchedAt: new Date(now()).toISOString(),
  };
}

/**
 * The drift board. With a token: one entry per repo, in order, each either the
 * full row set or { repo, status: 'DOWN', detail }. Without one: the single
 * object { status: 'NOT CONFIGURED', detail } and no network call at all.
 */
export async function buildDriftBoard({ repos = DRIFT_REPOS, token, fetchImpl = globalThis.fetch, now = () => Date.now(), staleDays = 7 } = {}) {
  if (!token || !String(token).trim()) return { status: 'NOT CONFIGURED', detail: NO_TOKEN_DETAIL };
  const tokenKey = createHash('sha256').update(String(token)).digest('hex').slice(0, 12);
  return Promise.all(repos.map(async (repo) => {
    const key = [repo, staleDays, tokenKey].join('|');
    const hit = cache.get(key);
    if (hit && now() - hit.at < DRIFT_CACHE_MS) return hit.value;
    try {
      const value = await readRepo(repo, { token: String(token).trim(), fetchImpl, now, staleDays });
      cache.set(key, { at: now(), value });
      return value;
    } catch (e) {
      return { repo, status: 'DOWN', detail: String((e && e.message) || e) };
    }
  }));
}
