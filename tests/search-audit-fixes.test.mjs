// Tests for each kind of fix from the b03 (youandinotai.com) and b04 (onlinerecycle.net) search audits.
// Run: node --test tests/search-audit-fixes.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, '..');
const YANI = path.join(ROOT, 'domains', 'youandinotai.com', 'frontend');
const OR_SITE = path.join(ROOT, 'domains', 'onlinerecycle.net', 'site');

const readYani = (rel) => fs.readFileSync(path.join(YANI, rel), 'utf8');
const readOr = (rel) => fs.readFileSync(path.join(OR_SITE, rel), 'utf8');

const isEl = (n) => typeof n.tagName === 'string';
const kids = (n) => (n.nodeName === 'template' ? n.content.childNodes : n.childNodes) ?? [];
const attr = (n, name) => n.attrs?.find((a) => a.name === name)?.value;
function* descend(node) {
  for (const child of kids(node)) {
    yield child;
    yield* descend(child);
  }
}
const all = (root, pred) => [...descend(root)].filter((n) => isEl(n) && pred(n));
const textOf = (node) => {
  const out = [];
  for (const child of kids(node)) {
    if (child.nodeName === '#text') out.push(child.value);
    else if (isEl(child)) out.push(textOf(child));
  }
  return out.join('').replace(/\s+/g, ' ').trim();
};
const titleOf = (doc) => {
  const el = all(doc, (n) => n.tagName === 'title')[0];
  return el ? textOf(el) : '';
};
const metaContent = (doc, attrName, attrVal) => {
  const el = all(doc, (n) => n.tagName === 'meta' && attr(n, attrName) === attrVal)[0];
  return el ? attr(el, 'content') : undefined;
};
const canonicalOf = (doc) => {
  const el = all(doc, (n) => n.tagName === 'link' && attr(n, 'rel') === 'canonical')[0];
  return el ? attr(el, 'href') : undefined;
};
const jsonLdBlocks = (doc) =>
  all(doc, (n) => n.tagName === 'script' && attr(n, 'type') === 'application/ld+json').map((el) =>
    JSON.parse(textOf(el)),
  );

test('1. title: unique titles, brand casing, and county/service qualifiers across both sites', () => {
  // youandinotai blog generator brand and hub title
  const blogScript = readYani('build_blog_static.py');
  assert.match(blogScript, /BRAND = "YouAndINotAI"/);
  assert.match(blogScript, /Verified Human Dating &amp; Safety Guides \| \{BRAND\}|Verified Human Dating & Safety Guides \| \{BRAND\}/);

  // per-route document.title updates on public SPA routes
  const appTsx = readYani('src/App.tsx');
  const loginTsx = readYani('src/app/pages/Login.tsx');
  const registerTsx = readYani('src/app/pages/Register.tsx');
  assert.match(appTsx, /Member Support & Safety Guide \| YouAndINotAI/);
  assert.match(loginTsx, /Member Sign In \| YouAndINotAI/);
  assert.match(registerTsx, /Create 18\+ Account \| YouAndINotAI/);

  // onlinerecycle titles include Central Florida / Sorrento / counties and brand suffix
  const orIndex = parse(readOr('index.html'));
  assert.match(titleOf(orIndex), /Central Florida/);
  assert.match(titleOf(orIndex), /Sorrento/);
  assert.match(titleOf(orIndex), /Lake, Orange & Seminole/);

  const orAreas = parse(readOr('service-areas.html'));
  assert.match(titleOf(orAreas), /Lake, Orange & Seminole/);
  assert.match(titleOf(orAreas), /\|\s*OnlineRecycle\.net$/);

  const orAbout = parse(readOr('about.html'));
  assert.match(titleOf(orAbout), /Central Florida/);

  const orDisclaimer = parse(readOr('disclaimer.html'));
  assert.equal(titleOf(orDisclaimer), 'Disclaimer | OnlineRecycle.net');
});

