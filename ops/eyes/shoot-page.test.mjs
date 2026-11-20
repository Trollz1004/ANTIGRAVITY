import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveFixtureReply } from './shoot-page.mjs';

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
  assert.deepEqual(
    resolveFixtureReply(fixture, '/api/v1/auth/me'),
    fixture['/auth/me']
  );
  assert.deepEqual(
    resolveFixtureReply(
      fixture,
      'http://127.0.0.1:5179/api/v1/metrics/affiliates?code=creator-one'
    ),
    fixture['/metrics/affiliates']
  );
  assert.deepEqual(resolveFixtureReply(fixture, '/api/v1/unlisted/route'), {});
  assert.deepEqual(resolveFixtureReply(fixture, '/unlisted'), {});
});
