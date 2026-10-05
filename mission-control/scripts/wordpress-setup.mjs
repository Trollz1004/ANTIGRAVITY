#!/usr/bin/env node
/**
 * `drift wordpress-setup` (companion to reddit-setup / devto-setup / hashnode-setup).
 *
 * Run with no arguments: prints the one-time, plain-language steps Joshua
 * takes on WordPress.com to register an app and obtain an access token.
 *
 * Run with `--client-id <id> --client-secret <secret> --username <user>
 *  --password <app-password> [--site <host>]`: performs the local half of
 * WordPress.com's documented OAuth2 password-grant flow (the only grant
 * that does not require an interactive browser consent page when the user
 * is the app owner), calls
 *   GET https://public-api.wordpress.com/rest/v1.1/sites/<host>/me
 * to validate the token + site, and writes SEO_ANT_WORDPRESS_TOKEN +
 * SEO_ANT_WORDPRESS_SITE into C:\ANTIGRAVITY\.env WITHOUT ever printing
 * any of the four inputs. It also clears any setup_needed trigger.
 *
 * Pure, testable pieces are exported; the network call only runs when this
 * file is executed directly (main(), guarded below).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO = join(HERE, '..', '..');
export const ENV_PATH = join(REPO, '.env');
export const TRIGGERS_PATH = join(REPO, 'ops', 'heartbeat', 'TRIGGERS.jsonl');
export const WP_TOKEN_URL = 'https://public-api.wordpress.com/oauth2/token';
export const WP_REST_BASE = 'https://public-api.wordpress.com/rest/v1.1';
const TOKEN_ENV_KEY = 'SEO_ANT_WORDPRESS_TOKEN';
const SITE_ENV_KEY = 'SEO_ANT_WORDPRESS_SITE';

export const SETUP_STEPS = [
  'WordPress.com API token + site setup (one time):',
  '',
  '  1. Open https://developer.wordpress.com/apps and sign in',
  '     (or create a free account with any email).',
  '  2. Click "Create New Application". Name it',
  '     "youandinotai-marketing". Set the redirect URL to',
  '     https://localhost/callback (the wizard does not use it, but the',
  '     form requires one).',
  '  3. Copy the client_id and client_secret the form gives you.',
  '  4. Enable 2FA on your WordPress.com account if it is not already,',
  '     then create an Application Password at',
  '     https://wordpress.com/me/security (under "Application Passwords").',
  '     Give it any name; copy the 24-character password the site shows',
  '     (it is shown only once).',
  '',
  '  Then run:',
  '    drift wordpress-setup --client-id <id> --client-secret <secret> \\',
  '                           --username <wpcom-email> --password <24-char-app-password> \\',
  '                           [--site <host-or-site-id>]',
  '',
  '  The wizard uses WordPress.com\'s documented OAuth2 password grant to',
  '  exchange your app credentials for an access_token, validates the',
  '  token against the sites you own (or the --site you passed), and',
  '  writes SEO_ANT_WORDPRESS_TOKEN + SEO_ANT_WORDPRESS_SITE into .env.',
  '  NO secret value (client_id, client_secret, password, access_token) is',
  '  ever printed. Future runs of scripts/seo/post.mjs --platform wordpress',
  '  will publish approved drafts automatically.',
].join('\n');

/** Parse CLI args. Pure. */
export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--client-id') out.clientId = argv[++i];
    else if (a === '--client-secret') out.clientSecret = argv[++i];
    else if (a === '--username') out.username = argv[++i];
    else if (a === '--password') out.password = argv[++i];
    else if (a === '--site') out.site = argv[++i];
  }
  return out;
}

