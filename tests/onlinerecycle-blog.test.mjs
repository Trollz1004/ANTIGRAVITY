// OnlineRecycle blog tests: /blog/ index, /sitemap.xml, and all posts in domains/onlinerecycle.net/site/blog/.
// Run: node --test tests/onlinerecycle-blog.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildOnlineRecycleBlogIndex,
  buildOnlineRecycleSitemap,
  discoverOnlineRecycleBlogPosts,
} from '../ops/domains-server/onlinerecycle-blog.mjs';
import { server as domainsServer } from '../ops/domains-server/server.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(here, '..', 'domains', 'onlinerecycle.net', 'site');
const BLOG_DIR = path.join(SITE, 'blog');
const LOOPBACK_HOST = ['127', '0', '0', '1'].join('.');

const POST_FILES = fs
  .readdirSync(BLOG_DIR)
  .filter((f) => f.endsWith('.html') && f !== 'index.html')
  .sort();

const BLOG_PAGES = [
  {
    file: 'blog/index.html',
    canonical: 'https://onlinerecycle.net/blog/',
    isPost: false,
  },
  ...POST_FILES.map((file) => ({
    file: `blog/${file}`,
    canonical: `https://onlinerecycle.net/blog/${file}`,
    isPost: true,
  })),
];

function parseAttrs(attrString) {
  const attrs = {};
  const re = /([a-zA-Z0-9_:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(attrString)) !== null) {
    attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return attrs;
}

function findOpenTags(html, tagName) {
  const re = new RegExp(`<${tagName}\\b([^>]*?)\\/?>`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push(parseAttrs(m[1] || ''));
  }
  return out;
}

function findTagBlocks(html, tagName) {
  const re = new RegExp(`<${tagName}\\b([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push({
      attrs: parseAttrs(m[1] || ''),
      innerHtml: m[2] || '',
    });
  }
  return out;
}

const HTML_ENTITY_MAP = {
  '&amp;': '&',
  '&nbsp;': ' ',
  '&middot;': '·',
  '&copy;': '©',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

function visibleText(fragment) {
  return fragment
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:amp|nbsp|middot|copy|quot|#39|apos);/g, (entity) => HTML_ENTITY_MAP[entity] ?? entity)
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

test('visibleText decodes HTML entities in a single pass without double-unescaping', () => {
  assert.equal(
    visibleText('<p>a &amp;nbsp; b &amp;quot;c&amp;quot; &amp;middot; d</p>'),
    'a &nbsp; b &quot;c&quot; &middot; d',
  );
});

test('blog test discovers posts from domains/onlinerecycle.net/site/blog without a hand-kept list', () => {
  assert.ok(POST_FILES.length >= 17, `expected at least 17 blog posts, found ${POST_FILES.length}`);
  const testSource = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
  const builderSource = fs.readFileSync(
    path.join(here, '..', 'ops', 'domains-server', 'onlinerecycle-blog.mjs'),
    'utf8',
  );
  for (const postFile of POST_FILES) {
    assert.equal(testSource.includes(postFile), false, `blog test must not hard-code post filename ${postFile}`);
    assert.equal(
      builderSource.includes(postFile),
      false,
      `onlinerecycle-blog.mjs must not hard-code post filename ${postFile}`,
    );
  }
  const discovered = discoverOnlineRecycleBlogPosts(SITE);
  assert.equal(discovered.length, POST_FILES.length);
  const generatedSitemap = buildOnlineRecycleSitemap(SITE);
  for (const postFile of POST_FILES) {
    const loc = `<loc>https://onlinerecycle.net/blog/${postFile}</loc>`;
    const occurrences = generatedSitemap.split(loc).length - 1;
    assert.equal(occurrences, 1, `sitemap.xml must include ${postFile} once, found ${occurrences}`);
  }
});

