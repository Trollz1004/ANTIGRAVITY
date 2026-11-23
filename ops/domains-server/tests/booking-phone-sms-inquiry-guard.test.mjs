import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');
const SERVER_PATH = path.resolve(HERE, '..', 'server.mjs');
const INDEX_HTML_PATH = path.join(REPO_ROOT, 'domains', 'onlinerecycle.net', 'site', 'index.html');
const LOOPBACK = ['127', '0', '0', '1'].join('.');

function extractBookingScript(html) {
  const marker = '<!-- Booking Calendar & Direct Slot Logic -->';
  const idx = html.indexOf(marker);
  assert.ok(idx !== -1, 'booking script marker must exist in index.html');
  const tail = html.slice(idx);
  const match = tail.match(/<script>([\s\S]*?)<\/script>/i);
  assert.ok(match && match[1], 'booking inline script must exist');
  return match[1];
}

function createFakeElement(id = '', tagName = 'div') {
  const listeners = new Map();
  const attrs = new Map();
  const classes = new Set();
  const el = {
    id,
    tagName: tagName.toUpperCase(),
    type: '',
    value: '',
    textContent: '',
    disabled: false,
    required: false,
    src: '',
    href: '',
    style: { display: '' },
    children: [],
    classList: {
      add(c) {
        classes.add(c);
      },
      remove(c) {
        classes.delete(c);
      },
      toggle(c, force) {
        const shouldAdd = force === undefined ? !classes.has(c) : Boolean(force);
        if (shouldAdd) classes.add(c);
        else classes.delete(c);
      },
      contains(c) {
        return classes.has(c);
      },
    },
    setAttribute(k, v) {
      attrs.set(k, String(v));
    },
    getAttribute(k) {
      return attrs.has(k) ? attrs.get(k) : null;
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    dispatchEvent(type, ev = {}) {
      const fns = listeners.get(type) || [];
      for (const fn of fns) {
        fn({
          preventDefault() {},
          ...ev,
        });
      }
    },
    click() {
      if (this.disabled) return;
      this.dispatchEvent('click');
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    scrollIntoView() {},
  };
  let rawClassName = '';
  Object.defineProperty(el, 'className', {
    get() {
      return rawClassName;
    },
    set(v) {
      rawClassName = String(v || '');
      classes.clear();
      for (const part of rawClassName.split(/\s+/).filter(Boolean)) {
        classes.add(part);
      }
    },
  });
  let rawInnerHtml = '';
  Object.defineProperty(el, 'innerHTML', {
    get() {
      return rawInnerHtml;
    },
    set(v) {
      rawInnerHtml = String(v || '');
      if (rawInnerHtml === '') {
        this.children = [];
      }
    },
  });
  return el;
}

function mountBookingDom({ bookedSlots = [] } = {}) {
  const html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
  const scriptSource = extractBookingScript(html);

  const elements = new Map();
  const getEl = (id) => {
    if (!elements.has(id)) {
      elements.set(id, createFakeElement(id));
    }
    return elements.get(id);
  };

  getEl('bf-service-type').value = 'dropoff';
  getEl('bf-count').value = '1-5 items';
  getEl('bf-wipe').value = 'Standard intake & storage wipe/destruction';

  const fetchCalls = [];
  const fakeFetch = (url, opts = {}) => {
    fetchCalls.push({ url, opts });
    if (url === '/api/booking-config') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            ok: true,
            timezone: 'America/New_York',
            googleScheduleEmbed: { dropoffUrl: '', pickupUrl: '' },
            bookedSlots,
          }),
      });
    }
    if (url === '/api/book') {
      const body = opts && opts.body ? JSON.parse(opts.body) : {};
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            ok: true,
            booking: {
              bookingId: 'OR-20261122-TEST0001',
              serviceType: body.serviceType || 'dropoff',
              fullName: body.fullName || 'Jane Doe',
              date: body.date || '2026-11-22',
              slotCode: body.slotCode || '09:00-09:30',
              slotLabel: body.slotLabel || '9:00 AM – 9:30 AM',
              deviceCount: body.deviceCount || '1-5 items',
            },
            googleCalendarUrl: 'https://calendar.google.com/calendar/render?action=TEMPLATE',
            icsUrl: '/api/calendar.ics?id=OR-20261122-TEST0001',
            smsUrl: 'sms:+13213962008?body=OnlineRecycle.net',
          }),
      });
    }
    return Promise.resolve({
      json: () => Promise.resolve({ ok: false, error: 'unexpected fetch in unit test' }),
    });
  };

  const windowObj = {
    location: { search: '', hash: '' },
    addEventListener() {},
  };

  const context = vm.createContext({
    window: windowObj,
    document: {
      getElementById: getEl,
      createElement: (tag) => createFakeElement('', tag),
      querySelectorAll: () => [],
    },
    Date,
    Intl,
    URLSearchParams,
    fetch: fakeFetch,
    console,
  });

  vm.runInContext(scriptSource, context);
  return { elements, getEl, fetchCalls, windowObj };
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, LOOPBACK, () => {
      const addr = srv.address();
      const port = addr && typeof addr === 'object' ? addr.port : 0;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

function httpRequestJson(port, method, urlPath, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = payload !== undefined ? JSON.stringify(payload) : '';
    const req = http.request(
      {
        host: LOOPBACK,
        port,
        path: urlPath,
        method,
        headers: {
          Host: 'onlinerecycle.net',
          ...(payload !== undefined
            ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
              }
            : {}),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch {
            // ignore
          }
          resolve({ status: res.statusCode, raw, json });
        });
      },
    );
    req.on('error', reject);
    if (payload !== undefined) req.write(bodyStr);
    req.end();
  });
}

