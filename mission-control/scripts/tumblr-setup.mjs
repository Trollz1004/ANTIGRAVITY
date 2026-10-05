#!/usr/bin/env node
/**
 * `drift tumblr-setup` (companion to reddit-setup / devto-setup /
 * hashnode-setup / wordpress-setup / blogger-setup).
 *
 * Run with no arguments: prints the one-time, plain-language steps Joshua
 * takes on tumblr.com to register an OAuth1 application.
 *
 * Run with `--consumer-key <key> --consumer-secret <secret>
 *  [--blog-id <uuid>] [--callback-port <port>]`: performs the local half
 * of Tumblr's documented OAuth1 1.0a three-legged flow:
 *
 *   Phase 1:  POST https://www.tumblr.com/oauth/request_token
 *             (signed with consumer credentials, oauth_callback=localhost:<port>/callback)
 *             -> { oauth_token, oauth_token_secret }
 *   Phase 2:  open browser to https://www.tumblr.com/oauth/authorize?oauth_token=...
 *             user clicks Authorize -> redirect to http://localhost:<port>/callback
 *             with ?oauth_token=...&oauth_verifier=...
 *   Phase 3:  POST https://www.tumblr.com/oauth/access_token
 *             (signed with consumer + request_token + oauth_verifier)
 *             -> { oauth_token, oauth_token_secret }   <-- the PERMANENT pair
 *   Phase 4:  GET https://api.tumblr.com/v2/user/info (signed)
 *             -> list of blogs. Pick the first uuid if --blog-id is not given.
 *   Phase 5:  write SEO_ANT_TUMBLR_CONSUMER_KEY + CONSUMER_SECRET +
 *             TOKEN + TOKEN_SECRET + BLOG_ID into .env. NO secret value
 *             is ever logged.
 *
 * Pure, testable pieces are exported; the network/browser/HTTP
 * orchestration only runs when this file is executed directly.
 */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHmac, randomBytes } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO = join(HERE, '..', '..');
export const ENV_PATH = join(REPO, '.env');
export const TRIGGERS_PATH = join(REPO, 'ops', 'heartbeat', 'TRIGGERS.jsonl');
export const DEFAULT_CALLBACK_PORT = 8767;
export const REQUEST_TOKEN_URL = 'https://www.tumblr.com/oauth/request_token';
export const AUTHORIZE_URL = 'https://www.tumblr.com/oauth/authorize';
export const ACCESS_TOKEN_URL = 'https://www.tumblr.com/oauth/access_token';
export const USER_INFO_URL = 'https://api.tumblr.com/v2/user/info';

const TOKEN_ENV_KEYS = [
  'SEO_ANT_TUMBLR_CONSUMER_KEY',
  'SEO_ANT_TUMBLR_CONSUMER_SECRET',
  'SEO_ANT_TUMBLR_TOKEN',
  'SEO_ANT_TUMBLR_TOKEN_SECRET',
  'SEO_ANT_TUMBLR_BLOG_ID',
];

export const SETUP_STEPS = [
  'Tumblr OAuth1 setup (one time):',
  '',
  '  1. Open https://www.tumblr.com/oauth/apps and sign in (or create a',
  '     free Tumblr account).',
  '  2. Click "Register an application". Fill in the form:',
  '       Application Name: "youandinotai-marketing"',
  '       Application Website: https://youandinotai.com',
  `       Default Callback URL: http://localhost:${DEFAULT_CALLBACK_PORT}/callback`,
  '       Application Description: one line about marketing the dating app',
  '  3. After registering, the next page shows your "OAuth Consumer Key"',
  '     and "Secret Key". Copy both.',
  '  4. Create (or pick) the Tumblr blog you want to publish to. The',
  '     wizard will auto-detect its UUID. Override with --blog-id <uuid>',
  '     if you have more than one blog and want a specific one.',
  '',
  '  Then run:',
  '    drift tumblr-setup --consumer-key <ck> --consumer-secret <cs> [--blog-id <uuid>]',
  '',
  '  That performs the OAuth1 1.0a three-legged flow: fetches a request',
  '  token, opens your browser for one-time Tumblr consent, catches the',
  '  callback locally, exchanges for the permanent token pair, fetches',
  '  /v2/user/info to pick the blog UUID, and writes',
  '  SEO_ANT_TUMBLR_CONSUMER_KEY + SEO_ANT_TUMBLR_CONSUMER_SECRET +',
  '  SEO_ANT_TUMBLR_TOKEN + SEO_ANT_TUMBLR_TOKEN_SECRET +',
  '  SEO_ANT_TUMBLR_BLOG_ID into .env. NO secret value is ever printed.',
].join('\n');

