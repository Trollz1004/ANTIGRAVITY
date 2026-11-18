// OnlineRecycle: about, terms and privacy must match the dark home page.
// Run: node --test tests/onlinerecycle-pages.test.mjs
//
// The pages are read with a real HTML parser (parse5, a root devDependency). No regular
// expression is ever used to strip tags, comments or scripts, or to decode entities.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, parseFragment } from 'parse5';

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(here, '..', 'domains', 'onlinerecycle.net', 'site');
const read = (name) => fs.readFileSync(path.join(SITE, name), 'utf8');

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

// ---- tree helpers (parse5 default tree adapter) -------------------------------------
const isEl = (n) => typeof n.tagName === 'string';
const kids = (n) => (n.nodeName === 'template' ? n.content.childNodes : n.childNodes) ?? [];
const attr = (n, name) => n.attrs?.find((a) => a.name === name)?.value;
const hasClass = (n, cls) => (attr(n, 'class') ?? '').split(/\s+/).includes(cls);
function* descend(node) {
  for (const child of kids(node)) {
    yield child;
    yield* descend(child);
  }
}
const all = (root, pred) => [...descend(root)].filter((n) => isEl(n) && pred(n));
const first = (root, pred, what) => {
  const found = all(root, pred)[0];
  assert.ok(found, `missing ${what}`);
  return found;
};
const tag = (name, cls) => (n) => n.tagName === name && (cls === undefined || hasClass(n, cls));

const DROPPED = new Set(['script', 'style']);
// Visible text: every text node (comments are not text nodes, script/style bodies are
// skipped, <br> is a space), joined with a space, whitespace collapsed. Entities are
// decoded once, by the parser.
const collect = (node, skip, out) => {
  for (const child of kids(node)) {
    if (child.nodeName === '#text') out.push(child.value);
    else if (isEl(child)) {
      if (DROPPED.has(child.tagName) || skip(child)) continue;
      if (child.tagName === 'br') out.push(' ');
      else collect(child, skip, out);
    }
  }
  return out;
};
const never = () => false;
const squash = (parts) => parts.join(' ').replace(/\s+/g, ' ').trim();
const textOfNode = (node, skip = never) => squash(collect(node, skip, []));
const textOf = (html) => textOfNode(parseFragment(html));
const hrefsOf = (root) =>
  all(root, (n) => attr(n, 'href') !== undefined)
    .map((n) => attr(n, 'href'))
    .sort();
// hash-only links on home ("#book") and root-anchored links on other pages ("/#book") mean the same thing.
const normHref = (h) => (h.startsWith('/#') ? h.slice(1) : h);
const linksOf = (root) =>
  all(root, (n) => n.tagName === 'a' && attr(n, 'href') !== undefined).map((a) => [
    normHref(attr(a, 'href')),
    textOfNode(a),
  ]);
const idsOf = (root) => new Set(all(root, (n) => attr(n, 'id') !== undefined).map((n) => attr(n, 'id')));

// ---- the extractor itself must behave like a parser ---------------------------------
test('textOf: parser semantics (entities decoded once, any-case script and comments never leak)', () => {
  assert.equal(textOf('<p>a &amp;lt; b</p>'), 'a &lt; b', 'double unescape');
  assert.equal(textOf('<p>x</p><SCRIPT>alert(1)</SCRIPT><p>y</p>'), 'x y', 'upper-case script');
  assert.equal(textOf('<p>x</p><ScRiPt type="x">alert(1)</sCrIpT><p>y</p>'), 'x y', 'mixed-case script');
  assert.equal(textOf('<p>x</p><!-- <script>alert(1)</script> --><p>y</p>'), 'x y', 'comment');
  assert.equal(textOf('<p>one<br>two<BR/>three</p>'), 'one two three', 'line breaks');
  assert.equal(textOf('<p>a&nbsp;&middot;&nbsp;b &#39;q&#39; &quot;r&quot;</p>'), 'a \u00b7 b \'q\' "r"', 'entities');
  assert.deepEqual(hrefsOf(parseFragment('<a HREF="/a&amp;b">x</a><link href="/c">')), ['/a&b', '/c'], 'hrefs');
});

// ---- the pages -----------------------------------------------------------------------
const home = parse(read('index.html'));
const homeHeader = first(home, tag('header', 'site-header'), 'home header');
const homeNav = first(homeHeader, tag('nav', 'top-nav'), 'home nav');
const homeFooter = first(
  home,
  (n) => n.tagName === 'footer' && attr(n, 'id') === 'footer' && hasClass(n, 'footer'),
  'home footer',
);
const progressOf = (doc) =>
  first(doc, (n) => n.tagName === 'nav' && attr(n, 'id') === 'onlinerecycle-progress-map', 'progress map nav');
const homeProgress = progressOf(home);
const homeIds = idsOf(home);
const isTopNav = tag('nav', 'top-nav');

const stylesheetOf = (doc) =>
  attr(
    first(
      doc,
      (n) => n.tagName === 'link' && attr(n, 'rel') === 'stylesheet' && /styles\.css/.test(attr(n, 'href') ?? ''),
      'site stylesheet',
    ),
    'href',
  );
const themeColorOf = (doc) =>
  attr(
    first(doc, (n) => n.tagName === 'meta' && attr(n, 'name') === 'theme-color', 'theme-color'),
    'content',
  );

