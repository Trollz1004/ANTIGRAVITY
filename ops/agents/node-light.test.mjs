import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';

import {
  resolveAgentDriftPath,
  readAgentDriftStatus,
  buildHealthEnvLight,
} from './node-light.mjs';

const require = createRequire(import.meta.url);
const cjs = require('./node-light.cjs');

test('ESM and CJS exports stay in sync', () => {
  assert.equal(typeof resolveAgentDriftPath, 'function');
  assert.equal(typeof readAgentDriftStatus, 'function');
  assert.equal(typeof buildHealthEnvLight, 'function');
  assert.equal(cjs.resolveAgentDriftPath, resolveAgentDriftPath);
  assert.equal(cjs.readAgentDriftStatus, readAgentDriftStatus);
  assert.equal(cjs.buildHealthEnvLight, buildHealthEnvLight);
});

test('buildHealthEnvLight returns green when env keys exist and no drift exists', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'node-light-green-'));
  try {
    fs.writeFileSync(
      path.join(tmp, 'env.required.json'),
      JSON.stringify({
        service: 'test-svc',
        envFile: 'test/.env',
        required: ['API_KEY'],
      }),
      'utf8',
    );
    const driftPath = path.join(tmp, 'agent-drift.json');
    fs.writeFileSync(driftPath, JSON.stringify({ driftedFiles: [] }), 'utf8');

    const result = buildHealthEnvLight({
      manifestDir: tmp,
      env: { API_KEY: 'dummy-value-never-returned' },
      driftPath,
    });
    assert.deepEqual(result, {
      missingEnv: [],
      driftedFiles: [],
      driftedCount: 0,
      nodeLight: 'green',
    });
    assert.equal(JSON.stringify(result).includes('dummy-value-never-returned'), false);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('buildHealthEnvLight returns amber on missingEnv or agent drift', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'node-light-amber-'));
  try {
    fs.writeFileSync(
      path.join(tmp, 'env.required.json'),
      JSON.stringify({
        service: 'test-svc',
        envFile: 'test/.env',
        required: ['TOKEN_A', 'TOKEN_B'],
        alternatives: { TOKEN_A: ['ALT_A'] },
      }),
      'utf8',
    );
    const missingDriftPath = path.join(tmp, 'missing-drift.json');

    const missingResult = buildHealthEnvLight({
      manifestDir: tmp,
      env: { ALT_A: 'present' },
      driftPath: missingDriftPath,
    });
    assert.equal(missingResult.nodeLight, 'amber');
    assert.deepEqual(missingResult.missingEnv, ['TOKEN_B']);
    assert.equal(missingResult.driftedCount, 0);

    const driftPath = path.join(tmp, 'agent-drift.json');
    fs.writeFileSync(
      driftPath,
      JSON.stringify({ driftedFiles: [{ file: 'CLAUDE.md', reason: 'stale' }] }),
      'utf8',
    );
    const driftResult = buildHealthEnvLight({
      manifestDir: tmp,
      env: { TOKEN_A: '1', TOKEN_B: '2' },
      driftPath,
    });
    assert.equal(driftResult.nodeLight, 'amber');
    assert.deepEqual(driftResult.missingEnv, []);
    assert.equal(driftResult.driftedCount, 1);
    assert.deepEqual(driftResult.driftedFiles, [{ file: 'CLAUDE.md', reason: 'stale' }]);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('readAgentDriftStatus handles missing and unreadable drift files cleanly', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'node-light-read-'));
  try {
    const absent = readAgentDriftStatus('', { LOCALAPPDATA: tmp });
    assert.equal(absent.present, false);
    assert.deepEqual(absent.driftedFiles, []);
    assert.equal(absent.driftedCount, 0);

    const badPath = path.join(tmp, 'dream-boot', 'agent-drift.json');
    fs.mkdirSync(path.dirname(badPath), { recursive: true });
    fs.writeFileSync(badPath, '{not-json', 'utf8');
    const bad = readAgentDriftStatus({ env: { LOCALAPPDATA: tmp } });
    assert.equal(bad.present, true);
    assert.equal(bad.driftedCount, 1);
    assert.equal(bad.driftedFiles[0].reason, 'unreadable');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
