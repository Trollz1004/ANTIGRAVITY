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

// Preserves the exact visual/reading presentation and ordering of the 18 existing posts
// while deriving any new or modified post's card from its own <title>, <meta name="description">, and <link rel="canonical">.
const EXISTING_POST_META = {
  'what-to-do-with-old-office-computers.html': {
    order: 1,
    id: 'post-office-computers',
    ariaLabel: 'What to Do With Old Office Computers',
    topic: 'OFFICE COMPUTER CLEANOUTS',
    baselineTitle: 'What to Do With Old Office Computers',
    baselineDescription:
      'Practical guide on what to do with old office computers in Central Florida, from sorting workstations and storage drives to scheduling Sorrento drop-off or route pickup.',
    indexSummary:
      'Learn how to inventory retired desktop towers, workstations, and laptops, separate storage media, select the right batch tier, and book a Sorrento drop-off slot or Central Florida route pickup across Lake, Orange, and Seminole Counties.',
    cta: 'Read Guide: Old Office Computers',
    lastmod: '2026-11-20',
  },
  'how-to-wipe-a-hard-drive-before-recycling-a-pc.html': {
    order: 2,
    id: 'post-wipe-drive',
    ariaLabel: 'How to Wipe a Hard Drive Before Recycling a PC',
    topic: 'STORAGE MEDIA SECURITY',
    baselineTitle: 'How to Wipe a Hard Drive Before Recycling a PC',
    baselineDescription:
      'Learn how to back up files, factory-reset your computer, and prepare hard drives and SSDs for secure wiping or physical destruction before recycling a PC in Central Florida.',
    indexSummary:
      'Step-by-step preparation before turning in a desktop or laptop: back up files, sign out of accounts, identify NVMe, SATA SSD, and magnetic hard drives, run a factory reset, and use our intake data handling workflow.',
    cta: 'Read Guide: How to Wipe a Hard Drive',
    lastmod: '2026-11-20',
  },
  'what-business-electronics-can-be-recycled.html': {
    order: 3,
    id: 'post-business-electronics',
    ariaLabel: 'What Business Electronics Can Be Recycled',
    topic: 'ACCEPTED COMMERCIAL GEAR',
    baselineTitle: 'What Business Electronics Can Be Recycled',
    baselineDescription:
      'Complete guide to what business electronics can be recycled in Central Florida, including office computers, rack servers, networking gear, monitors, printers, UPS backups, and storage drives.',
    indexSummary:
      'A complete walkthrough of accepted office and commercial equipment, from workstations, 1U to 4U rackmount servers, switches, and firewalls to monitors, printers, UPS battery backups, cables, and storage arrays.',
    cta: 'Read Guide: Business Electronics Recycling',
    lastmod: '2026-11-20',
  },
  'where-to-recycle-old-computers-in-lake-county-florida.html': {
    order: 4,
    id: 'post-lake-county-computers',
    ariaLabel: 'Where to Recycle Old Computers in Lake County, Florida',
    topic: 'LAKE COUNTY COMPUTER RECYCLING',
    baselineTitle: 'Where to Recycle Old Computers in Lake County, Florida',
    baselineDescription:
      'Practical guide on where to recycle old computers in Lake County, Florida. Learn about Sorrento drop-off, free route pickup, accepted gear, and online booking.',
    indexSummary:
      'Explore your options for recycling desktop towers, laptops, workstations, and servers in Lake County, from direct drop-off at our Sorrento hub to free scheduled route pickup across Mount Dora, Eustis, Tavares, Leesburg, and Clermont.',
    cta: 'Read Guide: Lake County Computer Recycling',
    lastmod: '2026-11-23',
  },
  'what-to-do-with-a-broken-laptop-in-orlando.html': {
    order: 5,
    id: 'post-broken-laptop-orlando',
    ariaLabel: 'What to Do With a Broken Laptop in Orlando',
    topic: 'BROKEN LAPTOP EVALUATION',
    baselineTitle: 'What to Do With a Broken Laptop in Orlando: Repair, Resell or Recycle',
    baselineDescription:
      'Honest guide on what to do with a broken laptop in Orlando: compare repair, resell, and recycling paths, learn when recycling is the right call, and schedule route pickup.',
    indexSummary:
      'An honest evaluation of what to do when a laptop screen cracks or the motherboard fails: compare repair costs versus resale value, understand when recycling is the right call, and schedule route pickup in Orlando.',
    cta: 'Read Guide: Broken Laptop in Orlando',
    lastmod: '2026-11-23',
  },
  'where-to-recycle-old-computers-in-altamonte-springs-florida.html': {
    order: 6,
    id: 'post-altamonte-springs-computers',
    ariaLabel: 'Where to Recycle Old Computers in Altamonte Springs, Florida',
    topic: 'ALTAMONTE SPRINGS COMPUTER RECYCLING',
    baselineTitle: 'Where to Recycle Old Computers in Altamonte Springs, Florida',
    baselineDescription:
      'Practical guide on where to recycle old computers in Altamonte Springs, Florida. Learn about Sorrento drop-off, free route pickup, accepted gear, and online booking.',
    indexSummary:
      'Clear options for recycling desktop towers, laptops, and computer components in Altamonte Springs, from direct drop-off in Sorrento to free scheduled route pickup across Seminole County.',
    cta: 'Read Guide: Altamonte Springs Computer Recycling',
    lastmod: '2026-11-24',
  },
  'where-to-recycle-old-computers-in-sanford-florida.html': {
    order: 7,
    id: 'post-sanford-computers',
    ariaLabel: 'Where to Recycle Old Computers in Sanford',
    topic: 'SANFORD COMPUTER RECYCLING',
    baselineTitle: 'Where to Recycle Old Computers in Sanford, Florida',
    baselineDescription:
      'Practical guide on where to recycle old computers in Sanford, Florida. Learn about free pickup in Seminole County, drive wiping or destruction, and easy online scheduling.',
    indexSummary:
      'Learn how Sanford residents and local businesses can clear out old office printers, computer towers, and cables with free Seminole County route pickup and drive wiping or destruction.',
    cta: 'Read Guide: Sanford Computers',
    lastmod: '2026-11-25',
  },
  'where-to-recycle-old-electronics-in-apopka-florida.html': {
    order: 8,
    id: 'post-apopka-electronics',
    ariaLabel: 'Where to Recycle Old Electronics in Apopka',
    topic: 'APOPKA ELECTRONICS RECYCLING',
    baselineTitle: 'Where to Recycle Old Electronics in Apopka, Florida',
    baselineDescription:
      'Practical guide on where to recycle old electronics in Apopka, Florida. Find free pickup across Orange County, drive wiping or destruction, and easy online scheduling.',
    indexSummary:
      'Find out how to safely clear out drawers of old phones, unused tablets, and computer hardware in Apopka with free Orange County route pickup and responsible media handling.',
    cta: 'Read Guide: Apopka Electronics',
    lastmod: '2026-11-25',
  },
  'where-to-recycle-old-computers-in-mount-dora-florida.html': {
    order: 9,
    id: 'post-mount-dora-computers',
    ariaLabel: 'Where to Recycle Old Computers in Mount Dora',
    topic: 'MOUNT DORA COMPUTER RECYCLING',
    baselineTitle: 'Where to Recycle Old Computers in Mount Dora, Florida',
    baselineDescription:
      'Practical guide on where to recycle old computers in Mount Dora, Florida. Learn about free pickup in Lake County, Sorrento drop-off, and storage drive wiping.',
    indexSummary:
      'A clear guide for Mount Dora households with retired school district laptops and family PCs, explaining quick Sorrento drop-off and free Lake County route pickups.',
    cta: 'Read Guide: Mount Dora Computers',
    lastmod: '2026-11-25',
  },
  'how-to-recycle-printers-in-central-florida.html': {
    order: 10,
    id: 'post-printers',
    ariaLabel: 'Where to Recycle Printers in Central Florida',
    topic: 'PRINTER RECYCLING',
    baselineTitle: 'Where to Recycle Printers in Central Florida',
    baselineDescription:
      'Practical guide on how to get rid of old desktop and office printers in Central Florida, with free Sorrento drop-off and route pickup in Lake, Orange, and Seminole Counties.',
    indexSummary:
      'How to prepare desktop and office printers for recycling, isolate internal hard drives or storage media, and book free Sorrento drop-off or scheduled route pickup across Lake, Orange, and Seminole Counties.',
    cta: 'Read Guide: Printer Recycling',
    lastmod: '2026-11-25',
  },
  'how-to-recycle-computer-monitors-in-central-florida.html': {
    order: 11,
    id: 'post-monitors',
    ariaLabel: 'Where to Recycle Computer Monitors in Central Florida',
    topic: 'COMPUTER MONITOR RECYCLING',
    baselineTitle: 'Where to Recycle Computer Monitors in Central Florida',
    baselineDescription:
      'Learn how to recycle old computer monitors, LCD screens, and desktop displays in Central Florida with free drop-off in Sorrento and scheduled pickup in Lake, Orange, and Seminole Counties.',
    indexSummary:
      'Practical steps for staging desktop monitors, LCD displays, and flat screens for local reuse and commodity recovery with free Sorrento drop-off or Central Florida route pickup.',
    cta: 'Read Guide: Computer Monitor Recycling',
    lastmod: '2026-11-25',
  },
  'how-to-recycle-game-consoles-in-central-florida.html': {
    order: 12,
    id: 'post-game-consoles',
    ariaLabel: 'Where to Recycle Game Consoles in Central Florida',
    topic: 'GAME CONSOLE RECYCLING',
    baselineTitle: 'Where to Recycle Game Consoles in Central Florida',
    baselineDescription:
      'Find out how to get rid of old game consoles, handheld systems, controllers, and gaming gear in Central Florida with free Sorrento drop-off and route pickup in Lake, Orange, and Seminole Counties.',
    indexSummary:
      'How to clear out old gaming systems, handhelds, controllers, and digital media, protect stored account credentials, and arrange free Sorrento drop-off or Central Florida route pickup.',
    cta: 'Read Guide: Game Console Recycling',
    lastmod: '2026-11-25',
  },
  'how-to-recycle-phones-and-tablets-in-central-florida.html': {
    order: 13,
    id: 'post-phones-tablets',
    ariaLabel: 'Where to Recycle Phones and Tablets in Central Florida',
    topic: 'PHONES AND TABLETS RECYCLING',
    baselineTitle: 'Where to Recycle Phones and Tablets in Central Florida',
    baselineDescription:
      'Practical guide on how to get rid of old smartphones and tablets in Central Florida, with free Sorrento drop-off and route pickup in Lake, Orange, and Seminole Counties.',
    indexSummary:
      'Learn how to back up files, sign out of accounts, and factory reset retired smartphones and tablets with free Sorrento drop-off and route pickup in Lake, Orange, and Seminole Counties.',
    cta: 'Read Guide: Phones &amp; Tablets',
    lastmod: '2026-11-25',
  },
  'how-to-recycle-servers-and-network-gear-in-central-florida.html': {
    order: 14,
    id: 'post-servers-network',
    ariaLabel: 'Where to Recycle Servers and Network Gear in Central Florida',
    topic: 'SERVERS AND NETWORK GEAR',
    baselineTitle: 'Where to Recycle Servers and Network Gear in Central Florida',
    baselineDescription:
      'Practical guide to recycling retired rackmount servers, network switches, routers, and battery backups in Central Florida with free pickup in Lake, Orange, and Seminole Counties.',
    indexSummary:
      'A practical guide to clearing out rackmount servers, network switches, routers, and battery backups from office closets with drive isolation and free Central Florida pickup.',
    cta: 'Read Guide: Servers &amp; Network Gear',
    lastmod: '2026-11-25',
  },
  'how-to-recycle-home-stereo-receivers-and-speakers-in-central-florida.html': {
    order: 15,
    id: 'post-home-stereo-speakers',
    ariaLabel: 'Where to Recycle Home Stereo Receivers and Speakers in Central Florida',
    topic: 'HOME STEREO AND SPEAKERS',
    baselineTitle: 'Where to Recycle Home Stereo Receivers and Speakers in Central Florida',
    baselineDescription:
      'Practical guide on how to get rid of old stereo receivers, amplifiers, speakers, and soundbars in Central Florida, with Sorrento drop-off and route pickup in Lake, Orange, and Seminole Counties.',
    indexSummary:
      'Find out how to disconnect and recycle old stereo receivers, amplifiers, soundbars, and speaker cabinets with free Sorrento drop-off and route pickup across Lake, Orange, and Seminole Counties.',
    cta: 'Read Guide: Home Stereo &amp; Speakers',
    lastmod: '2026-11-25',
  },
  'where-to-recycle-old-computers-in-clermont-florida.html': {
    order: 16,
    id: 'post-clermont',
    ariaLabel: 'Where to Recycle Old Computers in Clermont, Florida',
    topic: 'CLERMONT COMPUTER RECYCLING',
    baselineTitle: 'Where to Recycle Old Computers in Clermont, Florida',
    baselineDescription:
      'Practical guide on where to recycle old computers in Clermont, Florida. Find free pickup in Lake County, drive wiping or destruction, and easy online scheduling.',
    indexSummary:
      'Practical guide for Clermont residents and local businesses on clearing out desktop towers, laptops, monitors, and cables with free Lake County route pickup or Sorrento drop-off.',
    cta: 'Read Guide: Clermont Computer Recycling',
    lastmod: '2026-11-25',
  },
  'where-to-recycle-old-computers-in-winter-garden-florida.html': {
    order: 17,
    id: 'post-winter-garden',
    ariaLabel: 'Where to Recycle Old Computers in Winter Garden, Florida',
    topic: 'WINTER GARDEN COMPUTER RECYCLING',
    baselineTitle: 'Where to Recycle Old Computers in Winter Garden, Florida',
    baselineDescription:
      'Practical guide on where to recycle old computers in Winter Garden, Florida. Find free pickup across Orange County, drive wiping or destruction, and easy online scheduling.',
    indexSummary:
      'Straightforward guide for Winter Garden households and commercial offices looking to recycle old desktops, laptops, monitors, and cables with free Orange County route pickup or Sorrento drop-off.',
    cta: 'Read Guide: Winter Garden Computer Recycling',
    lastmod: '2026-11-25',
  },
  'where-to-recycle-old-computers-in-lake-mary-florida.html': {
    order: 18,
    id: 'post-lake-mary',
    ariaLabel: 'Where to Recycle Old Computers in Lake Mary, Florida',
    topic: 'LAKE MARY COMPUTER RECYCLING',
    baselineTitle: 'Where to Recycle Old Computers in Lake Mary, Florida',
    baselineDescription:
      'Practical guide on where to recycle old computers in Lake Mary, Florida. Find free pickup across Seminole County, drive wiping or destruction, and easy online scheduling.',
    indexSummary:
      'Straightforward guide for Lake Mary residents and businesses looking to recycle retired workstations, laptops, monitors, and cables with free Seminole County route pickup or Sorrento drop-off.',
    cta: 'Read Guide: Lake Mary Computer Recycling',
    lastmod: '2026-11-25',
  },
};

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

  const files = fs
    .readdirSync(blogDir)
    .filter((f) => f.endsWith('.html') && f !== 'index.html')
    .sort((a, b) => {
      const oa = EXISTING_POST_META[a]?.order ?? Number.MAX_SAFE_INTEGER;
      const ob = EXISTING_POST_META[b]?.order ?? Number.MAX_SAFE_INTEGER;
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

    const existing = EXISTING_POST_META[file];
    const titleUnchanged = existing && heading === existing.baselineTitle;
    const descUnchanged = existing && description === existing.baselineDescription;

    const id = titleUnchanged ? existing.id : `post-${file.replace(/\.html$/i, '')}`;
    const ariaLabel = titleUnchanged ? existing.ariaLabel : heading;
    const topic = titleUnchanged ? existing.topic : deriveTopic(heading, file);
    const summary = descUnchanged ? existing.indexSummary : description;
    const cta = titleUnchanged ? existing.cta : `Read Guide: ${escapeHtml(heading)}`;

    const metaLastmod =
      metas.find((m) => m.name === 'lastmod' || m.property === 'article:modified_time')?.content?.slice(0, 10) ?? '';
    let lastmod = metaLastmod || existing?.lastmod || '';
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
