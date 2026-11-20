// OnlineRecycle blog tests: /blog/ index and three posts.
// Run: node --test tests/onlinerecycle-blog.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';

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
];

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
const DROPPED = new Set(['script', 'style']);
const collect = (node, out = []) => {
  for (const child of kids(node)) {
    if (child.nodeName === '#text') out.push(child.value);
    else if (isEl(child)) {
      if (DROPPED.has(child.tagName)) continue;
      if (child.tagName === 'br') out.push(' ');
      else collect(child, out);
    }
  }
  return out;
};
const textOfNode = (node) => collect(node, []).join(' ').replace(/\s+/g, ' ').trim();
const countWords = (text) => text.split(/\s+/).filter(Boolean).length;

test('home page footer links to /blog/', () => {
  const homeHtml = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
  const homeDoc = parse(homeHtml);
  const footer = all(homeDoc, (n) => n.tagName === 'footer' && attr(n, 'id') === 'footer')[0];
  assert.ok(footer, 'home page must have #footer');
  const footerHrefs = all(footer, (n) => n.tagName === 'a').map((a) => attr(a, 'href'));
  assert.ok(footerHrefs.includes('/blog/'), 'home page footer must link to /blog/');
});

for (const page of BLOG_PAGES) {
  test(`${page.file}: exists, has title, meta description, canonical, one h1, uses site styles.css, and is in sitemap.xml`, () => {
    const fullPath = path.join(SITE, page.file);
    assert.ok(fs.existsSync(fullPath), `missing blog file ${page.file}`);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const doc = parse(raw);

    // 1. Title
    const titles = all(doc, (n) => n.tagName === 'title');
    assert.equal(titles.length, 1, `${page.file} must have exactly one <title>`);
    const titleText = textOfNode(titles[0]);
    assert.ok(titleText.length > 10, `${page.file} <title> must not be empty`);

    // 2. Meta description
    const descriptions = all(doc, (n) => n.tagName === 'meta' && attr(n, 'name') === 'description');
    assert.equal(descriptions.length, 1, `${page.file} must have one meta description`);
    const descContent = (attr(descriptions[0], 'content') ?? '').trim();
    assert.ok(descContent.length > 20, `${page.file} meta description must not be empty`);

    // 3. Canonical
    const canonicals = all(doc, (n) => n.tagName === 'link' && attr(n, 'rel') === 'canonical');
    assert.equal(canonicals.length, 1, `${page.file} must have one canonical link`);
    assert.equal(attr(canonicals[0], 'href'), page.canonical, `${page.file} canonical mismatch`);

    // 4. Exactly one h1
    const h1s = all(doc, (n) => n.tagName === 'h1');
    assert.equal(h1s.length, 1, `${page.file} must have exactly one <h1>`);
    assert.ok(textOfNode(h1s[0]).length > 5, `${page.file} <h1> must not be empty`);

    // 5. Appears in sitemap.xml
    const sitemap = fs.readFileSync(path.join(SITE, 'sitemap.xml'), 'utf8');
    assert.ok(
      sitemap.includes(`<loc>${page.canonical}</loc>`),
      `${page.canonical} must appear in sitemap.xml`,
    );

    // 6. Static HTML using site's own styles.css, no inline <style>
    const stylesheets = all(
      doc,
      (n) => n.tagName === 'link' && attr(n, 'rel') === 'stylesheet' && /^\/styles\.css/.test(attr(n, 'href') ?? ''),
    );
    assert.equal(stylesheets.length, 1, `${page.file} must link to /styles.css`);
    assert.equal(all(doc, (n) => n.tagName === 'style').length, 0, `${page.file} must not contain inline <style>`);
  });

  if (page.isPost) {
    test(`${page.file}: 500 to 800 words, no em dashes, no invented numbers/certificates/prices, ends with one booking link`, () => {
      const fullPath = path.join(SITE, page.file);
      assert.ok(fs.existsSync(fullPath), `missing post file ${page.file}`);
      const raw = fs.readFileSync(fullPath, 'utf8');
      const doc = parse(raw);

      assert.ok(!raw.includes('\u2014') && !/&mdash;|&#8212;|&#x2014;/i.test(raw), `${page.file} must not contain em dashes`);

      const article = all(doc, (n) => n.tagName === 'article' && hasClass(n, 'blog-post-article'))[0];
      assert.ok(article, `${page.file} must have <article class="blog-post-article">`);

      const articleText = textOfNode(article);
      const words = countWords(articleText);
      assert.ok(
        words >= 500 && words <= 800,
        `${page.file} article word count must be 500..800, got ${words}`,
      );

      // No invented certificates, standards, or prices
      assert.doesNotMatch(
        articleText,
        /\$|R2\b|e-Stewards|ISO\s*\d|NIST|DoD|certificate of destruction|certified destruction/i,
        `${page.file} must not invent certificates, standards, or prices`,
      );

      // Ends with one link to the booking section already on the site (/#book)
      const articleLinks = all(article, (n) => n.tagName === 'a');
      const bookingLinks = articleLinks.filter((a) => attr(a, 'href') === '/#book');
      assert.equal(bookingLinks.length, 1, `${page.file} article must contain exactly one link to /#book`);
      assert.equal(
        articleLinks.at(-1),
        bookingLinks[0],
        `${page.file} post must end with the link to the booking section`,
      );
    });
  }
}

test('blog/index.html links to all three posts', () => {
  const indexPath = path.join(SITE, 'blog/index.html');
  assert.ok(fs.existsSync(indexPath), 'missing blog/index.html');
  const doc = parse(fs.readFileSync(indexPath, 'utf8'));
  const main = all(doc, (n) => n.tagName === 'main')[0];
  assert.ok(main, 'blog/index.html must have <main>');
  const hrefs = all(main, (n) => n.tagName === 'a').map((a) => attr(a, 'href'));
  for (const post of BLOG_PAGES.filter((p) => p.isPost)) {
    const expectedHref = `/${post.file}`;
    assert.ok(hrefs.includes(expectedHref), `blog/index.html must link to ${expectedHref}`);
  }
});