test('2. meta description: SERP-length descriptions, county names, and valid og:image / twitter:image', () => {
  // youandinotai index.html social image points to existing /og-image.png
  const yaniIndex = parse(readYani('index.html'));
  assert.equal(metaContent(yaniIndex, 'property', 'og:image'), 'https://youandinotai.com/og-image.png');
  assert.equal(metaContent(yaniIndex, 'name', 'twitter:image'), 'https://youandinotai.com/og-image.png');
  assert.ok(fs.existsSync(path.join(YANI, 'public', 'og-image.png')));

  // metadata.json aligns with verified-human positioning and never calls the app beta/waitlist/launch
  const metadata = JSON.parse(readYani('metadata.json'));
  assert.doesNotMatch(metadata.description, /Gemini AI|beta|waitlist|launch/i);
  assert.match(metadata.description, /Bot-Shield/i);

  // onlinerecycle index.html meta description <= 160 chars and names Sorrento + Lake, Orange, Seminole
  const orIndex = parse(readOr('index.html'));
  const orDesc = metaContent(orIndex, 'name', 'description') ?? '';
  assert.ok(orDesc.length > 50 && orDesc.length <= 160, `expected <= 160 chars, got ${orDesc.length}`);
  assert.match(orDesc, /Sorrento/);
  assert.match(orDesc, /Lake, Orange, and Seminole Counties/);
  assert.match(metaContent(orIndex, 'name', 'keywords') ?? '', /Orange County/);
  assert.match(metaContent(orIndex, 'name', 'keywords') ?? '', /Seminole County/);

  // onlinerecycle disclaimer.html has Open Graph and Twitter description tags
  const orDisclaimer = parse(readOr('disclaimer.html'));
  assert.ok(metaContent(orDisclaimer, 'property', 'og:description'));
  assert.ok(metaContent(orDisclaimer, 'name', 'twitter:description'));
});

test('3. canonical: trailing-slash consistency, per-route canonicals, no canonical on 404.html, no 0-byte founding.html canonical', () => {
  const yaniIndex = parse(readYani('index.html'));
  assert.equal(canonicalOf(yaniIndex), 'https://youandinotai.com/');
  assert.equal(metaContent(yaniIndex, 'property', 'og:url'), 'https://youandinotai.com/');

  // join.html does not canonicalize to 0-byte founding.html
  const joinDoc = parse(readYani('public/join.html'));
  assert.notEqual(canonicalOf(joinDoc), 'https://youandinotai.com/founding.html');
  assert.equal(canonicalOf(joinDoc), 'https://youandinotai.com/');
  assert.match(metaContent(joinDoc, 'name', 'robots') ?? '', /noindex/);

  // blog markdown front matter canonicals have trailing slash
  const blogDir = path.join(YANI, 'public', 'blog');
  for (const name of fs.readdirSync(blogDir).filter((f) => f.endsWith('.md'))) {
    const content = fs.readFileSync(path.join(blogDir, name), 'utf8');
    const m = content.match(/^canonical:\s*"([^"]+)"/m);
    assert.ok(m && m[1].endsWith('/'), `${name} canonical missing trailing slash: ${m?.[1]}`);
  }

  // onlinerecycle index.html og:url has trailing slash and 404.html has no canonical tag
  const orIndex = parse(readOr('index.html'));
  assert.equal(canonicalOf(orIndex), 'https://onlinerecycle.net/');
  assert.equal(metaContent(orIndex, 'property', 'og:url'), 'https://onlinerecycle.net/');

  const or404 = parse(readOr('404.html'));
  assert.equal(canonicalOf(or404), undefined);
});

