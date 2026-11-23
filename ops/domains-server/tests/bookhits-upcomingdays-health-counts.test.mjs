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
import * as serverMod from '../server.mjs';

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

function mountBookingDomWithConfig({ browserIsoInstant, serverUpcomingDays, bookedSlots = [] }) {
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

  const RealDate = Date;
  const fixedMs = new RealDate(browserIsoInstant).getTime();

  class SkewedBrowserDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        super(fixedMs);
      } else {
        super(...args);
      }
    }
    static now() {
      return fixedMs;
    }
  }

  const fakeFetch = (url) => {
    if (url === '/api/booking-config') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            ok: true,
            timezone: 'America/New_York',
            upcomingDays: serverUpcomingDays,
            googleScheduleEmbed: { dropoffUrl: '', pickupUrl: '' },
            bookedSlots,
          }),
      });
    }
    return Promise.resolve({
      json: () => Promise.resolve({ ok: false }),
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
    Date: SkewedBrowserDate,
    Intl,
    URLSearchParams,
    fetch: fakeFetch,
    console,
  });

  vm.runInContext(scriptSource, context);
  return { getEl };
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

test('5001-IP bookHits map eviction caps bookHits at 5000 keys by pruning expired timestamps first and evicting the oldest key when full', () => {
  assert.equal(serverMod.BOOK_HITS_MAX, 5000, 'server.mjs must export BOOK_HITS_MAX = 5000');
  assert.equal(typeof serverMod.BOOK_WINDOW_MS, 'number', 'server.mjs must export BOOK_WINDOW_MS');
  const { bookHits, bookingAllowed, BOOK_WINDOW_MS } = serverMod;

  bookHits.clear();
  try {
    const t0 = 1_700_000_000_000;
    for (let i = 0; i < 5000; i++) {
      assert.equal(bookingAllowed(`198.51.100.${i}`, t0 + i), true);
    }
    assert.equal(bookHits.size, 5000);
    assert.equal(bookHits.has('198.51.100.0'), true);

    // 5001st distinct IP while all 5000 existing keys are still active -> evicts oldest key 198.51.100.0
    assert.equal(bookingAllowed('198.51.100.5000', t0 + 5000), true);
    assert.equal(bookHits.size, 5000);
    assert.equal(bookHits.has('198.51.100.0'), false, 'oldest key must be evicted when bookHits is full');
    assert.equal(bookHits.has('198.51.100.1'), true, 'second-oldest key must remain');
    assert.equal(bookHits.has('198.51.100.5000'), true, '5001st key must be inserted');

    // When an existing key has expired timestamps, pruning removes it first so the oldest active key is not evicted
    bookHits.set('198.51.100.2500', [t0 - BOOK_WINDOW_MS - 5000]);
    assert.equal(bookingAllowed('198.51.100.5001', t0 + 6000), true);
    assert.equal(bookHits.size, 5000);
    assert.equal(bookHits.has('198.51.100.2500'), false, 'expired key must be pruned first');
    assert.equal(bookHits.has('198.51.100.1'), true, 'oldest active key must survive when pruning frees a slot');
    assert.equal(bookHits.has('198.51.100.5001'), true);
  } finally {
    bookHits.clear();
  }
});

