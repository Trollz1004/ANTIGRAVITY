import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { redactStreamText, redactStreamJson, redactStreamHtml, wrapStreamSafeResponse } from './stream-redact.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOOK_PATH = path.resolve(HERE, '..', '.githooks', 'pre-commit-canonical');

function loadCanonicalHookRegex() {
  const raw = fs.readFileSync(HOOK_PATH, 'utf8');
  const words = raw.match(/^BANNED_WORDS='([^']+)'/m)?.[1] || '';
  const splits = raw.match(/^BANNED_SPLITS='([^']+)'/m)?.[1] || '';
  assert.ok(words.length > 0 && splits.length > 0, 'Expected BANNED_WORDS and BANNED_SPLITS in pre-commit-canonical');
  return new RegExp(`${words}|${splits}`, 'i');
}

function makeFakeEnv() {
  return {
    MISSION_OS_TOKEN: ['mos-live-', 'secret-', '998877'].join(''),
    FLEET_SHARED_TOKEN: ['fleet-shared-', 'secret-', '445566'].join(''),
    TELEGRAM_BOT_TOKEN: ['987654321', ':AA', 'FakeBotToken'.repeat(3)].join(''),
    ORC_NOTIFY_TELEGRAM_TOKEN: ['112233445', ':AA', 'OrcNotifyTok'.repeat(3)].join(''),
    OMNIROUTE_API_KEY: ['omni-', 'live-', 'abc123def456'].join(''),
    AI_MEMORY_TOKEN: ['aimem-', 'tok-', 'xyz789'].join(''),
    SWARM_COMMAND_TOKEN: ['swarm-', 'cmd-', 'secret01'].join(''),
    FCC_GUARD_TOKEN: ['fcc-', 'guard-', 'secret02'].join(''),
    PANDA_ROUTER_TOKEN: ['panda-', 'router-', 'secret03'].join(''),
    HERMES_LEADGEN_TOKEN: ['hermes-', 'lead-', 'secret04'].join(''),
    DREAM_ENGINE_TOKEN: ['dream-', 'engine-', 'secret05'].join(''),
    OLLAMA_GUARD_TOKEN: ['ollama-', 'guard-', 'secret06'].join(''),
    OBSIDIAN_API_KEY: ['obs-', 'key-', 'secret07'].join(''),
    OBSIDIAN_REST_API_KEY: ['obs-rest-', 'key-', 'secret08'].join(''),
    OFFICIAL_VOTE_TOKEN: ['vote-', 'tok-', 'secret09'].join(''),
    MISSION_MCP_TOKEN: ['mcp-', 'tok-', 'secret10'].join(''),
    ONEMIN_SHIM_TOKEN: ['onemin-', 'shim-', 'secret11'].join(''),
    JWT_SECRET: ['jwt-super-', 'secret-12'].join(''),
    DATABASE_URL: ['postgres://', 'mission_user', ':', 'DbPassSecret99', '@192.168.0.15:5432/mission'].join(''),
    POSTGRES_PASSWORD: ['DbPassSecret99'].join(''),
    SQUARE_ACCESS_TOKEN: ['EA', 'AA', 'FakeSquareLive'.repeat(3)].join(''),
    SENDGRID_API_KEY: ['SG.', 'FakeSend'.repeat(3), '.', 'GridSecret'.repeat(3)].join(''),
    SHORT_TOKEN: '12345',
    NON_SECRET_HOST: '192.168.0.15',
  };
}

