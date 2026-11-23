import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.resolve(HERE, '..', '..', '..', 'domains', 'onlinerecycle.net', 'site');

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