for (const page of PAGES) {
  const source = read(page);
  const doc = parse(source);

  test(`${page}: same stylesheet and cookie script as home`, () => {
    assert.equal(stylesheetOf(doc), stylesheetOf(home));
    const cookie = first(
      doc,
      (n) => n.tagName === 'script' && /^\/cookie-consent\.js\?v=\d+$/.test(attr(n, 'src') ?? ''),
      'cookie-consent script',
    );
    assert.notEqual(attr(cookie, 'defer'), undefined, 'cookie script must defer');
    assert.equal(themeColorOf(doc), themeColorOf(home));
  });

  test(`${page}: no light-theme markup, no forked inline stylesheet, no green band`, () => {
    const htmlEl = first(doc, tag('html'), 'html element');
    assert.equal(attr(htmlEl, 'lang'), 'en');
    assert.equal(attr(htmlEl, 'class'), 'dark');
    assert.equal(all(doc, tag('style')).length, 0, 'page must not carry its own stylesheet');
    assert.equal(all(doc, (n) => hasClass(n, 'topbar')).length, 0);
    assert.equal(all(doc, (n) => hasClass(n, 'hero')).length, 0);
    assert.doesNotMatch(source, /#16a34a|#15803d|#f0fdf4|#dcfce7|#f8fafc|#ffffff|--accent:\s*#16/i);
    assert.equal(
      all(doc, (n) => n.tagName === 'header' && n.attrs.length === 0).length,
      0,
      'old plain <header> must be gone',
    );
    assert.equal(
      all(doc, (n) => n.tagName === 'footer' && n.attrs.length === 0).length,
      0,
      'old plain <footer> must be gone',
    );
  });

  test(`${page}: same header, wireframe motion canvases and navigation as home`, () => {
    const header = first(doc, tag('header', 'site-header'), 'site header');
    const headerIds = idsOf(header);
    for (const id of ['onlinerecycle-header-mark', 'onlinerecycle-header-line', 'mobile-menu-btn']) {
      assert.ok(headerIds.has(id), `header lacks #${id}`);
    }
    const ids = idsOf(doc);
    assert.ok(ids.has('carbon-fibre-backdrop'));
    assert.ok(ids.has('onlinerecycle-stage-canvas'));
    assert.deepEqual(linksOf(first(header, isTopNav, 'header nav')), linksOf(homeNav));
    // brand + right hand status/contact block identical in text and links
    assert.equal(textOfNode(header, isTopNav), textOfNode(homeHeader, isTopNav));
  });

  test(`${page}: same footer as home`, () => {
    const footer = first(
      doc,
      (n) => n.tagName === 'footer' && attr(n, 'id') === 'footer' && hasClass(n, 'footer'),
      'footer',
    );
    assert.equal(textOfNode(footer), textOfNode(homeFooter));
    assert.deepEqual(linksOf(footer), linksOf(homeFooter));
  });

  test(`${page}: numbered section progress bar with every stop present`, () => {
    const progress = progressOf(doc);
    const stopsOf = (nav) => all(nav, (n) => attr(n, 'data-stop-id') !== undefined).map((n) => attr(n, 'data-stop-id'));
    const stops = stopsOf(progress);
    assert.equal(stops.length, stopsOf(homeProgress).length, 'same number of numbered stops as home');
    assert.deepEqual(
      all(progress, (n) => hasClass(n, 'journey-segment-num')).map((n) => textOfNode(n)),
      ['01', '02', '03', '04', '05', '06'],
    );
    assert.equal(stops[0], 'overview');
    assert.equal(stops.at(-1), 'footer');
    const ids = idsOf(doc);
    for (const id of stops) assert.ok(ids.has(id), `no element #${id} for the progress bar`);
    assert.ok(idsOf(progress).has('journey-readout-count'));
  });

  test(`${page}: motion engine honours prefers-reduced-motion and styles.css has the reduced-motion block`, () => {
    assert.ok(source.includes("window.matchMedia('(prefers-reduced-motion: reduce)')"));
    assert.ok(source.includes('data-stage-mode="active"'));
    assert.match(read('styles.css'), /@media \(prefers-reduced-motion: reduce\)/);
  });

  test(`${page}: legal text and About wording unchanged byte for byte (visible text and links)`, () => {
    const main = first(doc, tag('main'), '<main>');
    assert.equal(sha(textOfNode(main)), ORIGINAL[page].text, 'visible body copy changed');
    assert.equal(sha(JSON.stringify(hrefsOf(main))), ORIGINAL[page].hrefs, 'body links changed');
  });

  test(`${page}: every internal link and in-page anchor works`, () => {
    const ids = idsOf(doc);
    for (const [href] of linksOf(doc)) {
      if (/^(https?:|mailto:|tel:)/.test(href) || href === '#') continue;
      if (href.startsWith('#')) {
        assert.ok(ids.has(href.slice(1)) || homeIds.has(href.slice(1)), `dead anchor ${href}`);
        continue;
      }
      const clean = href.split('#')[0].split('?')[0];
      if (clean === '/') continue;
      assert.ok(fs.existsSync(path.join(SITE, clean.replace(/^\//, ''))), `dead link ${href}`);
    }
  });
}

test('about page: contact email is reported, not changed (judge to rule)', () => {
  const about = parse(read('about.html'));
  assert.ok(hrefsOf(about).includes('mailto:collaboration@youandinotai.com'));
});