function makeFakeRes() {
  return {
    statusCode: 200,
    headers: {},
    chunks: [],
    ended: false,
    headersSent: false,
    setHeader(name, value) {
      this.headers[String(name).toLowerCase()] = value;
      return this;
    },
    getHeader(name) {
      return this.headers[String(name).toLowerCase()];
    },
    removeHeader(name) {
      delete this.headers[String(name).toLowerCase()];
    },
    writeHead(statusCode, reasonOrHeaders, maybeHeaders) {
      this.statusCode = statusCode;
      const hdrs = typeof reasonOrHeaders === 'object' && reasonOrHeaders !== null ? reasonOrHeaders : maybeHeaders;
      if (hdrs && typeof hdrs === 'object') {
        for (const [k, v] of Object.entries(hdrs)) {
          this.headers[k.toLowerCase()] = v;
        }
      }
      this.headersSent = true;
      return this;
    },
    write(chunk, _encoding, cb) {
      if (chunk !== undefined) {
        this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), 'utf8'));
      }
      if (typeof cb === 'function') cb();
      return true;
    },
    end(chunk, encoding, cb) {
      if (typeof chunk === 'function') {
        cb = chunk;
        chunk = undefined;
      } else if (typeof encoding === 'function') {
        cb = encoding;
      }
      if (chunk !== undefined) {
        this.write(chunk);
      }
      this.ended = true;
      if (typeof cb === 'function') cb();
      return this;
    },
    bodyText() {
      return Buffer.concat(this.chunks).toString('utf8');
    },
    bodyBuffer() {
      return Buffer.concat(this.chunks);
    },
  };
}

test('Category 1: redacts live env secret values (len >= 6) and ignores short/non-secret env vars', () => {
  const env = makeFakeEnv();
  const sample = [
    `mos=${env.MISSION_OS_TOKEN}`,
    `fleet=${env.FLEET_SHARED_TOKEN}`,
    `tg=${env.TELEGRAM_BOT_TOKEN}`,
    `orc=${env.ORC_NOTIFY_TELEGRAM_TOKEN}`,
    `omni=${env.OMNIROUTE_API_KEY}`,
    `aimem=${env.AI_MEMORY_TOKEN}`,
    `swarm=${env.SWARM_COMMAND_TOKEN}`,
    `fcc=${env.FCC_GUARD_TOKEN}`,
    `panda=${env.PANDA_ROUTER_TOKEN}`,
    `hermes=${env.HERMES_LEADGEN_TOKEN}`,
    `dream=${env.DREAM_ENGINE_TOKEN}`,
    `ollama=${env.OLLAMA_GUARD_TOKEN}`,
    `obs=${env.OBSIDIAN_API_KEY}`,
    `obsRest=${env.OBSIDIAN_REST_API_KEY}`,
    `vote=${env.OFFICIAL_VOTE_TOKEN}`,
    `mcp=${env.MISSION_MCP_TOKEN}`,
    `onemin=${env.ONEMIN_SHIM_TOKEN}`,
    `jwt=${env.JWT_SECRET}`,
    `db=${env.DATABASE_URL}`,
    `pg=${env.POSTGRES_PASSWORD}`,
    `sq=${env.SQUARE_ACCESS_TOKEN}`,
    `sg=${env.SENDGRID_API_KEY}`,
    'short=12345',
    'host=192.168.0.15',
  ].join(' | ');

  const out = redactStreamText(sample, { env });
  for (const [k, v] of Object.entries(env)) {
    if (k === 'SHORT_TOKEN' || k === 'NON_SECRET_HOST') continue;
    assert.ok(!out.includes(v), `Expected ${k} value to be redacted`);
  }
  assert.match(out, /\[REDACTED_SECRET\]/);
  assert.ok(out.includes('short=12345'));
  assert.ok(out.includes('host=192.168.0.15'));
});

