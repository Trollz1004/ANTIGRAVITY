import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { checkRequiredEnv, loadEnvRequiredManifest, logStartupEnvCheck } from './env-required.mjs';
import { buildHealthEnvLight } from './node-light.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');

const EXPECTED_SERVICE_MANIFESTS = [
  { dir: 'ops/fleet', service: 'fleet-status' },
  { dir: 'mission-os', service: 'mission-os' },
  { dir: 'mission-control', service: 'mission-control' },
  { dir: 'ops/domains-server', service: 'domains-server' },
  { dir: 'domains/youandinotai.com/frontend', service: 'dateapp-frontend' },
  { dir: 'domains/youandinotai.com/backend', service: 'dateapp-backend' },
  { dir: 'apps/hermes-leadgen', service: 'hermes-leadgen' },
  { dir: 'services/governance', service: 'official-vote-service' },
  { dir: 'services/mission-mcp', service: 'mission-mcp' },
  { dir: 'services/onemin-shim', service: 'onemin-shim' },
  { dir: 'services/dateapp-desk-mcp', service: 'dateapp-desk-mcp' },
  { dir: 'brain-mcp', service: 'brain-mcp' },
];

test('all 12 expected service env.required.json manifests exist and match env-names-check.ps1 -ListTargetsOnly -Json', () => {
  const rawJson = execFileSync(
    'powershell',
    [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      path.join(HERE, 'env-names-check.ps1'),
      '-RepoRoot',
      REPO_ROOT,
      '-ListTargetsOnly',
      '-Json',
    ],
    { encoding: 'utf8' },
  );

  const report = JSON.parse(rawJson);
  assert.equal(report.ok, true);
  assert.equal(report.listTargetsOnly, true);

  const discoveredByService = new Map(report.services.map((s) => [s.service, s]));
  for (const expected of EXPECTED_SERVICE_MANIFESTS) {
    const manifestPath = path.join(REPO_ROOT, expected.dir, 'env.required.json');
    assert.equal(fs.existsSync(manifestPath), true, `Missing manifest: ${expected.dir}/env.required.json`);
    const manifest = loadEnvRequiredManifest(manifestPath);
    assert.equal(manifest.service, expected.service);
    assert.ok(discoveredByService.has(expected.service), `env-names-check missed ${expected.service}`);
  }
});

test('all 12 service manifests check in-memory env keys and nodeLight without leaking secret values', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e4-all-svcs-'));
  const cleanDrift = path.join(tmpDir, 'agent-drift.json');
  fs.writeFileSync(cleanDrift, JSON.stringify({ driftedFiles: [] }), 'utf8');

  try {
    for (const expected of EXPECTED_SERVICE_MANIFESTS) {
      const svcDir = path.join(REPO_ROOT, expected.dir);
      const manifest = loadEnvRequiredManifest(svcDir);

      // 1. Empty env catches all required keys (if manifest has required keys)
      const emptyCheck = checkRequiredEnv(svcDir, {});
      assert.deepEqual(emptyCheck.missingEnv, manifest.required);

      const warnings = [];
      logStartupEnvCheck(svcDir, {}, (m) => warnings.push(m));
      if (manifest.required.length > 0) {
        assert.equal(warnings.length, 1);
        assert.match(warnings[0], new RegExp(`\\[${expected.service}\\]`));
      } else {
        assert.equal(warnings.length, 0);
      }

      const amberHealth = buildHealthEnvLight({
        manifestDir: svcDir,
        env: {},
        driftPath: cleanDrift,
      });
      if (manifest.required.length > 0) {
        assert.equal(amberHealth.nodeLight, 'amber');
        assert.deepEqual(amberHealth.missingEnv, manifest.required);
      }

      // 2. Populating synthetic random secret values satisfies required keys cleanly with zero leakage
      const syntheticEnv = {};
      const sentinels = [];
      for (const reqKey of manifest.required) {
        const val = `synthetic-${expected.service}-${reqKey}-${Math.random().toString(36).slice(2)}`;
        syntheticEnv[reqKey] = val;
        sentinels.push(val);
      }
      const greenHealth = buildHealthEnvLight({
        manifestDir: svcDir,
        env: syntheticEnv,
        driftPath: cleanDrift,
      });
      assert.deepEqual(greenHealth, {
        missingEnv: [],
        driftedFiles: [],
        driftedCount: 0,
        nodeLight: 'green',
      });
      const serialized = JSON.stringify(greenHealth);
      for (const secret of sentinels) {
        assert.equal(serialized.includes(secret), false, `${expected.service} leaked synthetic value`);
      }
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('runtime Stage E4 helpers never read .env files from disk', () => {
  const runtimeHelpers = [
    'ops/agents/env-required.cjs',
    'ops/agents/env-required.mjs',
    'ops/agents/node-light.cjs',
    'ops/agents/node-light.mjs',
    'ops/agents/env_required.py',
    'mission-os/env-drift-light.mjs',
    'domains/youandinotai.com/backend/app/env_health.py',
    'services/dateapp-desk-mcp/server.mjs',
    'brain-mcp/src/index.ts',
  ];

  const forbidden = [
    /\breadDotEnvMap\b/,
    /\breadEnvFile\s*\(/,
    /readFileSync\([^)]*\.env\b/i,
    /read_text\([^)]*\.env\b/i,
    /['"`][^'"`\n]*(?:\\|\/)\.env['"`]/,
  ];

  for (const rel of runtimeHelpers) {
    const src = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
    for (const pat of forbidden) {
      assert.doesNotMatch(src, pat, `${rel} matched forbidden .env fallback pattern ${pat}`);
    }
  }
});