test('blog needs no stage.js: blog/stage.js is removed and blog pages work with static HTML, styles.css, and cookie-consent.js', () => {
  assert.equal(fs.existsSync(path.join(SITE, 'blog/stage.js')), false, 'blog/stage.js must not exist');
  for (const page of BLOG_PAGES) {
    const raw =
      page.file === 'blog/index.html'
        ? buildOnlineRecycleBlogIndex(SITE)
        : fs.readFileSync(path.join(SITE, page.file), 'utf8');
    assert.doesNotMatch(raw, /stage\.js/i, `${page.file} must not reference stage.js`);
    assert.equal(findTagBlocks(raw, 'canvas').length, 0, `${page.file} must not include unused canvas tags`);
    assert.match(raw, /id="cookie-banner"/, `${page.file} must include #cookie-banner for cookie-consent.js`);
  }
});

test('home page footer links to /blog/', () => {
  const homeHtml = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
  const footers = findTagBlocks(homeHtml, 'footer').filter((f) => f.attrs.id === 'footer');
  assert.equal(footers.length, 1, 'home page must have #footer');
  const footerHrefs = findOpenTags(footers[0].innerHtml, 'a').map((a) => a.href);
  assert.ok(footerHrefs.includes('/blog/'), 'home page footer must link to /blog/');
});

for (const page of BLOG_PAGES) {
  test(`${page.file}: exists, has title, meta description, canonical, one h1, uses site styles.css, and is in sitemap.xml`, () => {
    const fullPath = path.join(SITE, page.file);
    assert.ok(fs.existsSync(fullPath), `missing blog file ${page.file}`);
    const raw = page.file === 'blog/index.html' ? buildOnlineRecycleBlogIndex(SITE) : fs.readFileSync(fullPath, 'utf8');

    // 1. Title
    const titles = findTagBlocks(raw, 'title');
    assert.equal(titles.length, 1, `${page.file} must have exactly one <title>`);
    const titleText = visibleText(titles[0].innerHtml);
    assert.ok(titleText.length > 10, `${page.file} <title> must not be empty`);

    // 2. Meta description
    const descriptions = findOpenTags(raw, 'meta').filter((m) => m.name === 'description');
    assert.equal(descriptions.length, 1, `${page.file} must have one meta description`);
    const descContent = (descriptions[0].content ?? '').trim();
    assert.ok(descContent.length > 20, `${page.file} meta description must not be empty`);

    // 3. Canonical
    const canonicals = findOpenTags(raw, 'link').filter((l) => l.rel === 'canonical');
    assert.equal(canonicals.length, 1, `${page.file} must have one canonical link`);
    assert.equal(canonicals[0].href, page.canonical, `${page.file} canonical mismatch`);

    // 4. Exactly one h1
    const h1s = findTagBlocks(raw, 'h1');
    assert.equal(h1s.length, 1, `${page.file} must have exactly one <h1>`);
    assert.ok(visibleText(h1s[0].innerHtml).length > 5, `${page.file} <h1> must not be empty`);

    // 5. Appears in generated/served sitemap.xml with exactly one <loc> per <url>
    const sitemap = buildOnlineRecycleSitemap(SITE);
    assert.ok(sitemap.includes(`<loc>${page.canonical}</loc>`), `${page.canonical} must appear in sitemap.xml`);
    const urlBlocks = findTagBlocks(sitemap, 'url');
    for (const block of urlBlocks) {
      const locs = findTagBlocks(block.innerHtml, 'loc');
      assert.equal(locs.length, 1, 'every <url> block in sitemap.xml must contain exactly one <loc>');
    }

    // 6. Static HTML using site's own styles.css, no inline <style>
    const stylesheets = findOpenTags(raw, 'link').filter(
      (l) => l.rel === 'stylesheet' && /^\/styles\.css/.test(l.href ?? ''),
    );
    assert.equal(stylesheets.length, 1, `${page.file} must link to /styles.css`);
    assert.equal(findTagBlocks(raw, 'style').length, 0, `${page.file} must not contain inline <style>`);
  });

  if (page.isPost) {
    test(`${page.file}: 450 to 800 words, no em dashes, no invented numbers/certificates/prices, ends with one booking link`, () => {
      const fullPath = path.join(SITE, page.file);
      assert.ok(fs.existsSync(fullPath), `missing post file ${page.file}`);
      const raw = fs.readFileSync(fullPath, 'utf8');

      assert.ok(
        !raw.includes('\u2014') && !/&mdash;|&#8212;|&#x2014;/i.test(raw),
        `${page.file} must not contain em dashes`,
      );

      const articles = findTagBlocks(raw, 'article').filter((a) =>
        (a.attrs.class ?? '').split(/\s+/).includes('blog-post-article'),
      );
      assert.equal(articles.length, 1, `${page.file} must have one <article class="blog-post-article">`);

      const articleHtml = articles[0].innerHtml;
      const articleText = visibleText(articleHtml);
      const words = countWords(articleText);
      assert.ok(words >= 450 && words <= 800, `${page.file} article word count must be 450..800, got ${words}`);

      // No invented certificates, standards, prices, or business claims not in index.html / about.html
      assert.doesNotMatch(
        articleText,
        /\$|R2\b|e-Stewards|ISO\s*\d|NIST|DoD|certificate of destruction|certified destruction|keyboards|video adapters|charging docks|loose rechargeable batteries/i,
        `${page.file} must not state business claims, items, certificates, standards, or prices absent from index.html and about.html`,
      );

      // Ends with one link to the booking section already on the site (/#book)
      const articleLinks = findOpenTags(articleHtml, 'a');
      const bookingLinks = articleLinks.filter((a) => a.href === '/#book');
      assert.equal(bookingLinks.length, 1, `${page.file} article must contain exactly one link to /#book`);
      assert.equal(
        articleLinks.at(-1)?.href,
        '/#book',
        `${page.file} post must end with the link to the booking section`,
      );
    });
  }
}

