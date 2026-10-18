import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const path = new URL('./ops-dashboard.js', import.meta.url);
test('dashboard defines every required real-data route without duplicate IDs', () => {
  assert.ok(fs.existsSync(path), 'real-data dashboard implementation must exist');
  const context = { URL, console }; context.globalThis = context;
  vm.runInNewContext(fs.readFileSync(path, 'utf8'), context);
  const routes = context.OpsDashboard.routes;
  assert.deepEqual(Array.from(routes, r => r.id), ['overview','jarvis','agents','board','gateway','marketing','memory','node','logs','support','hermes','settings','chrome','lightx2v','comfyui','youtube','ecosystem']);
  assert.equal(new Set(routes.map(r => r.id)).size, routes.length);
  for (const route of routes) assert.ok(route.endpoint.startsWith('/api/'));
});
test('security helpers reject unsafe launches and redact sensitive fields', () => {
  const context = { URL, console }; context.globalThis = context;
  vm.runInNewContext(fs.readFileSync(path, 'utf8'), context);
  const api = context.OpsDashboard;
  assert.equal(typeof api.safeURL, 'function');
  assert.equal(api.safeURL('javascript:alert(1)'), null);
  assert.equal(api.safeURL('http://user:password@localhost/'), null);
  assert.equal(api.safeURL('http://127.0.0.1:8188/'), 'http://127.0.0.1:8188/');
  assert.equal(api.safeURL('http://192.168.0.8/'), null);
  assert.equal(api.sanitize({token:'hidden',nested:{password:'hidden'}}).token, '[redacted]');
  assert.equal(api.sanitize({nested:{password:'hidden'}}).nested.password, '[redacted]');
});
test('accessible shell loads local assets and has no canned conversation or iframe', () => {
  const htmlPath = new URL('./ops-dashboard.html', import.meta.url);
  assert.ok(fs.existsSync(htmlPath), 'accessible dashboard shell must exist');
  const html = fs.readFileSync(htmlPath,'utf8');
  assert.match(html, /id="navigation"/);
  assert.match(html, /id="content"/);
  assert.match(html, /aria-live="polite"/);
  assert.doesNotMatch(html, /<iframe|https:\/\/.*(?:cdn|fonts)/i);
});
