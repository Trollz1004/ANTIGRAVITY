import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCatalog, decorateFreshness, probeSingleEntry } from './bridge-registry.mjs';

test('catalog covers all 3 nodes and 8 lanes (24 entries) as a directory, never leaking secret values', () => {
  const catalog = buildCatalog();
  assert.equal(catalog.length, 24);
  const raw = JSON.stringify(catalog);
  assert.doesNotMatch(raw, /sk-[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{16,}/);
  const t5500Hermes = catalog.find((e) => e.id === 't5500/hermes');
  assert.ok(t5500Hermes);
  assert.equal(t5500Hermes.address, 'http://127.0.0.1:8643');
  assert.equal(t5500Hermes.auth.method, 'bearer');
});

test('decorateFreshness marks old timestamps as STALE and null timestamps as NEVER_VERIFIED', () => {
  const now = Date.parse('2026-10-26T00:30:00.000Z');
  const unverified = decorateFreshness({ id: 't5500/hermes', status: 'UNVERIFIED', last_verified_at: null }, now, 120);
  assert.equal(unverified.stale, true);
  assert.equal(unverified.age_seconds, null);
  assert.equal(unverified.freshness, 'NEVER_VERIFIED');

  const fresh = decorateFreshness({ id: 't5500/hermes', status: 'UP', last_verified_at: '2026-10-26T00:29:30.000Z' }, now, 120);
  assert.equal(fresh.stale, false);
  assert.equal(fresh.age_seconds, 30);
  assert.match(fresh.freshness, /^FRESH /);

  const stale = decorateFreshness({ id: 't5500/hermes', status: 'DOWN', last_verified_at: '2026-10-24T12:00:00.000Z' }, now, 120);
  assert.equal(stale.stale, true);
  assert.ok(stale.age_seconds > 120);
  assert.match(stale.freshness, /^STALE /);
});

test('probeSingleEntry judges services by identity string and reports WRONG_SERVICE if a wrong process answers 200', async () => {
  const entry = {
    id: 'alienware/ollama',
    node: 'alienware',
    node_ip: '192.168.0.40',
    lane: 'ollama',
    transport: 'http+cli',
    address: 'http://192.168.0.40:11434',
  };
  const fakeFetchWrong = async () => ({
    status: 200,
    text: async () => '<html>some unrelated server</html>',
  });
  const wrongRes = await probeSingleEntry(entry, { fetchImpl: fakeFetchWrong, nowIso: () => '2026-10-26T00:30:00.000Z' });
  assert.equal(wrongRes.status, 'WRONG_SERVICE');
  assert.equal(wrongRes.last_verified_at, '2026-10-26T00:30:00.000Z');

  const fakeFetchDown = async () => {
    throw new Error('connect ECONNREFUSED 192.168.0.40:11434');
  };
  const downRes = await probeSingleEntry(entry, { fetchImpl: fakeFetchDown, nowIso: () => '2026-10-26T00:30:05.000Z' });
  assert.equal(downRes.status, 'DOWN');
  assert.equal(downRes.last_verified_at, '2026-10-26T00:30:05.000Z');
});