test('buildDomainsHealthPayload and GET /health expose todayBookings and totalBookings counts with zero PII', async () => {
  const unitPayload = serverMod.buildDomainsHealthPayload(
    {
      FLEET_SHARED_TOKEN: 'fleet-tok',
      ORC_NOTIFY_TELEGRAM_TOKEN: 'tg-tok',
      ORC_NOTIFY_TELEGRAM_CHAT: 'tg-chat',
    },
    { unnotifiedBookings: 0, todayBookings: 2, totalBookings: 7, driftPath: 'nonexistent-drift.json' },
  );
  assert.equal(unitPayload.todayBookings, 2);
  assert.equal(unitPayload.totalBookings, 7);

  const port = await getFreePort();
  const tmpBookingsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orc-b57-bookings-'));
  const tmpStatsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orc-b57-stats-'));
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

    const healthEmpty = await httpRequestJson(port, 'GET', '/health');
    assert.equal(healthEmpty.status, 200);
    assert.equal(healthEmpty.json?.todayBookings, 0);
    assert.equal(healthEmpty.json?.totalBookings, 0);

    const flToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
    const flTomorrow = new Date(new Date(`${flToday}T00:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10);

    // Seed 1 historical active booking and 1 cancelled booking
    const historicalBooking = {
      bookingId: 'OR-20261110-HIST0001',
      createdAt: '2026-11-10T14:00:00.000Z',
      serviceType: 'dropoff',
      fullName: 'Alice Historical',
      phone: '321-555-0101',
      email: 'alice.secret@example.com',
      organization: 'Secret Org LLC',
      address: '101 Secret Ln',
      city: 'Sorrento',
      zip: '32776',
      date: '2026-11-10',
      slotCode: '09:00-09:30',
      slotLabel: '9:00 AM - 9:30 AM',
      deviceCount: '1-5 items',
      deviceList: 'confidential mainframe',
      notes: 'top secret notes',
      status: 'SCHEDULED',
      notified: true,
    };
    const cancelledTodayBooking = {
      bookingId: `OR-${flToday.replace(/-/g, '')}-CANC0002`,
      createdAt: new Date().toISOString(),
      serviceType: 'dropoff',
      fullName: 'Cancelled Person',
      phone: '321-555-0102',
      email: 'cancelled.secret@example.com',
      date: flToday,
      slotCode: '15:00-15:30',
      slotLabel: '3:00 PM - 3:30 PM',
      deviceCount: '1-5 items',
      deviceList: 'cancelled printer',
      status: 'CANCELLED',
      notified: true,
    };
    fs.writeFileSync(
      path.join(tmpBookingsDir, 'bookings.jsonl'),
      `${JSON.stringify(historicalBooking)}\n${JSON.stringify(cancelledTodayBooking)}\n`,
      'utf8',
    );

    // Submit 1 active booking today via POST /api/book
    const postRes = await httpRequestJson(port, 'POST', '/api/book', {
      serviceType: 'pickup',
      date: flTomorrow,
      slotCode: '10:00-12:00',
      slotLabel: '10:00 AM - 12:00 PM',
      fullName: 'Bob Today',
      phone: '321-555-0103',
      email: 'bob.secret@example.com',
      organization: 'Bob Recycling Co',
      address: '202 Confidential Ave',
      city: 'Sorrento',
      zip: '32776',
      deviceCount: '6-15 items',
      deviceList: '3 rack servers',
      notes: 'priority wipe',
    });
    assert.equal(postRes.status, 200);
    assert.equal(postRes.json?.ok, true);

    const healthAfter = await httpRequestJson(port, 'GET', '/health');
    assert.equal(healthAfter.status, 200);
    assert.equal(healthAfter.json?.todayBookings, 1, 'todayBookings must count active bookings for/created today');
    assert.equal(healthAfter.json?.totalBookings, 2, 'totalBookings must count all non-cancelled bookings');

    // Verify zero PII leaks on GET /health
    for (const pii of [
      'Alice Historical',
      'Bob Today',
      'Cancelled Person',
      '321-555-0101',
      '321-555-0102',
      '321-555-0103',
      'alice.secret@example.com',
      'bob.secret@example.com',
      'cancelled.secret@example.com',
      'Secret Org LLC',
      'Bob Recycling Co',
      '101 Secret Ln',
      '202 Confidential Ave',
      'confidential mainframe',
      '3 rack servers',
      'top secret notes',
      'OR-20261110-HIST0001',
      postRes.json.booking.bookingId,
    ]) {
      assert.equal(
        healthAfter.raw.includes(pii),
        false,
        `GET /health must never expose PII or booking details ("${pii}")`,
      );
    }
  } finally {
    child.kill();
    fs.rmSync(tmpBookingsDir, { recursive: true, force: true });
    fs.rmSync(tmpStatsDir, { recursive: true, force: true });
  }
});

test('domains/onlinerecycle.net/site/index.html syncs upcomingDays from cfg.upcomingDays returned by GET /api/booking-config', async () => {
  const serverDays = serverMod.buildNextDays(14, new Date('2026-11-22T15:00:00Z'));
  const { getEl } = mountBookingDomWithConfig({
    // Skewed browser clock 7 days behind the server
    browserIsoInstant: '2026-11-15T15:00:00Z',
    serverUpcomingDays: serverDays,
    bookedSlots: [{ date: '2026-11-23', slotCode: '09:00-09:30', serviceType: 'dropoff' }],
  });

  // Flush fetch('/api/booking-config') promise microtasks
  await new Promise((r) => setTimeout(r, 20));

  // Default selectedDate must sync to server Tomorrow (2026-11-23) from cfg.upcomingDays
  assert.equal(getEl('bf-date').value, '2026-11-23');
  assert.equal(getEl('selected-date-display').textContent, 'Tomorrow, Nov 23');

  const firstPagePills = getEl('date-strip').children.map((b) => b.innerHTML);
  assert.equal(firstPagePills.length, 7);
  assert.match(firstPagePills[0], /Today/);
  assert.match(firstPagePills[0], /Nov 22/);
  assert.match(firstPagePills[1], /Tomorrow/);
  assert.match(firstPagePills[1], /Nov 23/);
  assert.match(firstPagePills[6], /Nov 28/);

  // And renderSlots must use the synced selectedDate (2026-11-23), skipping booked 09:00-09:30 -> 08:00-08:30
  assert.equal(getEl('bf-slot-code').value, '08:00-08:30');

  // Toggle to next 7 days (days 8..14 from cfg.upcomingDays -> Nov 29..Dec 5)
  getEl('date-page-toggle').click();
  const secondPagePills = getEl('date-strip').children.map((b) => b.innerHTML);
  assert.equal(secondPagePills.length, 7);
  assert.match(secondPagePills[0], /Nov 29/);
  assert.match(secondPagePills[6], /Dec 5/);
  assert.equal(getEl('bf-date').value, '2026-11-29');
});