/** Parse CLI args. Pure. */
export function parseArgs(argv) {
  const out = { callbackPort: DEFAULT_CALLBACK_PORT };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--consumer-key') out.consumerKey = argv[++i];
    else if (a === '--consumer-secret') out.consumerSecret = argv[++i];
    else if (a === '--blog-id') out.blogId = argv[++i];
    else if (a === '--callback-port') out.callbackPort = parseInt(argv[++i], 10) || DEFAULT_CALLBACK_PORT;
  }
  return out;
}

/** RFC 3986 percent-encoding, mirroring post.mjs's pctEncode exactly. */
export function pctEncode(s) {
  return encodeURIComponent(String(s)).replace(/[!*'()]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

/**
 * Build the OAuth1 Authorization header for a given request. Mirrors
 * scripts/seo/post.mjs's oauth1Header so the wizard and the publisher
 * sign identically.
 */
export function oauth1Header({ method, url, bodyParams = {}, consumerKey, consumerSecret, token, tokenSecret, oauthParams: extraOauthParams = {} }) {
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_version: '1.0',
    ...extraOauthParams,
  };
  if (token) oauthParams.oauth_token = token;
  const allParams = { ...oauthParams, ...bodyParams };
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${pctEncode(k)}=${pctEncode(String(allParams[k]))}`)
    .join('&');
  const baseString = [method.toUpperCase(), pctEncode(url), pctEncode(paramString)].join('&');
  const signingKey = `${pctEncode(consumerSecret)}&${pctEncode(tokenSecret || '')}`;
  const signature = createHmac('sha1', signingKey).update(baseString).digest('base64');
  const headerParams = { ...oauthParams, oauth_signature: signature };
  return 'OAuth ' + Object.keys(headerParams)
    .sort()
    .map((k) => `${pctEncode(k)}="${pctEncode(headerParams[k])}"`)
    .join(', ');
}

/**
 * Return an UPDATED .env file's text: each key in `values` is replaced in
 * place if a line for it already exists, else appended. Other lines
 * untouched. Pure — never touches disk.
 */
export function buildEnvUpdate(existingText, values) {
  const lines = String(existingText || '').split(/\r?\n/);
  const remainingKeys = new Set(Object.keys(values));
  const out = lines.map((line) => {
    const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(line);
    if (m && remainingKeys.has(m[1])) {
      const key = m[1];
      remainingKeys.delete(key);
      return `${key}=${values[key]}`;
    }
    return line;
  });
  while (out.length && out[out.length - 1] === '') out.pop();
  for (const key of remainingKeys) out.push(`${key}=${values[key]}`);
  return out.join('\n') + '\n';
}

/** Write the Tumblr keys into .env without ever printing `values`. */
export function writeTumblrEnv({ envPath = ENV_PATH, values, readFile = readFileSync, writeFile = writeFileSync, exists = existsSync } = {}) {
  const existing = exists(envPath) ? readFile(envPath, 'utf8') : '';
  const updated = buildEnvUpdate(existing, values);
  writeFile(envPath, updated, 'utf8');
}

/** Filter every trigger line matching `kind` out of a TRIGGERS.jsonl text. Pure. */
export function removeTriggerLines(text, kind) {
  return String(text || '')
    .split(/\r?\n/)
    .filter((line) => {
      if (!line.trim()) return false;
      try { return JSON.parse(line).kind !== kind; } catch { return true; }
    })
    .join('\n') + (String(text || '').trim() ? '\n' : '');
}

/** Clear the tumblr setup trigger if present. */
export function clearTumblrSetupTrigger({ triggersPath = TRIGGERS_PATH, readFile = readFileSync, writeFile = writeFileSync, exists = existsSync } = {}) {
  if (!exists(triggersPath)) return { cleared: false };
  const text = readFile(triggersPath, 'utf8');
  const updated = removeTriggerLines(text, 'tumblr_api_setup_needed');
  if (updated === text) return { cleared: false };
  writeFile(triggersPath, updated, 'utf8');
  return { cleared: true };
}

/** Parse an OAuth1 form-encoded response (key=value&key=value). Pure. */
export function parseOAuth1Response(text) {
  const out = {};
  if (!text) return out;
  for (const part of String(text).split('&')) {
    const [k, v] = part.split('=');
    if (k) out[decodeURIComponent(k)] = v == null ? '' : decodeURIComponent(v);
  }
  return out;
}

/**
 * Phase 1: fetch a request_token from Tumblr. Pure-ish; takes an injected
 * fetch and a callback URL (passed as oauth_callback in the form-encoded
 * body, per OAuth1 1.0a three-legged flow).
 */
export async function fetchRequestToken({ consumerKey, consumerSecret, callbackUrl, fetchFn = fetch, url = REQUEST_TOKEN_URL } = {}) {
  if (!consumerKey || !consumerSecret || !callbackUrl) {
    return { ok: false, error: 'missing consumerKey, consumerSecret, or callbackUrl' };
  }
  const body = new URLSearchParams({ oauth_callback: callbackUrl }).toString();
  const headers = {
    'content-type': 'application/x-www-form-urlencoded',
    Authorization: oauth1Header({
      method: 'POST', url, bodyParams: { oauth_callback: callbackUrl },
      consumerKey, consumerSecret, tokenSecret: '',
    }),
  };
  try {
    const res = await fetchFn(url, { method: 'POST', headers, body });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `tumblr returned HTTP ${res.status}: ${text.slice(0, 200)}` };
    const parsed = parseOAuth1Response(text);
    if (!parsed.oauth_token || !parsed.oauth_token_secret) {
      return { ok: false, error: 'response missing oauth_token/oauth_token_secret: ' + text.slice(0, 200) };
    }
    return { ok: true, oauthToken: parsed.oauth_token, oauthTokenSecret: parsed.oauth_token_secret, callbackConfirmed: parsed.oauth_callback_confirmed };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}

/** Build the /oauth/authorize URL the user must click. Pure. */
export function buildAuthorizeUrl({ requestToken, url = AUTHORIZE_URL } = {}) {
  const params = new URLSearchParams({ oauth_token: requestToken });
  return `${url}?${params.toString()}`;
}

/** Parse the OAuth1 callback URL's query string. Pure. */
export function parseCallback(requestUrl, port = DEFAULT_CALLBACK_PORT) {
  const u = new URL(requestUrl, `http://localhost:${port}`);
  return {
    oauthToken: u.searchParams.get('oauth_token'),
    oauthVerifier: u.searchParams.get('oauth_verifier'),
    error: u.searchParams.get('error') || u.searchParams.get('denied'),
  };
}

/**
 * Phase 3: exchange the request_token + oauth_verifier for the permanent
 * token pair. Pure-ish. The oauth_verifier goes in the form-encoded body,
 * per OAuth1 1.0a three-legged flow.
 */
export async function fetchAccessToken({ consumerKey, consumerSecret, oauthToken, oauthTokenSecret, oauthVerifier, fetchFn = fetch, url = ACCESS_TOKEN_URL } = {}) {
  if (!consumerKey || !consumerSecret || !oauthToken || !oauthTokenSecret || !oauthVerifier) {
    return { ok: false, error: 'missing one of: consumerKey, consumerSecret, oauthToken, oauthTokenSecret, oauthVerifier' };
  }
  const body = new URLSearchParams({ oauth_verifier: oauthVerifier }).toString();
  const headers = {
    'content-type': 'application/x-www-form-urlencoded',
    Authorization: oauth1Header({
      method: 'POST', url, bodyParams: { oauth_verifier: oauthVerifier },
      consumerKey, consumerSecret, token: oauthToken, tokenSecret: oauthTokenSecret,
    }),
  };
  try {
    const res = await fetchFn(url, { method: 'POST', headers, body });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `tumblr returned HTTP ${res.status}: ${text.slice(0, 200)}` };
    const parsed = parseOAuth1Response(text);
    if (!parsed.oauth_token || !parsed.oauth_token_secret) {
      return { ok: false, error: 'response missing oauth_token/oauth_token_secret: ' + text.slice(0, 200) };
    }
    return { ok: true, oauthToken: parsed.oauth_token, oauthTokenSecret: parsed.oauth_token_secret };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}

/**
 * Phase 4: fetch /v2/user/info with the permanent token pair, return the
 * list of blogs (each has { uuid, name, url, title }). Pure-ish.
 */
export async function fetchUserInfo({ consumerKey, consumerSecret, oauthToken, oauthTokenSecret, fetchFn = fetch, url = USER_INFO_URL } = {}) {
  if (!consumerKey || !consumerSecret || !oauthToken || !oauthTokenSecret) {
    return { ok: false, error: 'missing one of: consumerKey, consumerSecret, oauthToken, oauthTokenSecret' };
  }
  const headers = {
    Authorization: oauth1Header({
      method: 'GET', url, bodyParams: {},
      consumerKey, consumerSecret, token: oauthToken, tokenSecret: oauthTokenSecret,
    }),
  };
  try {
    const res = await fetchFn(url, { method: 'GET', headers });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: `tumblr returned HTTP ${res.status}: ${JSON.stringify(body).slice(0, 200)}` };
    const blogs = body && body.response && body.response.user && Array.isArray(body.response.user.blogs)
      ? body.response.user.blogs.map((b) => ({ uuid: b.uuid, name: b.name, url: b.url, title: b.title }))
      : [];
    return { ok: true, blogs, count: blogs.length };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}

function openBrowser(url) {
  try {
    if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '""', url], { shell: false, stdio: 'ignore', detached: true });
    else if (process.platform === 'darwin') spawn('open', [url], { stdio: 'ignore', detached: true });
    else spawn('xdg-open', [url], { stdio: 'ignore', detached: true });
  } catch (e) {
    console.log('[tumblr-setup] could not auto-open a browser (' + String((e && e.message) || e) + ') — open this URL manually:');
    console.log(url);
  }
}

