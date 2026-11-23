import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');
const SITE_DIR = path.join(REPO_ROOT, 'domains', 'onlinerecycle.net', 'site');
const INDEX_HTML_PATH = path.join(SITE_DIR, 'index.html');
const SERVICE_AREAS_HTML_PATH = path.join(SITE_DIR, 'service-areas.html');

function parseOpenTagAttrs(openTag) {
  const attrs = {};
  const inner = openTag.replace(/^<[a-zA-Z0-9:-]+/, '').replace(/\/?>$/, '');
  const re = /([a-zA-Z0-9_:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+)))?/g;
  let match;
  while ((match = re.exec(inner)) !== null) {
    attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return attrs;
}

function findElementOpenTagById(html, id) {
  const re = /<([a-zA-Z0-9:-]+)\b[^>]*>/g;
  let match;
  while ((match = re.exec(html)) !== null) {
    const attrs = parseOpenTagAttrs(match[0]);
    if (attrs.id === id) {
      return { tagName: match[1].toLowerCase(), openTag: match[0], attrs, index: match.index };
    }
  }
  return null;
}

function extractArticleInnerHtmlById(html, id) {
  const found = findElementOpenTagById(html, id);
  assert.ok(found, `expected element #${id} to exist`);
  const closeIdx = html.indexOf(`</${found.tagName}>`, found.index);
  assert.ok(closeIdx !== -1, `expected closing </${found.tagName}> for #${id}`);
  return html.slice(found.index + found.openTag.length, closeIdx);
}

function extractJsonLdBlocks(html) {
  const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks = [];
  let match;
  while ((match = re.exec(html)) !== null) {
    blocks.push(JSON.parse(match[1].trim()));
  }
  return blocks;
}

test('domains/onlinerecycle.net/site/index.html has itemscope itemtype="https://schema.org/FAQPage" on #card-faq enclosing Question/Answer microdata', () => {
  const html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
  const faqCard = findElementOpenTagById(html, 'card-faq');
  assert.ok(faqCard, 'index.html must contain #card-faq');
  assert.ok(
    Object.prototype.hasOwnProperty.call(faqCard.attrs, 'itemscope'),
    '#card-faq must have itemscope attribute',
  );
  assert.equal(
    faqCard.attrs.itemtype,
    'https://schema.org/FAQPage',
    '#card-faq must have itemtype="https://schema.org/FAQPage"',
  );

  const faqInner = extractArticleInnerHtmlById(html, 'card-faq');
  const questionMatches =
    faqInner.match(/itemprop=["']mainEntity["'][^>]*itemtype=["']https:\/\/schema\.org\/Question["']/g) || [];
  const answerMatches =
    faqInner.match(/itemprop=["']acceptedAnswer["'][^>]*itemtype=["']https:\/\/schema\.org\/Answer["']/g) || [];
  assert.equal(questionMatches.length, 5, '#card-faq must enclose all 5 Question microdata items');
  assert.equal(answerMatches.length, 5, '#card-faq must enclose all 5 Answer microdata items');
});

test('domains/onlinerecycle.net/site/index.html RecyclingCenter JSON-LD has canonical url https://onlinerecycle.net/, GeoCoordinates (28.7953, -81.5645), and truthful equipment without TVs', () => {
  const html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
  const blocks = extractJsonLdBlocks(html);
  assert.ok(blocks.length >= 1, 'index.html must contain a JSON-LD script block');

  const rc = blocks.find((b) => b && b['@type'] === 'RecyclingCenter');
  assert.ok(rc, 'index.html JSON-LD must define a RecyclingCenter node');
  assert.equal(rc.url, 'https://onlinerecycle.net/');
  assert.equal(rc.address?.['@type'], 'PostalAddress');
  assert.equal(rc.address?.postalCode, '32776');

  assert.ok(rc.geo, 'index.html RecyclingCenter must define geo');
  assert.equal(rc.geo['@type'], 'GeoCoordinates');
  assert.equal(rc.geo.latitude, 28.7953);
  assert.equal(rc.geo.longitude, -81.5645);

  const rawJsonLd = JSON.stringify(rc);
  assert.doesNotMatch(rawJsonLd, /\bTVs?\b|televisions?/i, 'RecyclingCenter JSON-LD must not advertise TVs');

  const offers = rc.hasOfferCatalog?.itemListElement || [];
  const dropOffOffer = offers.find((o) => o?.itemOffered?.name === 'Free Electronics Drop-Off');
  assert.ok(dropOffOffer, 'RecyclingCenter JSON-LD must include Free Electronics Drop-Off offer');
  const dropOffDesc = String(dropOffOffer.itemOffered?.description || '');

  for (const requiredTerm of [
    'computers',
    'servers',
    'game consoles',
    'DVDs/Blu-rays',
    'stereo equipment',
    'SSD/HDD data destruction',
  ]) {
    assert.ok(
      dropOffDesc.includes(requiredTerm),
      `expected Free Electronics Drop-Off description to include "${requiredTerm}", got: "${dropOffDesc}"`,
    );
  }
});

test('domains/onlinerecycle.net/site/service-areas.html RecyclingCenter JSON-LD has canonical url https://onlinerecycle.net/, postalCode 32776, and GeoCoordinates (28.7953, -81.5645)', () => {
  const html = fs.readFileSync(SERVICE_AREAS_HTML_PATH, 'utf8');
  const blocks = extractJsonLdBlocks(html);
  assert.ok(blocks.length >= 1, 'service-areas.html must contain a JSON-LD script block');

  const graph = Array.isArray(blocks[0]?.['@graph']) ? blocks[0]['@graph'] : blocks;
  const rc = graph.find((node) => node && node['@type'] === 'RecyclingCenter');
  assert.ok(rc, 'service-areas.html JSON-LD must include a RecyclingCenter node');

  assert.equal(rc.url, 'https://onlinerecycle.net/');
  assert.equal(rc['@id'], 'https://onlinerecycle.net/#recycling-center');
  assert.equal(rc.address?.['@type'], 'PostalAddress');
  assert.equal(rc.address?.addressLocality, 'Sorrento');
  assert.equal(rc.address?.addressRegion, 'FL');
  assert.equal(rc.address?.postalCode, '32776');
  assert.equal(rc.address?.addressCountry, 'US');

  assert.ok(rc.geo, 'service-areas.html RecyclingCenter must include GeoCoordinates');
  assert.equal(rc.geo['@type'], 'GeoCoordinates');
  assert.equal(rc.geo.latitude, 28.7953);
  assert.equal(rc.geo.longitude, -81.5645);

  const faqCard = findElementOpenTagById(html, 'card-faq');
  assert.ok(faqCard, 'service-areas.html must contain #card-faq');
  assert.equal(
    faqCard.attrs.itemtype,
    undefined,
    'service-areas.html #card-faq must not duplicate FAQPage microdata alongside JSON-LD FAQPage',
  );
});