test('4. sitemap entries: /support included, deterministic lastmod dates, and updated onlinerecycle lastmod dates', () => {
  const blogScript = readYani('build_blog_static.py');
  assert.doesNotMatch(blogScript, /date\.today\(\)\.isoformat\(\)/);
  assert.match(blogScript, /\{SITE\}\/support/);

  const yaniSitemapPath = path.join(YANI, 'public', 'sitemap.xml');
  assert.ok(fs.existsSync(yaniSitemapPath), 'youandinotai public/sitemap.xml must exist');
  const yaniSitemap = fs.readFileSync(yaniSitemapPath, 'utf8');
  assert.match(yaniSitemap, /<loc>https:\/\/youandinotai\.com\/<\/loc>/);
  assert.match(yaniSitemap, /<loc>https:\/\/youandinotai\.com\/support<\/loc>/);
  assert.match(yaniSitemap, /<loc>https:\/\/youandinotai\.com\/blog\/<\/loc>/);

  const orSitemap = readOr('sitemap.xml');
  assert.doesNotMatch(orSitemap, /2026-03-08/);
  assert.match(orSitemap, /<lastmod>2026-11-18<\/lastmod>/);
});

test('5. robots line: youandinotai disallows gated paths and onlinerecycle has robots.txt with Sitemap and Disallow /api/ /docs/', () => {
  const yaniRobots = readYani('public/robots.txt');
  for (const rule of ['Disallow: /app/', 'Disallow: /api/', 'Disallow: /c/', 'Disallow: /go/']) {
    assert.ok(yaniRobots.includes(rule), `youandinotai robots.txt missing ${rule}`);
  }
  assert.match(yaniRobots, /Sitemap:\s*https:\/\/youandinotai\.com\/sitemap\.xml/);

  const orRobotsPath = path.join(OR_SITE, 'robots.txt');
  assert.ok(fs.existsSync(orRobotsPath), 'onlinerecycle robots.txt must exist');
  const orRobots = fs.readFileSync(orRobotsPath, 'utf8');
  assert.match(orRobots, /User-agent:\s*\*/);
  assert.match(orRobots, /Disallow:\s*\/api\//);
  assert.match(orRobots, /Disallow:\s*\/docs\//);
  assert.match(orRobots, /Sitemap:\s*https:\/\/onlinerecycle\.net\/sitemap\.xml/);
});

test('6. image alt text: every img has non-empty alt text and social card images include og:image:alt and twitter:image:alt', () => {
  const orIndex = parse(readOr('index.html'));
  const imgs = all(orIndex, (n) => n.tagName === 'img');
  assert.ok(imgs.length >= 3);
  for (const img of imgs) {
    const alt = (attr(img, 'alt') ?? '').trim();
    assert.ok(alt.length > 0, 'every img in onlinerecycle index.html must have non-empty alt');
  }
  for (const page of ['index.html', 'service-areas.html', 'about.html', 'terms.html', 'privacy.html']) {
    const doc = parse(readOr(page));
    assert.ok((metaContent(doc, 'property', 'og:image:alt') ?? '').length > 0, `${page} missing og:image:alt`);
    assert.ok((metaContent(doc, 'name', 'twitter:image:alt') ?? '').length > 0, `${page} missing twitter:image:alt`);
  }

  const yaniIndex = parse(readYani('index.html'));
  assert.ok((metaContent(yaniIndex, 'property', 'og:image:alt') ?? '').length > 0);
  assert.ok((metaContent(yaniIndex, 'name', 'twitter:image:alt') ?? '').length > 0);
});

test('7. broken internal links: /blog/ linked from main site, error boundary links to /, brand logo links to /, footer Home links, no raw square.link on join.html, tel: link on disclaimer.html', () => {
  const appTsx = readYani('src/App.tsx');
  assert.match(appTsx, /href="\/blog\/"/);
  assert.doesNotMatch(appTsx, /Open Privacy Center \(\/app\/privacy\)/);

  const mainTsx = readYani('src/main.tsx');
  assert.doesNotMatch(mainTsx, /href="\/app"\s*className="app-button-dark/);

  const joinHtml = readYani('public/join.html');
  assert.doesNotMatch(joinHtml, /square\.link/);
  assert.doesNotMatch(joinHtml, /No language\./);

  const llmsTxt = readYani('public/llms.txt');
  assert.equal((llmsTxt.match(/^# YouAndINotAI$/gm) ?? []).length, 1, 'llms.txt should not duplicate # YouAndINotAI');
  const agentsMd = readYani('public/AGENTS.md');
  assert.equal((agentsMd.match(/^## Data Safety$/gm) ?? []).length, 1, 'AGENTS.md should not duplicate ## Data Safety');

  for (const page of ['index.html', 'about.html', 'terms.html', 'privacy.html', 'service-areas.html']) {
    const doc = parse(readOr(page));
    const brand = all(doc, (n) => n.tagName === 'a' && (attr(n, 'class') ?? '').split(/\s+/).includes('brand'))[0];
    assert.equal(attr(brand, 'href'), '/', `${page} header brand link must point to /`);
    const footer = all(doc, (n) => n.tagName === 'footer')[0];
    const footerHrefs = all(footer, (n) => n.tagName === 'a').map((a) => attr(a, 'href'));
    assert.ok(footerHrefs.includes('/'), `${page} footer must include Home link to /`);
  }

  const disclaimerDoc = parse(readOr('disclaimer.html'));
  const disclaimerHrefs = all(disclaimerDoc, (n) => n.tagName === 'a').map((a) => attr(a, 'href'));
  assert.ok(disclaimerHrefs.includes('tel:+13213962008'), 'disclaimer.html must have clickable tel:+13213962008');
  assert.ok(disclaimerHrefs.includes('/about.html'), 'disclaimer.html footer must link to /about.html');
});

test('8. structured data: states only what page states (Web-only OS, 5 live offers without beta/waitlist/launch, BlogPosting JSON-LD, FAQPage itemscope on onlinerecycle index.html, no TVs in RecyclingCenter, deduplicated FAQPage on service-areas.html)', () => {
  const yaniIndex = parse(readYani('index.html'));
  const [yaniLd] = jsonLdBlocks(yaniIndex);
  assert.equal(yaniLd.operatingSystem, 'Web');
  assert.equal(yaniLd.url, 'https://youandinotai.com/');
  assert.ok(Array.isArray(yaniLd.offers) && yaniLd.offers.length === 5);
  assert.doesNotMatch(JSON.stringify(yaniLd), /beta|waitlist|launch|iOS|Android/i);

  const blogScript = readYani('build_blog_static.py');
  assert.match(blogScript, /"@type":\s*"BlogPosting"/);

  const orIndex = parse(readOr('index.html'));
  const faqCard = all(orIndex, (n) => attr(n, 'id') === 'card-faq')[0];
  assert.equal(attr(faqCard, 'itemtype'), 'https://schema.org/FAQPage');
  assert.NotEqual?.(attr(faqCard, 'itemscope'), undefined);
  assert.notEqual(attr(faqCard, 'itemscope'), undefined);

  const [orLd] = jsonLdBlocks(orIndex);
  assert.equal(orLd.url, 'https://onlinerecycle.net/');
  assert.doesNotMatch(JSON.stringify(orLd), /\bTVs\b/i);
  assert.equal(orLd.geo?.['@type'], 'GeoCoordinates');

  const orAreas = parse(readOr('service-areas.html'));
  const areaFaqCard = all(orAreas, (n) => attr(n, 'id') === 'card-faq')[0];
  assert.equal(attr(areaFaqCard, 'itemtype'), undefined, 'service-areas.html should not duplicate FAQPage in microdata and JSON-LD');
  const [areasLd] = jsonLdBlocks(orAreas);
  const rcNode = areasLd['@graph'].find((n) => n['@type'] === 'RecyclingCenter');
  assert.equal(rcNode.url, 'https://onlinerecycle.net/');
  assert.equal(rcNode.address.postalCode, '32776');
});
