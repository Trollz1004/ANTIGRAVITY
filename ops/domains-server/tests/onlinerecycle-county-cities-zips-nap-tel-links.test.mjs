import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { server as domainsServer } from '../server.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.resolve(HERE, '..', '..', '..', 'domains', 'onlinerecycle.net', 'site');
const ARCHIVE_DIR = path.resolve(
  HERE,
  '..',
  '..',
  '..',
  'domains',
  'onlinerecycle.net',
  'archive',
  'town-posts-2026-11-26',
);
const LOOPBACK_HOST = ['127', '0', '0', '1'].join('.');

const ARCHIVED_TOWN_POSTS = [
  'where-to-recycle-old-computers-in-altamonte-springs-florida.html',
  'where-to-recycle-old-computers-in-clermont-florida.html',
  'where-to-recycle-old-computers-in-lake-county-florida.html',
  'where-to-recycle-old-computers-in-lake-mary-florida.html',
  'where-to-recycle-old-computers-in-leesburg-florida.html',
  'where-to-recycle-old-computers-in-mount-dora-florida.html',
  'where-to-recycle-old-computers-in-oviedo-florida.html',
  'where-to-recycle-old-computers-in-sanford-florida.html',
  'where-to-recycle-old-computers-in-winter-garden-florida.html',
  'where-to-recycle-old-computers-in-winter-park-florida.html',
  'where-to-recycle-old-electronics-in-apopka-florida.html',
];

function readSiteFile(relPath) {
  return fs.readFileSync(path.join(SITE_DIR, relPath), 'utf8');
}

const HTML_ENTITY_MAP = {
  '&amp;': '&',
  '&nbsp;': ' ',
  '&middot;': '·',
  '&copy;': '©',
};

function decodeEntities(text) {
  return text
    .replace(/&(?:amp|nbsp|middot|copy);/g, (entity) => HTML_ENTITY_MAP[entity] ?? entity)
    .replace(/\s+/g, ' ')
    .trim();
}

function visibleText(html) {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  );
}

test('decodeEntities unescapes HTML entities in one pass without double-unescaping &amp;', () => {
  assert.equal(
    visibleText('<p>Lake &amp; Orange &amp;nbsp; &amp;middot; &amp;copy; &nbsp; &middot; &copy;</p>'),
    'Lake & Orange &nbsp; &middot; &copy; · ©',
  );
});

const COUNTY_COVERAGE = [
  {
    county: 'Lake County',
    areaFile: 'areas/lake-county/index.html',
    cardHeading: 'Lake County',
    cities: [
      { city: 'Sorrento', zip: '32776' },
      { city: 'Mount Dora', zip: '32757' },
      { city: 'Eustis', zip: '32726' },
      { city: 'Tavares', zip: '32778' },
      { city: 'Leesburg', zip: '34748' },
      { city: 'Clermont', zip: '34711' },
    ],
  },
  {
    county: 'Orange County',
    areaFile: 'areas/orange-county/index.html',
    cardHeading: 'Orange County',
    cities: [
      { city: 'Orlando', zip: '32801' },
      { city: 'Apopka', zip: '32703' },
      { city: 'Winter Park', zip: '32789' },
      { city: 'Maitland', zip: '32751' },
      { city: 'Ocoee', zip: '34761' },
      { city: 'Winter Garden', zip: '34787' },
    ],
  },
  {
    county: 'Seminole County',
    areaFile: 'areas/seminole-county/index.html',
    cardHeading: 'Seminole County',
    cities: [
      { city: 'Sanford', zip: '32771' },
      { city: 'Altamonte Springs', zip: '32701' },
      { city: 'Longwood', zip: '32750' },
      { city: 'Lake Mary', zip: '32746' },
      { city: 'Casselberry', zip: '32707' },
      { city: 'Oviedo', zip: '32765' },
    ],
  },
];

const SITE_PAGES_WITH_FOOTER = [
  'index.html',
  'service-areas.html',
  'about.html',
  'terms.html',
  'privacy.html',
  'disclaimer.html',
  'areas/sorrento/index.html',
  'areas/lake-county/index.html',
  'areas/orange-county/index.html',
  'areas/seminole-county/index.html',
  'blog/index.html',
  'blog/what-to-do-with-old-office-computers.html',
  'blog/how-to-wipe-a-hard-drive-before-recycling-a-pc.html',
  'blog/what-business-electronics-can-be-recycled.html',
];

test('service-areas.html lists served cities and ZIP codes under Lake, Orange, and Seminole County cards', () => {
  const html = readSiteFile('service-areas.html');
  const chipMatches = [
    ...html.matchAll(/<div class="category-chip">([\s\S]*?)<\/div>\s*(?=<div class="category-chip">|<\/div>)/gi),
  ];
  assert.equal(chipMatches.length, 3, 'service-areas.html must contain 3 county category-chip blocks');

  for (const { county, cities } of COUNTY_COVERAGE) {
    const chipBlock = chipMatches.map((m) => m[1]).find((b) => b.includes(county));
    assert.ok(chipBlock, `service-areas.html missing category-chip for ${county}`);
    const text = visibleText(chipBlock);
    for (const { city, zip } of cities) {
      assert.ok(text.includes(city), `service-areas.html ${county} card must list city ${city}`);
      assert.ok(text.includes(zip), `service-areas.html ${county} card must list ZIP ${zip} for ${city}`);
    }
  }
});

