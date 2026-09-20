#!/usr/bin/env node
/**
 * `drift reddit-setup` (specs/010-social-publish-pipeline, unit 4).
 *
 * Run with no arguments: prints the one-time, plain-language steps Joshua
 * takes on reddit.com to register the app. Run with
 * `--client-id <id> --client-secret <secret>`: performs the local half of
 * Reddit's documented OAuth2 authorization-code flow — opens the browser
 * for his one-time consent, catches the redirect on http://localhost:8765,
 * exchanges the code for a refresh token, writes the four REDDIT_* lines
 * into C:\ANTIGRAVITY\.env WITHOUT ever printing them, and clears the
 * `reddit_api_setup_needed` trigger.
 *
 * Pure, testable pieces are exported functions; the network/browser/HTTP
 * orchestration only runs when this file is executed directly (`main()`,
 * guarded below), so `npx vitest` never opens a browser or a real port.
 */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { buildAuthorizeUrl, exchangeCodeForToken } from '../lib/reddit-api.mjs';
import { REDDIT_SETUP_TRIGGER_KIND } from '../lib/reddit-api.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO = join(HERE, '..', '..');
export const ENV_PATH = join(REPO, '.env');
export const TRIGGERS_PATH = join(REPO, 'ops', 'heartbeat', 'TRIGGERS.jsonl');
export const CALLBACK_PORT = 8765;
export const REDIRECT_URI = `http://localhost:${CALLBACK_PORT}/callback`;

export const SETUP_STEPS = [
  'Reddit API app setup (one time):',
  '',
  '  1. Open https://www.reddit.com/prefs/apps',
  '  2. Click "create another app..." (or "create app" if this is the first one).',
  '  3. Name it for the business, e.g. "youandinotai-marketing".',
  '  4. Choose type: "script" (simplest) or "web app" if you prefer.',
  `  5. Set the redirect uri to exactly: ${REDIRECT_URI}`,
  '  6. Click "create app". Copy the client id (under the app name) and the secret.',
  '',
  '  Then run:',
  '    drift reddit-setup --client-id <id> --client-secret <secret>',
  '',
  '  That opens your browser for a one-time consent click, catches the',
  '  callback locally, exchanges it for a refresh token, and writes',
  '  REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET / REDDIT_REFRESH_TOKEN /',
  '  REDDIT_USER_AGENT into .env. No token value is ever printed.',
].join('\n');

/** Parse CLI args of the shape --client-id X --client-secret Y. Pure. */
export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--client-id') out.clientId = argv[++i];
    else if (argv[i] === '--client-secret') out.clientSecret = argv[++i];
  }
  return out;
}

/**
 * Return an UPDATED .env file's text: each REDDIT_* key in `values` is
 * replaced in place if a line for it already exists, else appended. Every
 * other line is left untouched. Pure — never touches disk.
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
  // Drop a single trailing blank line so appended keys don't pile up gaps.
  while (out.length && out[out.length - 1] === '') out.pop();
  for (const key of remainingKeys) out.push(`${key}=${values[key]}`);
  return out.join('\n') + '\n';
}

/** Write REDDIT_* into .env without ever printing `values`. */
export function writeRedditEnv({ envPath = ENV_PATH, values, readFile = readFileSync, writeFile = writeFileSync, exists = existsSync }) {
  const existing = exists(envPath) ? readFile(envPath, 'utf8') : '';
  const updated = buildEnvUpdate(existing, values);
  writeFile(envPath, updated, 'utf8');
}

/** Filter every line matching `kind` out of a TRIGGERS.jsonl text. Pure. */
export function removeTriggerLines(text, kind) {
  return String(text || '')
    .split(/\r?\n/)
    .filter((line) => {
      if (!line.trim()) return false;
      try { return JSON.parse(line).kind !== kind; } catch { return true; }
    })
    .join('\n') + (String(text || '').trim() ? '\n' : '');
}

