#!/usr/bin/env node
/**
 * `drift blogger-setup` (companion to reddit-setup / devto-setup /
 * hashnode-setup / wordpress-setup).
 *
 * Run with no arguments: prints the one-time, plain-language steps Joshua
 * takes on Google Cloud Console to register an OAuth2 web app with the
 * Blogger API scope, then performs the local half of Google's documented
 * OAuth2 authorization-code flow:
 *
 *   --client-id <id> --client-secret <secret> [--blog-id <id>]
 *
 * - Opens the browser to Google's consent URL with the blogger scope
 *   and a localhost callback (port 8766).
 * - Catches the redirect on http://localhost:8766/callback, validates
 *   the state, exchanges the code for an access_token + refresh_token
 *   against https://oauth2.googleapis.com/token.
 * - Validates the access_token by calling
 *     GET https://www.googleapis.com/blogger/v3/users/me/blogs
 *   to confirm the scope is granted and to capture the blog ID (if Joshua
 *   did not pass --blog-id).
 * - Writes SEO_ANT_BLOGGER_TOKEN (the access_token) +
 *   SEO_ANT_BLOGGER_REFRESH_TOKEN + SEO_ANT_BLOGGER_BLOG_ID into
 *   C:\ANTIGRAVITY\.env WITHOUT ever printing them. NO secret value is
 *   ever logged.
 *
 * Pure, testable pieces are exported; the network/browser/HTTP
 * orchestration only runs when this file is executed directly.
 */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO = join(HERE, '..', '..');
export const ENV_PATH = join(REPO, '.env');
export const TRIGGERS_PATH = join(REPO, 'ops', 'heartbeat', 'TRIGGERS.jsonl');
export const CALLBACK_PORT = 8766;
export const REDIRECT_URI = `http://localhost:${CALLBACK_PORT}/callback`;
export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const BLOGGER_LIST_BLOGS_URL = 'https://www.googleapis.com/blogger/v3/users/me/blogs';
const TOKEN_ENV_KEY = 'SEO_ANT_BLOGGER_TOKEN';
const REFRESH_ENV_KEY = 'SEO_ANT_BLOGGER_REFRESH_TOKEN';
const BLOG_ID_ENV_KEY = 'SEO_ANT_BLOGGER_BLOG_ID';
const SCOPE = 'https://www.googleapis.com/auth/blogger';

export const SETUP_STEPS = [
  'Blogger (Google API) OAuth2 setup (one time):',
  '',
  '  1. Open https://console.cloud.google.com and sign in (or create a',
  '     free Google account).',
  '  2. Create (or pick) a project. Enable the "Blogger API v3" for it',
  '     under APIs & Services -> Library.',
  '  3. APIs & Services -> OAuth consent screen: configure it as',
  '     "External", add your Google account as a test user.',
  '  4. APIs & Services -> Credentials -> Create Credentials -> OAuth',
  '     client ID. Choose Application type: "Web application". Set the',
  '     Authorized redirect URI to exactly:',
  `         ${REDIRECT_URI}`,
  '  5. Copy the client_id and client_secret the form gives you.',
  '  6. Create (or pick) a Blogger blog at https://www.blogger.com (it',
  '     comes free with every Google account). The wizard will auto-',
  '     detect its ID. Override with --blog-id <id> if you have more',
  '     than one and want a specific one.',
  '',
  '  Then run:',
  '    drift blogger-setup --client-id <id> --client-secret <secret> [--blog-id <id>]',
  '',
  '  That opens your browser for a one-time Google consent click',
  '  (granting the Blogger scope), catches the callback locally,',
  '  exchanges it for an access_token + refresh_token, validates the',
  '  scope against /blogger/v3/users/me/blogs, and writes',
  '  SEO_ANT_BLOGGER_TOKEN + SEO_ANT_BLOGGER_REFRESH_TOKEN +',
  '  SEO_ANT_BLOGGER_BLOG_ID into .env. NO secret value is ever printed.',
].join('\n');

/** Parse CLI args. Pure. */
export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--client-id') out.clientId = argv[++i];
    else if (a === '--client-secret') out.clientSecret = argv[++i];
    else if (a === '--blog-id') out.blogId = argv[++i];
  }
  return out;
}

/** Build the Google consent URL. Pure. */
export function buildAuthorizeUrl({ clientId, redirectUri, state, scope = SCOPE }) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope,
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/** Build the form body for the OAuth2 code-exchange call. Pure. */
export function buildTokenRequestBody({ clientId, clientSecret, code, redirectUri }) {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });
  return params.toString();
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

