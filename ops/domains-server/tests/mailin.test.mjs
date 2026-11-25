import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { formatBookingMessage } from '../booking-notify.mjs';
import { dayKey } from '../booking-stats.mjs';
import * as serverMod from '../server.mjs';

const HTML_ENTITY_MAP = {
  '&amp;': '&',
  '&#39;': "'",
  '&apos;': "'",
  '&quot;': '"',
  '&nbsp;': ' ',
};

function decodeMailInEntities(text) {
  return String(text || '')
    .replace(/&(?:amp|#39|apos|quot|nbsp);/g, (entity) => HTML_ENTITY_MAP[entity] ?? entity)
    .replace(/\s+/g, ' ')
    .trim();
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');
const SERVER_PATH = path.resolve(HERE, '..', 'server.mjs');
const ENV_REQUIRED_PATH = path.resolve(HERE, '..', 'env.required.json');
const SITE_DIR = path.join(REPO_ROOT, 'domains', 'onlinerecycle.net', 'site');
const INDEX_HTML_PATH = path.join(SITE_DIR, 'index.html');
const LOOPBACK = ['127', '0', '0', '1'].join('.');
const TEST_MAILIN_ADDRESS = '1 Test Lane, Testville, FL 00000';

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

function httpRequest(port, method, urlPath, payload, headers = {}) {
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
            json = null;
          }
          resolve({ status: res.statusCode, raw, json, headers: res.headers });
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
      const r = await httpRequest(port, 'GET', '/health');
      if (r.status === 200) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 80));
  }
  throw new Error(`domains-server did not start on port ${port}`);
}

function extractMailInScript(html) {
  const marker = '<!-- Mail-In Option & Request Logic -->';
  const idx = html.indexOf(marker);
  assert.notEqual(idx, -1, 'mail-in script marker must exist in index.html');
  const tail = html.slice(idx);
  const match = tail.match(/<script>([\s\S]*?)<\/script>/i);
  assert.ok(match && match[1], 'mail-in inline script must exist');
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
    hidden: false,
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
    removeAttribute(k) {
      attrs.delete(k);
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
  return el;
}

function mountMailInDom({ available = false, onPostMailIn } = {}) {
  const html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
  const scriptSource = extractMailInScript(html);

  const elements = new Map();
  const getEl = (id) => {
    if (!elements.has(id)) {
      const el = createFakeElement(id);
      if (id === 'mailin-section' || id === 'tab-mailin' || id === 'mailin-confirm-box' || id === 'mailin-error') {
        el.hidden = id === 'mailin-section' || id === 'tab-mailin';
        el.style.display = 'none';
      }
      if (id === 'mi-count') {
        el.value = '1';
      }
      elements.set(id, el);
    }
    return elements.get(id);
  };

  const fetchCalls = [];
  const fakeFetch = async (url, opts = {}) => {
    fetchCalls.push({ url: String(url), opts });
    if (String(url) === '/api/mailin-config') {
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            ok: true,
            available: Boolean(available),
            enabled: Boolean(available),
            mailInAvailable: Boolean(available),
          };
        },
      };
    }
    if (String(url) === '/api/mailin') {
      const body = opts && opts.body ? JSON.parse(opts.body) : {};
      if (onPostMailIn) {
        return onPostMailIn(body);
      }
      return {
        ok: true,
        status: 200,
        async text() {
          return JSON.stringify({
            ok: true,
            referenceId: 'OR-20261125-MAILTEST00000001',
            bookingId: 'OR-20261125-MAILTEST00000001',
            mailingAddress: TEST_MAILIN_ADDRESS,
          });
        },
        async json() {
          return {
            ok: true,
            referenceId: 'OR-20261125-MAILTEST00000001',
            bookingId: 'OR-20261125-MAILTEST00000001',
            mailingAddress: TEST_MAILIN_ADDRESS,
          };
        },
      };
    }
    return {
      ok: false,
      status: 404,
      async json() {
        return { ok: false };
      },
    };
  };

  const context = vm.createContext({
    window: {
      location: { search: '', hash: '' },
      addEventListener() {},
    },
    document: {
      getElementById: getEl,
      createElement: (tag) => createFakeElement('', tag),
      querySelectorAll: () => [],
    },
    fetch: fakeFetch,
    URLSearchParams,
    console,
    Number,
    String,
    Boolean,
    JSON,
  });

  vm.runInContext(scriptSource, context);
  return { getEl, fetchCalls };
}

