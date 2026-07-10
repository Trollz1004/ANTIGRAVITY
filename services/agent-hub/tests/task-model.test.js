// Unit tests for src/models/task.js — validation and pure-function logic only.
// Runs WITHOUT a database. `enforceQueueCap` and `promoteFromBacklog` are
// DB-coupled (they call db.query directly) and are intentionally not tested
// here — see the note near the bottom of this file.

const test = require('node:test');
const assert = require('node:assert/strict');

const { validate, buildTask, PLATFORMS, STATUSES, PRIORITIES, PRIORITY_MAP } = require('../src/models/task');

test('platforms list includes the current operator and support lanes without duplicates', () => {
  assert.ok(PLATFORMS.includes('odysseus'));
  assert.ok(PLATFORMS.includes('clawx'));
  assert.ok(PLATFORMS.includes('anythingllm'));
  assert.equal(new Set(PLATFORMS).size, PLATFORMS.length);
});

test('validate: accepts a minimal valid task', () => {
  const errors = validate({ title: 'Do the thing', status: 'todo', platform: 'hermes' });
  assert.deepEqual(errors, []);
});

test('validate: accepts every platform in PLATFORMS', () => {
  for (const platform of PLATFORMS) {
    const errors = validate({ title: 'x', status: 'backlog', platform });
    assert.deepEqual(errors, [], `platform "${platform}" should be valid`);
  }
});

test('validate: rejects missing title', () => {
  const errors = validate({ status: 'todo', platform: 'hermes' });
  assert.ok(errors.some((e) => e.includes('title')));
});

test('validate: rejects unknown platform', () => {
  const errors = validate({ title: 'x', status: 'todo', platform: 'not-a-real-platform' });
  assert.ok(errors.some((e) => e.includes('platform')));
});

test('validate: rejects missing platform', () => {
  const errors = validate({ title: 'x', status: 'todo' });
  assert.ok(errors.some((e) => e.includes('platform')));
});

test('validate: rejects unknown status', () => {
  const errors = validate({ title: 'x', status: 'not-a-status', platform: 'hermes' });
  assert.ok(errors.some((e) => e.includes('status')));
});

test('validate: rejects missing status', () => {
  const errors = validate({ title: 'x', platform: 'hermes' });
  assert.ok(errors.some((e) => e.includes('status')));
});

test('validate: accepts every valid status', () => {
  for (const status of STATUSES) {
    const errors = validate({ title: 'x', status, platform: 'hermes' });
    assert.deepEqual(errors, [], `status "${status}" should be valid`);
  }
});

test('validate: rejects invalid priority when provided', () => {
  const errors = validate({ title: 'x', status: 'todo', platform: 'hermes', priority: 'urgent-ish' });
  assert.ok(errors.some((e) => e.includes('priority')));
});

test('validate: priority is optional', () => {
  const errors = validate({ title: 'x', status: 'todo', platform: 'hermes' });
  assert.deepEqual(errors, []);
});

test('validate: accepts every valid priority', () => {
  for (const priority of PRIORITIES) {
    const errors = validate({ title: 'x', status: 'todo', platform: 'hermes', priority });
    assert.deepEqual(errors, [], `priority "${priority}" should be valid`);
  }
});

test('validate: accumulates multiple errors at once', () => {
  const errors = validate({});
  assert.ok(errors.length >= 3); // missing title, status, platform
});

test('buildTask: fills defaults for a minimal task', () => {
  const task = buildTask({ title: 'Ship it', platform: 'hermes' });
  assert.equal(task.title, 'Ship it');
  assert.equal(task.platform, 'hermes');
  assert.equal(task.status, 'backlog');
  assert.equal(task.priority, 'medium');
  assert.deepEqual(task.tags, []);
  assert.equal(task.created_by_id, 'system');
  assert.ok(task.id);
  assert.ok(task.created_date);
  assert.ok(task.updated_date);
});

test('buildTask: preserves explicit fields over defaults', () => {
  const task = buildTask({
    title: 'Custom task',
    platform: 'odysseus',
    status: 'todo',
    priority: 'critical',
    tags: ['a', 'b'],
    created_by_id: 'josh'
  });
  assert.equal(task.status, 'todo');
  assert.equal(task.priority, 'critical');
  assert.deepEqual(task.tags, ['a', 'b']);
  assert.equal(task.created_by_id, 'josh');
});

test('PRIORITY_MAP: orders critical before high before medium before low', () => {
  assert.ok(PRIORITY_MAP.critical < PRIORITY_MAP.high);
  assert.ok(PRIORITY_MAP.high < PRIORITY_MAP.medium);
  assert.ok(PRIORITY_MAP.medium < PRIORITY_MAP.low);
});

// NOTE on DB-coupled functions:
// `enforceQueueCap(db)` and `promoteFromBacklog(db)` in src/models/task.js
// both call `db.query(...)` directly against a real Postgres connection and
// are not pure functions — they are integration-tested against a live DB,
// not unit-tested here. Their queue-cap *decision* logic (compare count to
// MAX_ACTIVE, backlog on overflow) is exercised indirectly through the
// route handlers in src/routes/tasks.js and src/routes/mcp.js, which also
// require a DB connection and are out of scope for the no-DB unit suite.