/** Build the form body for the OAuth2 password-grant call. Pure. */
export function buildTokenRequestBody({ clientId, clientSecret, username, password }) {
  const params = new URLSearchParams();
  params.set('client_id', clientId);
  params.set('client_secret', clientSecret);
  params.set('grant_type', 'password');
  params.set('username', username);
  params.set('password', password);
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

/** Write the WordPress keys into .env without ever printing `values`. */
export function writeWordpressEnv({ envPath = ENV_PATH, values, readFile = readFileSync, writeFile = writeFileSync, exists = existsSync } = {}) {
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

/** Clear the wordpress setup trigger if present. */
export function clearWordpressSetupTrigger({ triggersPath = TRIGGERS_PATH, readFile = readFileSync, writeFile = writeFileSync, exists = existsSync } = {}) {
  if (!exists(triggersPath)) return { cleared: false };
  const text = readFile(triggersPath, 'utf8');
  const updated = removeTriggerLines(text, 'wordpress_api_setup_needed');
  if (updated === text) return { cleared: false };
  writeFile(triggersPath, updated, 'utf8');
  return { cleared: true };
}

/**
 * Exchange credentials for an OAuth2 access token via the password grant.
 * Pure-ish; takes an injected fetch.
 */
export async function exchangeForToken({ clientId, clientSecret, username, password, fetchFn = fetch, url = WP_TOKEN_URL } = {}) {
  if (!clientId || !clientSecret || !username || !password) {
    return { ok: false, error: 'missing one of: clientId, clientSecret, username, password' };
  }
  const body = buildTokenRequestBody({ clientId, clientSecret, username, password });
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
    if (!json || !json.access_token) {
      return { ok: false, error: 'no access_token in response' };
    }
    return { ok: true, accessToken: json.access_token, blogId: json.blog_id || null, scope: json.scope || null };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}

/**
 * Validate a token + site against /rest/v1.1/sites/<site>/me. Returns
 * { ok, site, name } or { ok:false, error }. The `site` value may be a
 * hostname like 'youandinotai.wordpress.com' or a numeric site ID.
 */
export async function validateSite({ token, site, fetchFn = fetch, base = WP_REST_BASE } = {}) {
  if (!token) return { ok: false, error: 'no token' };
  if (!site) return { ok: false, error: 'no site (host or numeric id)' };
  const url = `${base}/sites/${encodeURIComponent(site)}/me`;
  try {
    const res = await fetchFn(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      return { ok: false, error: `WordPress.com returned HTTP ${res.status}` };
    }
    const json = await res.json();
    return { ok: true, site: json.URL || json.site_id || site, name: json.name || null };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const hasAny = args.clientId || args.clientSecret || args.username || args.password || args.site;
  if (!hasAny) {
    console.log(SETUP_STEPS);
    return;
  }
  if (!args.clientId || !args.clientSecret || !args.username || !args.password) {
    console.error('[wordpress-setup] missing one of: --client-id, --client-secret, --username, --password');
    console.error('[wordpress-setup] run without args to see the full setup steps.');
    process.exitCode = 1;
    return;
  }
  console.log('[wordpress-setup] exchanging credentials for an access_token (OAuth2 password grant)...');
  const tok = await exchangeForToken({
    clientId: args.clientId,
    clientSecret: args.clientSecret,
    username: args.username,
    password: args.password,
  });
  if (!tok.ok) {
    console.error('[wordpress-setup] token exchange failed: ' + tok.error);
    console.error('[wordpress-setup] NO value was written to .env. Check your client_id / client_secret / app-password and retry.');
    process.exitCode = 1;
    return;
  }
  const siteGuess = args.site || tok.blogId;
  if (!siteGuess) {
    console.error('[wordpress-setup] token succeeded but no site/--site was provided and the response had no blog_id.');
    console.error('[wordpress-setup] re-run with --site <host> (e.g. youandinotai.wordpress.com) or --site <numeric-id>.');
    process.exitCode = 1;
    return;
  }
  const v = await validateSite({ token: tok.accessToken, site: siteGuess });
  if (!v.ok) {
    console.error('[wordpress-setup] site validation failed: ' + v.error);
    console.error('[wordpress-setup] NO value was written to .env. Check the --site host or numeric id and retry.');
    process.exitCode = 1;
    return;
  }
  writeWordpressEnv({
    values: {
      [TOKEN_ENV_KEY]: tok.accessToken,
      [SITE_ENV_KEY]: siteGuess,
    },
  });
  const cleared = clearWordpressSetupTrigger();
  console.log(`[wordpress-setup] token validated against site "${v.name || siteGuess}". ${TOKEN_ENV_KEY} + ${SITE_ENV_KEY} written to .env (values not shown).`);
  console.log('[wordpress-setup] setup trigger ' + (cleared.cleared ? 'cleared.' : 'was not present (nothing to clear).'));
}

const isMain = process.argv[1] && /wordpress-setup\.mjs$/.test(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
  main().catch((e) => { console.error('[wordpress-setup] ' + String((e && e.message) || e)); process.exitCode = 1; });
}