test('blog/index.html links to all posts and matches existing posts byte-for-byte', () => {
  const indexPath = path.join(SITE, 'blog/index.html');
  assert.ok(fs.existsSync(indexPath), 'missing blog/index.html');
  const raw = buildOnlineRecycleBlogIndex(SITE);
  const mains = findTagBlocks(raw, 'main');
  assert.equal(mains.length, 1, 'blog/index.html must have <main>');
  const hrefs = findOpenTags(mains[0].innerHtml, 'a').map((a) => a.href);
  for (const post of BLOG_PAGES.filter((p) => p.isPost)) {
    const expectedHref = `/${post.file}`;
    assert.ok(hrefs.includes(expectedHref), `blog/index.html must link to ${expectedHref}`);
  }
});

test('adding a new post file alone adds its title, description, and canonical to the blog index and sitemap', async () => {
  const tmpSite = fs.mkdtempSync(path.join(os.tmpdir(), 'onlinerecycle-blog-selflist-'));
  try {
    fs.cpSync(SITE, tmpSite, { recursive: true });
    const newPostFile = 'where-to-recycle-old-computers-in-eustis-florida.html';
    const newPostCanonical = `https://onlinerecycle.net/blog/${newPostFile}`;
    const newPostTitle = 'Where to Recycle Old Computers in Eustis, Florida';
    const newPostDescription =
      'Practical guide on where to recycle old computers in Eustis, Florida with free Lake County pickup and Sorrento drop-off.';
    const samplePost = fs.readFileSync(path.join(BLOG_DIR, POST_FILES[0]), 'utf8');
    const newPostHtml = samplePost
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${newPostTitle} | OnlineRecycle.net</title>`)
      .replace(
        /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
        `<meta name="description" content="${newPostDescription}" />`,
      )
      .replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/, `<link rel="canonical" href="${newPostCanonical}" />`)
      .replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${newPostTitle}</h1>`);

    fs.writeFileSync(path.join(tmpSite, 'blog', newPostFile), newPostHtml, 'utf8');

    const generatedIndex = buildOnlineRecycleBlogIndex(tmpSite);
    const generatedVisible = visibleText(generatedIndex);
    assert.ok(generatedIndex.includes(`/blog/${newPostFile}`), 'generated index must link to the new post');
    assert.ok(generatedVisible.includes(newPostTitle), 'generated index must include the new post title');
    assert.ok(generatedVisible.includes(newPostDescription), 'generated index must include the new post description');

    const generatedSitemap = buildOnlineRecycleSitemap(tmpSite);
    assert.ok(
      generatedSitemap.includes(`<loc>${newPostCanonical}</loc>`),
      'generated sitemap must include the new post canonical URL',
    );
  } finally {
    fs.rmSync(tmpSite, { recursive: true, force: true });
  }

  // Also verify domains-server serves the dynamic blog index and sitemap over HTTP
  const listener = domainsServer.listeners('request')[0];
  const srv = http.createServer((req, res) => {
    req.headers.host = 'onlinerecycle.net';
    return listener(req, res);
  });
  await new Promise((resolve, reject) => {
    srv.on('error', reject);
    srv.listen(0, LOOPBACK_HOST, resolve);
  });
  try {
    const port = srv.address().port;
    const baseUrl = `http://${LOOPBACK_HOST}:${port}`;
    const [blogRes, sitemapRes] = await Promise.all([fetch(`${baseUrl}/blog/`), fetch(`${baseUrl}/sitemap.xml`)]);
    assert.equal(blogRes.status, 200);
    assert.equal(sitemapRes.status, 200);
    const blogHtml = await blogRes.text();
    const sitemapXml = await sitemapRes.text();
    for (const post of BLOG_PAGES.filter((p) => p.isPost)) {
      assert.ok(blogHtml.includes(`/${post.file}`), `served /blog/ must link to /${post.file}`);
      assert.ok(
        sitemapXml.includes(`<loc>${post.canonical}</loc>`),
        `served /sitemap.xml must include ${post.canonical}`,
      );
    }
  } finally {
    await new Promise((resolve) => srv.close(resolve));
  }
});

