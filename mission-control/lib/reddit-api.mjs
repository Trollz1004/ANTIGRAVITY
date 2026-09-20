/**
 * Reddit via the official API (specs/010-social-publish-pipeline, unit 3).
 *
 * Implements Reddit's documented OAuth2 authorization-code-with-refresh-token
 * flow (https://github.com/reddit-archive/reddit/wiki/OAuth2, read live for
 * this unit):
 *   - authorize:    GET  https://www.reddit.com/api/v1/authorize
 *                   (response_type=code, state, redirect_uri, duration,
 *                   scope)
 *   - token/refresh: POST https://www.reddit.com/api/v1/access_token
 *                   (HTTP Basic auth: client_id / client_secret;
 *                   grant_type=authorization_code|refresh_token)
 *   - API calls:    https://oauth.reddit.com/... with
 *                   `Authorization: bearer <token>`
 *
 * Never browser automation of a personal account — every call here is a
 * registered app's OAuth2 token against the documented API.
 *
 * Config (all four required; any one missing is "not configured", never a
 * silent guess): REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET,
 * REDDIT_REFRESH_TOKEN, REDDIT_USER_AGENT (a descriptive string naming the
 * business and a contact, per Reddit's API rules).
 *
 * Rate limiting is enforced on TWO independent local cooldowns before a
 * request is ever sent — one post per subreddit per 4 hours, one post per
 * hour overall — and Reddit's own `x-ratelimit-*` response headers are read
 * back into the result so a caller can see how much headroom Reddit itself
 * reports.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { executeManualHandoff } from './social-adapters.mjs';

export const AUTHORIZE_URL = 'https://www.reddit.com/api/v1/authorize';
export const TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
export const API_BASE = 'https://oauth.reddit.com';

export const PER_SUBREDDIT_COOLDOWN_MS = 4 * 60 * 60 * 1000; // one post per subreddit per 4h
export const OVERALL_COOLDOWN_MS = 60 * 60 * 1000; // one post per hour overall

export const REDDIT_ENV_VARS = ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET', 'REDDIT_REFRESH_TOKEN', 'REDDIT_USER_AGENT'];

/** Read the four required env vars; returns null (not a partial object) unless every one is present. */
export function getRedditConfig(envValue) {
  const clientId = envValue('REDDIT_CLIENT_ID');
  const clientSecret = envValue('REDDIT_CLIENT_SECRET');
  const refreshToken = envValue('REDDIT_REFRESH_TOKEN');
  const userAgent = envValue('REDDIT_USER_AGENT');
  if (!clientId || !clientSecret || !refreshToken || !userAgent) return null;
  return { clientId, clientSecret, refreshToken, userAgent };
}

export function redditConfigured(envValue) {
  return getRedditConfig(envValue) !== null;
}

/** GET https://www.reddit.com/api/v1/authorize?... — the URL Joshua opens once to grant access. */
export function buildAuthorizeUrl({ clientId, redirectUri, state, scope = 'submit identity', duration = 'permanent' }) {
  const u = new URL(AUTHORIZE_URL);
  u.searchParams.set('client_id', clientId);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('state', state);
  u.searchParams.set('redirect_uri', redirectUri);
  u.searchParams.set('duration', duration);
  u.searchParams.set('scope', scope);
  return u.toString();
}

function basicAuthHeader(clientId, clientSecret) {
  return 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
}

/** POST .../access_token with grant_type=authorization_code — the one-time exchange after the user's consent redirect. */
export async function exchangeCodeForToken({ clientId, clientSecret, code, redirectUri, userAgent, fetchImpl = globalThis.fetch }) {
  const r = await fetchImpl(TOKEN_URL, {
    method: 'POST',
    headers: {
      authorization: basicAuthHeader(clientId, clientSecret),
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': userAgent,
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }).toString(),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || j.error) return { ok: false, status: r.status, error: (j && j.error) || ('HTTP ' + r.status) };
  return { ok: true, accessToken: j.access_token, refreshToken: j.refresh_token, expiresIn: j.expires_in, scope: j.scope };
}

/** POST .../access_token with grant_type=refresh_token — run on every post; Reddit access tokens last ~1h. */
export async function refreshAccessToken({ clientId, clientSecret, refreshToken, userAgent, fetchImpl = globalThis.fetch }) {
  const r = await fetchImpl(TOKEN_URL, {
    method: 'POST',
    headers: {
      authorization: basicAuthHeader(clientId, clientSecret),
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': userAgent,
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }).toString(),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || j.error) return { ok: false, status: r.status, error: (j && j.error) || ('HTTP ' + r.status) };
  return { ok: true, accessToken: j.access_token, expiresIn: j.expires_in, scope: j.scope };
}

