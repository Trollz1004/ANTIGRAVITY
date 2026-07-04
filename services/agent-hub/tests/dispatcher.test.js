// Unit tests for src/integrations/dispatcher.js — pure functions only, no DB.

const test = require('node:test');
const assert = require('node:assert/strict');

const { PLATFORMS } = require('../src/platforms');
const {
  getRouting,
  getNodeForPlatform,
  getAllRoutes,
  canAutoDispatch,
  validatePlatformRouting,
  PLATFORM_ROUTING
} = require('../src/integrations/dispatcher');

test('every PLATFORMS entry has a PLATFORM_ROUTING entry (single source of truth)', () => {
  const { missingRouting, missingPlatform } = validatePlatformRouting();
  assert.deepEqual(missingRouting, [], `platforms missing routing: ${missingRouting.join(', ')}`);
  assert.deepEqual(missingPlatform, [], `routing entries not in PLATFORMS: ${missingPlatform.join(', ')}`);
});

test('validatePlatformRouting never throws, only warns', () => {
  assert.doesNotThrow(() => validatePlatformRouting());
});

test('PLATFORM_ROUTING includes odysseus with the expected local-service endpoint', () => {
  const route = PLATFORM_ROUTING.odysseus;
  assert.ok(route, 'odysseus route should exist');
  assert.equal(route.node, 'sabretooth');
  assert.equal(route.access, 'local-service');
  assert.equal(route.endpoint, 'http://127.0.0.1:7000');
});

test('getRouting returns null for unknown platform', () => {
  assert.equal(getRouting('not-a-real-platform'), null);
});

test('getRouting returns config for a known platform', () => {
  const route = getRouting('hermes');
  assert.ok(route);
  assert.equal(route.node, 'sabretooth');
});

test('getNodeForPlatform returns node name for known platform', () => {
  assert.equal(getNodeForPlatform('odysseus'), 'sabretooth');
});

test('getNodeForPlatform returns null for unknown platform', () => {
  assert.equal(getNodeForPlatform('not-a-real-platform'), null);
});

test('getAllRoutes returns one entry per PLATFORM_ROUTING key', () => {
  const routes = getAllRoutes();
  assert.equal(routes.length, Object.keys(PLATFORM_ROUTING).length);
  assert.equal(routes.length, PLATFORMS.length);
});

test('canAutoDispatch is true for local-service platforms', () => {
  assert.equal(canAutoDispatch('hermes'), true);
  assert.equal(canAutoDispatch('odysseus'), true);
});

test('canAutoDispatch is false for browser-signin platforms', () => {
  assert.equal(canAutoDispatch('codex'), false);
  assert.equal(canAutoDispatch('grok'), false);
});

test('canAutoDispatch is false for unknown platform', () => {
  assert.equal(canAutoDispatch('not-a-real-platform'), false);
});