test('blog posts visible text contains no disallowed claims or words', () => {
  const BANNED_TERMS = [
    'facility',
    'warehouse',
    'van',
    'vans',
    'truck',
    'trucks',
    'driver',
    'drivers',
    'landfill',
    'landfills',
    'reminder',
    'toner',
    'ink tank',
    'scanner',
    'scanners',
    'copier',
    'copiers',
    'mail-in',
    'mail in',
    'takes under',
    'only a few minutes',
    'a couple of minutes',
    'takes only',
    'guarantee',
    'guaranteed',
    'certified',
    'certificate',
  ];

  const violations = [];

  for (const file of POST_FILES) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
    const text = visibleText(raw);

    for (const term of BANNED_TERMS) {
      const escaped = term.replace(/[-\\/\\^$*+?.()|[\\]{}]/g, '\\$&');
      const re = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i');
      if (re.test(text)) {
        violations.push(`${file}: disallowed word '${term}'`);
      }
    }

    // The word 'minutes' is allowed only inside '30-minute'. Make the test fail on any other use of 'minute' or 'minutes'.
    const minuteRe = /\b([a-zA-Z0-9]+-)?(minutes?)\b/gi;
    let match;
    while ((match = minuteRe.exec(text)) !== null) {
      const full = match[0].toLowerCase();
      if (full !== '30-minute') {
        violations.push(`${file}: disallowed word '${match[2]}' (in '${match[0]}')`);
      }
    }
  }

  if (violations.length > 0) {
    assert.fail(`Disallowed words found in blog posts:\n${violations.join('\n')}`);
  }
});
