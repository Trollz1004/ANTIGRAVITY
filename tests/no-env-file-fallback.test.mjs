import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');

function collectRuntimeFiles() {
  const missionOsFiles = fs
    .readdirSync(path.join(REPO_ROOT, 'mission-os'))
    .filter((name) => name.endsWith('.mjs') && !name.endsWith('.test.mjs'))
    .map((name) => path.join('mission-os', name));

  return [
    ...missionOsFiles,
    'mission-control/server.mjs',
    'ops/domains-server/server.mjs',
    'services/governance/server.ts',
    'services/mission-mcp/src/server.ts',
    'services/onemin-shim/server.mjs',
    'apps/hermes-leadgen/server.js',
    'domains/youandinotai.com/frontend/server.ts',
  ];
}

test('PR #423 Node/TS runtime servers never read .env files from disk as fallbacks', () => {
  const files = collectRuntimeFiles();
  assert.ok(files.length >= 10, 'Expected full list of PR #423 runtime servers');

  const forbiddenPatterns = [
    { name: 'readDotEnvMap helper', re: /\breadDotEnvMap\b/ },
    { name: 'readEnvFile call', re: /\breadEnvFile\s*\(/ },
    { name: 'readFileSync reading .env', re: /readFileSync\([^)]*\.env\b/i },
    { name: 'literal .env candidate path', re: /['"`][^'"`\n]*(?:\\|\/)\.env['"`]/ },
  ];

  for (const rel of files) {
    const abs = path.join(REPO_ROOT, rel);
    const src = fs.readFileSync(abs, 'utf8');
    for (const pat of forbiddenPatterns) {
      assert.doesNotMatch(
        src,
        pat.re,
        `${rel} still contains forbidden .env file fallback (${pat.name})`
      );
    }
  }

  const mcSrc = fs.readFileSync(path.join(REPO_ROOT, 'mission-control/server.mjs'), 'utf8');
  assert.match(mcSrc, /resolveConfig\(\{[^}]*readEnv:\s*\(\)\s*=>\s*\(\{\}\)/);
  assert.match(mcSrc, /resolveVault\(\{[^}]*readEnv:\s*\(\)\s*=>\s*\(\{\}\)/);
});