async function waitForServer(port) {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await httpRequestJson(port, 'GET', '/health');
      if (r.status === 200) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`domains-server did not come up on port ${port}`);
}

function futureDateIso(daysAhead = 2) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(
    new Date(Date.now() + daysAhead * 86400000),
  );
}

test('booking form in domains/onlinerecycle.net/site/index.html rejects phones with fewer than 10 digits and invalid emails when given', async () => {
  const { getEl, fetchCalls } = mountBookingDom();
  await new Promise((r) => setTimeout(r, 20));

  getEl('bf-name').value = 'Jane Doe';
  getEl('bf-devices').value = '2 Dell laptops and 1 desktop tower';

  // 1. Phone with fewer than 10 digits must be rejected client-side before POST /api/book
  for (const shortPhone of ['555-0199', '123456789', '(321) 555-019', 'ext 1234']) {
    getEl('bf-phone').value = shortPhone;
    getEl('bf-email').value = '';
    const before = fetchCalls.filter((c) => c.url === '/api/book').length;
    getEl('booking-form').dispatchEvent('submit');
    const after = fetchCalls.filter((c) => c.url === '/api/book').length;
    assert.equal(after, before, `form must not POST /api/book for <10 digit phone "${shortPhone}"`);
    assert.equal(getEl('booking-error').style.display, 'block');
    assert.match(getEl('booking-error').textContent, /10[- ]digit|phone/i);
  }

  // 2. Invalid email when given must be rejected client-side before POST /api/book
  getEl('bf-phone').value = '(321) 555-0199';
  for (const badEmail of ['not-an-email', 'jane@', '@example.com', 'jane@example', 'jane doe@example.com']) {
    getEl('bf-email').value = badEmail;
    const before = fetchCalls.filter((c) => c.url === '/api/book').length;
    getEl('booking-form').dispatchEvent('submit');
    const after = fetchCalls.filter((c) => c.url === '/api/book').length;
    assert.equal(after, before, `form must not POST /api/book for invalid email "${badEmail}"`);
    assert.equal(getEl('booking-error').style.display, 'block');
    assert.match(getEl('booking-error').textContent, /email/i);
  }

  // 3. Valid 10-digit phone with blank optional email succeeds and POSTs /api/book
  getEl('bf-phone').value = '(321) 555-0199';
  getEl('bf-email').value = '';
  const beforeBlankEmail = fetchCalls.filter((c) => c.url === '/api/book').length;
  getEl('booking-form').dispatchEvent('submit');
  const afterBlankEmail = fetchCalls.filter((c) => c.url === '/api/book').length;
  assert.equal(
    afterBlankEmail,
    beforeBlankEmail + 1,
    'form must POST /api/book when phone has 10 digits and email is empty',
  );

  // 4. Valid 10+ digit phone with valid email succeeds and POSTs /api/book
  getEl('bf-phone').value = '+1 (321) 555-0199';
  getEl('bf-email').value = 'jane.doe+recycle@example.com';
  getEl('booking-form').dispatchEvent('submit');
  const afterValidEmail = fetchCalls.filter((c) => c.url === '/api/book').length;
  assert.equal(afterValidEmail, beforeBlankEmail + 2, 'form must POST /api/book when phone and email are valid');
});