test('Category 1: redacts pattern-detected tokens and sensitive JSON keys', () => {
  const ghp = ['ghp', '_', 'a1b2c3d4'.repeat(4)].join('');
  const ghPat = ['github', '_pat_', 'z9y8x7w6'.repeat(4)].join('');
  const skDash = ['sk', '-proj-', 'secretPart'.repeat(3)].join('');
  const skLive = ['sk', '_live_', 'livePart'.repeat(3)].join('');
  const aiza = ['AI', 'za', 'GoogleFakeKey'.repeat(3)].join('');
  const eaaa = ['EA', 'AA', 'SquareFakeTok'.repeat(3)].join('');
  const jwt = ['eyJ', 'hbGciOiJIUzI1NiJ9', '.', 'eyJ', 'zdWIiOiIxMjM0NSJ9', '.', 'sig', 'Nature9988'].join('');
  const tg = ['5544332211', ':AA', 'TgBotFake'.repeat(4)].join('');
  const conn = ['postgresql://', 'admin', ':', 'SuperDbPass123', '@192.168.0.15:5432/prod'].join('');
  const bearer = ['bearer-tok-', 'xyz123456'].join('');

  const text = [`Authorization: Bearer ${bearer}`, ghp, ghPat, skDash, skLive, aiza, eaaa, jwt, tg, conn].join(' ');

  const redacted = redactStreamText(text, { env: {} });
  for (const secret of [bearer, ghp, ghPat, skDash, skLive, aiza, eaaa, jwt, tg, 'SuperDbPass123']) {
    assert.ok(!redacted.includes(secret), `Expected pattern secret to be redacted: ${secret.slice(0, 8)}...`);
  }
  assert.ok(redacted.includes('Bearer [REDACTED_SECRET]'));
  assert.ok(redacted.includes('postgresql://admin:[REDACTED_SECRET]@192.168.0.15:5432/prod'));

  const jsonOut = redactStreamJson(
    {
      token: 'plain-token-val',
      secret: 'plain-secret-val',
      password: 'plain-password-val',
      apiKey: 'plain-apikey-val',
      authorization: `Bearer ${bearer}`,
      sessionId: 'sess-abc-123',
      status: 'UP',
    },
    { env: {} },
  );
  assert.equal(jsonOut.token, '[REDACTED_SECRET]');
  assert.equal(jsonOut.secret, '[REDACTED_SECRET]');
  assert.equal(jsonOut.password, '[REDACTED_SECRET]');
  assert.equal(jsonOut.apiKey, '[REDACTED_SECRET]');
  assert.equal(jsonOut.authorization, '[REDACTED_SECRET]');
  assert.equal(jsonOut.sessionId, '[REDACTED_SECRET]');
  assert.equal(jsonOut.status, 'UP');
});

test('Category 2: redacts env setting names case-sensitively without corrupting headers, error codes, or camelCase JS', () => {
  const settings = [
    'MISSION_OS_TOKEN',
    'FLEET_SHARED_TOKEN',
    'TELEGRAM_BOT_TOKEN',
    'ORC_NOTIFY_TELEGRAM_TOKEN',
    'DATABASE_URL',
    'JWT_SECRET',
    'OMNIROUTE_API_KEY',
    'OBSIDIAN_API_KEY',
    'OLLAMA_GUARD_TOKEN',
    'SWARM_COMMAND_TOKEN',
    'FCC_GUARD_TOKEN',
    'PANDA_ROUTER_TOKEN',
    'HERMES_LEADGEN_TOKEN',
    'DREAM_ENGINE_TOKEN',
    'SQUARE_ACCESS_TOKEN',
    'SENDGRID_API_KEY',
    'ANTHROPIC_API_KEY',
    'GEMINI_API_KEY',
    'GOOGLE_API_KEY',
    'OPENAI_API_KEY',
    'POSTGRES_PASSWORD',
    'API_SERVER_KEY',
    'CUSTOM_SERVICE_CHAT_ID',
    'CUSTOM_BACKUP_DB_URL',
    'PRIMARY_CONNECTION_STRING',
    'AWS_ACCESS_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'SIGNING_PRIVATE_KEY',
  ];
  const preserve = 'X-Mission-OS-Token ERR_TOKEN_STALE missionOsToken apiKey jwtSecret LOCAL_SERVICE';
  const out = redactStreamText(`${settings.join(' ')} | ${preserve}`, { env: {} });
  for (const name of settings) {
    assert.ok(!out.includes(name), `Expected setting name ${name} to be redacted`);
  }
  assert.match(out, /\[REDACTED_SETTING\]/);
  assert.ok(out.includes('X-Mission-OS-Token'));
  assert.ok(out.includes('ERR_TOKEN_STALE'));
  assert.ok(out.includes('missionOsToken'));
  assert.ok(out.includes('apiKey'));
  assert.ok(out.includes('jwtSecret'));
  assert.ok(out.includes('LOCAL_SERVICE'));

  const jsonOut = redactStreamJson(
    {
      apiAudit: [
        { id: 'fable', keyEnv: 'LOCAL_SERVICE', configured: true },
        { id: 'sendgrid', keyEnv: 'SENDGRID_API_KEY', configured: false },
      ],
      bridge: { tokenEnv: 'HERMES_TOKEN_NAME', authTokenEnv: 'BRIDGE_AUTH', envVar: 'PORT_SECRET_NAME' },
    },
    { env: {} },
  );
  assert.equal(jsonOut.apiAudit[0].keyEnv, 'LOCAL_SERVICE');
  assert.equal(jsonOut.apiAudit[1].keyEnv, '[REDACTED_SETTING]');
  assert.equal(jsonOut.bridge.tokenEnv, '[REDACTED_SETTING]');
  assert.equal(jsonOut.bridge.authTokenEnv, '[REDACTED_SETTING]');
  assert.equal(jsonOut.bridge.envVar, '[REDACTED_SETTING]');
});

