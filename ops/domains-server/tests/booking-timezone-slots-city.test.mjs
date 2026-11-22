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

function mountBookingDom({ fixedIsoInstant, localOffsetMinutes = -480, bookedSlots = [] } = {}) {
  const html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
  const scriptSource = extractBookingScript(html);

  const elements = new Map();
  const getEl = (id) => {
    if (!elements.has(id)) {
      elements.set(id, createFakeElement(id));
    }
    return elements.get(id);
  };

  // Seed default form values matching index.html
  getEl('bf-service-type').value = 'dropoff';
  getEl('bf-count').value = '1-5 items';
  getEl('bf-wipe').value = 'Standard intake & storage wipe/destruction';

  const RealDate = Date;
  const fixedMs = new RealDate(fixedIsoInstant).getTime();

  // Simulates a browser running in a non-Eastern timezone (default UTC-8 Pacific Time)
  // so calls to getFullYear/getMonth/getDate/toLocaleDateString without timeZone: 'America/New_York'
  // return the browser's local timezone date rather than Eastern Time.
  class FakeDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        super(fixedMs);
        this._isLocalConstructed = false;
      } else if (args.length >= 3 && typeof args[0] === 'number' && typeof args[1] === 'number') {
        const [y, m, d = 1, hh = 0, mm = 0, ss = 0, ms = 0] = args;
        const utcMs = RealDate.UTC(y, m, d, hh, mm, ss, ms) - localOffsetMinutes * 60000;
        super(utcMs);
        this._isLocalConstructed = true;
      } else {
        super(...args);
        this._isLocalConstructed = false;
      }
    }

    static now() {
      return fixedMs;
    }

    _localShifted() {
      return new RealDate(this.getTime() + localOffsetMinutes * 60000);
    }

    getFullYear() {
      return this._localShifted().getUTCFullYear();
    }

    getMonth() {
      return this._localShifted().getUTCMonth();
    }

    getDate() {
      return this._localShifted().getUTCDate();
    }

    getHours() {
      return this._localShifted().getUTCHours();
    }

    getMinutes() {
      return this._localShifted().getUTCMinutes();
    }

    toLocaleDateString(locale = 'en-US', options = {}) {
      if (options && options.timeZone) {
        return super.toLocaleDateString(locale, options);
      }
      return this._localShifted().toLocaleDateString(locale, { ...options, timeZone: 'UTC' });
    }
  }

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
    Date: FakeDate,
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

test('14-day date strip in index.html and server.mjs uses America/New_York time regardless of visitor timezone', () => {
  // 2026-11-21T06:00:00Z is 2026-11-21 01:00 AM in America/New_York (EST, UTC-5),
  // but still 2026-11-20 10:00 PM in America/Los_Angeles (PST, UTC-8).
  const instant = '2026-11-21T06:00:00Z';
  const { getEl } = mountBookingDom({
    fixedIsoInstant: instant,
    localOffsetMinutes: -480,
  });

  // Default selectedDate is tomorrow in America/New_York -> 2026-11-22 (not 2026-11-21).
  assert.equal(getEl('bf-date').value, '2026-11-22');
  const firstPagePills = getEl('date-strip').children.map((b) => b.innerHTML);
  assert.equal(firstPagePills.length, 7);
  assert.match(firstPagePills[0], /Today/);
  assert.match(firstPagePills[0], /Nov 21/);
  assert.match(firstPagePills[1], /Tomorrow/);
  assert.match(firstPagePills[1], /Nov 22/);

  // Toggle to next 7 days (days 8..14 -> Nov 28..Dec 4 in America/New_York).
  getEl('date-page-toggle').click();
  const secondPagePills = getEl('date-strip').children.map((b) => b.innerHTML);
  assert.equal(secondPagePills.length, 7);
  assert.match(secondPagePills[0], /Nov 28/);
  assert.match(secondPagePills[6], /Dec 4/);

  // Server helper buildNextDays also builds the 14-day strip in America/New_York time.
  assert.equal(typeof serverMod.buildNextDays, 'function', 'server.mjs must export buildNextDays');
  const serverDays = serverMod.buildNextDays(14, new Date(instant));
  assert.equal(serverDays.length, 14);
  assert.equal(serverDays[0].iso, '2026-11-21');
  assert.equal(serverDays[0].dow, 'Today');
  assert.equal(serverDays[0].dom, 'Nov 21');
  assert.equal(serverDays[1].iso, '2026-11-22');
  assert.equal(serverDays[13].iso, '2026-12-04');
});