test('POST /api/book rejects phones with fewer than 10 digits and invalid emails when given, and accepts valid phones and optional or valid emails', async () => {
  const port = await getFreePort();
  const tmpBookingsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orc-b27-validate-bookings-'));
  const tmpStatsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orc-b27-validate-stats-'));
  const child = spawn(process.execPath, [SERVER_PATH], {
    env: {
      ...process.env,
      DOMAINS_SERVER_PORT: String(port),
      DOMAINS_SERVER_HOST: LOOPBACK,
      ORC_BOOKINGS_DIR: tmpBookingsDir,
      ORC_STATS_DIR: tmpStatsDir,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  try {
    await waitForServer(port);
    const dateIso = futureDateIso(2);

    // 1. Reject phones with fewer than 10 digits
    for (const shortPhone of ['555-0199', '123456789', '(321) 555-019']) {
      const res = await httpRequestJson(port, 'POST', '/api/book', {
        serviceType: 'dropoff',
        date: dateIso,
        slotCode: '09:00-09:30',
        slotLabel: '9:00 AM - 9:30 AM',
        fullName: 'Taylor Smith',
        phone: shortPhone,
        deviceCount: '1-5 items',
        deviceList: '2 laptops',
      });
      assert.equal(res.status, 400, `expected 400 for short phone "${shortPhone}", got ${res.status}: ${res.raw}`);
      assert.equal(res.json?.ok, false);
      assert.match(res.json?.error || '', /10[- ]digit|phone/i);
    }

    // 2. Reject invalid emails when given
    for (const badEmail of ['not-an-email', 'taylor@', '@example.com', 'taylor@example', 'taylor smith@example.com']) {
      const res = await httpRequestJson(port, 'POST', '/api/book', {
        serviceType: 'dropoff',
        date: dateIso,
        slotCode: '09:00-09:30',
        slotLabel: '9:00 AM - 9:30 AM',
        fullName: 'Taylor Smith',
        phone: '(321) 555-0144',
        email: badEmail,
        deviceCount: '1-5 items',
        deviceList: '2 laptops',
      });
      assert.equal(res.status, 400, `expected 400 for invalid email "${badEmail}", got ${res.status}: ${res.raw}`);
      assert.equal(res.json?.ok, false);
      assert.match(res.json?.error || '', /email/i);
    }

    // 3. Accept valid 10-digit phone with empty optional email
    const okNoEmail = await httpRequestJson(port, 'POST', '/api/book', {
      serviceType: 'dropoff',
      date: dateIso,
      slotCode: '09:00-09:30',
      slotLabel: '9:00 AM - 9:30 AM',
      fullName: 'Taylor Smith',
      phone: '(321) 555-0144',
      email: '',
      deviceCount: '1-5 items',
      deviceList: '2 laptops',
    });
    assert.equal(okNoEmail.status, 200);
    assert.equal(okNoEmail.json?.ok, true);

    // 4. Accept valid 11-digit phone with valid email
    const okWithEmail = await httpRequestJson(port, 'POST', '/api/book', {
      serviceType: 'dropoff',
      date: dateIso,
      slotCode: '10:00-10:30',
      slotLabel: '10:00 AM - 10:30 AM',
      fullName: 'Taylor Smith',
      phone: '+1 321-555-0144',
      email: 'taylor.smith@example.com',
      deviceCount: '1-5 items',
      deviceList: '2 laptops',
    });
    assert.equal(okWithEmail.status, 200);
    assert.equal(okWithEmail.json?.ok, true);
    assert.equal(okWithEmail.json?.booking?.email, 'taylor.smith@example.com');
  } finally {
    child.kill();
    fs.rmSync(tmpBookingsDir, { recursive: true, force: true });
    fs.rmSync(tmpStatsDir, { recursive: true, force: true });
  }
});

test('POST /api/book formats smsUrl with ?body= instead of ?&body= and still returns 200 and notifies the owner when inquiries/*.txt write fails after saving the booking', async () => {
  const tmpBookingsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orc-b27-inquiry-guard-bookings-'));
  const tmpStatsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orc-b27-inquiry-guard-stats-'));

  // Place a regular file at bookingsDir/inquiries so creating or writing inquiries/*.txt fails on disk.
  fs.writeFileSync(path.join(tmpBookingsDir, 'inquiries'), 'blocked-inquiries-dir', 'utf8');

  const prevBookingsDir = process.env.ORC_BOOKINGS_DIR;
  const prevStatsDir = process.env.ORC_STATS_DIR;
  const prevToken = process.env.ORC_NOTIFY_TELEGRAM_TOKEN;
  const prevChat = process.env.ORC_NOTIFY_TELEGRAM_CHAT;
  const prevFetch = globalThis.fetch;
  const origWriteFile = fsp.writeFile;

  process.env.ORC_BOOKINGS_DIR = tmpBookingsDir;
  process.env.ORC_STATS_DIR = tmpStatsDir;
  process.env.ORC_NOTIFY_TELEGRAM_TOKEN = 'test-bot-token';
  process.env.ORC_NOTIFY_TELEGRAM_CHAT = 'test-chat-id';

  const telegramCalls = [];
  globalThis.fetch = async (url, opts) => {
    telegramCalls.push({ url: String(url), opts });
    return { ok: true, status: 200 };
  };

  // Also force fsp.writeFile to reject for any inquiries/*.txt path even if mkdir were bypassed.
  fsp.writeFile = async (targetPath, ...rest) => {
    if (String(targetPath).includes('inquiries') && String(targetPath).endsWith('.txt')) {
      const err = new Error('simulated EIO writing inquiry txt');
      err.code = 'EIO';
      throw err;
    }
    return origWriteFile(targetPath, ...rest);
  };

  const port = await getFreePort();
  const serverModUrl = `${new URL('../server.mjs', import.meta.url).href}?t=${Date.now()}`;
  const mod = await import(serverModUrl);
  const srv = http.createServer(mod.server.listeners('request')[0]);

  await new Promise((resolve, reject) => {
    srv.listen(port, LOOPBACK, resolve);
    srv.on('error', reject);
  });

  try {
    const dateIso = futureDateIso(3);
    const res = await httpRequestJson(port, 'POST', '/api/book', {
      serviceType: 'pickup',
      date: dateIso,
      slotCode: '10:00-12:00',
      slotLabel: '10:00 AM - 12:00 PM',
      fullName: 'Jordan Vance',
      phone: '(321) 555-0188',
      email: 'jordan@example.com',
      address: '456 Oak Ave',
      city: 'Sorrento',
      zip: '32776',
      deviceCount: '6-15 items',
      deviceList: '4 workstations and 2 switches',
    });

    assert.equal(res.status, 200, `expected 200 even when inquiries/*.txt fails, got ${res.status}: ${res.raw}`);
    assert.equal(res.json?.ok, true);

    // Verify RFC 5724 smsUrl uses ?body= and never ?&body=
    const smsUrl = String(res.json?.smsUrl || '');
    assert.ok(
      smsUrl.startsWith('sms:+13213962008?body='),
      `expected smsUrl to start with sms:+13213962008?body=, got ${smsUrl}`,
    );
    assert.ok(!smsUrl.includes('?&body='), `smsUrl must not contain ?&body=: ${smsUrl}`);

    // Verify booking was saved to bookings.jsonl and marked notified: true
    const savedBookings = fs
      .readFileSync(path.join(tmpBookingsDir, 'bookings.jsonl'), 'utf8')
      .trim()
      .split(/\r?\n/)
      .map((line) => JSON.parse(line));
    assert.equal(savedBookings.length, 1);
    assert.equal(savedBookings[0].bookingId, res.json.booking.bookingId);
    assert.equal(savedBookings[0].notified, true);

    // Verify owner notification was sent via Telegram
    assert.equal(telegramCalls.length, 1, 'owner must still be notified when inquiries/*.txt write fails');
    assert.match(telegramCalls[0].url, /api\.telegram\.org\/bottest-bot-token\/sendMessage/);
    const tgPayload = JSON.parse(telegramCalls[0].opts.body);
    assert.equal(tgPayload.chat_id, 'test-chat-id');
    assert.match(tgPayload.text, /Jordan Vance/);
  } finally {
    await new Promise((resolve) => srv.close(resolve));
    fsp.writeFile = origWriteFile;
    globalThis.fetch = prevFetch;
    if (prevBookingsDir === undefined) delete process.env.ORC_BOOKINGS_DIR;
    else process.env.ORC_BOOKINGS_DIR = prevBookingsDir;
    if (prevStatsDir === undefined) delete process.env.ORC_STATS_DIR;
    else process.env.ORC_STATS_DIR = prevStatsDir;
    if (prevToken === undefined) delete process.env.ORC_NOTIFY_TELEGRAM_TOKEN;
    else process.env.ORC_NOTIFY_TELEGRAM_TOKEN = prevToken;
    if (prevChat === undefined) delete process.env.ORC_NOTIFY_TELEGRAM_CHAT;
    else process.env.ORC_NOTIFY_TELEGRAM_CHAT = prevChat;
    fs.rmSync(tmpBookingsDir, { recursive: true, force: true });
    fs.rmSync(tmpStatsDir, { recursive: true, force: true });
  }
});