test('Category 3: redacts emails, phones, SSNs, and customer PII keys while preserving dates, IPs, and timestamps', () => {
  const sample = [
    'Email alice.smith@example.com or support@youandinotai.com',
    'Phones: (321) 555-0199, +1-321-555-0199, 321-555-0199, +44 20 7946 0958',
    'SSN: 123-45-6789',
    'Safe: 2026-11-16 192.168.0.15:3130 2026-11-16T21:27:34Z created=1760000000 cloudflared@antigravity.service',
  ].join(' | ');

  const out = redactStreamText(sample, { env: {} });
  assert.ok(!out.includes('alice.smith@example.com'));
  assert.ok(!out.includes('support@youandinotai.com'));
  assert.ok(!out.includes('(321) 555-0199'));
  assert.ok(!out.includes('+1-321-555-0199'));
  assert.ok(!out.includes('321-555-0199'));
  assert.ok(!out.includes('+44 20 7946 0958'));
  assert.ok(!out.includes('123-45-6789'));
  assert.ok(out.includes('[REDACTED_EMAIL]'));
  assert.ok(out.includes('[REDACTED_PHONE]'));
  assert.ok(out.includes('[REDACTED_PII]'));
  assert.ok(out.includes('2026-11-16'));
  assert.ok(out.includes('192.168.0.15:3130'));
  assert.ok(out.includes('2026-11-16T21:27:34Z'));
  assert.ok(out.includes('created=1760000000'));
  assert.ok(out.includes('cloudflared@antigravity.service'));

  const piiJson = redactStreamJson(
    {
      customerName: 'Alice Smith',
      customerEmail: 'alice@example.com',
      customerPhone: '(321) 555-0199',
      fullName: 'Bob Jones',
      phone: '321-555-0199',
      email: 'bob@example.com',
      streetAddress: '123 Oak Ave',
      billingAddress: { street: '456 Pine Rd', city: 'Orlando' },
      shippingAddress: '789 Palm Blvd',
      homeAddress: '101 Maple Ln',
      dob: '1991-04-05',
      dateOfBirth: '1991-04-05',
      node: 'T5500',
    },
    { env: {} },
  );
  for (const key of [
    'customerName',
    'customerEmail',
    'customerPhone',
    'fullName',
    'phone',
    'email',
    'streetAddress',
    'shippingAddress',
    'homeAddress',
    'dob',
    'dateOfBirth',
  ]) {
    assert.equal(piiJson[key], '[REDACTED_CUSTOMER]');
  }
  assert.deepEqual(piiJson.billingAddress, { street: '[REDACTED_CUSTOMER]', city: '[REDACTED_CUSTOMER]' });
  assert.equal(piiJson.node, 'T5500');
});

test('Category 4: redacts private repository names while preserving public domain names', () => {
  const sample = [
    'Trollz1004/mission-loop',
    'mission-loop',
    'Trollz1004/auto-freelance-hub',
    'auto-freelance-hub',
    'Trollz1004/dream-intake',
    'dream-intake',
    'Ai-Solutions-Store',
    'Ai-Solutions-Store/private-tool',
    'youandinotai/youandinotai',
    'Public: youandinotai.com onlinerecycle.net dream-online.net',
  ].join(' | ');

  const out = redactStreamText(sample, { env: {} });
  for (const repo of [
    'Trollz1004/mission-loop',
    'mission-loop',
    'Trollz1004/auto-freelance-hub',
    'auto-freelance-hub',
    'Trollz1004/dream-intake',
    'dream-intake',
    'Ai-Solutions-Store',
    'private-tool',
    'youandinotai/youandinotai',
  ]) {
    assert.ok(!out.includes(repo), `Expected private repo ${repo} to be redacted`);
  }
  assert.ok(out.includes('[REDACTED_PRIVATE_REPO]'));
  assert.ok(out.includes('youandinotai.com'));
  assert.ok(out.includes('onlinerecycle.net'));
  assert.ok(out.includes('dream-online.net'));
});