// ── local rate limiting (checked BEFORE any request reaches Reddit) ────────

/** Fresh, empty rate-limit state shape. */
export function emptyRateState() {
  return { lastPostAt: null, lastPostBySubreddit: {} };
}

/**
 * True/false + reason, checked before ever calling Reddit: one post per
 * subreddit per 4h, one post per hour overall. Never mutates `state`.
 */
export function canPostNow({ state, subreddit, now = () => new Date() }) {
  const st = state || emptyRateState();
  const t = now().getTime();
  if (st.lastPostAt) {
    const sinceOverall = t - new Date(st.lastPostAt).getTime();
    if (sinceOverall < OVERALL_COOLDOWN_MS) {
      return { ok: false, reason: `overall rate limit: last post ${Math.round(sinceOverall / 60000)}m ago, one per hour allowed`, retryAt: new Date(new Date(st.lastPostAt).getTime() + OVERALL_COOLDOWN_MS).toISOString() };
    }
  }
  const lastForSub = st.lastPostBySubreddit && st.lastPostBySubreddit[subreddit];
  if (lastForSub) {
    const sinceSub = t - new Date(lastForSub).getTime();
    if (sinceSub < PER_SUBREDDIT_COOLDOWN_MS) {
      return { ok: false, reason: `r/${subreddit} rate limit: last post ${Math.round(sinceSub / 60000)}m ago, one per 4h allowed`, retryAt: new Date(new Date(lastForSub).getTime() + PER_SUBREDDIT_COOLDOWN_MS).toISOString() };
    }
  }
  return { ok: true, reason: null };
}

/** Returns a NEW state object recording a successful post — never mutates the input. */
export function recordPost(state, subreddit, now = () => new Date()) {
  const st = state || emptyRateState();
  const iso = now().toISOString();
  return { lastPostAt: iso, lastPostBySubreddit: { ...(st.lastPostBySubreddit || {}), [subreddit]: iso } };
}

/** Extract Reddit's own ratelimit headers (informational; the local cooldowns above are the actual gate). */
export function readRateLimitHeaders(headers) {
  const get = (name) => (headers && typeof headers.get === 'function' ? headers.get(name) : (headers || {})[name]);
  const used = get('x-ratelimit-used');
  const remaining = get('x-ratelimit-remaining');
  const reset = get('x-ratelimit-reset');
  return {
    used: used != null ? Number(used) : null,
    remaining: remaining != null ? Number(remaining) : null,
    resetSeconds: reset != null ? Number(reset) : null,
  };
}

/** POST /api/submit as a self post. Returns {ok, url} or {ok:false, status, error}. */
export async function submitSelfPost({ accessToken, userAgent, subreddit, title, text, fetchImpl = globalThis.fetch }) {
  const r = await fetchImpl(`${API_BASE}/api/submit`, {
    method: 'POST',
    headers: {
      authorization: 'bearer ' + accessToken,
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': userAgent,
    },
    body: new URLSearchParams({ sr: subreddit, kind: 'self', title, text: text || '', api_type: 'json', resubmit: 'true' }).toString(),
  });
  const rateLimit = readRateLimitHeaders(r.headers);
  if (r.status === 403 || r.status === 429) {
    const body = await r.text().catch(() => '');
    return { ok: false, status: r.status, error: `Reddit ${r.status}: ${body.slice(0, 500)}`, rateLimit };
  }
  const j = await r.json().catch(() => null);
  const errors = j && j.json && Array.isArray(j.json.errors) ? j.json.errors : [];
  if (!r.ok || !j || errors.length) {
    return { ok: false, status: r.status, error: errors.length ? JSON.stringify(errors) : ('HTTP ' + r.status), rateLimit };
  }
  const data = j.json && j.json.data;
  const url = data && (data.url || (data.id ? `https://www.reddit.com/r/${subreddit}/comments/${data.id.replace(/^t3_/, '')}/` : null));
  return { ok: true, url: url || null, rateLimit };
}

/**
 * Full posting orchestration for one proposal: refresh the token, respect
 * the two local cooldowns, submit, and report the outcome. Never throws —
 * every branch returns a plain result object; the caller decides what state
 * transition that maps to.
 */
