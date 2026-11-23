// OnlineRecycle: crawlable spin-cards and working Manage Cookies banner on subpages.
// Run: node --test tests/onlinerecycle-spincards-cookie-banner.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.join(HERE, '..', 'domains', 'onlinerecycle.net', 'site');

const SPIN_CARD_PAGES = ['index.html', 'service-areas.html', 'about.html', 'terms.html', 'privacy.html'];
const SUBPAGES = ['about.html', 'terms.html', 'privacy.html'];

function readSiteFile(relPath) {
  return fs.readFileSync(path.join(SITE_DIR, relPath), 'utf8');
}

function extractInlineScripts(html) {
  const scripts = [];
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrPart = m[0].slice(0, m[0].indexOf('>'));
    if (/type\s*=\s*["']application\/ld\+json["']/i.test(attrPart)) continue;
    scripts.push(m[1]);
  }
  return scripts;
}

function extractSyncSpinCardsBody(scriptSource) {
  const marker = 'function syncSpinCards()';
  const startIdx = scriptSource.indexOf(marker);
  if (startIdx === -1) return null;
  const braceStart = scriptSource.indexOf('{', startIdx);
  if (braceStart === -1) return null;
  let depth = 0;
  for (let i = braceStart; i < scriptSource.length; i++) {
    const ch = scriptSource[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return scriptSource.slice(startIdx, i + 1);
      }
    }
  }
  return null;
}

