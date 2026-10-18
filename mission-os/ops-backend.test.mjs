import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
let ops = {};
try { ops = await import('./ops-backend.mjs'); } catch {}
test('origin and DNS rebinding guard rejects foreign hosts and POSTs', () => {
 assert.equal(typeof ops.guardRequest, 'function');
 const req = (headers, method='POST') => ({headers,method});
 assert.equal(ops.guardRequest(req({host:'127.0.0.1:3130',origin:'https://evil.example','content-type':'application/json'}),3130),403);
 assert.equal(ops.guardRequest(req({host:'evil.example:3130'},'GET'),3130),403);
 assert.equal(ops.guardRequest(req({host:'127.0.0.1:3130','content-type':'application/json'}),3130),403);
 assert.equal(ops.guardRequest(req({host:'127.0.0.1:3130',origin:'http://127.0.0.1:3130','content-type':'application/json'}),3130),0);
});
test('browser URL validator rejects executable schemes and credentials', () => {
 assert.equal(typeof ops.browserURL, 'function');
 for (const s of ['file:///C:/secret','javascript:alert(1)','http://u:p@example.com','data:text/html,x']) assert.throws(()=>ops.browserURL(s));
 assert.equal(ops.browserURL('https://example.com/'),'https://example.com/');
});
test('all read views return sourced envelopes with no invented activity', async () => {
 assert.equal(typeof ops.readOps, 'function');
 for (const view of ['board','memory','node','logs','support','hermes','settings','browser','video','youtube','marketing','ecosystem']) {
  const v=await ops.readOps(view,{root:'C:/ANTIGRAVITY',state:async()=>({services:[]}),bridges:async()=>({bridges:[]})});
  assert.equal(typeof v.ok,'boolean',view); assert.ok(v.generated,view); assert.ok(v.source,view);
  assert.ok(Array.isArray(v.items),view);
 }
});