export async function postProposalToReddit({
  proposal, config, rateState, now = () => new Date(), fetchImpl = globalThis.fetch,
}) {
  const subreddit = proposal.subreddit || subredditFromTitle(proposal.title);
  if (!subreddit) return { ok: false, error: 'no subreddit given (proposal.subreddit or a "r/<name>" title)' };

  const gate = canPostNow({ state: rateState, subreddit, now });
  if (!gate.ok) return { ok: false, error: gate.reason, retryAt: gate.retryAt, rateLimited: true };

  const refreshed = await refreshAccessToken({
    clientId: config.clientId, clientSecret: config.clientSecret, refreshToken: config.refreshToken,
    userAgent: config.userAgent, fetchImpl,
  });
  if (!refreshed.ok) return { ok: false, error: 'token refresh failed: ' + refreshed.error, status: refreshed.status };

  const posted = await submitSelfPost({
    accessToken: refreshed.accessToken, userAgent: config.userAgent, subreddit,
    title: proposal.title, text: proposal.body, fetchImpl,
  });
  if (!posted.ok) return posted;

  return { ok: true, url: posted.url, subreddit, rateLimit: posted.rateLimit, nextRateState: recordPost(rateState, subreddit, now) };
}

/** Parse "r/dating" (or "/r/dating") out of a title/heading; null if absent. */
export function subredditFromTitle(title) {
  const m = /\br\/([A-Za-z0-9_]+)\b/.exec(String(title || ''));
  return m ? m[1] : null;
}

// ── persisted local rate-limit state (data/, gitignored) ───────────────────

export function readRateState(path, { readFile = readFileSync, exists = existsSync } = {}) {
  if (!exists(path)) return emptyRateState();
  try { return { ...emptyRateState(), ...JSON.parse(readFile(path, 'utf8')) }; } catch { return emptyRateState(); }
}

export function writeRateState(path, state, { writeFile = writeFileSync, mkdir = mkdirSync } = {}) {
  try { mkdir(dirname(path), { recursive: true }); writeFile(path, JSON.stringify(state), 'utf8'); } catch { /* a rate-state write failure must never crash the caller */ }
}

// ── setup-needed trigger (deduplicated by kind) ─────────────────────────────

/** Append one trigger line to TRIGGERS.jsonl unless a line with the same `kind` already exists. */
export function appendDedupedTrigger({ triggersPath, kind, text, readFile = readFileSync, exists = existsSync, appendFile = appendFileSync, mkdir = mkdirSync, now = () => new Date() }) {
  const append = appendFile;
  let already = false;
  if (exists(triggersPath)) {
    let content = '';
    try { content = readFile(triggersPath, 'utf8'); } catch { content = ''; }
    already = content.split(/\r?\n/).some((line) => {
      if (!line.trim()) return false;
      try { return JSON.parse(line).kind === kind; } catch { return false; }
    });
  }
  if (already) return { appended: false };
  mkdir(dirname(triggersPath), { recursive: true });
  const rec = { id: kind, kind, text, ts: now().toISOString() };
  append(triggersPath, JSON.stringify(rec) + '\n');
  return { appended: true, record: rec };
}

export const REDDIT_SETUP_TRIGGER_KIND = 'reddit_api_setup_needed';
export const REDDIT_SETUP_TRIGGER_TEXT = 'Reddit API app needed once: run drift reddit-setup';

/**
 * Adapter entry point for `socialAdapters.execute` when `proposal.platform
 * === 'reddit'`. Not configured -> writes the approved copy to the
 * marketing inbox and appends the deduplicated setup trigger, returns
 * {ok:false, error} prefixed "NOT CONFIGURED". Configured -> refreshes the
 * token, honors the two local cooldowns, and posts.
 */
export async function executeRedditAdapter({
  proposal, envValue, inboxDir, triggersPath, rateStatePath,
  fetchImpl = globalThis.fetch, now = () => new Date(), appendFile,
}) {
  const config = getRedditConfig(envValue);
  if (!config) {
    const handoff = executeManualHandoff({
      inboxDir, platform: 'reddit', id: proposal.id, title: proposal.title,
      body: proposal.body, brand: proposal.brand, date: now(),
    });
    appendDedupedTrigger({ triggersPath, kind: REDDIT_SETUP_TRIGGER_KIND, text: REDDIT_SETUP_TRIGGER_TEXT, now, appendFile });
    return {
      ok: false,
      error: 'NOT CONFIGURED: Reddit API app not set up — wrote the approved copy to ops/marketing-inbox/approved/ and filed a setup trigger (run `drift reddit-setup`)' + (handoff.ok ? '' : ' [handoff write also failed: ' + handoff.error + ']'),
      path: handoff.ok ? handoff.path : undefined,
    };
  }
  const rateState = readRateState(rateStatePath);
  const result = await postProposalToReddit({ proposal, config, rateState, now, fetchImpl });
  if (result.ok) {
    writeRateState(rateStatePath, result.nextRateState);
    return { ok: true, url: result.url };
  }
  return { ok: false, error: result.error, status: result.status };
}
