// OnlineRecycle blog tests: /blog/ index and three posts.
// Run: node --test tests/onlinerecycle-blog.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(here, '..', 'domains', 'onlinerecycle.net', 'site');

const BLOG_PAGES = [
  {
    file: 'blog/index.html',
    canonical: 'https://onlinerecycle.net/blog/',
    isPost: false,
  },
  {
    file: 'blog/what-to-do-with-old-office-computers.html',
    canonical: 'https://onlinerecycle.net/blog/what-to-do-with-old-office-computers.html',
    isPost: true,
  },
  {
    file: 'blog/how-to-wipe-a-hard-drive-before-recycling-a-pc.html',
    canonical: 'https://onlinerecycle.net/blog/how-to-wipe-a-hard-drive-before-recycling-a-pc.html',
    isPost: true,
  },
  {
    file: 'blog/what-business-electronics-can-be-recycled.html',
    canonical: 'https://onlinerecycle.net/blog/what-business-electronics-can-be-recycled.html',
    isPost: true,
  },
  {
    file: 'blog/where-to-recycle-old-computers-in-lake-county-florida.html',
    canonical: 'https://onlinerecycle.net/blog/where-to-recycle-old-computers-in-lake-county-florida.html',
    isPost: true,
  },
  {
    file: 'blog/what-to-do-with-a-broken-laptop-in-orlando.html',
    canonical: 'https://onlinerecycle.net/blog/what-to-do-with-a-broken-laptop-in-orlando.html',
    isPost: true,
  },
  {
    file: 'blog/where-to-recycle-old-computers-in-altamonte-springs-florida.html',
    canonical: 'https://onlinerecycle.net/blog/where-to-recycle-old-computers-in-altamonte-springs-florida.html',
    isPost: true,
  },
  {
    file: 'blog/where-to-recycle-old-computers-in-sanford-florida.html',
    canonical: 'https://onlinerecycle.net/blog/where-to-recycle-old-computers-in-sanford-florida.html',
    isPost: true,
  },
  {
    file: 'blog/where-to-recycle-old-electronics-in-apopka-florida.html',
    canonical: 'https://onlinerecycle.net/blog/where-to-recycle-old-electronics-in-apopka-florida.html',
    isPost: true,
  },
  {
    file: 'blog/where-to-recycle-old-computers-in-mount-dora-florida.html',
    canonical: 'https://onlinerecycle.net/blog/where-to-recycle-old-computers-in-mount-dora-florida.html',
    isPost: true,
  },
  {
    file: 'blog/how-to-recycle-printers-in-central-florida.html',
    canonical: 'https://onlinerecycle.net/blog/how-to-recycle-printers-in-central-florida.html',
    isPost: true,
  },
  {
    file: 'blog/how-to-recycle-computer-monitors-in-central-florida.html',
    canonical: 'https://onlinerecycle.net/blog/how-to-recycle-computer-monitors-in-central-florida.html',
    isPost: true,
  },
  {
    file: 'blog/how-to-recycle-game-consoles-in-central-florida.html',
    canonical: 'https://onlinerecycle.net/blog/how-to-recycle-game-consoles-in-central-florida.html',
    isPost: true,
  },
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

test('blog needs no stage.js: blog/stage.js is removed and blog pages work with static HTML, styles.css, and cookie-consent.js', () => {
  assert.equal(fs.existsSync(path.join(SITE, 'blog/stage.js')), false, 'blog/stage.js must not exist');
  for (const page of BLOG_PAGES) {
    const raw = fs.readFileSync(path.join(SITE, page.file), 'utf8');
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
    const raw = fs.readFileSync(fullPath, 'utf8');

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

    // 5. Appears in sitemap.xml
    const sitemap = fs.readFileSync(path.join(SITE, 'sitemap.xml'), 'utf8');
    assert.ok(sitemap.includes(`<loc>${page.canonical}</loc>`), `${page.canonical} must appear in sitemap.xml`);

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

test('blog/index.html links to all posts', () => {
  const indexPath = path.join(SITE, 'blog/index.html');
  assert.ok(fs.existsSync(indexPath), 'missing blog/index.html');
  const raw = fs.readFileSync(indexPath, 'utf8');
  const mains = findTagBlocks(raw, 'main');
  assert.equal(mains.length, 1, 'blog/index.html must have <main>');
  const hrefs = findOpenTags(mains[0].innerHtml, 'a').map((a) => a.href);
  for (const post of BLOG_PAGES.filter((p) => p.isPost)) {
    const expectedHref = `/${post.file}`;
    assert.ok(hrefs.includes(expectedHref), `blog/index.html must link to ${expectedHref}`);
  }
});
