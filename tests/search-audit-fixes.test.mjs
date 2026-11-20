// Tests for each kind of fix from the b03 (youandinotai.com) and b04 (onlinerecycle.net) search audits.
// Run: node --test tests/search-audit-fixes.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, '..');
const YANI = path.join(ROOT, 'domains', 'youandinotai.com', 'frontend');
const OR_SITE = path.join(ROOT, 'domains', 'onlinerecycle.net', 'site');

const readYani = (rel) => fs.readFileSync(path.join(YANI, rel), 'utf8');
const readOr = (rel) => fs.readFileSync(path.join(OR_SITE, rel), 'utf8');

const parseAttrs = (tagStr) => {
  const attrs = {};
  const re = /([a-zA-Z0-9_:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+)))?/g;
  const inner = tagStr.replace(/^<[a-zA-Z0-9:-]+/, '').replace(/\/?>$/, '');
  let m;
  while ((m = re.exec(inner)) !== null) {
    attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return attrs;
};

const getTags = (html, tagName) => {
  const re = new RegExp(`<${tagName}\\b[^>]*>`, 'gi');
  return (html.match(re) ?? []).map(parseAttrs);
};

const decodeEntities = (s) => s.replaceAll('&amp;', '&');

const titleOf = (html) => {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1].replace(/\s+/g, ' ').trim()) : '';
};

const metaContent = (html, attrName, attrVal) => {
  for (const attrs of getTags(html, 'meta')) {
    if (attrs[attrName] === attrVal) return decodeEntities(attrs.content ?? '');
  }
  return undefined;
};

const canonicalOf = (html) => {
  for (const attrs of getTags(html, 'link')) {
    if (attrs.rel === 'canonical') return attrs.href;
  }
  return undefined;
};

const jsonLdBlocks = (html) => {
  const re = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push(JSON.parse(m[1].trim()));
  }
  return out;
};

test('1. title: unique titles, brand casing, and county/service qualifiers across both sites', () => {
  const blogScript = readYani('build_blog_static.py');
  assert.match(blogScript, /BRAND = "YouAndINotAI"/);
  assert.match(
    blogScript,
    /Verified Human Dating &amp; Safety Guides \| \{BRAND\}|Verified Human Dating & Safety Guides \| \{BRAND\}/,
  );

  const appTsx = readYani('src/App.tsx');
  const loginTsx = readYani('src/app/pages/Login.tsx');
  const registerTsx = readYani('src/app/pages/Register.tsx');
  assert.match(appTsx, /Member Support & Safety Guide \| YouAndINotAI/);
  assert.match(loginTsx, /Member Sign In \| YouAndINotAI/);
  assert.match(registerTsx, /Create 18\+ Account \| YouAndINotAI/);

  const orIndex = readOr('index.html');
  assert.match(titleOf(orIndex), /Central Florida/);
  assert.match(titleOf(orIndex), /Sorrento/);
  assert.match(titleOf(orIndex), /Lake, Orange & Seminole/);

  const orAreas = readOr('service-areas.html');
  assert.match(titleOf(orAreas), /Lake, Orange & Seminole/);
  assert.match(titleOf(orAreas), /\|\s*OnlineRecycle\.net$/);

  const orAbout = readOr('about.html');
  assert.match(titleOf(orAbout), /Central Florida/);

  const orDisclaimer = readOr('disclaimer.html');
  assert.equal(titleOf(orDisclaimer), 'Disclaimer | OnlineRecycle.net');
});

test('2. meta description: SERP-length descriptions, county names, and valid og:image / twitter:image', () => {
  const yaniIndex = readYani('index.html');
  assert.equal(metaContent(yaniIndex, 'property', 'og:image'), 'https://youandinotai.com/og-image.png');
  assert.equal(metaContent(yaniIndex, 'name', 'twitter:image'), 'https://youandinotai.com/og-image.png');
  assert.ok(fs.existsSync(path.join(YANI, 'public', 'og-image.png')));

  const metadata = JSON.parse(readYani('metadata.json'));
  assert.doesNotMatch(metadata.description, /Gemini AI|beta|waitlist|launch/i);
  assert.match(metadata.description, /Bot-Shield/i);

  const orIndex = readOr('index.html');
  const orDesc = metaContent(orIndex, 'name', 'description') ?? '';
  assert.ok(orDesc.length > 50 && orDesc.length <= 160, `expected <= 160 chars, got ${orDesc.length}`);
  assert.match(orDesc, /Sorrento/);
  assert.match(orDesc, /Lake, Orange, and Seminole Counties/);
  assert.match(metaContent(orIndex, 'name', 'keywords') ?? '', /Orange County/);
  assert.match(metaContent(orIndex, 'name', 'keywords') ?? '', /Seminole County/);

  const orDisclaimer = readOr('disclaimer.html');
  assert.ok(metaContent(orDisclaimer, 'property', 'og:description'));
  assert.ok(metaContent(orDisclaimer, 'name', 'twitter:description'));
});

