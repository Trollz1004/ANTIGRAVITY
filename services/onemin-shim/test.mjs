// node --test test.mjs — exercises the shim against a mock 1min.ai upstream.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
let mock, shim;
let mockPort, shimPort;
let lastUpstreamReq = null;

before(async () => {
  // Mock 1min.ai upstream
  mock = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      lastUpstreamReq = { url: req.url, headers: req.headers, body: JSON.parse(body || '{}') };
      if (!req.headers['api-key']) {
        res.writeHead(401, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ message: 'unauthorized' }));
      }
      if ((req.url || '').includes('isStreaming=true')) {
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        res.write('event: content\ndata: {"content":"Hello "}\n\n');
        res.write('event: content\ndata: {"content":"world"}\n\n');
        res.write('event: done\ndata: {}\n\n');
        return res.end();
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        aiRecord: {
          status: 'SUCCESS',
          aiRecordDetail: { resultObject: ['Hello from mock 1min'] },
        },
      }));
    });
  });
  await new Promise((r) => mock.listen(0, '127.0.0.1', r));
  mockPort = mock.address().port;

  shimPort = 21300 + Math.floor(Math.random() * 500);
  shim = spawn(process.execPath, [join(here, 'server.mjs')], {
    env: {
      ...process.env,
      ONEMIN_SHIM_PORT: String(shimPort),
      ONEMIN_UPSTREAM: `http://127.0.0.1:${mockPort}`,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('shim did not start')), 5000);
    shim.stdout.on('data', (d) => { if (String(d).includes('listening')) { clearTimeout(t); resolve(); } });
    shim.stderr.on('data', (d) => console.error('shim stderr:', String(d)));
  });
});

after(() => { shim?.kill(); mock?.close(); });

const base = () => `http://127.0.0.1:${shimPort}`;

test('GET /v1/models returns an OpenAI-shaped list', async () => {
  const r = await fetch(`${base()}/v1/models`);
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.object, 'list');
  assert.ok(j.data.length > 0 && j.data[0].id);
});

test('missing auth is a 401 openai-shaped error', async () => {
  const r = await fetch(`${base()}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'hi' }] }),
  });
  assert.equal(r.status, 401);
  const j = await r.json();
  assert.ok(j.error.message.includes('Missing API key'));
});

test('non-streaming: translates request and response, forwards model verbatim', async () => {
  const r = await fetch(`${base()}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer test-key-123' },
    body: JSON.stringify({
      model: 'my-custom-model-id',
      messages: [
        { role: 'system', content: 'Be brief.' },
        { role: 'user', content: 'Say hello' },
      ],
    }),
  });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.object, 'chat.completion');
  assert.equal(j.choices[0].message.content, 'Hello from mock 1min');
  assert.equal(j.choices[0].finish_reason, 'stop');
  // upstream request shape
  assert.equal(lastUpstreamReq.body.type, 'UNIFY_CHAT_WITH_AI');
  assert.equal(lastUpstreamReq.body.model, 'my-custom-model-id');
  assert.ok(lastUpstreamReq.body.promptObject.prompt.includes('SYSTEM: Be brief.'));
  assert.ok(lastUpstreamReq.body.promptObject.prompt.includes('USER: Say hello'));
  // key forwarded via API-KEY header, never logged
  assert.equal(lastUpstreamReq.headers['api-key'], 'test-key-123');
});

test('streaming: emits OpenAI chunks then [DONE]', async () => {
  const r = await fetch(`${base()}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer test-key-123' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [{ role: 'user', content: 'Say hello' }],
    }),
  });
  assert.equal(r.status, 200);
  assert.ok((r.headers.get('content-type') || '').includes('text/event-stream'));
  const text = await r.text();
  const datas = text.split('\n\n').filter(Boolean)
    .map((b) => b.split('\n').find((l) => l.startsWith('data: '))?.slice(6))
    .filter(Boolean);
  assert.equal(datas.at(-1), '[DONE]');
  const chunks = datas.slice(0, -1).map((d) => JSON.parse(d));
  const content = chunks.map((c) => c.choices[0].delta.content || '').join('');
  assert.equal(content, 'Hello world');
  assert.equal(chunks.at(-1).choices[0].finish_reason, 'stop');
});

test('upstream empty payload fails closed as 502', async () => {
  // Point a second request at a path the mock answers with empty resultObject
  const orig = mock.listeners('request')[0];
  mock.removeAllListeners('request');
  mock.on('request', (req, res) => {
    let b = ''; req.on('data', (c) => (b += c));
    req.on('end', () => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ aiRecord: { aiRecordDetail: { resultObject: [] } } }));
    });
  });
  const r = await fetch(`${base()}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer test-key-123' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'hi' }] }),
  });
  assert.equal(r.status, 502);
  const j = await r.json();
  assert.ok(j.error.message.includes('empty result payload'));
  mock.removeAllListeners('request');
  mock.on('request', orig);
});
