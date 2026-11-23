import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');
const SITE_DIR = path.join(REPO_ROOT, 'domains', 'onlinerecycle.net', 'site');

function readSiteFile(relPath) {
  return fs.readFileSync(path.join(SITE_DIR, relPath), 'utf8');
}

function extractMediaBlock(css, mediaHeaderSubstring) {
  const idx = css.indexOf(mediaHeaderSubstring);
  if (idx === -1) return null;
  const openBrace = css.indexOf('{', idx);
  if (openBrace === -1) return null;
  let depth = 0;
  for (let i = openBrace; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') {
      depth--;
      if (depth === 0) {
        return css.slice(openBrace + 1, i);
      }
    }
  }
  return null;
}

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

test('disclaimer.html and 404.html have no fonts.googleapis.com links and include /styles.css?v=20261118, shared dark header/footer, booking links, and #cookie-banner', () => {
  for (const page of ['disclaimer.html', '404.html']) {
    const html = readSiteFile(page);

    // 1. No external Google Fonts links or inline <style> blocks
    assert.doesNotMatch(
      html,
      /fonts\.googleapis\.com|fonts\.gstatic\.com/i,
      `${page} must not link to external fonts.googleapis.com or fonts.gstatic.com`,
    );
    assert.doesNotMatch(html, /<style\b/i, `${page} must not carry an inline <style> block`);

    // 2. Dark theme root, shared stylesheet /styles.css?v=20261118, and cookie-consent.js
    assert.match(html, /<html\b[^>]*\bclass=["']dark["']/i, `${page} <html> must have class="dark"`);
    assert.match(
      html,
      /<link\b[^>]*\bhref=["']\/styles\.css\?v=20261118["'][^>]*>/i,
      `${page} must link to /styles.css?v=20261118`,
    );
    assert.match(
      html,
      /<script\b[^>]*\bsrc=["']\/cookie-consent\.js\?v=\d+["'][^>]*\bdefer\b/i,
      `${page} must load /cookie-consent.js with defer`,
    );

    // 3. Shared dark header (.site-header), primary nav (#primary-top-nav), booking links, and tel:+13213962008
    assert.match(
      html,
      /<header\b[^>]*\bclass=["'][^"']*\bsite-header\b[^"']*["'][^>]*>/i,
      `${page} must include shared <header class="site-header">`,
    );
    assert.match(
      html,
      /<nav\b[^>]*\bclass=["'][^"']*\btop-nav\b[^"']*["'][^>]*\bid=["']primary-top-nav["'][^>]*>/i,
      `${page} must include shared <nav class="top-nav" id="primary-top-nav">`,
    );
    assert.match(html, /href=["']\/#book["']/i, `${page} must include drop-off booking link /#book`);
    assert.match(
      html,
      /href=["']\/\?service=pickup#book["']/i,
      `${page} must include pickup booking link /?service=pickup#book`,
    );
    assert.match(
      html,
      /Call \/ Text:\s*<a\b[^>]*\bhref=["']tel:\+13213962008["'][^>]*>\(321\) 396-2008<\/a>/i,
      `${page} header must include Call / Text: (321) 396-2008 link`,
    );

    // 4. Shared dark footer (<footer class="footer" id="footer">) and Manage Cookies link
    assert.match(
      html,
      /<footer\b[^>]*\bclass=["'][^"']*\bfooter\b[^"']*["'][^>]*\bid=["']footer["'][^>]*>/i,
      `${page} must include shared <footer class="footer" id="footer">`,
    );
    assert.match(
      html,
      /\bid=["']manage-cookies-link["']/i,
      `${page} footer must include #manage-cookies-link`,
    );

    // 5. #cookie-banner outside <main>
    const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
    assert.ok(mainMatch, `${page} must include <main>...</main>`);
    assert.doesNotMatch(
      mainMatch[1],
      /\bid=["']cookie-banner["']/i,
      `${page} #cookie-banner must be outside <main>`,
    );
    const outsideMain = html.slice(0, mainMatch.index) + html.slice(mainMatch.index + mainMatch[0].length);
    for (const id of [
      'cookie-banner',
      'cb-checks',
      'cb-necessary',
      'cb-analytics',
      'cb-functional',
      'cb-accept-btn',
      'cb-options-btn',
      'cb-decline-btn',
    ]) {
      assert.match(
        outsideMain,
        new RegExp(`\\bid=["']${id}["']`, 'i'),
        `${page} must include #${id} outside <main>`,
      );
    }
  }
});

test('styles.css keeps a compact Call / Text (321) 396-2008 link visible on viewports under 1120px', () => {
  const css = readSiteFile('styles.css');
  const media1120 = extractMediaBlock(css, '@media (max-width: 1120px)');
  assert.ok(media1120, 'styles.css must contain @media (max-width: 1120px) block');

  // Parse every CSS rule inside @media (max-width: 1120px)
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  let headerRightHiddenWhenClosed = false;
  let contactInfoHiddenWhenClosed = false;
  let compactContactStyled = false;

  while ((m = ruleRe.exec(media1120)) !== null) {
    const selectors = m[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const declarations = m[2];
    const hasDisplayNone = /display\s*:\s*none\b/i.test(declarations);

    for (const sel of selectors) {
      if (hasDisplayNone) {
        if (
          sel.includes('.header-right') &&
          !sel.includes('.status-pill') &&
          !sel.includes('.contact-subline')
        ) {
          headerRightHiddenWhenClosed = true;
        }
        if (sel.includes('.contact-info') && !sel.includes('.contact-subline')) {
          contactInfoHiddenWhenClosed = true;
        }
      }
      if (
        (sel.includes('.header-right') || sel.includes('.contact-info')) &&
        /display\s*:\s*(?:inline-flex|flex)\b|font-size\s*:/i.test(declarations) &&
        !sel.includes('.menu-open')
      ) {
        compactContactStyled = true;
      }
    }
  }

  assert.equal(
    headerRightHiddenWhenClosed,
    false,
    'styles.css @media (max-width: 1120px) must not set display: none on .header-right when menu is closed',
  );
  assert.equal(
    contactInfoHiddenWhenClosed,
    false,
    'styles.css @media (max-width: 1120px) must not set display: none on .contact-info when menu is closed',
  );
  assert.equal(
    compactContactStyled,
    true,
    'styles.css @media (max-width: 1120px) must style .header-right / .contact-info compactly so Call / Text (321) 396-2008 remains visible below 1120px',
  );
});

test('index.html includes (321) 396-2008 in #confirm-summary', async () => {
  const html = readSiteFile('index.html');

  // 1. Static HTML or script assignment for #confirm-summary includes (321) 396-2008
  const confirmSummaryTag = html.match(/<p\b[^>]*\bid=["']confirm-summary["'][^>]*>([\s\S]*?)<\/p>/i);
  assert.ok(confirmSummaryTag, 'index.html must contain <p id="confirm-summary">');
  assert.match(
    confirmSummaryTag[1],
    /\(321\)\s*396-2008/,
    'static #confirm-summary in index.html must include (321) 396-2008',
  );

  // 2. Dynamic booking confirmation populates #confirm-summary with (321) 396-2008
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
              bookingId: 'OR-20261122-B56TEST1',
              serviceType: body.serviceType || 'dropoff',
              fullName: body.fullName || 'Jane Doe',
              date: body.date || '2026-11-23',
              slotCode: body.slotCode || '09:00-09:30',
              slotLabel: body.slotLabel || '9:00 AM – 9:30 AM',
              deviceCount: body.deviceCount || '1-5 items',
            },
            googleCalendarUrl: 'https://calendar.google.com/calendar/render?action=TEMPLATE',
            icsUrl: '/api/calendar.ics?id=OR-20261122-B56TEST1',
            smsUrl: 'sms:+13213962008?body=OnlineRecycle.net',
          }),
      });
    }
    return Promise.resolve({
      json: () => Promise.resolve({ ok: false }),
    });
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
    Date,
    Intl,
    URLSearchParams,
    fetch: fakeFetch,
    console,
  });

  vm.runInContext(scriptSource, context);
  await new Promise((r) => setTimeout(r, 20));

  getEl('bf-name').value = 'Jane Doe';
  getEl('bf-phone').value = '(321) 555-0199';
  getEl('bf-devices').value = '2 laptops and 1 monitor';
  getEl('booking-form').dispatchEvent('submit');
  await new Promise((r) => setTimeout(r, 20));

  assert.equal(getEl('booking-confirm-box').style.display, 'block');
  assert.match(
    getEl('confirm-summary').textContent,
    /\(321\)\s*396-2008/,
    'populated #confirm-summary textContent after booking must include (321) 396-2008',
  );
});
