// OnlineRecycle area pages tests: one static page at /areas/<slug>/ for each area named on service-areas.html.
// Run: node --test tests/onlinerecycle-area-pages.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(here, '..', 'domains', 'onlinerecycle.net', 'site');

const AREAS = [
  {
    town: 'Sorrento',
    slug: 'sorrento',
    file: 'areas/sorrento/index.html',
    href: '/areas/sorrento/',
    canonical: 'https://onlinerecycle.net/areas/sorrento/',
  },
  {
    town: 'Lake County',
    slug: 'lake-county',
    file: 'areas/lake-county/index.html',
    href: '/areas/lake-county/',
    canonical: 'https://onlinerecycle.net/areas/lake-county/',
  },
  {
    town: 'Orange County',
    slug: 'orange-county',
    file: 'areas/orange-county/index.html',
    href: '/areas/orange-county/',
    canonical: 'https://onlinerecycle.net/areas/orange-county/',
  },
  {
    town: 'Seminole County',
    slug: 'seminole-county',
    file: 'areas/seminole-county/index.html',
    href: '/areas/seminole-county/',
    canonical: 'https://onlinerecycle.net/areas/seminole-county/',
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

const collectText = (node, skip, out) => {
  for (const child of kids(node)) {
    if (child.nodeName === '#text') out.push(child.value);
    else if (isEl(child)) {
      if (DROPPED.has(child.tagName) || skip(child)) continue;
      if (child.tagName === 'br') out.push(' ');
      else collectText(child, skip, out);
    }
  }
  return out;
};

const textOfNode = (node, skip = () => false) => collectText(node, skip, []).join(' ').replace(/\s+/g, ' ').trim();

const countWords = (text) => text.split(/\s+/).filter(Boolean).length;

test('service-areas.html names only the served areas and links to every /areas/<slug>/ page', () => {
  const serviceAreasHtml = fs.readFileSync(path.join(SITE, 'service-areas.html'), 'utf8');
  const doc = parse(serviceAreasHtml);
  const hrefs = all(doc, (n) => n.tagName === 'a' && attr(n, 'href') !== undefined).map((a) => attr(a, 'href'));

  for (const area of AREAS) {
    assert.ok(serviceAreasHtml.includes(area.town), `service-areas.html must name ${area.town}`);
    assert.ok(hrefs.includes(area.href), `service-areas.html must link to ${area.href}`);
  }
});

for (const area of AREAS) {
  test(`${area.file}: has title, description, canonical, one h1 ('Free electronics recycling pickup in ${area.town}'), site styles, and is in sitemap.xml`, () => {
    const fullPath = path.join(SITE, area.file);
    assert.ok(fs.existsSync(fullPath), `missing area page ${area.file}`);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const doc = parse(raw);

    // 1. Title
    const titles = all(doc, (n) => n.tagName === 'title');
    assert.equal(titles.length, 1, `${area.file} must have exactly one <title>`);
    const titleText = textOfNode(titles[0]);
    assert.ok(titleText.includes(area.town), `${area.file} <title> must include ${area.town}`);
    assert.ok(titleText.includes('OnlineRecycle.net'), `${area.file} <title> must include OnlineRecycle.net`);

    // 2. Meta description
    const descriptions = all(doc, (n) => n.tagName === 'meta' && attr(n, 'name') === 'description');
    assert.equal(descriptions.length, 1, `${area.file} must have one meta description`);
    const descContent = (attr(descriptions[0], 'content') ?? '').trim();
    assert.ok(
      descContent.length >= 50 && descContent.length <= 160,
      `${area.file} meta description must be 50..160 chars, got ${descContent.length}`,
    );
    assert.ok(descContent.includes(area.town), `${area.file} meta description must mention ${area.town}`);

    // 3. Canonical
    const canonicals = all(doc, (n) => n.tagName === 'link' && attr(n, 'rel') === 'canonical');
    assert.equal(canonicals.length, 1, `${area.file} must have one canonical link`);
    assert.equal(attr(canonicals[0], 'href'), area.canonical, `${area.file} canonical mismatch`);

    // 4. Exactly one h1 with exact headline
    const h1s = all(doc, (n) => n.tagName === 'h1');
    assert.equal(h1s.length, 1, `${area.file} must have exactly one <h1>`);
    assert.equal(textOfNode(h1s[0]), `Free electronics recycling pickup in ${area.town}`, `${area.file} <h1> mismatch`);

    // 5. Listed in sitemap.xml
    const sitemap = fs.readFileSync(path.join(SITE, 'sitemap.xml'), 'utf8');
    assert.ok(sitemap.includes(`<loc>${area.canonical}</loc>`), `${area.canonical} must appear in sitemap.xml`);

    // 6. Uses site's own styles.css without inline <style>
    const htmlEl = all(doc, (n) => n.tagName === 'html')[0];
    assert.equal(attr(htmlEl, 'class'), 'dark', `${area.file} html element must have class="dark"`);
    const stylesheets = all(
      doc,
      (n) => n.tagName === 'link' && attr(n, 'rel') === 'stylesheet' && /^\/styles\.css/.test(attr(n, 'href') ?? ''),
    );
    assert.equal(stylesheets.length, 1, `${area.file} must link to /styles.css`);
    assert.equal(all(doc, (n) => n.tagName === 'style').length, 0, `${area.file} must not have inline <style>`);
  });

  test(`${area.file}: 200 to 300 words drawn only from existing facts, one button to /?service=pickup#book, and no invented prices, certificates, distances or drive times`, () => {
    const fullPath = path.join(SITE, area.file);
    assert.ok(fs.existsSync(fullPath), `missing area page ${area.file}`);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const doc = parse(raw);

    const mains = all(doc, (n) => n.tagName === 'main');
    assert.equal(mains.length, 1, `${area.file} must have one <main>`);
    const mainEl = mains[0];

    const mainText = textOfNode(mainEl);
    const mainWords = countWords(mainText);
    assert.ok(mainWords >= 200 && mainWords <= 300, `${area.file} main word count must be 200..300, got ${mainWords}`);

    const bodyOnlyText = textOfNode(mainEl, (n) => n.tagName === 'h1' || hasClass(n, 'btn'));
    const bodyOnlyWords = countWords(bodyOnlyText);
    assert.ok(
      bodyOnlyWords >= 200 && bodyOnlyWords <= 300,
      `${area.file} body copy word count (excluding h1 and button) must also be 200..300, got ${bodyOnlyWords}`,
    );

    // Covers the four required topics from index.html, about.html, and service-areas.html:
    // 1. what is accepted
    assert.match(
      mainText,
      /computers|laptops|workstations|servers/i,
      `${area.file} must state accepted computing gear`,
    );
    assert.match(mainText, /consoles|DVDs|Blu-rays|stereo/i, `${area.file} must state accepted consoles/media/stereo`);
    // 2. drop-off in Sorrento
    assert.match(mainText, /Sorrento/i, `${area.file} must mention drop-off in Sorrento`);
    assert.match(mainText, /30-minute/i, `${area.file} must mention 30-minute Sorrento drop-off windows`);
    // 3. route pickup windows
    assert.match(mainText, /2-hour/i, `${area.file} must mention 2-hour pickup windows`);
    // 4. data wiping
    assert.match(mainText, /wipe|erasure|destruction/i, `${area.file} must mention data wiping or destruction`);

    // One button to /?service=pickup#book
    const buttons = all(mainEl, (n) => n.tagName === 'a' && hasClass(n, 'btn'));
    assert.equal(buttons.length, 1, `${area.file} must have exactly one button in <main>`);
    assert.equal(
      attr(buttons[0], 'href'),
      '/?service=pickup#book',
      `${area.file} button must link to /?service=pickup#book`,
    );

    // No invented prices, certificates, distances, drive times, or false Google Calendar claims
    assert.doesNotMatch(
      mainText,
      /\$|R2\b|e-Stewards|ISO\s*\d|NIST|DoD|certificate|certified|\bmiles?\b|\bkm\b|\pkilometers?\b|drive time|minutes away|hour drive|Google Calendar/i,
      `${area.file} must not contain invented prices, certificates, distances, drive times, or false Google Calendar claims`,
    );
  });
}

test('area pages are worded differently from each other', () => {
  const texts = AREAS.map((area) => {
    const fullPath = path.join(SITE, area.file);
    assert.ok(fs.existsSync(fullPath), `missing area page ${area.file}`);
    const doc = parse(fs.readFileSync(fullPath, 'utf8'));
    const mainEl = all(doc, (n) => n.tagName === 'main')[0];
    const paragraphs = all(mainEl, (n) => n.tagName === 'p').map((p) => textOfNode(p));
    assert.ok(paragraphs.length >= 3, `${area.file} must have at least 3 paragraphs`);
    return { area: area.slug, paragraphs, fullText: textOfNode(mainEl) };
  });

  // No two pages may share any identical paragraph
  const seenParagraphs = new Map();
  for (const { area, paragraphs } of texts) {
    for (const p of paragraphs) {
      assert.equal(
        seenParagraphs.has(p),
        false,
        `duplicate paragraph between ${area} and ${seenParagraphs.get(p)}: "${p}"`,
      );
      seenParagraphs.set(p, area);
    }
  }

  // Pairwise 4-gram Jaccard similarity must remain low (< 0.25) so pages are genuinely worded differently
  const fourGrams = (s) => {
    const words = s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    const set = new Set();
    for (let i = 0; i <= words.length - 4; i++) {
      set.add(words.slice(i, i + 4).join(' '));
    }
    return set;
  };

  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = fourGrams(texts[i].fullText);
      const b = fourGrams(texts[j].fullText);
      let intersection = 0;
      for (const g of a) {
        if (b.has(g)) intersection++;
      }
      const union = a.size + b.size - intersection;
      const jaccard = union === 0 ? 0 : intersection / union;
      assert.ok(
        jaccard < 0.25,
        `pages ${texts[i].area} and ${texts[j].area} are too similar (4-gram Jaccard ${jaccard.toFixed(3)})`,
      );
    }
  }
});