/** Clear the reddit_api_setup_needed trigger once setup succeeds. No-op if the file doesn't exist. */
export function clearRedditSetupTrigger({ triggersPath = TRIGGERS_PATH, readFile = readFileSync, writeFile = writeFileSync, exists = existsSync } = {}) {
  if (!exists(triggersPath)) return { cleared: false };
  const text = readFile(triggersPath, 'utf8');
  const updated = removeTriggerLines(text, REDDIT_SETUP_TRIGGER_KIND);
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

function openBrowser(url) {
  try {
    if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '""', url], { shell: false, stdio: 'ignore', detached: true });
    else if (process.platform === 'darwin') spawn('open', [url], { stdio: 'ignore', detached: true });
    else spawn('xdg-open', [url], { stdio: 'ignore', detached: true });
  } catch (e) {
    console.log('[reddit-setup] could not auto-open a browser (' + String((e && e.message) || e) + ') — open this URL manually:');
    console.log(url);
  }
}

/** Listen once on CALLBACK_PORT for the OAuth2 redirect, resolve with {code, state, error}. */
function waitForCallback({ port = CALLBACK_PORT, timeoutMs = 5 * 60 * 1000 } = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const server = createServer((req, res) => {
      const { code, state, error } = parseCallback(req.url);
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('<html><body><h3>You can close this tab.</h3><p>drift reddit-setup received the callback.</p></body></html>');
      clearTimeout(timer);
      server.close();
      if (error) rejectPromise(new Error('Reddit denied consent: ' + error));
      else if (!code) rejectPromise(new Error('callback had no code'));
      else resolvePromise({ code, state });
    });
    const timer = setTimeout(() => { server.close(); rejectPromise(new Error('timed out waiting for the Reddit consent callback')); }, timeoutMs);
    server.listen(port);
  });
}

async function main() {
  const { clientId, clientSecret } = parseArgs(process.argv.slice(2));
  if (!clientId || !clientSecret) {
    console.log(SETUP_STEPS);
    return;
  }
  const state = randomBytes(8).toString('hex');
  const authorizeUrl = buildAuthorizeUrl({ clientId, redirectUri: REDIRECT_URI, state });
  console.log('[reddit-setup] opening your browser for a one-time Reddit consent click...');
  console.log('[reddit-setup] if it does not open, visit:');
  console.log(authorizeUrl);
  openBrowser(authorizeUrl);

  let callback;
  try {
    callback = await waitForCallback();
  } catch (e) {
    console.error('[reddit-setup] ' + String((e && e.message) || e));
    process.exitCode = 1;
    return;
  }
  if (callback.state !== state) {
    console.error('[reddit-setup] state mismatch — aborting for safety.');
    process.exitCode = 1;
    return;
  }

  const userAgent = `web:youandinotai-marketing:v1.0 (by /u/joshlcoleman)`;
  const exchanged = await exchangeCodeForToken({ clientId, clientSecret, code: callback.code, redirectUri: REDIRECT_URI, userAgent });
  if (!exchanged.ok) {
    console.error('[reddit-setup] token exchange failed: ' + exchanged.error);
    process.exitCode = 1;
    return;
  }

  writeRedditEnv({
    values: {
      REDDIT_CLIENT_ID: clientId,
      REDDIT_CLIENT_SECRET: clientSecret,
      REDDIT_REFRESH_TOKEN: exchanged.refreshToken,
      REDDIT_USER_AGENT: userAgent,
    },
  });
  const cleared = clearRedditSetupTrigger();
  console.log('[reddit-setup] done — REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_REFRESH_TOKEN, REDDIT_USER_AGENT written to .env (values not shown).');
  console.log('[reddit-setup] setup trigger ' + (cleared.cleared ? 'cleared.' : 'was not present (nothing to clear).'));
}

const isMain = process.argv[1] && /reddit-setup\.mjs$/.test(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
  main().catch((e) => { console.error('[reddit-setup] ' + String((e && e.message) || e)); process.exitCode = 1; });
}