test('selectedSlotCode skips already-booked and elapsed today windows in index.html and server.mjs', async () => {
  // 2026-11-21T15:15:00Z is 10:15 AM ET on 2026-11-21.
  // Elapsed drop-off windows on 2026-11-21: 08:00-08:30, 09:00-09:30, 10:00-10:30.
  // Suppose 11:00-11:30 on 2026-11-21 is already booked, and on tomorrow (2026-11-22)
  // both 08:00-08:30 and 09:00-09:30 are already booked.
  const instant = '2026-11-21T15:15:00Z';
  const bookedSlots = [
    { date: '2026-11-21', slotCode: '11:00-11:30', serviceType: 'dropoff' },
    { date: '2026-11-22', slotCode: '08:00-08:30', serviceType: 'dropoff' },
    { date: '2026-11-22', slotCode: '09:00-09:30', serviceType: 'dropoff' },
  ];
  const { getEl } = mountBookingDom({
    fixedIsoInstant: instant,
    localOffsetMinutes: -300,
    bookedSlots,
  });

  // Flush fetch('/api/booking-config') promise microtasks.
  await new Promise((r) => setTimeout(r, 20));

  // On tomorrow (2026-11-22), 08:00-08:30 and 09:00-09:30 are taken -> selectedSlotCode must be 10:00-10:30.
  assert.equal(getEl('bf-date').value, '2026-11-22');
  assert.equal(getEl('bf-slot-code').value, '10:00-10:30');

  // Click "Today" (2026-11-21) at 10:15 AM ET:
  // 08:00-08:30, 09:00-09:30, 10:00-10:30 are elapsed; 11:00-11:30 is booked -> must select 13:00-13:30.
  getEl('date-strip').children[0].click();
  assert.equal(getEl('bf-date').value, '2026-11-21');
  assert.equal(getEl('bf-slot-code').value, '13:00-13:30');

  // First four drop-off buttons on Today must be disabled (3 elapsed + 1 booked).
  const todayDropoffBtns = getEl('slot-strip').children;
  assert.equal(todayDropoffBtns[0].disabled, true);
  assert.equal(todayDropoffBtns[1].disabled, true);
  assert.equal(todayDropoffBtns[2].disabled, true);
  assert.equal(todayDropoffBtns[3].disabled, true);
  assert.equal(todayDropoffBtns[4].disabled, false);

  // Switch to pickup on Today at 10:15 AM ET:
  // 08:00-10:00 and 10:00-12:00 have elapsed -> selectedSlotCode must skip to 12:00-14:00.
  getEl('tab-pickup').click();
  assert.equal(getEl('bf-slot-code').value, '12:00-14:00');

  // Server helper selectDefaultSlot also skips taken and elapsed today windows.
  assert.equal(typeof serverMod.selectDefaultSlot, 'function', 'server.mjs must export selectDefaultSlot');
  const picked = serverMod.selectDefaultSlot({
    serviceType: 'dropoff',
    date: '2026-11-21',
    bookedSlots,
    now: new Date(instant),
  });
  assert.equal(picked?.code, '13:00-13:30');
});

test('pickup bookings without a non-empty city are rejected by the form and by POST /api/book', async () => {
  const instant = '2026-11-21T15:15:00Z';
  const { getEl, fetchCalls } = mountBookingDom({
    fixedIsoInstant: instant,
    localOffsetMinutes: -300,
    bookedSlots: [],
  });
  await new Promise((r) => setTimeout(r, 20));

  // Switch form to pickup and submit with address filled but city blank.
  getEl('tab-pickup').click();
  getEl('bf-name').value = 'Alex Rivera';
  getEl('bf-phone').value = '321-555-0199';
  getEl('bf-address').value = '789 Pine Rd';
  getEl('bf-city').value = '   ';
  getEl('bf-devices').value = '2 desktop towers and 1 monitor';

  const callsBefore = fetchCalls.length;
  getEl('booking-form').dispatchEvent('submit');
  assert.equal(fetchCalls.length, callsBefore, 'form must not POST /api/book when pickup city is empty');
  assert.equal(getEl('booking-error').style.display, 'block');
  assert.match(getEl('booking-error').textContent, /city/i);

  // Live server test for POST /api/book
  const port = await getFreePort();
  const tmpBookingsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orc-b26-bookings-'));
  const tmpStatsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orc-b26-stats-'));
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
    const cfgRes = await httpRequestJson(port, 'GET', '/api/booking-config');
    assert.equal(cfgRes.status, 200);
    assert.ok(Array.isArray(cfgRes.json?.upcomingDays), '/api/booking-config must return upcomingDays');
    assert.equal(cfgRes.json.upcomingDays.length, 14);

    const tomorrowIso = cfgRes.json.upcomingDays[1].iso;

    // 1. Pickup without city -> 400
    const noCityRes = await httpRequestJson(port, 'POST', '/api/book', {
      serviceType: 'pickup',
      date: tomorrowIso,
      slotCode: '10:00-12:00',
      slotLabel: '10:00 AM - 12:00 PM',
      fullName: 'Alex Rivera',
      phone: '321-555-0199',
      address: '789 Pine Rd',
      city: '   ',
      deviceCount: '1-5 items',
      deviceList: '2 desktop towers and 1 monitor',
    });
    assert.equal(noCityRes.status, 400);
    assert.equal(noCityRes.json?.ok, false);
    assert.match(noCityRes.json?.error || '', /city/i);

    // 2. Pickup with non-empty city -> 200
    const withCityRes = await httpRequestJson(port, 'POST', '/api/book', {
      serviceType: 'pickup',
      date: tomorrowIso,
      slotCode: '10:00-12:00',
      slotLabel: '10:00 AM - 12:00 PM',
      fullName: 'Alex Rivera',
      phone: '321-555-0199',
      address: '789 Pine Rd',
      city: 'Sorrento, FL 32776',
      deviceCount: '1-5 items',
      deviceList: '2 desktop towers and 1 monitor',
    });
    assert.equal(withCityRes.status, 200);
    assert.equal(withCityRes.json?.ok, true);
    assert.equal(withCityRes.json?.booking?.city, 'Sorrento, FL 32776');
  } finally {
    child.kill();
    fs.rmSync(tmpBookingsDir, { recursive: true, force: true });
    fs.rmSync(tmpStatsDir, { recursive: true, force: true });
  }
});
