// Unit tests for src/middleware/auth.js using a stubbed req/res — no DB, no server.

const test = require('node:test');
const assert = require('node:assert/strict');

const apiKeyAuth = require('../src/middleware/auth');

function makeRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
  return res;
}

function withEnv(value, fn) {
  const original = process.env.AGENT_HUB_API_KEY;
  if (value === undefined) {
    delete process.env.AGENT_HUB_API_KEY;
  } else {
    process.env.AGENT_HUB_API_KEY = value;
  }
  try {
    fn();
  } finally {
    if (original === undefined) {
      delete process.env.AGENT_HUB_API_KEY;
    } else {
      process.env.AGENT_HUB_API_KEY = original;
    }
  }
}

test('401 when AGENT_HUB_API_KEY is unset (fail-closed, no bypass)', () => {
  withEnv(undefined, () => {
    const req = { headers: {} };
    const res = makeRes();
    let nextCalled = false;

    apiKeyAuth(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
  });
});

test('401 when AGENT_HUB_API_KEY is set but request has no key', () => {
  withEnv('secret-key-123', () => {
    const req = { headers: {} };
    const res = makeRes();
    let nextCalled = false;

    apiKeyAuth(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
  });
});

test('401 when request key does not match expected key', () => {
  withEnv('secret-key-123', () => {
    const req = { headers: { 'x-api-key': 'wrong-key' } };
    const res = makeRes();
    let nextCalled = false;

    apiKeyAuth(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
  });
});

test('200 (calls next) when x-api-key header matches', () => {
  withEnv('secret-key-123', () => {
    const req = { headers: { 'x-api-key': 'secret-key-123' } };
    const res = makeRes();
    let nextCalled = false;

    apiKeyAuth(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, null); // res.status/json never called
  });
});

test('200 (calls next) when api_key header matches', () => {
  withEnv('secret-key-123', () => {
    const req = { headers: { api_key: 'secret-key-123' } };
    const res = makeRes();
    let nextCalled = false;

    apiKeyAuth(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
  });
});

test('401 when AGENT_HUB_API_KEY is set to empty string (falsy, fail-closed)', () => {
  withEnv('', () => {
    const req = { headers: { 'x-api-key': '' } };
    const res = makeRes();
    let nextCalled = false;

    apiKeyAuth(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
  });
});