function createFakeElement(id = '', tagName = 'div') {
  const listeners = new Map();
  const attrs = new Map();
  const classes = new Set();
  const styleProps = new Map();
  const el = {
    id,
    tagName: tagName.toUpperCase(),
    type: '',
    value: '',
    textContent: '',
    disabled: false,
    required: false,
    checked: false,
    hidden: false,
    src: '',
    href: '',
    offsetHeight: 64,
    parentElement: null,
    children: [],
    _rect: { top: 300, bottom: 540, height: 240, left: 0, right: 600, width: 600 },
    style: {
      display: '',
      transform: '',
      opacity: '',
      visibility: '',
      paddingBottom: '',
      setProperty(k, v) {
        styleProps.set(k, String(v));
      },
      getPropertyValue(k) {
        return styleProps.get(k) || '';
      },
    },
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
        return shouldAdd;
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
      let defaultPrevented = false;
      for (const fn of fns) {
        fn({
          preventDefault() {
            defaultPrevented = true;
          },
          ...ev,
        });
      }
      return !defaultPrevented;
    },
    click() {
      if (this.disabled) return;
      this.dispatchEvent('click');
    },
    appendChild(child) {
      child.parentElement = this;
      this.children.push(child);
      return child;
    },
    contains(target) {
      if (!target) return false;
      if (target === this) return true;
      return this.children.some((c) => (typeof c.contains === 'function' ? c.contains(target) : c === target));
    },
    getBoundingClientRect() {
      return this._rect;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    scrollIntoView() {},
    focus() {},
    getContext() {
      return null;
    },
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

function mountStageAndBookingPage(pageName, { scrollY = 0, reducedMotion = false } = {}) {
  const html = readSiteFile(pageName);
  const inlineScripts = extractInlineScripts(html);
  assert.ok(inlineScripts.length >= 1, `${pageName} must have inline stage script`);

  const elements = new Map();
  const getEl = (id) => {
    if (!elements.has(id)) {
      elements.set(id, createFakeElement(id));
    }
    return elements.get(id);
  };

  // Create representative spin cards:
  // 1. #card-scheduler (on index.html)
  // 2. settled card (center in viewport)
  // 3. offscreen card below viewport (absT >= 0.98)
  // 4. offscreen card above viewport (absT >= 0.98)
  const schedulerStage = createFakeElement('stage-scheduler', 'div');
  schedulerStage._rect = { top: 700, bottom: 1650, height: 950, left: 0, right: 780, width: 780 };
  const schedulerCard = getEl('card-scheduler');
  schedulerCard.setAttribute('data-fly-dir', 'from-below');
  schedulerStage.appendChild(schedulerCard);

  const confirmBox = getEl('booking-confirm-box');
  schedulerCard.appendChild(confirmBox);

  const settledStage = createFakeElement('stage-settled', 'div');
  settledStage._rect = { top: 300, bottom: 540, height: 240, left: 0, right: 560, width: 560 };
  const settledCard = getEl('card-settled');
  settledCard.setAttribute('data-fly-dir', 'from-left');
  settledStage.appendChild(settledCard);

  const belowStage = createFakeElement('stage-below', 'div');
  belowStage._rect = { top: 1400, bottom: 1680, height: 280, left: 0, right: 560, width: 560 };
  const belowCard = getEl('card-offscreen-below');
  belowCard.setAttribute('data-fly-dir', 'from-right');
  belowStage.appendChild(belowCard);

  const aboveStage = createFakeElement('stage-above', 'div');
  aboveStage._rect = { top: -400, bottom: -140, height: 260, left: 0, right: 560, width: 560 };
  const aboveCard = getEl('card-offscreen-above');
  aboveCard.setAttribute('data-fly-dir', 'from-above');
  aboveStage.appendChild(aboveCard);

  const spinCards =
    pageName === 'index.html'
      ? [schedulerCard, settledCard, belowCard, aboveCard]
      : [settledCard, belowCard, aboveCard];

  // Seed default form inputs for index.html booking script
  getEl('bf-service-type').value = 'dropoff';
  getEl('bf-count').value = '1-5 items';
  getEl('bf-wipe').value = 'Standard intake & storage wipe/destruction';

  const headerEl = createFakeElement('site-header', 'header');
  const bodyEl = createFakeElement('body', 'body');

  const winListeners = new Map();
  const windowObj = {
    innerWidth: 1440,
    innerHeight: 900,
    devicePixelRatio: 1,
    scrollY,
    location: { search: '', hash: '' },
    matchMedia(q) {
      return { matches: q.includes('prefers-reduced-motion') ? reducedMotion : false };
    },
    requestAnimationFrame() {
      return 1;
    },
    scrollTo({ top } = {}) {
      if (typeof top === 'number') this.scrollY = top;
    },
    addEventListener(type, fn) {
      if (!winListeners.has(type)) winListeners.set(type, []);
      winListeners.get(type).push(fn);
    },
    trigger(type, ev = {}) {
      for (const fn of winListeners.get(type) || []) {
        fn(ev);
      }
    },
  };

  const documentObj = {
    hidden: false,
    body: bodyEl,
    activeElement: bodyEl,
    getElementById: getEl,
    createElement: (tag) => createFakeElement('', tag),
    querySelector(sel) {
      if (sel === '.site-header') return headerEl;
      return null;
    },
    querySelectorAll(sel) {
      if (sel === '.spin-card') return spinCards;
      return [];
    },
    addEventListener() {},
  };

  const fakeFetch = (url, opts = {}) => {
    if (url === '/api/booking-config') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            ok: true,
            timezone: 'America/New_York',
            googleScheduleEmbed: { dropoffUrl: '', pickupUrl: '' },
            bookedSlots: [],
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
              bookingId: 'OR-20261122-B32TEST1',
              serviceType: body.serviceType || 'dropoff',
              fullName: body.fullName || 'Jane Doe',
              date: body.date || '2026-11-22',
              slotCode: body.slotCode || '09:00-09:30',
              slotLabel: body.slotLabel || '9:00 AM – 9:30 AM',
              deviceCount: body.deviceCount || '1-5 items',
            },
            googleCalendarUrl: 'https://calendar.google.com/calendar/render?action=TEMPLATE',
            icsUrl: '/api/calendar.ics?id=OR-20261122-B32TEST1',
            smsUrl: 'sms:+13213962008?body=OnlineRecycle.net',
          }),
      });
    }
    return Promise.resolve({
      json: () => Promise.resolve({ ok: false }),
    });
  };

  const context = vm.createContext({
    window: windowObj,
    document: documentObj,
    performance: { now: () => 1000 },
    Date,
    Intl,
    URLSearchParams,
    fetch: fakeFetch,
    setTimeout,
    clearTimeout,
    console,
  });

  for (const scriptSource of inlineScripts) {
    vm.runInContext(scriptSource, context);
  }

  return {
    windowObj,
    documentObj,
    getEl,
    spinCards,
    schedulerCard,
    schedulerStage,
    confirmBox,
    settledCard,
    belowCard,
    aboveCard,
  };
}

