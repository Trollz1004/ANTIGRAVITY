#!/usr/bin/env node
// Builds OnlineRecycle.net /blog/ index HTML and /sitemap.xml blog entries
// directly from the post files in domains/onlinerecycle.net/site/blog/*.html.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_SITE_DIR = path.resolve(__dirname, '..', '..', 'domains', 'onlinerecycle.net', 'site');

const HTML_ENTITY_MAP = {
  '&amp;': '&',
  '&nbsp;': ' ',
  '&middot;': '·',
  '&copy;': '©',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

function decodeEntities(str) {
  return String(str || '').replace(/&(?:amp|nbsp|middot|copy|quot|#39|apos);/g, (e) => HTML_ENTITY_MAP[e] ?? e);
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

function stripBrandSuffix(rawTitle) {
  return String(rawTitle || '')
    .replace(/\s*\|\s*OnlineRecycle\.net.*$/i, '')
    .trim();
}

function parseExistingIndexSections(siteDir) {
  const indexPath = path.join(siteDir, 'blog', 'index.html');
  const map = new Map();
  if (!fs.existsSync(indexPath)) return map;

  const raw = fs.readFileSync(indexPath, 'utf8');
  const overviewEndMarker = '      </section>\n';
  const overviewStart = raw.indexOf('<section class="stage-stop legal-stop" id="blog-overview"');
  const overviewEnd =
    overviewStart >= 0 ? raw.indexOf(overviewEndMarker, overviewStart) + overviewEndMarker.length : -1;
  const ctaStart = raw.indexOf('      <section class="stage-stop legal-stop" id="cta"');
  if (overviewStart < 0 || overviewEnd < 0 || ctaStart < 0 || ctaStart < overviewEnd) return map;

  const body = raw.slice(overviewEnd, ctaStart);
  const sectionRe = /      <section\b([\s\S]*?)>([\s\S]*?)      <\/section>/g;
  let m;
  let order = 1;
  while ((m = sectionRe.exec(body)) !== null) {
    const rawSection = m[0];
    const sectionAttrs = parseAttrs(m[1] || '');
    const inner = m[2] || '';
    const h2LinkMatch = inner.match(
      /<h2\b[^>]*>\s*<a\b[^>]*href="\/blog\/([^"#?]+)"[^>]*>([\s\S]*?)<\/a\s*>\s*<\/h2\s*>/i,
    );
    if (!h2LinkMatch) continue;
    const file = h2LinkMatch[1].trim();
    const heading = decodeEntities(h2LinkMatch[2].replace(/\s+/g, ' ').trim());
    const topicMatch = inner.match(/<div class="section-sub">\s*\d+\s*\/\s*([\s\S]*?)<\/div\s*>/i);
    const topic = decodeEntities((topicMatch?.[1] ?? '').replace(/\s+/g, ' ').trim());
    const pMatch = inner.match(/<p>([\s\S]*?)<\/p\s*>/i);
    const summary = decodeEntities((pMatch?.[1] ?? '').replace(/\s+/g, ' ').trim());
    const ctaMatch = inner.match(/<a\b[^>]*class="btn btn-primary"[^>]*>([\s\S]*?)<\/a\s*>/i);
    const cta = (ctaMatch?.[1] ?? '').replace(/\s+/g, ' ').trim();

    map.set(file, {
      order: order++,
      id: sectionAttrs.id || `post-${file.replace(/\.html$/i, '')}`,
      ariaLabel: decodeEntities(sectionAttrs['aria-label'] || heading),
      topic,
      baselineTitle: heading,
      indexSummary: summary,
      cta,
      rawSection,
    });
  }
  return map;
}

function parseExistingSitemapLastmods(siteDir) {
  const sitemapPath = path.join(siteDir, 'sitemap.xml');
  const map = new Map();
  if (!fs.existsSync(sitemapPath)) return map;

  const raw = fs.readFileSync(sitemapPath, 'utf8');
  const urlRe = /<url>([\s\S]*?)<\/url>/gi;
  let m;
  while ((m = urlRe.exec(raw)) !== null) {
    const block = m[1];
    const locs = [...block.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((x) => x[1].trim());
    if (locs.length !== 1) continue;
    const lastmodMatch = block.match(/<lastmod>([\s\S]*?)<\/lastmod>/i);
    if (lastmodMatch) {
      map.set(locs[0], lastmodMatch[1].trim());
    }
  }
  return map;
}

function deriveTopic(heading, file) {
  const clean = String(heading || '')
    .replace(/^(?:where|how|what)\s+to\s+(?:recycle|do\s+with)\s+(?:old\s+|a\s+)?/i, '')
    .replace(/,\s*florida$/i, '')
    .replace(/\s+in\s+central\s+florida$/i, ' RECYCLING')
    .trim();
  if (clean) return clean.toUpperCase();
  return file
    .replace(/\.html$/i, '')
    .replace(/-/g, ' ')
    .toUpperCase();
}

export function discoverOnlineRecycleBlogPosts(siteDir = DEFAULT_SITE_DIR) {
  const blogDir = path.join(siteDir, 'blog');
  if (!fs.existsSync(blogDir)) return [];

  const existingSections = parseExistingIndexSections(siteDir);
  const existingLastmods = parseExistingSitemapLastmods(siteDir);

  const files = fs
    .readdirSync(blogDir)
    .filter((f) => f.endsWith('.html') && f !== 'index.html')
    .sort((a, b) => {
      const oa = existingSections.get(a)?.order ?? Number.MAX_SAFE_INTEGER;
      const ob = existingSections.get(b)?.order ?? Number.MAX_SAFE_INTEGER;
      if (oa !== ob) return oa - ob;
      return a.localeCompare(b);
    });

  return files.map((file) => {
    const fullPath = path.join(blogDir, file);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const rawTitleMatch = raw.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    const rawH1Match = raw.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    const titleText = decodeEntities((rawTitleMatch?.[1] ?? rawH1Match?.[1] ?? '').replace(/\s+/g, ' ').trim());
    const heading = stripBrandSuffix(titleText) || decodeEntities((rawH1Match?.[1] ?? '').replace(/\s+/g, ' ').trim());

    const metas = findOpenTags(raw, 'meta');
    const descAttr = metas.find((m) => m.name === 'description')?.content ?? '';
    const description = decodeEntities(descAttr.replace(/\s+/g, ' ').trim());

    const links = findOpenTags(raw, 'link');
    const canonical =
      (links.find((l) => l.rel === 'canonical')?.href ?? '').trim() || `https://onlinerecycle.net/blog/${file}`;

    let href = `/blog/${file}`;
    try {
      href = new URL(canonical).pathname;
    } catch {
      // keep default /blog/<file>
    }

    const existing = existingSections.get(file);
    const titleUnchanged = Boolean(existing && heading === existing.baselineTitle);

    const id = titleUnchanged ? existing.id : `post-${file.replace(/\.html$/i, '')}`;
    const ariaLabel = titleUnchanged ? existing.ariaLabel : heading;
    const topic = titleUnchanged ? existing.topic : deriveTopic(heading, file);
    const summary = titleUnchanged && existing.indexSummary ? existing.indexSummary : description;
    const cta = titleUnchanged && existing.cta ? existing.cta : `Read Guide: ${escapeHtml(heading)}`;
    const rawSection = titleUnchanged ? existing.rawSection : null;

    const metaLastmod =
      metas.find((m) => m.name === 'lastmod' || m.property === 'article:modified_time')?.content?.slice(0, 10) ?? '';
    let lastmod = metaLastmod || existingLastmods.get(canonical) || '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) {
      try {
        lastmod = fs.statSync(fullPath).mtime.toISOString().slice(0, 10);
      } catch {
        lastmod = '2026-11-25';
      }
    }

    return {
      file,
      title: titleText,
      heading,
      description,
      summary,
      canonical,
      href,
      id,
      ariaLabel,
      topic,
      cta,
      lastmod,
      rawSection,
    };
  });
}

function wrapParagraph(text, indent = '            ', maxLineLen = 120) {
  const words = String(text || '')
    .split(/\s+/)
    .filter(Boolean);
  const lines = [];
  let current = indent;
  for (const word of words) {
    if (current === indent) {
      current += word;
    } else if (current.length + 1 + word.length <= maxLineLen) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = `${indent}${word}`;
    }
  }
  if (current !== indent) lines.push(current);
  return lines.join('\n');
}

function renderPostSection(post, index) {
  const num = String(index + 1).padStart(2, '0');
  if (post.rawSection) {
    return post.rawSection.replace(/<div class="section-sub">\d+\s*\/\s*/, `<div class="section-sub">${num} / `);
  }
  const h2Single = `          <h2><a href="${post.href}">${escapeHtml(post.heading)}</a></h2>`;
  const aInsideH2Single = `            <a href="${post.href}">${escapeHtml(post.heading)}</a>`;
  const h2Open =
    h2Single.length <= 120
      ? h2Single
      : aInsideH2Single.length <= 120
        ? `          <h2>\n${aInsideH2Single}\n          </h2>`
        : `          <h2>\n            <a href="${post.href}"\n              >${escapeHtml(post.heading)}</a\n            >\n          </h2>`;
  const ctaOpenSingle = `            <a class="btn btn-primary" href="${post.href}"`;
  const ctaLink =
    ctaOpenSingle.length > 120
      ? `            <a\n              class="btn btn-primary"\n              href="${post.href}"\n              >${post.cta}</a\n            >`
      : `            <a class="btn btn-primary" href="${post.href}"\n              >${post.cta}</a\n            >`;

  return [
    '      <section',
    '        class="stage-stop legal-stop"',
    `        id="${escapeHtml(post.id)}"`,
    `        aria-label="${escapeHtml(post.ariaLabel)}"`,
    '      >',
    '        <div class="legal-panel">',
    `          <div class="section-sub">${num} / ${escapeHtml(post.topic)}</div>`,
    h2Open,
    '          <p>',
    wrapParagraph(escapeHtml(post.summary)),
    '          </p>',
    '          <div class="cta-row">',
    ctaLink,
    '          </div>',
    '        </div>',
    '      </section>',
  ].join('\n');
}

export function buildOnlineRecycleBlogIndex(siteDir = DEFAULT_SITE_DIR) {
  const posts = discoverOnlineRecycleBlogPosts(siteDir);
  const indexPath = path.join(siteDir, 'blog', 'index.html');
  const template = fs.readFileSync(indexPath, 'utf8');

  const overviewEndMarker = '      </section>\n';
  const overviewStart = template.indexOf('<section class="stage-stop legal-stop" id="blog-overview"');
  const overviewEnd =
    overviewStart >= 0 ? template.indexOf(overviewEndMarker, overviewStart) + overviewEndMarker.length : -1;
  const ctaStart = template.indexOf('      <section class="stage-stop legal-stop" id="cta"');

  if (overviewStart < 0 || overviewEnd < 0 || ctaStart < 0 || ctaStart < overviewEnd) {
    return template;
  }

  const beforePosts = template.slice(0, overviewEnd);
  const ctaNum = String(posts.length + 1).padStart(2, '0');
  const fromCta = template
    .slice(ctaStart)
    .replace(
      /<div class="section-sub">\d+\s*\/\s*SCHEDULE INTAKE<\/div>/,
      `<div class="section-sub">${ctaNum} / SCHEDULE INTAKE</div>`,
    );

  const postSections = posts.map((post, i) => renderPostSection(post, i)).join('\n\n');
  return `${beforePosts}\n${postSections}\n\n${fromCta}`;
}

const SITEMAP_PRE_BLOG_URLS = [
  { loc: 'https://onlinerecycle.net/', lastmod: '2026-11-18', changefreq: 'weekly', priority: '1.0' },
  {
    loc: 'https://onlinerecycle.net/service-areas.html',
    lastmod: '2026-11-21',
    changefreq: 'monthly',
    priority: '0.8',
  },
  { loc: 'https://onlinerecycle.net/areas/sorrento/', lastmod: '2026-11-21', changefreq: 'monthly', priority: '0.8' },
  {
    loc: 'https://onlinerecycle.net/areas/lake-county/',
    lastmod: '2026-11-21',
    changefreq: 'monthly',
    priority: '0.8',
  },
  {
    loc: 'https://onlinerecycle.net/areas/orange-county/',
    lastmod: '2026-11-21',
    changefreq: 'monthly',
    priority: '0.8',
  },
  {
    loc: 'https://onlinerecycle.net/areas/seminole-county/',
    lastmod: '2026-11-21',
    changefreq: 'monthly',
    priority: '0.8',
  },
];

const SITEMAP_POST_BLOG_URLS = [
  { loc: 'https://onlinerecycle.net/about.html', lastmod: '2026-11-18', changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://onlinerecycle.net/terms.html', lastmod: '2026-11-18', changefreq: 'yearly', priority: '0.4' },
  { loc: 'https://onlinerecycle.net/privacy.html', lastmod: '2026-11-18', changefreq: 'yearly', priority: '0.4' },
  { loc: 'https://onlinerecycle.net/disclaimer.html', lastmod: '2026-03-23', changefreq: 'yearly', priority: '0.4' },
];

function renderUrlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

export function buildOnlineRecycleSitemap(siteDir = DEFAULT_SITE_DIR) {
  const posts = discoverOnlineRecycleBlogPosts(siteDir);
  const latestBlogDate = posts.reduce((max, p) => (p.lastmod > max ? p.lastmod : max), '2026-11-25') || '2026-11-25';

  const entries = [
    ...SITEMAP_PRE_BLOG_URLS,
    {
      loc: 'https://onlinerecycle.net/blog/',
      lastmod: latestBlogDate,
      changefreq: 'weekly',
      priority: '0.8',
    },
    ...posts.map((post) => ({
      loc: post.canonical,
      lastmod: post.lastmod,
      changefreq: 'monthly',
      priority: '0.7',
    })),
    ...SITEMAP_POST_BLOG_URLS,
  ];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(renderUrlEntry),
    '</urlset>',
    '',
  ].join('\n');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  const siteDir = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SITE_DIR;
  fs.writeFileSync(path.join(siteDir, 'blog', 'index.html'), buildOnlineRecycleBlogIndex(siteDir), 'utf8');
  fs.writeFileSync(path.join(siteDir, 'sitemap.xml'), buildOnlineRecycleSitemap(siteDir), 'utf8');
}