test('3. canonical: trailing-slash consistency, per-route canonicals, no canonical on 404.html, no 0-byte founding.html canonical', () => {
  const yaniIndex = readYani('index.html');
  assert.equal(canonicalOf(yaniIndex), 'https://youandinotai.com/');
  assert.equal(metaContent(yaniIndex, 'property', 'og:url'), 'https://youandinotai.com/');

  const joinDoc = readYani('public/join.html');
  assert.notEqual(canonicalOf(joinDoc), 'https://youandinotai.com/founding.html');
  assert.equal(canonicalOf(joinDoc), 'https://youandinotai.com/');
  assert.match(metaContent(joinDoc, 'name', 'robots') ?? '', /noindex/);

  const blogDir = path.join(YANI, 'public', 'blog');
  for (const name of fs.readdirSync(blogDir).filter((f) => f.endsWith('.md'))) {
    const content = fs.readFileSync(path.join(blogDir, name), 'utf8');
    const m = content.match(/^canonical:\s*"([^"]+)"/m);
    assert.ok(m && m[1].endsWith('/'), `${name} canonical missing trailing slash: ${m?.[1]}`);
  }

  const orIndex = readOr('index.html');
  assert.equal(canonicalOf(orIndex), 'https://onlinerecycle.net/');
  assert.equal(metaContent(orIndex, 'property', 'og:url'), 'https://onlinerecycle.net/');

  const or404 = readOr('404.html');
  assert.equal(canonicalOf(or404), undefined);
});

test('4. sitemap entries: /support included, deterministic lastmod dates, and updated onlinerecycle lastmod dates', () => {
  const blogScript = readYani('build_blog_static.py');
  assert.doesNotMatch(blogScript, /date\.today\(\)\.isoformat\(\)/);
  assert.match(blogScript, /\{SITE\}\/support/);

  execFileSync('python', [path.join(YANI, 'build_blog_static.py')], { stdio: 'pipe' });
  execFileSync('python', [path.join(YANI, 'build_blog_static.py'), '--check'], { stdio: 'pipe' });

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
  const orIndex = readOr('index.html');
  const imgs = getTags(orIndex, 'img');
  assert.ok(imgs.length >= 3);
  for (const img of imgs) {
    assert.ok((img.alt ?? '').trim().length > 0, 'every img in onlinerecycle index.html must have non-empty alt');
  }
  for (const page of ['index.html', 'service-areas.html', 'about.html', 'terms.html', 'privacy.html']) {
    const doc = readOr(page);
    assert.ok((metaContent(doc, 'property', 'og:image:alt') ?? '').length > 0, `${page} missing og:image:alt`);
    assert.ok((metaContent(doc, 'name', 'twitter:image:alt') ?? '').length > 0, `${page} missing twitter:image:alt`);
  }

  const yaniIndex = readYani('index.html');
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

  for (const page of ['index.html', 'about.html', 'terms.html', 'privacy.html', 'service-areas.html']) {
    const doc = readOr(page);
    const brand = getTags(doc, 'a').find((a) => (a.class ?? '').split(/\s+/).includes('brand'));
    assert.equal(brand?.href, '/', `${page} header brand link must point to /`);
    const footerMatch = doc.match(/<footer[\s\S]*?<\/footer>/i)?.[0] ?? '';
    const footerHrefs = getTags(footerMatch, 'a').map((a) => a.href);
    assert.ok(footerHrefs.includes('/'), `${page} footer must include Home link to /`);
  }

  const disclaimerDoc = readOr('disclaimer.html');
  const disclaimerHrefs = getTags(disclaimerDoc, 'a').map((a) => a.href);
  assert.ok(disclaimerHrefs.includes('tel:+13213962008'), 'disclaimer.html must have clickable tel:+13213962008');
  assert.ok(disclaimerHrefs.includes('/about.html'), 'disclaimer.html footer must link to /about.html');
});

test('8. structured data: states only what page states (Web-only OS, 5 live offers without beta/waitlist/launch, BlogPosting JSON-LD, FAQPage itemscope on onlinerecycle index.html, no TVs in RecyclingCenter, deduplicated FAQPage on service-areas.html)', () => {
  const yaniIndex = readYani('index.html');
  const [yaniLd] = jsonLdBlocks(yaniIndex);
  assert.equal(yaniLd.operatingSystem, 'Web');
  assert.equal(yaniLd.url, 'https://youandinotai.com/');
  assert.ok(Array.isArray(yaniLd.offers) && yaniLd.offers.length === 5);
  assert.doesNotMatch(JSON.stringify(yaniLd), /beta|waitlist|launch|iOS|Android/i);

  const blogScript = readYani('build_blog_static.py');
  assert.match(blogScript, /"@type":\s*"BlogPosting"/);

  const orIndex = readOr('index.html');
  const faqCard = getTags(orIndex, 'article').find((a) => a.id === 'card-faq');
  assert.equal(faqCard?.itemtype, 'https://schema.org/FAQPage');
  assert.notEqual(faqCard?.itemscope, undefined);

  const [orLd] = jsonLdBlocks(orIndex);
  assert.equal(orLd.url, 'https://onlinerecycle.net/');
  assert.doesNotMatch(JSON.stringify(orLd), /\bTVs\b/i);
  assert.equal(orLd.geo?.['@type'], 'GeoCoordinates');

  const orAreas = readOr('service-areas.html');
  const areaFaqCard = getTags(orAreas, 'article').find((a) => a.id === 'card-faq');
  assert.equal(areaFaqCard?.itemtype, undefined, 'service-areas.html should not duplicate FAQPage in microdata and JSON-LD');
  const [areasLd] = jsonLdBlocks(orAreas);
  const rcNode = areasLd['@graph'].find((n) => n['@type'] === 'RecyclingCenter');
  assert.equal(rcNode.url, 'https://onlinerecycle.net/');
  assert.equal(rcNode.address.postalCode, '32776');
});