test('areas/{lake-county,orange-county,seminole-county}/index.html list served cities and ZIP codes for each county', () => {
  for (const { county, areaFile, cities } of COUNTY_COVERAGE) {
    const html = readSiteFile(areaFile);
    const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
    assert.ok(mainMatch, `${areaFile} must contain <main>`);
    const mainText = visibleText(mainMatch[1]);
    for (const { city, zip } of cities) {
      assert.ok(mainText.includes(city), `${areaFile} (${county}) must list served city ${city}`);
      assert.ok(mainText.includes(zip), `${areaFile} (${county}) must list served ZIP ${zip} for ${city}`);
    }
  }
});

test('terms.html, privacy.html, and disclaimer.html wrap (321) 396-2008 in clickable tel:+13213962008 link inside .contact-box', () => {
  for (const page of ['terms.html', 'privacy.html', 'disclaimer.html']) {
    const html = readSiteFile(page);
    const contactBoxMatch = html.match(/<div class="contact-box">([\s\S]*?)<\/div>/i);
    assert.ok(contactBoxMatch, `${page} must have a .contact-box block`);
    const contactBoxHtml = contactBoxMatch[1];
    assert.match(
      contactBoxHtml,
      /<a\b[^>]*href=["']tel:\+13213962008["'][^>]*>\s*\(321\) 396-2008\s*<\/a>/i,
      `${page} .contact-box must wrap (321) 396-2008 in <a href="tel:+13213962008">`,
    );
  }
});

test('every OnlineRecycle site page with a footer includes Lake, Orange & Seminole Counties in the footer NAP line', () => {
  for (const page of SITE_PAGES_WITH_FOOTER) {
    const html = readSiteFile(page);
    const footerMatch = html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/i);
    assert.ok(footerMatch, `${page} must have a <footer>`);
    const footerHtml = footerMatch[1];
    const footerText = visibleText(footerHtml);

    assert.ok(
      footerText.includes('Trash Or Treasure Online Recycler LLC'),
      `${page} footer NAP must include business name Trash Or Treasure Online Recycler LLC`,
    );
    assert.ok(footerText.includes('Sorrento'), `${page} footer NAP must include Sorrento`);
    assert.ok(
      footerText.includes('Lake, Orange & Seminole Counties'),
      `${page} footer NAP must include "Lake, Orange & Seminole Counties"`,
    );
    assert.match(
      footerHtml,
      /<a\b[^>]*href=["']tel:\+13213962008["'][^>]*>\s*\(321\) 396-2008\s*<\/a>/i,
      `${page} footer NAP must include clickable tel:+13213962008 link for (321) 396-2008`,
    );
  }
});

test('archived town blog URLs return 301 to /blog/towns-we-pick-up-from.html and drop out of /blog/ and /sitemap.xml', async () => {
  for (const file of ARCHIVED_TOWN_POSTS) {
    assert.equal(
      fs.existsSync(path.join(SITE_DIR, 'blog', file)),
      false,
      `${file} must be moved out of domains/onlinerecycle.net/site/blog`,
    );
    assert.equal(
      fs.existsSync(path.join(ARCHIVE_DIR, file)),
      true,
      `${file} must exist in domains/onlinerecycle.net/archive/town-posts-2026-11-26`,
    );
  }

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

    for (const file of ARCHIVED_TOWN_POSTS) {
      const oldUrl = `/blog/${file}`;
      const res = await fetch(`${baseUrl}${oldUrl}`, { redirect: 'manual' });
      assert.equal(res.status, 301, `expected 301 for ${oldUrl}, got ${res.status}`);
      assert.equal(
        res.headers.get('location'),
        '/blog/towns-we-pick-up-from.html',
        `expected Location /blog/towns-we-pick-up-from.html for ${oldUrl}`,
      );
    }

    const [foldedRes, blogRes, sitemapRes] = await Promise.all([
      fetch(`${baseUrl}/blog/towns-we-pick-up-from.html`),
      fetch(`${baseUrl}/blog/`),
      fetch(`${baseUrl}/sitemap.xml`),
    ]);
    assert.equal(foldedRes.status, 200);
    assert.equal(blogRes.status, 200);
    assert.equal(sitemapRes.status, 200);

    const blogHtml = await blogRes.text();
    const sitemapXml = await sitemapRes.text();
    assert.ok(
      blogHtml.includes('/blog/towns-we-pick-up-from.html'),
      '/blog/ must link to /blog/towns-we-pick-up-from.html',
    );
    assert.ok(
      sitemapXml.includes('<loc>https://onlinerecycle.net/blog/towns-we-pick-up-from.html</loc>'),
      '/sitemap.xml must include towns-we-pick-up-from.html',
    );
    for (const file of ARCHIVED_TOWN_POSTS) {
      assert.equal(blogHtml.includes(file), false, `/blog/ must not include archived town post ${file}`);
      assert.equal(sitemapXml.includes(file), false, `/sitemap.xml must not include archived town post ${file}`);
    }
  } finally {
    await new Promise((resolve) => srv.close(resolve));
  }
});