/** Write the Blogger keys into .env without ever printing `values`. */
export function writeBloggerEnv({ envPath = ENV_PATH, values, readFile = readFileSync, writeFile = writeFileSync, exists = existsSync } = {}) {
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

/** Clear the blogger setup trigger if present. */
export function clearBloggerSetupTrigger({ triggersPath = TRIGGERS_PATH, readFile = readFileSync, writeFile = writeFileSync, exists = existsSync } = {}) {
  if (!exists(triggersPath)) return { cleared: false };
  const text = readFile(triggersPath, 'utf8');
  const updated = removeTriggerLines(text, 'blogger_api_setup_needed');
  if (updated === text) return { cleared: false };
  writeFile(triggersPath, updated, 'utf8');
  return { cleared: true };
}

/** Parse the OAuth2 redirect's query string into {code, state, error}. Pure. */
export function parseCallback(requestUrl) {
  const u = new URL(requestUrl, `http://localhost:${CALLBACK_PORT}`);
  return {
    code: u.searchParams.get('code'),
    state: u.searchParams.get('state'),
    error: u.searchParams.get('error'),
  };
}

/**
 * Exchange the auth code for an access_token + refresh_token. Pure-ish;
 * takes an injected fetch.
 */
export async function exchangeCodeForToken({ clientId, clientSecret, code, redirectUri, fetchFn = fetch, url = GOOGLE_TOKEN_URL } = {}) {
  if (!clientId || !clientSecret || !code) {
    return { ok: false, error: 'missing one of: clientId, clientSecret, code' };
  }
  const body = buildTokenRequestBody({ clientId, clientSecret, code, redirectUri });
  try {
    const res = await fetchFn(url, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errDesc = (json && (json.error_description || json.error)) || `HTTP ${res.status}`;
      return { ok: false, error: errDesc };
    }
    if (!json.access_token) {
      return { ok: false, error: 'no access_token in response' };
    }
    return { ok: true, accessToken: json.access_token, refreshToken: json.refresh_token || null };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}

/**
 * Validate an access_token + list the user's blogs. Returns
 * { ok, blogs: [{id, name, url}], count } or { ok:false, error }.
 */
export async function listBlogs({ token, fetchFn = fetch, url = BLOGGER_LIST_BLOGS_URL } = {}) {
  if (!token) return { ok: false, error: 'no token' };
  try {
    const res = await fetchFn(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status !== 200) {
      return { ok: false, error: `Blogger API returned HTTP ${res.status}` };
    }
    const body = await res.json();
    const items = body && body.items && Array.isArray(body.items) ? body.items : [];
    const blogs = items.map((b) => ({ id: b.id, name: b.name || null, url: b.url || null }));
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
    console.log('[blogger-setup] could not auto-open a browser (' + String((e && e.message) || e) + ') — open this URL manually:');
    console.log(url);
  }
}

/** Listen once on CALLBACK_PORT for the OAuth2 redirect. */
function waitForCallback({ port = CALLBACK_PORT, timeoutMs = 5 * 60 * 1000 } = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const server = createServer((req, res) => {
      const { code, state, error } = parseCallback(req.url);
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('<html><body><h3>You can close this tab.</h3><p>drift blogger-setup received the callback.</p></body></html>');
      clearTimeout(timer);
      server.close();
      if (error) rejectPromise(new Error('Google denied consent: ' + error));
      else if (!code) rejectPromise(new Error('callback had no code'));
      else resolvePromise({ code, state });
    });
    const timer = setTimeout(() => { server.close(); rejectPromise(new Error('timed out waiting for the Google consent callback')); }, timeoutMs);
    server.listen(port);
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.clientId || !args.clientSecret) {
    console.log(SETUP_STEPS);
    return;
  }
  const state = randomBytes(8).toString('hex');
  const authorizeUrl = buildAuthorizeUrl({ clientId: args.clientId, redirectUri: REDIRECT_URI, state });
  console.log('[blogger-setup] opening your browser for a one-time Google consent click...');
  console.log('[blogger-setup] if it does not open, visit:');
  console.log(authorizeUrl);
  openBrowser(authorizeUrl);

  let callback;
  try {
    callback = await waitForCallback();
  } catch (e) {
    console.error('[blogger-setup] ' + String((e && e.message) || e));
    process.exitCode = 1;
    return;
  }
  if (callback.state !== state) {
    console.error('[blogger-setup] state mismatch — aborting for safety.');
    process.exitCode = 1;
    return;
  }

  console.log('[blogger-setup] exchanging auth code for access_token + refresh_token...');
  const tok = await exchangeCodeForToken({
    clientId: args.clientId,
    clientSecret: args.clientSecret,
    code: callback.code,
    redirectUri: REDIRECT_URI,
  });
  if (!tok.ok) {
    console.error('[blogger-setup] token exchange failed: ' + tok.error);
    console.error('[blogger-setup] NO value was written to .env.');
    process.exitCode = 1;
    return;
  }
  if (!tok.refreshToken) {
    console.error('[blogger-setup] no refresh_token in the response. This happens when Google has already granted the scope; re-run with prompt=consent forced by revoking https://myaccount.google.com/permissions first.');
    console.error('[blogger-setup] NO value was written to .env.');
    process.exitCode = 1;
    return;
  }

  let blogId = args.blogId;
  if (!blogId) {
    console.log('[blogger-setup] listing blogs via /blogger/v3/users/me/blogs...');
    const listing = await listBlogs({ token: tok.accessToken });
    if (!listing.ok) {
      console.error('[blogger-setup] could not list blogs: ' + listing.error);
      console.error('[blogger-setup] NO value was written to .env.');
      process.exitCode = 1;
      return;
    }
    if (!listing.blogs.length) {
      console.error('[blogger-setup] token is valid but you have no Blogger blogs. Create one at https://www.blogger.com first.');
      console.error('[blogger-setup] NO value was written to .env.');
      process.exitCode = 1;
      return;
    }
    blogId = listing.blogs[0].id;
    console.log(`[blogger-setup] picked first blog: "${listing.blogs[0].name || blogId}" (${listing.count} total).`);
  }

  writeBloggerEnv({
    values: {
      [TOKEN_ENV_KEY]: tok.accessToken,
      [REFRESH_ENV_KEY]: tok.refreshToken,
      [BLOG_ID_ENV_KEY]: blogId,
    },
  });
  const cleared = clearBloggerSetupTrigger();
  console.log(`[blogger-setup] ${TOKEN_ENV_KEY} + ${REFRESH_ENV_KEY} + ${BLOG_ID_ENV_KEY} written to .env (values not shown).`);
  console.log('[blogger-setup] setup trigger ' + (cleared.cleared ? 'cleared.' : 'was not present (nothing to clear).'));
}

const isMain = process.argv[1] && /blogger-setup\.mjs$/.test(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
  main().catch((e) => { console.error('[blogger-setup] ' + String((e && e.message) || e)); process.exitCode = 1; });
}