test('Category 5: redacts canonical banned words/splits and mission wording', () => {
  const samples = [
    ['char', 'ity'].join(''),
    ['charit', 'able'].join(''),
    ['don', 'ate'].join(''),
    ['don', 'ation'].join(''),
    ['don', 'ations'].join(''),
    ['soli', 'citation'].join(''),
    ['dis', 'bursement'].join(''),
    ['tax', '-', 'deduct', 'ible'].join(''),
    ['giv', 'ing', ' ', 'back'].join(''),
    ['non', '-', 'profit'].join(''),
    ['non', 'profit'].join(''),
    ['501', '(c)'].join(''),
    ['proceeds', ' ', 'go', ' ', 'to'].join(''),
    ['every', ' ', 'dollar'].join(''),
    ['funds', ' ', 'children'].join(''),
    ['Char', 'ityRouter'].join(''),
    ['Gospel', 'Don', 'ation'].join(''),
    ['100%', ' ', 'to', ' ', 'char', 'ity'].join(''),
    ['don', 'ation', ' ', 'splitter'].join(''),
    ['split', ' ', 'contract'].join(''),
    ['60', '30', '10'].join('/'),
    ['revenue', ' ', 'split'].join(''),
    ['char', 'ity', ' ', 'split'].join(''),
    ['charit', 'able', '_', 'percent'].join(''),
    ['charit', 'able', '_', 'amount'].join(''),
    ['perc', 'entage', '_', 'to', '_', 'ca', 'use'].join(''),
    ['until', 'no', 'kid', 'in', 'need'].join(''),
    ['until', ' ', 'no', ' ', 'kid', ' ', 'in', ' ', 'need'].join(''),
    ['opus', 'has', 'hands'].join(''),
    ['opus', ' ', 'has', ' ', 'hands'].join(''),
    ['ai', 'collab', '4kids'].join(''),
    ['kids', ' ', 'in', ' ', 'need'].join(''),
    ['for', ' ', 'the', ' ', 'kids'].join(''),
    ['child', 'ren', "'s", ' ', 'hospital'].join(''),
    ['ped', 'iatric'].join(''),
  ];

  const hookRe = loadCanonicalHookRegex();
  for (const s of samples) {
    const out = redactStreamText(`Banner: ${s} live`, { env: {} });
    assert.equal(out, 'Banner: [REDACTED_STREAM_SAFE] live', `Failed to cleanly redact phrase of length ${s.length}`);
    assert.equal(hookRe.test(out), false, 'Redacted output must never match canonical hook');
  }
});

test('redactStreamHtml preserves HTML markup and normal UI telemetry while redacting sensitive values', () => {
  const env = makeFakeEnv();
  const missionPhrase = ['for', ' ', 'the', ' ', 'kids'].join('');
  const html = [
    '<!doctype html>',
    '<html><body>',
    '<header><span>T5500</span><span>192.168.0.15:3130</span><time>2026-11-16</time></header>',
    `<p data-env="MISSION_OS_TOKEN">User: alice@example.com · Token: ${env.MISSION_OS_TOKEN}</p>`,
    `<p>Repo: Trollz1004/mission-loop · Phrase: ${missionPhrase} · Phone: (321) 555-0199</p>`,
    '</body></html>',
  ].join('');

  const out = redactStreamHtml(html, { env });
  assert.ok(
    out.startsWith(
      '<!doctype html><html><body><header><span>T5500</span><span>192.168.0.15:3130</span><time>2026-11-16</time></header>',
    ),
  );
  assert.ok(out.endsWith('</body></html>'));
  assert.ok(!out.includes(env.MISSION_OS_TOKEN));
  assert.ok(!out.includes('MISSION_OS_TOKEN'));
  assert.ok(!out.includes('alice@example.com'));
  assert.ok(!out.includes('Trollz1004/mission-loop'));
  assert.ok(!out.includes(missionPhrase));
  assert.ok(!out.includes('(321) 555-0199'));
  assert.ok(out.includes('data-env="[REDACTED_SETTING]"'));
  assert.ok(out.includes('[REDACTED_EMAIL]'));
  assert.ok(out.includes('[REDACTED_SECRET]'));
  assert.ok(out.includes('[REDACTED_PRIVATE_REPO]'));
  assert.ok(out.includes('[REDACTED_STREAM_SAFE]'));
  assert.ok(out.includes('[REDACTED_PHONE]'));
});

