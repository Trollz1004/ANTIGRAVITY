// Unit tests for src/leads/scoring.js — heuristic_score is a pure function,
// no DB/network required. oneMinScore is exercised only for its "disabled by
// default" fallback path (no ONEMINAI_API_KEY set) — the network-calling
// branch is intentionally not tested here (no live key available).

const test = require('node:test');
const assert = require('node:assert/strict');

const { heuristic_score, oneMinScore, MIN_SCORE, MAX_SCORE } = require('../src/leads/scoring');

test('heuristic_score: returns 0 for null/undefined/non-object input', () => {
  assert.equal(heuristic_score(null), 0);
  assert.equal(heuristic_score(undefined), 0);
  assert.equal(heuristic_score('not an object'), 0);
});

test('heuristic_score: returns an integer within [0, 100] for a minimal lead', () => {
  const score = heuristic_score({ name: 'Test', email: 't@example.com' });
  assert.ok(Number.isInteger(score));
  assert.ok(score >= MIN_SCORE && score <= MAX_SCORE);
});

test('heuristic_score: never exceeds MAX_SCORE even for a maximally-loaded lead', () => {
  const lead = {
    name: 'Max Lead',
    email: 'max@example.com',
    phone: '+15551234567',
    source: 'referral',
    interests: ['a', 'b', 'c', 'd', 'e'],
    email_opens: 999,
    email_clicks: 999,
    conversion_value: 500,
    tags: ['vip', 'high-value']
  };
  const score = heuristic_score(lead);
  assert.ok(score <= MAX_SCORE);
});

test('heuristic_score: a fuller lead scores at least as high as a bare lead', () => {
  const bare = heuristic_score({ name: 'Bare', email: 'bare@example.com', source: 'cold_outreach' });
  const fuller = heuristic_score({
    name: 'Fuller',
    email: 'fuller@example.com',
    phone: '+15551234567',
    source: 'referral',
    interests: ['Environmental', 'Health'],
    email_opens: 5,
    email_clicks: 3,
    conversion_value: 100,
    tags: ['vip']
  });
  assert.ok(fuller > bare, `expected fuller (${fuller}) > bare (${bare})`);
});

test('heuristic_score: referral source scores higher than cold_outreach, all else equal', () => {
  const base = { name: 'X', email: 'x@example.com', interests: [], email_opens: 0, email_clicks: 0, conversion_value: 0, tags: [] };
  const referral = heuristic_score({ ...base, source: 'referral' });
  const cold = heuristic_score({ ...base, source: 'cold_outreach' });
  assert.ok(referral > cold);
});

test('heuristic_score: vip/high-value tags boost score', () => {
  const base = { name: 'X', email: 'x@example.com', source: 'website', interests: [], email_opens: 0, email_clicks: 0, conversion_value: 0 };
  const withoutTag = heuristic_score({ ...base, tags: [] });
  const withTag = heuristic_score({ ...base, tags: ['vip'] });
  assert.ok(withTag > withoutTag);
});

test('heuristic_score: prior conversion_value boosts score', () => {
  const base = { name: 'X', email: 'x@example.com', source: 'website', interests: [], email_opens: 0, email_clicks: 0, tags: [] };
  const noConversion = heuristic_score({ ...base, conversion_value: 0 });
  const hasConversion = heuristic_score({ ...base, conversion_value: 50 });
  assert.ok(hasConversion > noConversion);
});

test('heuristic_score: missing email/phone scores lower than having both', () => {
  const base = { name: 'X', source: 'website', interests: [], email_opens: 0, email_clicks: 0, conversion_value: 0, tags: [] };
  const noContact = heuristic_score({ ...base });
  const withContact = heuristic_score({ ...base, email: 'x@example.com', phone: '+15551234567' });
  assert.ok(withContact > noContact);
});

test('oneMinScore: falls back to heuristic_score when ONEMINAI_API_KEY is unset', async () => {
  const original = process.env.ONEMINAI_API_KEY;
  delete process.env.ONEMINAI_API_KEY;

  try {
    const lead = { name: 'Test', email: 't@example.com', source: 'referral' };
    const expected = heuristic_score(lead);
    const actual = await oneMinScore(lead);
    assert.equal(actual, expected);
  } finally {
    if (original !== undefined) process.env.ONEMINAI_API_KEY = original;
  }
});

test('oneMinScore: falls back to heuristic_score when ONEMINAI_API_KEY is empty string', async () => {
  const original = process.env.ONEMINAI_API_KEY;
  process.env.ONEMINAI_API_KEY = '   ';

  try {
    const lead = { name: 'Test', email: 't@example.com', source: 'event' };
    const expected = heuristic_score(lead);
    const actual = await oneMinScore(lead);
    assert.equal(actual, expected);
  } finally {
    if (original !== undefined) process.env.ONEMINAI_API_KEY = original;
    else delete process.env.ONEMINAI_API_KEY;
  }
});
