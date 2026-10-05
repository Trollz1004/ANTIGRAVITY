#!/usr/bin/env node
/**
 * `drift devto-setup` (companion to reddit-setup).
 *
 * Run with no arguments: prints the one-time, plain-language steps Joshua
 * takes on dev.to to generate an API key. Run with `--token <key>`:
 * validates the key against dev.to's /api/users/me endpoint, writes the
 * SEO_ANT_DEVTO_TOKEN (and equivalent DRE/AIS placeholders if missing) into
 * C:\ANTIGRAVITY\.env WITHOUT ever printing the token, and clears any
 * setup_needed trigger for the devto platform.
 *
 * Pure, testable pieces are exported; the network call only runs when this
 * file is executed directly (main(), guarded below), so `npx vitest` never
 * hits the network.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO = join(HERE, '..', '..');
export const ENV_PATH = join(REPO, '.env');
export const TRIGGERS_PATH = join(REPO, 'ops', 'heartbeat', 'TRIGGERS.jsonl');
export const DEVTO_VALIDATE_URL = 'https://dev.to/api/users/me';
const TOKEN_ENV_KEY = 'SEO_ANT_DEVTO_TOKEN';

export const SETUP_STEPS = [
  'dev.to API key setup (one time):',
  '',
  '  1. Open https://dev.to/enter and sign in (or create a free account',
  '     with any email — Gmail works).',
  '  2. Go to https://dev.to/settings/extensions (left sidebar)',
  '  3. Scroll to "DEV Community API Keys"',
  '  4. Click "Generate API Key", give it a description like',
  '     "youandinotai-marketing".',
  '  5. Copy the generated key (it is shown only once).',
  '',
  '  Then run:',
  '    drift devto-setup --token <your-api-key>',
  '',
  '  That validates the key against dev.to, writes SEO_ANT_DEVTO_TOKEN',
  '  into .env (the value is NEVER printed), and clears the setup trigger.',
  '  Future runs of scripts/seo/post.mjs --platform devto will publish',
  '  approved drafts automatically.',
].join('\n');

/** Parse CLI args of the shape --token X. Pure. */
export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--token') out.token = argv[++i];
  }
  return out;
}

/**
 * Return an UPDATED .env file's text: TOKEN_ENV_KEY is replaced in place if
 * a line for it already exists, else appended. Other lines untouched. Pure.
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

/** Write TOKEN_ENV_KEY into .env without ever printing `values`. */
export function writeDevtoEnv({ envPath = ENV_PATH, values, readFile = readFileSync, writeFile = writeFileSync, exists = existsSync } = {}) {
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

/** Clear the devto setup trigger if present. */
export function clearDevtoSetupTrigger({ triggersPath = TRIGGERS_PATH, readFile = readFileSync, writeFile = writeFileSync, exists = existsSync } = {}) {
  if (!exists(triggersPath)) return { cleared: false };
  const text = readFile(triggersPath, 'utf8');
  const updated = removeTriggerLines(text, 'devto_api_setup_needed');
  if (updated === text) return { cleared: false };
  writeFile(triggersPath, updated, 'utf8');
  return { cleared: true };
}

/** Validate a dev.to API key by hitting /api/users/me. Pure-ish; requires fetch. */
export async function validateToken(token, { fetchFn = fetch, url = DEVTO_VALIDATE_URL } = {}) {
  if (!token || typeof token !== 'string') {
    return { ok: false, error: 'no token' };
  }
  try {
    const res = await fetchFn(url, { headers: { 'api-key': token } });
    if (res.status !== 200) {
      return { ok: false, error: `dev.to returned HTTP ${res.status}` };
    }
    const body = await res.json();
    return { ok: true, username: body && body.username ? body.username : null };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}

async function main() {
  const { token } = parseArgs(process.argv.slice(2));
  if (!token) {
    console.log(SETUP_STEPS);
    return;
  }
  console.log('[devto-setup] validating API key against dev.to...');
  const v = await validateToken(token);
  if (!v.ok) {
    console.error('[devto-setup] validation failed: ' + v.error);
    console.error('[devto-setup] the token was NOT written to .env. Re-run drift devto-setup with a working key.');
    process.exitCode = 1;
    return;
  }
  writeDevtoEnv({ values: { [TOKEN_ENV_KEY]: token } });
  const cleared = clearDevtoSetupTrigger();
  console.log(`[devto-setup] key validated (dev.to user: ${v.username || 'unknown'}). ${TOKEN_ENV_KEY} written to .env (value not shown).`);
  console.log('[devto-setup] setup trigger ' + (cleared.cleared ? 'cleared.' : 'was not present (nothing to clear).'));
}

const isMain = process.argv[1] && /devto-setup\.mjs$/.test(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
  main().catch((e) => { console.error('[devto-setup] ' + String((e && e.message) || e)); process.exitCode = 1; });
}