test('env.required.json lists RECYCLE_MAILIN_ADDRESS as an optional setting name only', () => {
  const raw = fs.readFileSync(ENV_REQUIRED_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  assert.ok(Array.isArray(parsed.optional), 'env.required.json must have optional array');
  assert.ok(
    parsed.optional.includes('RECYCLE_MAILIN_ADDRESS'),
    'env.required.json optional must include RECYCLE_MAILIN_ADDRESS',
  );
  assert.ok(!parsed.required.includes('RECYCLE_MAILIN_ADDRESS'), 'RECYCLE_MAILIN_ADDRESS must not be in required');
});

test('setting missing: /api/mailin-config reports available=false, mail-in option stays hidden, and POST /api/mailin answers 404', async () => {
  const port = await getFreePort();
  const tmpBookingsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orc-mailin-off-bookings-'));
  const tmpStatsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orc-mailin-off-stats-'));
  const env = {
    ...process.env,
    DOMAINS_SERVER_PORT: String(port),
    DOMAINS_SERVER_HOST: LOOPBACK,
    ORC_BOOKINGS_DIR: tmpBookingsDir,
    ORC_STATS_DIR: tmpStatsDir,
  };
  delete env.RECYCLE_MAILIN_ADDRESS;

  const child = spawn(process.execPath, [SERVER_PATH], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  try {
    await waitForServer(port);

    const switchRes = await httpRequest(port, 'GET', '/api/mailin-config');
    assert.equal(switchRes.status, 200);
    assert.equal(switchRes.json?.ok, true);
    assert.equal(switchRes.json?.available, false);
    assert.equal(switchRes.json?.enabled, false);

    const postRes = await httpRequest(port, 'POST', '/api/mailin', {
      fullName: 'Taylor Reed',
      email: 'taylor@example.com',
      state: 'GA',
      deviceKind: 'Laptop',
      deviceCount: 1,
    });
    assert.equal(postRes.status, 404, 'POST /api/mailin must answer 404 when RECYCLE_MAILIN_ADDRESS is missing');

    const bookMailInRes = await httpRequest(port, 'POST', '/api/book', {
      serviceType: 'mailin',
      fullName: 'Taylor Reed',
      email: 'taylor@example.com',
      state: 'GA',
      deviceKind: 'Laptop',
      deviceCount: 1,
    });
    assert.equal(
      bookMailInRes.status,
      404,
      'POST /api/book with serviceType=mailin must answer 404 when RECYCLE_MAILIN_ADDRESS is missing',
    );

    const { getEl } = mountMailInDom({ available: false });
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(getEl('mailin-section').hidden, true);
    assert.equal(getEl('mailin-section').style.display, 'none');
    assert.equal(getEl('tab-mailin').hidden, true);
    assert.equal(getEl('tab-mailin').style.display, 'none');
  } finally {
    child.kill();
    fs.rmSync(tmpBookingsDir, { recursive: true, force: true });
    fs.rmSync(tmpStatsDir, { recursive: true, force: true });
  }
});

test('setting present: option shows, POST /api/mailin returns a reference ID and the mailing address, and request is stored and notified', async () => {
  const port = await getFreePort();
  const tmpBookingsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orc-mailin-on-bookings-'));
  const tmpStatsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orc-mailin-on-stats-'));
  const env = {
    ...process.env,
    DOMAINS_SERVER_PORT: String(port),
    DOMAINS_SERVER_HOST: LOOPBACK,
    ORC_BOOKINGS_DIR: tmpBookingsDir,
    ORC_STATS_DIR: tmpStatsDir,
    RECYCLE_MAILIN_ADDRESS: TEST_MAILIN_ADDRESS,
  };

  const child = spawn(process.execPath, [SERVER_PATH], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  try {
    await waitForServer(port);

    const switchRes = await httpRequest(port, 'GET', '/api/mailin-config');
    assert.equal(switchRes.status, 200);
    assert.equal(switchRes.json?.ok, true);
    assert.equal(switchRes.json?.available, true);
    assert.equal(switchRes.json?.enabled, true);
    assert.equal(
      switchRes.raw.includes(TEST_MAILIN_ADDRESS),
      false,
      '/api/mailin-config must never return the mailing address',
    );

    const postRes = await httpRequest(port, 'POST', '/api/mailin', {
      fullName: 'Alex Mercer',
      email: 'alex@example.com',
      state: 'NC',
      deviceKind: '1 phone and 1 tablet',
      deviceCount: 2,
    });
    assert.equal(postRes.status, 200, `expected 200 from POST /api/mailin, got ${postRes.status}: ${postRes.raw}`);
    assert.equal(postRes.json?.ok, true);
    const refId = postRes.json?.referenceId || postRes.json?.bookingId || postRes.json?.booking?.bookingId;
    assert.match(String(refId || ''), /^OR-\d{8}-[0-9A-F]{16}$/);
    assert.equal(postRes.json?.mailingAddress, TEST_MAILIN_ADDRESS);

    // Verify stored in bookings.jsonl and inquiries/<refId>.txt without storing the mailing address
    const jsonlRaw = fs.readFileSync(path.join(tmpBookingsDir, 'bookings.jsonl'), 'utf8');
    const saved = JSON.parse(jsonlRaw.trim());
    assert.equal(saved.bookingId, refId);
    assert.equal(saved.serviceType, 'mailin');
    assert.equal(saved.fullName, 'Alex Mercer');
    assert.equal(saved.email, 'alex@example.com');
    assert.equal(saved.state, 'NC');
    assert.equal(saved.deviceCount, 2);
    assert.equal(saved.deviceKind, '1 phone and 1 tablet');
    assert.equal(jsonlRaw.includes(TEST_MAILIN_ADDRESS), false);

    const inquiryRaw = fs.readFileSync(path.join(tmpBookingsDir, 'inquiries', `${refId}.txt`), 'utf8');
    assert.match(inquiryRaw, /Alex Mercer/);
    assert.match(inquiryRaw, /NC/);
    assert.equal(inquiryRaw.includes(TEST_MAILIN_ADDRESS), false);

    const notifyText = formatBookingMessage(saved);
    assert.match(notifyText, /^New mail-in request/m);
    assert.match(notifyText, new RegExp(`Booking ID: ${refId}`));
    assert.match(notifyText, /Name: Alex Mercer/);
    assert.match(notifyText, /State: NC/);

    // Verify page DOM unhides option and displays reference + mailing address on submit
    const { getEl } = mountMailInDom({ available: true });
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(getEl('mailin-section').hidden, false);
    assert.notEqual(getEl('mailin-section').style.display, 'none');
    assert.equal(getEl('tab-mailin').hidden, false);
    assert.notEqual(getEl('tab-mailin').style.display, 'none');

    getEl('mi-name').value = 'Alex Mercer';
    getEl('mi-email').value = 'alex@example.com';
    getEl('mi-state').value = 'NC';
    getEl('mi-kind').value = '1 phone and 1 tablet';
    getEl('mi-count').value = '2';
    getEl('mailin-form').dispatchEvent('submit');
    await new Promise((r) => setTimeout(r, 20));

    assert.equal(getEl('mailin-confirm-box').style.display, 'block');
    assert.match(getEl('mailin-confirm-ref').textContent, /OR-20261125-MAILTEST00000001/);
    assert.match(getEl('mailin-confirm-address').textContent, new RegExp(TEST_MAILIN_ADDRESS));
  } finally {
    child.kill();
    fs.rmSync(tmpBookingsDir, { recursive: true, force: true });
    fs.rmSync(tmpStatsDir, { recursive: true, force: true });
  }
});

test('the mailing address string never appears in any built page or any GET answer', async () => {
  const port = await getFreePort();
  const tmpBookingsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orc-mailin-get-bookings-'));
  const tmpStatsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orc-mailin-get-stats-'));
  const env = {
    ...process.env,
    DOMAINS_SERVER_PORT: String(port),
    DOMAINS_SERVER_HOST: LOOPBACK,
    ORC_BOOKINGS_DIR: tmpBookingsDir,
    ORC_STATS_DIR: tmpStatsDir,
    RECYCLE_MAILIN_ADDRESS: TEST_MAILIN_ADDRESS,
  };

  const child = spawn(process.execPath, [SERVER_PATH], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  try {
    await waitForServer(port);

    const getPaths = [
      '/',
      '/index.html',
      '/about.html',
      '/terms.html',
      '/privacy.html',
      '/disclaimer.html',
      '/service-areas.html',
      '/health',
      '/api/health',
      '/api/booking-config',
      '/api/mailin-config',
    ];
    for (const p of getPaths) {
      const res = await httpRequest(port, 'GET', p);
      assert.equal(
        res.raw.includes(TEST_MAILIN_ADDRESS),
        false,
        `GET ${p} must never contain the mailing address string`,
      );
    }
  } finally {
    child.kill();
    fs.rmSync(tmpBookingsDir, { recursive: true, force: true });
    fs.rmSync(tmpStatsDir, { recursive: true, force: true });
  }
});

test('more than two devices per box is refused with a plain message, and no street address is asked of the sender', async () => {
  const port = await getFreePort();
  const tmpBookingsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orc-mailin-cap-bookings-'));
  const tmpStatsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orc-mailin-cap-stats-'));
  const env = {
    ...process.env,
    DOMAINS_SERVER_PORT: String(port),
    DOMAINS_SERVER_HOST: LOOPBACK,
    ORC_BOOKINGS_DIR: tmpBookingsDir,
    ORC_STATS_DIR: tmpStatsDir,
    RECYCLE_MAILIN_ADDRESS: TEST_MAILIN_ADDRESS,
  };

  const child = spawn(process.execPath, [SERVER_PATH], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  try {
    await waitForServer(port);

    for (const count of [3, 4, 10]) {
      const res = await httpRequest(port, 'POST', '/api/mailin', {
        fullName: 'Jordan Vance',
        email: 'jordan@example.com',
        state: 'TX',
        deviceKind: 'Phones',
        deviceCount: count,
      });
      assert.equal(res.status, 400, `deviceCount=${count} must be refused with 400`);
      assert.equal(res.json?.ok, false);
      assert.match(res.json?.error || '', /two devices per box at most/i);
      assert.equal(
        res.raw.includes(TEST_MAILIN_ADDRESS),
        false,
        'refused request must never reveal the mailing address',
      );
    }

    // Client form also refuses more than 2 devices with a plain message
    const { getEl } = mountMailInDom({ available: true });
    await new Promise((r) => setTimeout(r, 20));
    getEl('mi-name').value = 'Jordan Vance';
    getEl('mi-email').value = 'jordan@example.com';
    getEl('mi-state').value = 'TX';
    getEl('mi-kind').value = 'Phones';
    getEl('mi-count').value = '3';
    getEl('mailin-form').dispatchEvent('submit');
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(getEl('mailin-error').style.display, 'block');
    assert.match(getEl('mailin-error').textContent, /two devices per box at most/i);
  } finally {
    child.kill();
    fs.rmSync(tmpBookingsDir, { recursive: true, force: true });
    fs.rmSync(tmpStatsDir, { recursive: true, force: true });
  }
});

test('mail-in section in index.html has the exact required copy, USPS Publication 52 section 349 packing rules, one USPS link, no street address input, and no forbidden wording', () => {
  const html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
  const startIdx = html.indexOf('id="mailin-section"');
  assert.notEqual(startIdx, -1, 'index.html must contain #mailin-section');
  const endIdx = html.indexOf('<!-- STOP 03 (#how-it-works)', startIdx);
  assert.notEqual(endIdx, -1, '#mailin-section must sit before STOP 03');
  const sectionHtml = html.slice(startIdx, endIdx);
  const plainText = decodeMailInEntities(sectionHtml);

  const requiredLines = [
    'Mail-in is for phones, tablets, laptops and small electronics from anywhere in the United States. You pay the postage. We do not pay for mailed devices.',
    'How: fill in the short form, get a reference and the mailing address, write the reference inside the box.',
    "Packing, from USPS Publication 52 section 349: a used device with a lithium battery goes by ground only, never air. Use a rigid box, cushion each device so it cannot move, switch it off. Two devices per box at most. Write 'Restricted Electronic Device' and 'Surface Transportation Only' on the address side.",
    'Do not mail a device with a swollen, leaking or punctured battery. USPS does not allow it. Use drop-off or pickup for those.',
    'What happens to it: storage wiped or destroyed with reasonable effort; working gear reused, the rest recycled. Nothing is mailed back.',
  ];
  for (const line of requiredLines) {
    assert.ok(plainText.includes(line), `mail-in section missing required line: "${line}"`);
  }

  // Exactly one link to USPS
  const links = [...sectionHtml.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a\s*>/gi)];
  const uspsLinks = links.filter((m) => /usps\.com/i.test(m[1]));
  assert.equal(uspsLinks.length, 1, 'mail-in section must contain exactly one link to USPS');

  // No street address input in #mailin-form
  assert.doesNotMatch(sectionHtml, /street-address|name=["']address["']/i);

  // Forbidden words in mail-in section
  assert.doesNotMatch(
    plainText,
    /\bimmediately\b|\blandfill\b|\benvironment(?:al)?\b|\bsecure\b|\bITAD\b|\$\d|\bwarehouse\b|\btruck\b|\bvan\b|\bstaff\b|\bteam\b/i,
  );
});

test('decodeMailInEntities unescapes HTML entities in one pass without double-unescaping &amp;', () => {
  assert.equal(
    decodeMailInEntities(
      'Write &#39;Restricted&#39; &amp; &quot;Surface&quot; &amp;quot; &amp;#39; &amp;apos; &amp;amp;',
    ),
    'Write \'Restricted\' & "Surface" &quot; &#39; &apos; &amp;',
  );
});

test('mail-in record uses status MAILIN_REQUESTED, does not take or block any drop-off or pickup slot, does not appear in /api/calendar.ics, and does not break /api/booking-config or booking stats', async () => {
  const port = await getFreePort();
  const tmpBookingsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orc-mailin-isolation-bookings-'));
  const tmpStatsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orc-mailin-isolation-stats-'));
  const env = {
    ...process.env,
    DOMAINS_SERVER_PORT: String(port),
    DOMAINS_SERVER_HOST: LOOPBACK,
    ORC_BOOKINGS_DIR: tmpBookingsDir,
    ORC_STATS_DIR: tmpStatsDir,
    RECYCLE_MAILIN_ADDRESS: TEST_MAILIN_ADDRESS,
  };

  const child = spawn(process.execPath, [SERVER_PATH], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  try {
    await waitForServer(port);

    const cfgBefore = await httpRequest(port, 'GET', '/api/booking-config');
    assert.equal(cfgBefore.status, 200);
    const tomorrowIso = cfgBefore.json?.upcomingDays?.[1]?.iso;
    assert.match(String(tomorrowIso || ''), /^\d{4}-\d{2}-\d{2}$/);

    // Seed a legacy mail-in record in bookings.jsonl with status SCHEDULED and no date/slot,
    // plus one with a date/slot to prove neither can block a slot, appear in calendar.ics, or leak into bookedSlots.
    const legacyNoDateId = 'OR-20261125-LEGACYMAIL000001';
    const legacyWithDateId = 'OR-20261125-LEGACYMAIL000002';
    const legacyRecords = [
      {
        bookingId: legacyNoDateId,
        referenceId: legacyNoDateId,
        createdAt: new Date().toISOString(),
        serviceType: 'mailin',
        fullName: 'Legacy Mail No Date',
        email: 'legacy1@example.com',
        state: 'GA',
        deviceKind: '1 phone',
        deviceCount: 1,
        deviceList: '1 (1 phone)',
        status: 'SCHEDULED',
        notified: true,
      },
      {
        bookingId: legacyWithDateId,
        referenceId: legacyWithDateId,
        createdAt: new Date().toISOString(),
        serviceType: 'mailin',
        fullName: 'Legacy Mail With Date',
        email: 'legacy2@example.com',
        state: 'SC',
        date: tomorrowIso,
        slotCode: '09:00-09:30',
        deviceKind: '1 tablet',
        deviceCount: 1,
        deviceList: '1 (1 tablet)',
        status: 'SCHEDULED',
        notified: true,
      },
    ];
    fs.writeFileSync(
      path.join(tmpBookingsDir, 'bookings.jsonl'),
      `${legacyRecords.map((r) => JSON.stringify(r)).join('\n')}\n`,
      'utf8',
    );

    // Submit a new mail-in request (even passing date and slotCode in the payload)
    const mailInRes = await httpRequest(port, 'POST', '/api/mailin', {
      fullName: 'robin Carter',
      email: 'robin@example.com',
      state: 'NC',
      deviceKind: '2 phones',
      deviceCount: 2,
      date: tomorrowIso,
      slotCode: '09:00-09:30',
    });
    assert.equal(mailInRes.status, 200);
    assert.equal(mailInRes.json?.ok, true);
    const mailInId = mailInRes.json?.referenceId;
    assert.match(String(mailInId || ''), /^OR-\d{8}-[0-9A-F]{16}$/);

    // Verify the saved mail-in record in bookings.jsonl has status MAILIN_REQUESTED and no date or slotCode
    const allSaved = fs
      .readFileSync(path.join(tmpBookingsDir, 'bookings.jsonl'), 'utf8')
      .trim()
      .split(/\r?\n/)
      .map((l) => JSON.parse(l));
    const savedMailIn = allSaved.find((b) => b.bookingId === mailInId);
    assert.ok(savedMailIn, 'mail-in record must be written to bookings.jsonl');
    assert.equal(savedMailIn.status, 'MAILIN_REQUESTED', 'mail-in record must use its own status MAILIN_REQUESTED');
    assert.equal(savedMailIn.date, undefined, 'mail-in record must not store a date');
    assert.equal(savedMailIn.slotCode, undefined, 'mail-in record must not store a slotCode');

    // 1. Mail-in records must NOT appear in /api/calendar.ics
    for (const id of [mailInId, legacyNoDateId, legacyWithDateId]) {
      const icsRes = await httpRequest(port, 'GET', `/api/calendar.ics?id=${encodeURIComponent(id)}`);
      assert.equal(icsRes.status, 404, `mail-in record ${id} must not appear in /api/calendar.ics`);
      assert.equal(icsRes.raw.includes('BEGIN:VCALENDAR'), false);
    }

    // 2. Mail-in records must NOT break /api/booking-config or appear in bookedSlots
    const cfgAfterMailIn = await httpRequest(port, 'GET', '/api/booking-config');
    assert.equal(cfgAfterMailIn.status, 200);
    assert.equal(cfgAfterMailIn.json?.ok, true);
    assert.equal(Array.isArray(cfgAfterMailIn.json?.upcomingDays), true);
    assert.equal(cfgAfterMailIn.json?.upcomingDays?.length, 14);
    assert.deepEqual(
      cfgAfterMailIn.json?.bookedSlots,
      [],
      'mail-in records must never appear in /api/booking-config bookedSlots',
    );

    // Also verify selectDefaultSlot with raw records never treats a mail-in record as a taken slot
    const defaultDropoff = serverMod.selectDefaultSlot({
      serviceType: 'dropoff',
      date: '',
      bookedSlots: allSaved,
    });
    assert.equal(defaultDropoff?.code, '09:00-09:30');

    // 3. Mail-in records must NOT take or block any drop-off or pickup slot
    const dropoffRes = await httpRequest(port, 'POST', '/api/book', {
      serviceType: 'dropoff',
      date: tomorrowIso,
      slotCode: '09:00-09:30',
      slotLabel: '9:00 AM – 9:30 AM',
      fullName: 'Casey Dropoff',
      phone: '(321) 555-0140',
      email: 'casey@example.com',
      deviceCount: '1-5 items',
      deviceList: '1 laptop',
    });
    assert.equal(dropoffRes.status, 200, `drop-off booking must succeed, got ${dropoffRes.status}: ${dropoffRes.raw}`);
    assert.equal(dropoffRes.json?.ok, true);

    const pickupRes = await httpRequest(port, 'POST', '/api/book', {
      serviceType: 'pickup',
      date: tomorrowIso,
      slotCode: '10:00-12:00',
      slotLabel: '10:00 AM – 12:00 PM',
      fullName: 'Morgan Pickup',
      phone: '(321) 555-0141',
      email: 'morgan@example.com',
      address: '100 Main St',
      city: 'Sorrento, FL 32776',
      zip: '32776',
      deviceCount: '1-5 items',
      deviceList: '2 desktop towers',
    });
    assert.equal(pickupRes.status, 200, `pickup booking must succeed, got ${pickupRes.status}: ${pickupRes.raw}`);
    assert.equal(pickupRes.json?.ok, true);

    // Real drop-off and pickup bookings DO appear in /api/calendar.ics and /api/booking-config
    const dropoffIcs = await httpRequest(
      port,
      'GET',
      `/api/calendar.ics?id=${encodeURIComponent(dropoffRes.json.booking.bookingId)}`,
    );
    assert.equal(dropoffIcs.status, 200);
    assert.match(dropoffIcs.raw, /BEGIN:VCALENDAR/);

    const cfgAfterSlots = await httpRequest(port, 'GET', '/api/booking-config');
    assert.equal(cfgAfterSlots.status, 200);
    assert.deepEqual(cfgAfterSlots.json?.bookedSlots, [
      { date: tomorrowIso, slotCode: '09:00-09:30', serviceType: 'dropoff' },
      { date: tomorrowIso, slotCode: '10:00-12:00', serviceType: 'pickup' },
    ]);

    // 4. Mail-in records must NOT break booking stats or /health counts
    await httpRequest(port, 'GET', '/', undefined, {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0 Safari/537.36',
    });
    const statsPath = path.join(tmpStatsDir, `${dayKey()}.json`);
    assert.equal(fs.existsSync(statsPath), true, 'daily booking stats file must exist');
    const statsJson = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    assert.equal(statsJson.page_views, 1);
    assert.equal(statsJson.page_views_all, 1);
    assert.equal(statsJson.bookings, 3, 'stats bookings count must stay valid integer without breaking');

    const healthRes = await httpRequest(port, 'GET', '/health');
    assert.equal(healthRes.status, 200);
    assert.equal(typeof healthRes.json?.todayBookings, 'number');
    assert.equal(typeof healthRes.json?.totalBookings, 'number');
    assert.equal(healthRes.json?.todayBookings >= 2, true);
    assert.equal(healthRes.json?.totalBookings >= 2, true);
  } finally {
    child.kill();
    fs.rmSync(tmpBookingsDir, { recursive: true, force: true });
    fs.rmSync(tmpStatsDir, { recursive: true, force: true });
  }
});
