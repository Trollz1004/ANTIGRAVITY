import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const SCRIPT_PATH = path.join(REPO_ROOT, 'ops/github/protect-antigravity-main.ps1');

function runPrintOnlyScript() {
  const result = spawnSync(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', SCRIPT_PATH],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    },
  );
  return result;
}

function extractCanonicalPayload(stdout) {
  const marker = '-- Canonical Payload JSON --';
  const startIdx = stdout.indexOf(marker);
  assert.notEqual(
    startIdx,
    -1,
    'Expected "-- Canonical Payload JSON --" section in stdout',
  );
  const afterMarker = stdout.slice(startIdx + marker.length);
  const endIdx = afterMarker.indexOf('==================================================================');
  assert.notEqual(
    endIdx,
    -1,
    'Expected closing "====" divider after Canonical Payload JSON',
  );
  const rawJson = afterMarker.slice(0, endIdx).trim();
  return JSON.parse(rawJson);
}

test('protect-antigravity-main.ps1 runs print-only dry-run without mutating and exits 0', () => {
  const result = runPrintOnlyScript();
  assert.equal(
    result.status,
    0,
    `Expected exit code 0, got ${result.status}. stderr:\n${result.stderr}`,
  );
  assert.match(
    result.stdout,
    /(?:DRY-RUN|Print-only)/i,
    'Expected DRY-RUN or Print-only mode header in stdout',
  );
  assert.match(
    result.stdout,
    /read-only/i,
    'Expected read-only audit description in stdout',
  );
  assert.doesNotMatch(
    result.stdout,
    /APPLY \(Judge mutation mode\)/,
    'Must never enter APPLY mutation mode when run without -Apply',
  );
  assert.doesNotMatch(
    result.stdout,
    /SUCCESS: Updated/,
    'Must never mutate GitHub ruleset when run without -Apply',
  );
});

test('printed canonical ruleset payload requires all unconditional green checks and excludes path-filtered or non-blocking checks', () => {
  const result = runPrintOnlyScript();
  assert.equal(result.status, 0, `Unexpected exit code ${result.status}`);

  const payload = extractCanonicalPayload(result.stdout);
  assert.equal(payload.name, 'main-quality-gate');
  assert.equal(payload.enforcement, 'active');
  assert.deepEqual(payload.bypass_actors, []);

  const statusRule = payload.rules.find(
    (rule) => rule.type === 'required_status_checks',
  );
  assert.ok(statusRule, 'Expected required_status_checks rule in payload');

  const contexts = statusRule.parameters.required_status_checks.map(
    (entry) => entry.context,
  );

  const requiredChecks = [
    'quality-gate',
    'doctrine-check',
    'guardian-check',
    'Scan for forbidden patterns',
    'eslint-prettier-check',
    'code',
    'Validate adapter manifests',
    'Cockpit never on a public path',
    'Enforce Mission Control role wall',
  ];

  for (const check of requiredChecks) {
    assert.ok(
      contexts.includes(check),
      `Expected required_status_checks to include "${check}", got: ${JSON.stringify(contexts)}`,
    );
  }

  const excludedChecks = [
    'Flag MD + config drift (do NOT auto-resolve)',
    'dashboard',
    'api',
    'compliance',
    'Unit and static gate',
    'Pre-commit validation',
  ];

  for (const check of excludedChecks) {
    assert.ok(
      !contexts.includes(check),
      `Did not expect path-filtered or non-blocking check "${check}" in required_status_checks`,
    );
  }
});