/** Listen once on `port` for the OAuth1 callback. */
function waitForCallback({ port = DEFAULT_CALLBACK_PORT, timeoutMs = 5 * 60 * 1000 } = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const server = createServer((req, res) => {
      const parsed = parseCallback(req.url, port);
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('<html><body><h3>You can close this tab.</h3><p>drift tumblr-setup received the callback.</p></body></html>');
      clearTimeout(timer);
      server.close();
      if (parsed.error) rejectPromise(new Error('Tumblr denied consent: ' + parsed.error));
      else if (!parsed.oauthVerifier) rejectPromise(new Error('callback had no oauth_verifier'));
      else resolvePromise(parsed);
    });
    const timer = setTimeout(() => { server.close(); rejectPromise(new Error('timed out waiting for the Tumblr consent callback')); }, timeoutMs);
    server.listen(port);
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.consumerKey || !args.consumerSecret) {
    console.log(SETUP_STEPS);
    return;
  }
  const port = args.callbackPort;
  const callbackUrl = `http://localhost:${port}/callback`;
  console.log('[tumblr-setup] phase 1/4: fetching request_token...');
  const reqTok = await fetchRequestToken({
    consumerKey: args.consumerKey,
    consumerSecret: args.consumerSecret,
    callbackUrl,
  });
  if (!reqTok.ok) {
    console.error('[tumblr-setup] request_token failed: ' + reqTok.error);
    console.error('[tumblr-setup] NO value was written to .env.');
    process.exitCode = 1;
    return;
  }
  console.log(`[tumblr-setup] request_token obtained (callback_confirmed=${reqTok.callbackConfirmed || 'n/a'}).`);

  const authorizeUrl = buildAuthorizeUrl({ requestToken: reqTok.oauthToken });
  console.log('[tumblr-setup] phase 2/4: opening your browser for a one-time Tumblr consent click...');
  console.log('[tumblr-setup] if it does not open, visit:');
  console.log(authorizeUrl);
  openBrowser(authorizeUrl);

  let callback;
  try {
    callback = await waitForCallback({ port });
  } catch (e) {
    console.error('[tumblr-setup] ' + String((e && e.message) || e));
    process.exitCode = 1;
    return;
  }
  if (callback.oauthToken !== reqTok.oauthToken) {
    console.error('[tumblr-setup] oauth_token mismatch on callback — aborting for safety.');
    process.exitCode = 1;
    return;
  }
  console.log('[tumblr-setup] phase 3/4: exchanging for permanent access_token...');
  const accTok = await fetchAccessToken({
    consumerKey: args.consumerKey,
    consumerSecret: args.consumerSecret,
    oauthToken: reqTok.oauthToken,
    oauthTokenSecret: reqTok.oauthTokenSecret,
    oauthVerifier: callback.oauthVerifier,
  });
  if (!accTok.ok) {
    console.error('[tumblr-setup] access_token exchange failed: ' + accTok.error);
    console.error('[tumblr-setup] NO value was written to .env.');
    process.exitCode = 1;
    return;
  }
  console.log('[tumblr-setup] phase 4/4: validating scope via /v2/user/info...');
  let blogId = args.blogId;
  if (!blogId) {
    const info = await fetchUserInfo({
      consumerKey: args.consumerKey,
      consumerSecret: args.consumerSecret,
      oauthToken: accTok.oauthToken,
      oauthTokenSecret: accTok.oauthTokenSecret,
    });
    if (!info.ok) {
      console.error('[tumblr-setup] user/info failed: ' + info.error);
      console.error('[tumblr-setup] NO value was written to .env.');
      process.exitCode = 1;
      return;
    }
    if (!info.blogs.length) {
      console.error('[tumblr-setup] token is valid but you have no Tumblr blogs. Create one at https://www.tumblr.com/new first.');
      console.error('[tumblr-setup] NO value was written to .env.');
      process.exitCode = 1;
      return;
    }
    blogId = info.blogs[0].uuid;
    console.log(`[tumblr-setup] picked first blog: "${info.blogs[0].title || info.blogs[0].name || blogId}" (${info.count} total).`);
  }

  writeTumblrEnv({
    values: {
      'SEO_ANT_TUMBLR_CONSUMER_KEY': args.consumerKey,
      'SEO_ANT_TUMBLR_CONSUMER_SECRET': args.consumerSecret,
      'SEO_ANT_TUMBLR_TOKEN': accTok.oauthToken,
      'SEO_ANT_TUMBLR_TOKEN_SECRET': accTok.oauthTokenSecret,
      'SEO_ANT_TUMBLR_BLOG_ID': blogId,
    },
  });
  const cleared = clearTumblrSetupTrigger();
  console.log('[tumblr-setup] 5 SEO_ANT_TUMBLR_* keys written to .env (values not shown).');
  console.log('[tumblr-setup] setup trigger ' + (cleared.cleared ? 'cleared.' : 'was not present (nothing to clear).'));
}

const isMain = process.argv[1] && /tumblr-setup\.mjs$/.test(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
  main().catch((e) => { console.error('[tumblr-setup] ' + String((e && e.message) || e)); process.exitCode = 1; });
}
