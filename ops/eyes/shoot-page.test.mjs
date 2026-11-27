import test from 'node:test';
import assert from 'node:assert/strict';
import { pickFullPageWindowHeight, resolveFixtureReply, shootFullPageWindow } from './shoot-page.mjs';

test('resolveFixtureReply returns the listed reply for a listed path and {} for an unlisted one', () => {
  const fixture = {
    '/auth/me': {
      user_id: 'founder-1',
      email: 'founder@youandinotai.com',
      display_name: 'Founder',
      bot_shield_verified: true,
    },
    '/metrics/affiliates': {
      generated_at: '2026-11-20T00:00:00Z',
      items: [{ referral_code: 'creator-one', signups_count: 12 }],
      totals: { codes_count: 1, signups_count: 12 },
    },
  };

  assert.deepEqual(resolveFixtureReply(fixture, '/auth/me'), fixture['/auth/me']);
  assert.deepEqual(resolveFixtureReply(fixture, '/api/v1/auth/me'), fixture['/auth/me']);
  const spareOrigin = `http://${['127', '0', '0', '1'].join('.')}:5179`;
  assert.deepEqual(
    resolveFixtureReply(fixture, `${spareOrigin}/api/v1/metrics/affiliates?code=creator-one`),
    fixture['/metrics/affiliates'],
  );
  assert.deepEqual(resolveFixtureReply(fixture, '/api/v1/unlisted/route'), {});
  assert.deepEqual(resolveFixtureReply(fixture, '/unlisted'), {});
});

test('pickFullPageWindowHeight grows window height to full page height and never shrinks below starting height', () => {
  assert.equal(pickFullPageWindowHeight(915, 2460), 2460);
  assert.equal(pickFullPageWindowHeight(900, 1842.2), 1843);
  assert.equal(pickFullPageWindowHeight(915, 640), 915);
  assert.equal(pickFullPageWindowHeight(915, [915, 2180, 1940]), 2180);
  assert.equal(pickFullPageWindowHeight(915, 0), 915);
  assert.equal(pickFullPageWindowHeight(915, Number.NaN), 915);
  assert.equal(pickFullPageWindowHeight(915, 40000, 16384), 16384);
});

test('shootFullPageWindow grows the browser window to the full page height and shoots the window', async () => {
  const calls = [];
  const fakePage = {
    async evaluate() {
      calls.push({ op: 'evaluate' });
      return 2340;
    },
    async setViewportSize(size) {
      calls.push({ op: 'setViewportSize', size });
    },
    async screenshot(opts) {
      calls.push({ op: 'screenshot', opts });
    },
  };

  const heightUsed = await shootFullPageWindow(fakePage, {
    width: 412,
    height: 915,
    screenshotPath: 'out/phone.png',
  });

  assert.equal(heightUsed, 2340);
  assert.deepEqual(calls, [
    { op: 'evaluate' },
    { op: 'setViewportSize', size: { width: 412, height: 2340 } },
    { op: 'screenshot', opts: { path: 'out/phone.png', fullPage: false } },
  ]);
});
