// OnlineRecycle: about, terms and privacy must match the dark home page.
// Run: node --test tests/onlinerecycle-pages.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(here, '..', 'domains', 'onlinerecycle.net', 'site');
const read = (name) => fs.readFileSync(path.join(SITE, name), 'utf8');

const home = read('index.html');
const PAGES = ['about.html', 'terms.html', 'privacy.html'];

// sha256 of the visible body copy (text between the old header and footer) and of the
// sorted href list, taken from the pages as they were on origin/main before the restyle.
// The restyle must not change the legal text or the About wording.
const ORIGINAL = {
  'about.html': {
    text: 'ba807ce178ab2aa6ab322946d993e652c8961895eebc04cbf71011f5afaaaa56',
    hrefs: '46ecd1790c2fa850e087fe666a43df5cddac77482fd8bbb652de3c5d83fa835c',
  },
  'terms.html': {
    text: 'ffc3de1f9b8edcaf719b46de31e83c3600cc230dcc124b98d8ebc1d2705c087f',
    hrefs: '6f0ba2854da38a24e7187307fc8370e8b783f793747dfe8a3161dea02b74ca84',
  },
  'privacy.html': {
    text: '8fe9f8f43ef7b82e007afaf217d011f6ae161b01b791e63f2b784861a5dc4806',
    hrefs: '8280650be23af99cb10ae61349cfbaef4ad2e668ce810d353f462e2ee7098a50',
  },
};

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&middot;/g, '·')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
const textOf = (html) =>
  decode(
    html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<br\s*\/?>/g, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
const hrefsOf = (html) => [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]).sort();
const between = (html, open, close) => {
  const a = html.indexOf(open);
  assert.ok(a >= 0, `missing ${open}`);
  const b = html.indexOf(close, a);
  assert.ok(b >= 0, `missing ${close}`);
  return html.slice(a, b + close.length);
};
// hash-only links on home ("#book") and root-anchored links on other pages ("/#book") mean the same thing.
const normHref = (h) => (h.startsWith('/#') ? h.slice(1) : h);
const linksOf = (html) =>
  [...html.matchAll(/<a\b[^>]*?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => [normHref(m[1]), textOf(m[2])]);

const homeHeader = between(home, '<header class="site-header">', '</header>');
const homeNav = between(homeHeader, '<nav class="top-nav"', '</nav>');
const homeFooter = between(home, '<footer class="footer" id="footer">', '</footer>');
const progressOf = (h) => {
  const m = h.match(/<nav\s+id="onlinerecycle-progress-map"[\s\S]*?<\/nav>/);
  assert.ok(m, 'missing progress map nav');
  return m[0];
};
const homeProgress = progressOf(home);

for (const page of PAGES) {
  const html = read(page);

  test(`${page}: same stylesheet and cookie script as home`, () => {
    const css = (h) => h.match(/<link rel="stylesheet" href="([^"]+)"/)?.[1];
    assert.equal(css(html), css(home));
    assert.match(html, /<script src="\/cookie-consent\.js\?v=\d+" defer><\/script>/);
    assert.equal(
      html.match(/<meta name="theme-color" content="([^"]+)"/)?.[1],
      home.match(/<meta name="theme-color" content="([^"]+)"/)?.[1],
    );
  });

  test(`${page}: no light-theme markup, no forked inline stylesheet, no green band`, () => {
    assert.match(html, /<html lang="en" class="dark">/);
    assert.doesNotMatch(html, /<style[\s>]/i, 'page must not carry its own stylesheet');
    assert.doesNotMatch(html, /class="topbar"/);
    assert.doesNotMatch(html, /class="hero"/);
    assert.doesNotMatch(html, /#16a34a|#15803d|#f0fdf4|#dcfce7|#f8fafc|#ffffff|--accent:\s*#16/i);
    assert.doesNotMatch(html, /<header>/, 'old plain <header> must be gone');
    assert.doesNotMatch(html, /<footer>/, 'old plain <footer> must be gone');
  });

  test(`${page}: same header, wireframe motion canvases and navigation as home`, () => {
    const header = between(html, '<header class="site-header">', '</header>');
    for (const id of ['onlinerecycle-header-mark', 'onlinerecycle-header-line', 'mobile-menu-btn']) {
      assert.ok(header.includes(`id="${id}"`), `header lacks #${id}`);
    }
    assert.ok(html.includes('id="carbon-fibre-backdrop"'));
    assert.ok(html.includes('id="onlinerecycle-stage-canvas"'));
    assert.deepEqual(linksOf(between(header, '<nav class="top-nav"', '</nav>')), linksOf(homeNav));
    // brand + right hand status/contact block identical in text and links
    assert.equal(textOf(header.replace(/<nav class="top-nav"[\s\S]*?<\/nav>/, '')), textOf(homeHeader.replace(/<nav class="top-nav"[\s\S]*?<\/nav>/, '')));
  });

  test(`${page}: same footer as home`, () => {
    const footer = between(html, '<footer class="footer" id="footer">', '</footer>');
    assert.equal(textOf(footer), textOf(homeFooter));
    assert.deepEqual(linksOf(footer), linksOf(homeFooter));
  });

  test(`${page}: numbered section progress bar with every stop present`, () => {
    const progress = progressOf(html);
    const stops = [...progress.matchAll(/data-stop-id="([^"]+)"/g)].map((m) => m[1]);
    const homeStops = [...homeProgress.matchAll(/data-stop-id="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(stops.length, homeStops.length, 'same number of numbered stops as home');
    assert.deepEqual(
      [...progress.matchAll(/class="journey-segment-num">(\d+)</g)].map((m) => m[1]),
      ['01', '02', '03', '04', '05', '06'],
    );
    assert.equal(stops[0], 'overview');
    assert.equal(stops.at(-1), 'footer');
    for (const id of stops) assert.ok(html.includes(`id="${id}"`), `no element #${id} for the progress bar`);
    assert.ok(progress.includes('id="journey-readout-count"'));
  });

  test(`${page}: motion engine honours prefers-reduced-motion and styles.css has the reduced-motion block`, () => {
    assert.ok(html.includes("window.matchMedia('(prefers-reduced-motion: reduce)')"));
    assert.ok(html.includes('data-stage-mode="active"'));
    assert.match(read('styles.css'), /@media \(prefers-reduced-motion: reduce\)/);
  });

  test(`${page}: legal text and About wording unchanged byte for byte (visible text and links)`, () => {
    const main = between(html, '<main', '</main>');
    assert.equal(sha(textOf(main)), ORIGINAL[page].text, 'visible body copy changed');
    assert.equal(sha(JSON.stringify(hrefsOf(main))), ORIGINAL[page].hrefs, 'body links changed');
  });

  test(`${page}: every internal link and in-page anchor works`, () => {
    const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    for (const [href] of linksOf(html)) {
      if (/^(https?:|mailto:|tel:)/.test(href) || href === '#') continue;
      if (href.startsWith('#')) {
        assert.ok(ids.has(href.slice(1)) || home.includes(`id="${href.slice(1)}"`), `dead anchor ${href}`);
        continue;
      }
      const clean = href.split('#')[0].split('?')[0];
      if (clean === '/') continue;
      assert.ok(fs.existsSync(path.join(SITE, clean.replace(/^\//, ''))), `dead link ${href}`);
    }
  });
}

test('about page: contact email is reported, not changed (judge to rule)', () => {
  assert.match(read('about.html'), /mailto:collaboration@youandinotai\.com/);
});

// The text extractor must be a real HTML parser, not regular expressions.
test('textOf: parser semantics (entities decoded once, any-case script and comments never leak)', () => {
  assert.equal(textOf('<p>a &amp;lt; b</p>'), 'a &lt; b', 'double unescape');
  assert.equal(textOf('<p>x</p><SCRIPT>alert(1)</SCRIPT><p>y</p>'), 'x y', 'upper-case script');
  assert.equal(textOf('<p>x</p><ScRiPt type="x">alert(1)</sCrIpT><p>y</p>'), 'x y', 'mixed-case script');
  assert.equal(textOf('<p>x</p><!-- <script>alert(1)</script> --><p>y</p>'), 'x y', 'comment');
  assert.equal(textOf('<p>one<br>two<BR/>three</p>'), 'one two three', 'line breaks');
  assert.equal(textOf('<p>a&nbsp;&middot;&nbsp;b &#39;q&#39; &quot;r&quot;</p>'), "a \u00b7 b 'q' \"r\"", 'entities');
});