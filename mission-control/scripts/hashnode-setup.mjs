#!/usr/bin/env node
/**
 * `drift hashnode-setup` (companion to devto-setup / reddit-setup).
 *
 * Run with no arguments: prints the one-time, plain-language steps Joshua
 * takes on hashnode.com to generate a personal access token. Run with
 * `--token <key>`: validates the token by calling Hashnode's GraphQL
 * `{ me { publications(first: 50) { edges { node { id title } } } } }`
 * query at gql.hashnode.com, picks the first publication's ID, and writes
 * both SEO_ANT_HASHNODE_TOKEN and SEO_ANT_HASHNODE_PUBLICATION_ID into
 * C:\ANTIGRAVITY\.env WITHOUT ever printing the token value, and clears
 * any setup_needed trigger for the hashnode platform.
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
export const HASHNODE_GQL_URL = 'https://gql.hashnode.com';
const TOKEN_ENV_KEY = 'SEO_ANT_HASHNODE_TOKEN';
const PUB_ID_ENV_KEY = 'SEO_ANT_HASHNODE_PUBLICATION_ID';

export const SETUP_STEPS = [
  'Hashnode API key + publication ID setup (one time):',
  '',
  '  1. Open https://hashnode.com and sign in (or create a free account',
  '     with any email — Gmail works).',
  '  2. Click your avatar (top right) -> Settings -> Developer.',
  '     Direct URL: https://hashnode.com/settings/developer',
  '  3. Under "Personal Access Token", click "Generate".',
  '  4. Copy the generated token (it is shown only once).',
  '  5. If you do not yet have a Hashnode publication (blog), create one',
  '     first at https://hashnode.com/create-blog — pick a hostname you',
  '     own (or use the free hashnode.com subdomain). The wizard will',
  '     auto-detect its ID from the token.',
  '',
  '  Then run:',
  '    drift hashnode-setup --token <your-token>',
  '',
  '  That validates the token against Hashnode\'s GraphQL API, picks',
  '  your first publication\'s ID, and writes SEO_ANT_HASHNODE_TOKEN +',
  '  SEO_ANT_HASHNODE_PUBLICATION_ID into .env (the values are NEVER',
  '  printed). Future runs of scripts/seo/post.mjs --platform hashnode',
  '  will publish approved drafts automatically.',
  '',
  '  Override the auto-picked publication with --publication-id <id>',
  '  if you have more than one publication and want a specific one.',
].join('\n');

/** Parse CLI args of the shape --token X --publication-id Y. Pure. */
export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--token') out.token = argv[++i];
    else if (argv[i] === '--publication-id') out.publicationId = argv[++i];
  }
  return out;
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

/** Write the Hashnode keys into .env without ever printing `values`. */
export function writeHashnodeEnv({ envPath = ENV_PATH, values, readFile = readFileSync, writeFile = writeFileSync, exists = existsSync } = {}) {
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

/** Clear the hashnode setup trigger if present. */
export function clearHashnodeSetupTrigger({ triggersPath = TRIGGERS_PATH, readFile = readFileSync, writeFile = writeFileSync, exists = existsSync } = {}) {
  if (!exists(triggersPath)) return { cleared: false };
  const text = readFile(triggersPath, 'utf8');
  const updated = removeTriggerLines(text, 'hashnode_api_setup_needed');
  if (updated === text) return { cleared: false };
  writeFile(triggersPath, updated, 'utf8');
  return { cleared: true };
}

/**
 * Call Hashnode's GraphQL endpoint and return the first publication's
 * { id, title } or { ok:false, error }. Pure-ish; takes an injected fetch.
 */
export async function fetchFirstPublication({ token, fetchFn = fetch, url = HASHNODE_GQL_URL } = {}) {
  if (!token || typeof token !== 'string') {
    return { ok: false, error: 'no token' };
  }
  const query = `query { me { publications(first: 50) { edges { node { id title } } } } }`;
  try {
    const res = await fetchFn(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify({ query }),
    });
    if (res.status !== 200) {
      return { ok: false, error: `hashnode returned HTTP ${res.status}` };
    }
    const body = await res.json();
    if (body && body.errors && Array.isArray(body.errors) && body.errors.length) {
      return { ok: false, error: 'hashnode graphql error: ' + (body.errors[0] && body.errors[0].message || 'unknown') };
    }
    const edges = body && body.data && body.data.me && body.data.me.publications && body.data.me.publications.edges;
    if (!Array.isArray(edges) || edges.length === 0) {
      return { ok: false, error: 'no publications found for this token — create one at https://hashnode.com/create-blog first' };
    }
    const first = edges[0].node;
    return { ok: true, id: first.id, title: first.title || null, count: edges.length };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.token) {
    console.log(SETUP_STEPS);
    return;
  }
  let publicationId = args.publicationId;
  if (!publicationId) {
    console.log('[hashnode-setup] validating token + fetching first publication ID...');
    const pub = await fetchFirstPublication({ token: args.token });
    if (!pub.ok) {
      console.error('[hashnode-setup] validation failed: ' + pub.error);
      console.error('[hashnode-setup] the token was NOT written to .env. Re-run drift hashnode-setup with a working token, or pass --publication-id <id> if your token cannot list publications.');
      process.exitCode = 1;
      return;
    }
    publicationId = pub.id;
    console.log(`[hashnode-setup] token validated. picked first publication: "${pub.title || pub.id}" (${pub.count} total).`);
  }
  writeHashnodeEnv({
    values: {
      [TOKEN_ENV_KEY]: args.token,
      [PUB_ID_ENV_KEY]: publicationId,
    },
  });
  const cleared = clearHashnodeSetupTrigger();
  console.log(`[hashnode-setup] ${TOKEN_ENV_KEY} + ${PUB_ID_ENV_KEY} written to .env (values not shown).`);
  console.log('[hashnode-setup] setup trigger ' + (cleared.cleared ? 'cleared.' : 'was not present (nothing to clear).'));
}

const isMain = process.argv[1] && /hashnode-setup\.mjs$/.test(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
  main().catch((e) => { console.error('[hashnode-setup] ' + String((e && e.message) || e)); process.exitCode = 1; });
}