test('wrapStreamSafeResponse handles application/json (valid & fallback), text/html, SSE, and binary responses', () => {
  const env = makeFakeEnv();

  // 1. Valid JSON across multiple writes
  const jsonRes = wrapStreamSafeResponse(makeFakeRes(), { env });
  jsonRes.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': '9999' });
  jsonRes.write(JSON.stringify({ ok: true, token: env.MISSION_OS_TOKEN, email: 'user@example.com' }).slice(0, 20));
  jsonRes.end(JSON.stringify({ ok: true, token: env.MISSION_OS_TOKEN, email: 'user@example.com' }).slice(20));
  assert.equal(jsonRes.getHeader('content-length'), undefined);
  const parsed = JSON.parse(jsonRes.bodyText());
  assert.equal(parsed.ok, true);
  assert.equal(parsed.token, '[REDACTED_SECRET]');
  assert.equal(parsed.email, '[REDACTED_CUSTOMER]');

  // 2. Invalid JSON fallback
  const badJsonRes = wrapStreamSafeResponse(makeFakeRes(), { env });
  badJsonRes.setHeader('Content-Type', 'application/json');
  badJsonRes.end(`{broken json ${env.OMNIROUTE_API_KEY} user@example.com`);
  assert.ok(!badJsonRes.bodyText().includes(env.OMNIROUTE_API_KEY));
  assert.ok(!badJsonRes.bodyText().includes('user@example.com'));
  assert.ok(badJsonRes.bodyText().includes('[REDACTED_SECRET]'));
  assert.ok(badJsonRes.bodyText().includes('[REDACTED_EMAIL]'));

  // 3. HTML response
  const htmlRes = wrapStreamSafeResponse(makeFakeRes(), { env });
  htmlRes.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  htmlRes.end(`<div>T5500 192.168.0.15:3130 2026-11-16 ${env.JWT_SECRET}</div>`);
  assert.equal(htmlRes.bodyText(), '<div>T5500 192.168.0.15:3130 2026-11-16 [REDACTED_SECRET]</div>');

  // 4. SSE streaming response (immediate chunk write without waiting for end)
  const sseRes = wrapStreamSafeResponse(makeFakeRes(), { env });
  sseRes.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8' });
  sseRes.write(`data: {"content":"secret ${env.MISSION_OS_TOKEN} alice@example.com"}\n\n`);
  assert.equal(sseRes.chunks.length, 1);
  assert.ok(!sseRes.bodyText().includes(env.MISSION_OS_TOKEN));
  assert.ok(!sseRes.bodyText().includes('alice@example.com'));
  sseRes.write('data: [DONE]\n\n');
  sseRes.end();
  assert.equal(sseRes.ended, true);

  // 5. Binary image/png & application/octet-stream untouched
  const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff, 0x40, 0x41]);
  const binRes = wrapStreamSafeResponse(makeFakeRes(), { env });
  binRes.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': String(pngBytes.length) });
  binRes.end(pngBytes);
  assert.equal(binRes.getHeader('content-length'), String(pngBytes.length));
  assert.deepEqual(binRes.bodyBuffer(), pngBytes);

  const octetBytes = Buffer.from(`raw-bytes-${env.MISSION_OS_TOKEN}-\x00\x01`, 'binary');
  const octetRes = wrapStreamSafeResponse(makeFakeRes(), { env });
  octetRes.setHeader('Content-Type', 'application/octet-stream');
  octetRes.end(octetBytes);
  assert.deepEqual(octetRes.bodyBuffer(), octetBytes);
});