test('syncSpinCards() does not set visibility: hidden on off-screen cards across all OnlineRecycle pages', () => {
  for (const page of SPIN_CARD_PAGES) {
    const html = readSiteFile(page);
    const scripts = extractInlineScripts(html);
    const stageScript = scripts.find((s) => s.includes('function syncSpinCards()'));
    assert.ok(stageScript, `${page} must define syncSpinCards()`);

    const fnBody = extractSyncSpinCardsBody(stageScript);
    assert.ok(fnBody, `${page} syncSpinCards() body must be parseable`);
    assert.doesNotMatch(
      fnBody,
      /visibility\s*=\s*['"]hidden['"]|visibility\s*:\s*hidden/i,
      `${page} syncSpinCards() must not set visibility: hidden`,
    );

    // Execute in VM at scrollY = 0 and scrollY = 420 and check every card's inline style.visibility
    const mounted = mountStageAndBookingPage(page, { scrollY: 0, reducedMotion: false });
    for (const card of mounted.spinCards) {
      assert.notEqual(
        card.style.visibility,
        'hidden',
        `${page} card #${card.id} must not have visibility: hidden at scrollY=0`,
      );
      assert.equal(
        card.style.visibility,
        'visible',
        `${page} card #${card.id} must keep visibility: visible in the DOM at scrollY=0`,
      );
    }

    mounted.windowObj.scrollY = 420;
    mounted.windowObj.trigger('scroll');
    for (const card of mounted.spinCards) {
      assert.notEqual(
        card.style.visibility,
        'hidden',
        `${page} card #${card.id} (state=${card.getAttribute('data-flight-state')}) must not have visibility: hidden on scroll`,
      );
      assert.equal(
        card.style.visibility,
        'visible',
        `${page} card #${card.id} (state=${card.getAttribute('data-flight-state')}) must keep visibility: visible in the DOM on scroll`,
      );
    }
    assert.equal(mounted.belowCard.getAttribute('data-flight-state'), 'offscreen');
    assert.equal(mounted.aboveCard.getAttribute('data-flight-state'), 'offscreen');
  }
});

test('syncSpinCards() keeps #card-scheduler and the booking confirmation card (#booking-confirm-box) visible in the DOM before and after booking submission', async () => {
  const mounted = mountStageAndBookingPage('index.html', { scrollY: 0, reducedMotion: false });
  await new Promise((r) => setTimeout(r, 20));

  // Before booking at scrollY = 0: #card-scheduler is offscreen but never visibility: hidden
  assert.equal(mounted.schedulerCard.style.visibility, 'visible');
  assert.notEqual(mounted.confirmBox.style.visibility, 'hidden');

  // Submit a valid booking
  mounted.getEl('bf-name').value = 'Jordan Vance';
  mounted.getEl('bf-phone').value = '(321) 555-0188';
  mounted.getEl('bf-devices').value = '3 Dell laptops and 1 laser printer';
  mounted.getEl('booking-form').dispatchEvent('submit');
  await new Promise((r) => setTimeout(r, 20));

  assert.equal(mounted.confirmBox.style.display, 'block', 'booking confirmation card must be displayed after booking');
  assert.notEqual(
    mounted.confirmBox.style.visibility,
    'hidden',
    'booking confirmation card must not be visibility: hidden',
  );

  // Even if scroll fires at scrollY = 0 or when scrolled to the bottom of #card-scheduler,
  // #card-scheduler and #booking-confirm-box stay visible and settled.
  mounted.windowObj.scrollY = 0;
  mounted.windowObj.trigger('scroll');
  assert.equal(mounted.schedulerCard.style.visibility, 'visible');
  assert.equal(mounted.schedulerCard.style.opacity, '1');
  assert.equal(mounted.schedulerCard.getAttribute('data-flight-state'), 'settled');
  assert.equal(mounted.confirmBox.style.display, 'block');
  assert.notEqual(mounted.confirmBox.style.visibility, 'hidden');

  // Simulate scrolling down to view the bottom of #card-scheduler where #booking-confirm-box sits
  mounted.windowObj.scrollY = 900;
  mounted.schedulerStage._rect = { top: -650, bottom: 200, height: 850, left: 0, right: 780, width: 780 };
  mounted.windowObj.trigger('scroll');
  assert.equal(mounted.schedulerCard.style.visibility, 'visible');
  assert.equal(mounted.schedulerCard.style.opacity, '1');
  assert.equal(mounted.schedulerCard.getAttribute('data-flight-state'), 'settled');
  assert.equal(mounted.confirmBox.style.display, 'block');
  assert.notEqual(mounted.confirmBox.style.visibility, 'hidden');
});

test('about.html, terms.html and privacy.html each include #cookie-banner outside <main> so Manage Cookies opens the banner', () => {
  const cookieScriptSource = readSiteFile('cookie-consent.js');

  for (const page of SUBPAGES) {
    const html = readSiteFile(page);

    // 1. <main> must exist and must NOT contain #cookie-banner
    const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
    assert.ok(mainMatch, `${page} must contain <main>...</main>`);
    assert.doesNotMatch(
      mainMatch[1],
      /id\s*=\s*["']cookie-banner["']/i,
      `${page} #cookie-banner must be outside <main>`,
    );

    // 2. Document outside <main> must include #cookie-banner and all required controls
    const htmlOutsideMain = html.slice(0, mainMatch.index) + html.slice(mainMatch.index + mainMatch[0].length);
    assert.match(
      htmlOutsideMain,
      /<div\b[^>]*\bid=["']cookie-banner["'][^>]*>/i,
      `${page} must include #cookie-banner outside <main>`,
    );
    for (const requiredId of [
      'cookie-banner',
      'cb-checks',
      'cb-necessary',
      'cb-analytics',
      'cb-functional',
      'cb-accept-btn',
      'cb-options-btn',
      'cb-decline-btn',
      'manage-cookies-link',
    ]) {
      const idRe = new RegExp(`\\bid=["']${requiredId}["']`, 'i');
      assert.match(
        htmlOutsideMain,
        idRe,
        `${page} must include #${requiredId} outside <main> so cookie-consent.js and Manage Cookies work`,
      );
    }

    // 3. Execute cookie-consent.js against the ids present in the page outside <main>
    const presentIds = new Set();
    const idScanRe = /\bid=["']([^"']+)["']/gi;
    let m;
    while ((m = idScanRe.exec(htmlOutsideMain)) !== null) {
      presentIds.add(m[1]);
    }

    const elements = new Map();
    for (const id of presentIds) {
      const el = createFakeElement(id);
      if (id === 'cb-checks' || id === 'cb-decline-btn') el.hidden = true;
      if (id === 'cb-necessary') {
        el.checked = true;
        el.disabled = true;
      }
      if (id === 'cb-accept-btn') el.textContent = 'OK';
      if (id === 'cb-options-btn') el.setAttribute('aria-expanded', 'false');
      elements.set(id, el);
    }

    const storage = new Map([
      [
        'or_cookie_consent',
        JSON.stringify({ decided: true, analytics: false, functional: false, timestamp: '2026-11-21T00:00:00.000Z' }),
      ],
    ]);

    const context = vm.createContext({
      document: {
        getElementById(id) {
          return elements.get(id) || null;
        },
      },
      localStorage: {
        getItem(k) {
          return storage.has(k) ? storage.get(k) : null;
        },
        setItem(k, v) {
          storage.set(k, String(v));
        },
        removeItem(k) {
          storage.delete(k);
        },
      },
      Date,
      JSON,
    });

    vm.runInContext(cookieScriptSource, context);

    const banner = elements.get('cookie-banner');
    const manageCookiesLink = elements.get('manage-cookies-link');
    const checks = elements.get('cb-checks');
    const optionsButton = elements.get('cb-options-btn');
    const declineButton = elements.get('cb-decline-btn');
    const acceptButton = elements.get('cb-accept-btn');

    assert.ok(banner, `${page} must have #cookie-banner element`);
    assert.ok(manageCookiesLink, `${page} must have #manage-cookies-link element`);
    assert.equal(banner.style.display, 'none', `${page} banner starts hidden when prior consent exists`);

    // Clicking Manage Cookies must clear stored consent, expand options, and show the banner
    manageCookiesLink.click();
    assert.equal(
      banner.style.display,
      'block',
      `${page} clicking Manage Cookies must set #cookie-banner display to block`,
    );
    assert.equal(checks.hidden, false, `${page} clicking Manage Cookies must unhide #cb-checks`);
    assert.equal(declineButton.hidden, false, `${page} clicking Manage Cookies must unhide #cb-decline-btn`);
    assert.equal(optionsButton.hidden, true, `${page} clicking Manage Cookies must hide #cb-options-btn`);
    assert.equal(optionsButton.getAttribute('aria-expanded'), 'true');
    assert.equal(acceptButton.textContent, 'Accept Selected');
    assert.equal(storage.has('or_cookie_consent'), false, `${page} clicking Manage Cookies must clear prior consent`);
  }
});