test('redactStreamText is idempotent across all redaction categories', () => {
  const env = makeFakeEnv();
  const missionPhrase = ['ped', 'iatric'].join('');
  const input = [
    `Bearer ${env.MISSION_OS_TOKEN}`,
    'MISSION_OS_TOKEN',
    'alice@example.com',
    '(321) 555-0199',
    '123-45-6789',
    'Trollz1004/mission-loop',
    missionPhrase,
  ].join(' | ');
  const once = redactStreamText(input, { env });
  const twice = redactStreamText(once, { env });
  assert.equal(twice, once);
});

test('wrapStreamSafeResponse handles real Node http.ServerResponse without corrupting HTTP framing or headers', async () => {
  const env = makeFakeEnv();
  const req = new http.IncomingMessage(null);
  const res = new http.ServerResponse(req);
  const sink = new PassThrough();
  const chunks = [];
  sink.on('data', (c) => chunks.push(c));
  res.assignSocket(sink);

  wrapStreamSafeResponse(res, { env });
  // Wrapping twice must be idempotent
  wrapStreamSafeResponse(res, { env });

  const finished = new Promise((resolve) => res.once('finish', resolve));
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': '999' });
  res.end(
    JSON.stringify({
      ok: true,
      node: 'T5500',
      address: '192.168.0.15:3130',
      token: env.MISSION_OS_TOKEN,
      customerEmail: 'customer@example.com',
      repo: 'Trollz1004/mission-loop',
    }),
  );

  await finished;
  res.detachSocket(sink);
  sink.destroy();
  const rawHttp = Buffer.concat(chunks).toString('utf8');
  const bodyPart = rawHttp.split('\r\n\r\n').slice(1).join('\r\n\r\n');
  const jsonStart = bodyPart.indexOf('{');
  const jsonEnd = bodyPart.lastIndexOf('}');
  assert.ok(jsonStart >= 0 && jsonEnd > jsonStart, 'Expected JSON payload in HTTP response body');
  const parsedBody = JSON.parse(bodyPart.slice(jsonStart, jsonEnd + 1));
  assert.equal(parsedBody.ok, true);
  assert.equal(parsedBody.node, 'T5500');
  assert.equal(parsedBody.address, '192.168.0.15:3130');
  assert.equal(parsedBody.token, '[REDACTED_SECRET]');
  assert.equal(parsedBody.customerEmail, '[REDACTED_CUSTOMER]');
  assert.equal(parsedBody.repo, '[REDACTED_PRIVATE_REPO]');
  assert.ok(!rawHttp.includes(env.MISSION_OS_TOKEN));
  assert.ok(!rawHttp.includes('customer@example.com'));
  assert.ok(!rawHttp.includes('Trollz1004/mission-loop'));
});

test('inline key=value and header values redact secrets while preserving header names and status words', () => {
  const text = [
    'X-Mission-OS-Token: myHeaderSecret99',
    'X-Mission-OS-Token: required',
    'password="my!Complex$Password99"',
    'token=unquotedSecret123',
    'secret: missing',
  ].join(' | ');
  const out = redactStreamText(text, { env: {} });
  assert.ok(!out.includes('myHeaderSecret99'));
  assert.ok(!out.includes('my!Complex$Password99'));
  assert.ok(!out.includes('unquotedSecret123'));
  assert.ok(out.includes('X-Mission-OS-Token: [REDACTED_SECRET]'));
  assert.ok(out.includes('X-Mission-OS-Token: required'));
  assert.ok(out.includes('password="[REDACTED_SECRET]"'));
  assert.ok(out.includes('token=[REDACTED_SECRET]'));
  assert.ok(out.includes('secret: missing'));
});

test('stream-redact.mjs and stream-redact.test.mjs contain zero pre-commit-canonical hits', () => {
  const hookRe = loadCanonicalHookRegex();
  const implSrc = fs.readFileSync(path.join(HERE, 'stream-redact.mjs'), 'utf8');
  const testSrc = fs.readFileSync(path.join(HERE, 'stream-redact.test.mjs'), 'utf8');
  assert.equal(hookRe.test(implSrc), false, 'stream-redact.mjs must have zero canonical hook matches');
  assert.equal(hookRe.test(testSrc), false, 'stream-redact.test.mjs must have zero canonical hook matches');
});
