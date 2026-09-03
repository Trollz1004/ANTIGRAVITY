#!/usr/bin/env node
// scripts/seo/post.mjs — Fable-tier SEO syndication poster.
// Zero-dependency Node 24 ESM CLI. See docs/seo/FABLE-TIER-SEO.md for the design
// and scripts/seo/README.md for usage/exit codes.
//
// node scripts/seo/post.mjs --brand dre|ais|ant --platform devto|hashnode|wordpress|tumblr|blogger|ghost --file <md> [--dry-run] [--all-new]

import { readFileSync, existsSync, appendFileSync, readdirSync } from 'node:fs';
import { createHmac, randomBytes } from 'node:crypto';
import path from 'node:path';

const ROOT = 'C:\\ANTIGRAVITY';
const ENV_FILE = path.join(ROOT, '.env');
const HOOK_FILE = path.join(ROOT, '.githooks', 'pre-commit-canonical');
const LEDGER_FILE = path.join(ROOT, 'docs', 'seo', 'published.jsonl');

const EXIT = {
  OK: 0,
  USAGE: 1,
  FILE: 2,
  AUTH_MISSING: 3,
  BANNED: 4,
  NO_CANONICAL: 5,
  DUPLICATE: 6,
  API_ERROR: 7,
};

function die(code, msg) {
  console.error(msg);
  process.exit(code);
}

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------
const BRANDS = {
  dre: {
    key: 'DRE',
    name: 'DREAM Online',
    baseUrl: 'https://dream-online.net',
    draftsDir: "D:\\CLAUDE's-N-Joshua's-Dream-Online-MMORPG\\docs\\blog",
  },
  ais: {
    key: 'AIS',
    name: 'Ai-Solutions.Store',
    baseUrl: 'https://ai-solutions.store',
    draftsDir: 'C:\\Ai-Solutions.store\\blog',
  },
  ant: {
    key: 'ANT',
    name: 'YouAndINotAI',
    baseUrl: 'https://youandinotai.com',
    draftsDir: 'C:\\ANTIGRAVITY\\content\\blog\\youandinotai',
  },
};

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const out = { dryRun: false, allNew: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--brand') out.brand = argv[++i];
    else if (a === '--platform') out.platform = argv[++i];
    else if (a === '--file') out.file = argv[++i];
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--all-new') out.allNew = true;
    else die(EXIT.USAGE, `Unknown argument: ${a}`);
  }
  if (!out.brand || !BRANDS[out.brand]) die(EXIT.USAGE, `--brand must be one of: ${Object.keys(BRANDS).join('|')}`);
  if (!out.platform || !PLATFORM_NAMES.includes(out.platform)) die(EXIT.USAGE, `--platform must be one of: ${PLATFORM_NAMES.join('|')}`);
  if (!out.allNew && !out.file) die(EXIT.USAGE, 'Either --file <md> or --all-new is required.');
  return out;
}

// ---------------------------------------------------------------------------
// Frontmatter parsing (subset of YAML sufficient for these draft files)
// ---------------------------------------------------------------------------
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) die(EXIT.FILE, 'No frontmatter block found (expected --- ... ---).');
  const [, fmBlock, body] = m;
  const lines = fmBlock.split(/\r?\n/);
  const fm = {};
  let currentListKey = null;
  for (const line of lines) {
    const listItem = line.match(/^\s*-\s+(.*)$/);
    if (listItem && currentListKey) {
      fm[currentListKey].push(stripQuotes(listItem[1].trim()));
      continue;
    }
    currentListKey = null;
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, rest] = kv;
    if (rest === '') {
      fm[key] = [];
      currentListKey = key;
    } else if (rest.startsWith('[')) {
      try {
        fm[key] = JSON.parse(rest.replace(/'/g, '"'));
      } catch {
        fm[key] = rest
          .replace(/^\[|\]$/g, '')
          .split(',')
          .map((s) => stripQuotes(s.trim()))
          .filter(Boolean);
      }
    } else {
      fm[key] = stripQuotes(rest.trim());
    }
  }
  return { frontmatter: fm, body: body.trim() };
}

function stripQuotes(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

// ---------------------------------------------------------------------------
// Tiny Markdown -> HTML converter (no deps): headings, paragraphs, lists,
// links, bold/italic, inline code, fenced code blocks.
// ---------------------------------------------------------------------------
function inline(md) {
  return md
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;
  let paraBuf = [];
  let listBuf = [];
  let listType = null;

  function flushPara() {
    if (paraBuf.length) {
      out.push(`<p>${inline(paraBuf.join(' '))}</p>`);
      paraBuf = [];
    }
  }
  function flushList() {
    if (listBuf.length) {
      const tag = listType === 'ol' ? 'ol' : 'ul';
      out.push(`<${tag}>` + listBuf.map((li) => `<li>${inline(li)}</li>`).join('') + `</${tag}>`);
      listBuf = [];
      listType = null;
    }
  }

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      flushPara();
      flushList();
      const codeLines = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      out.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      i++;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushPara();
      flushList();
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ul || ol) {
      flushPara();
      const type = ol ? 'ol' : 'ul';
      if (listType && listType !== type) flushList();
      listType = type;
      listBuf.push((ul || ol)[1].trim());
      i++;
      continue;
    }
    flushList();

    if (line.trim() === '') {
      flushPara();
      i++;
      continue;
    }

    paraBuf.push(line.trim());
    i++;
  }
  flushPara();
  flushList();
  return out.join('\n');
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---------------------------------------------------------------------------
// Banned word / split enforcement — read the live list at runtime.
// ---------------------------------------------------------------------------
function loadBannedPattern() {
  if (!existsSync(HOOK_FILE)) die(EXIT.FILE, `Cannot find canonical-guard hook: ${HOOK_FILE}`);
  const hook = readFileSync(HOOK_FILE, 'utf8');
  const words = hook.match(/^BANNED_WORDS='(.*)'$/m);
  const splits = hook.match(/^BANNED_SPLITS='(.*)'$/m);
  if (!words || !splits) die(EXIT.FILE, 'Could not parse BANNED_WORDS/BANNED_SPLITS from pre-commit-canonical.');
  const pattern = `${words[1]}|${splits[1]}`;
  return new RegExp(pattern, 'gi');
}

function checkBanned(text) {
  const re = loadBannedPattern();
  const hits = text.match(re);
  if (hits && hits.length) {
    die(EXIT.BANNED, `BANNED CONTENT: found "${[...new Set(hits)].join(', ')}" — remove before posting.`);
  }
}

// ---------------------------------------------------------------------------
// Ledger
// ---------------------------------------------------------------------------
function readLedger() {
  if (!existsSync(LEDGER_FILE)) return [];
  return readFileSync(LEDGER_FILE, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function isDuplicate(ledger, brand, platform, slug) {
  return ledger.some((r) => r.brand === brand && r.platform === platform && r.slug === slug);
}

function appendLedger(record) {
  appendFileSync(LEDGER_FILE, JSON.stringify(record) + '\n', 'utf8');
}

// ---------------------------------------------------------------------------
// Env loading — process.env first, fallback to parsing .env at runtime.
// Values are NEVER logged.
// ---------------------------------------------------------------------------
function loadEnv() {
  const map = { ...process.env };
  if (existsSync(ENV_FILE)) {
    const raw = readFileSync(ENV_FILE, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      const key = t.slice(0, eq).trim();
      const val = t.slice(eq + 1).trim();
      if (!(key in map) || map[key] === undefined || map[key] === '') {
        map[key] = val;
      }
    }
  }
  return map;
}

function requireEnv(names, envMap) {
  const values = {};
  for (const name of names) {
    const v = envMap[name];
    if (!v) die(EXIT.AUTH_MISSING, `AUTH MISSING ${name}`);
    values[name] = v;
  }
  return values;
}

// ---------------------------------------------------------------------------
// UTM helper
// ---------------------------------------------------------------------------
function utmUrl(canonical, platform, brand, slug) {
  const u = new URL(canonical);
  u.searchParams.set('utm_source', platform);
  u.searchParams.set('utm_medium', 'syndication');
  u.searchParams.set('utm_campaign', 'seo15');
  u.searchParams.set('utm_content', `${brand}-${slug}`);
  return u.toString();
}

// ---------------------------------------------------------------------------
// OAuth 1.0a (Tumblr) — HMAC-SHA1 via node:crypto, no deps.
// ---------------------------------------------------------------------------
function pctEncode(s) {
  return encodeURIComponent(s).replace(/[!*'()]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function oauth1Header(method, url, bodyParams, consumerKey, consumerSecret, token, tokenSecret) {
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: token,
    oauth_version: '1.0',
  };
  const allParams = { ...oauthParams, ...bodyParams };
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${pctEncode(k)}=${pctEncode(String(allParams[k]))}`)
    .join('&');
  const baseString = [method.toUpperCase(), pctEncode(url), pctEncode(paramString)].join('&');
  const signingKey = `${pctEncode(consumerSecret)}&${pctEncode(tokenSecret)}`;
  const signature = createHmac('sha1', signingKey).update(baseString).digest('base64');
  const headerParams = { ...oauthParams, oauth_signature: signature };
  const header =
    'OAuth ' +
    Object.keys(headerParams)
      .sort()
      .map((k) => `${pctEncode(k)}="${pctEncode(headerParams[k])}"`)
      .join(', ');
  return header;
}

// ---------------------------------------------------------------------------
// Ghost Admin API JWT — HS256 via node:crypto, no deps.
// ---------------------------------------------------------------------------
function ghostJwt(adminApiKey) {
  const [id, secret] = adminApiKey.split(':');
  const header = { alg: 'HS256', typ: 'JWT', kid: id };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iat: now, exp: now + 300, aud: '/admin/' };
  const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signingInput = `${b64url(header)}.${b64url(payload)}`;
  const sig = createHmac('sha256', Buffer.from(secret, 'hex')).update(signingInput).digest('base64url');
  return `${signingInput}.${sig}`;
}

// ---------------------------------------------------------------------------
// Platform adapters
// ---------------------------------------------------------------------------
const PLATFORM_NAMES = ['devto', 'hashnode', 'wordpress', 'tumblr', 'blogger', 'ghost'];

function tagsFromKeywords(keywords, max) {
  const out = [];
  for (const k of keywords || []) {
    const t = String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (t && !out.includes(t)) out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

const PLATFORMS = {
  devto: {
    envNames: (B) => [`SEO_${B}_DEVTO_TOKEN`],
    build(brand, fm, body, html, env) {
      return {
        method: 'POST',
        url: 'https://dev.to/api/articles',
        headers: { 'content-type': 'application/json' },
        body: {
          article: {
            title: fm.title,
            body_markdown: body,
            published: true,
            tags: tagsFromKeywords(fm.keywords, 4),
            canonical_url: fm.canonical,
          },
        },
      };
    },
    applyAuth(req, env, B) {
      req.headers['api-key'] = env[`SEO_${B}_DEVTO_TOKEN`];
    },
    extractUrl(resp) {
      return resp.url;
    },
  },

  hashnode: {
    envNames: (B) => [`SEO_${B}_HASHNODE_TOKEN`, `SEO_${B}_HASHNODE_PUBLICATION_ID`],
    build(brand, fm, body, html, env) {
      const mutation = `mutation PublishPost($input: PublishPostInput!) {
  publishPost(input: $input) { post { id url } }
}`;
      return {
        method: 'POST',
        url: 'https://gql.hashnode.com/',
        headers: { 'content-type': 'application/json' },
        body: {
          query: mutation,
          variables: {
            input: {
              title: fm.title,
              contentMarkdown: body,
              originalArticleURL: fm.canonical,
              tags: [],
            },
          },
        },
      };
    },
    applyAuth(req, env, B) {
      req.headers['Authorization'] = env[`SEO_${B}_HASHNODE_TOKEN`];
      req.body.variables.input.publicationId = env[`SEO_${B}_HASHNODE_PUBLICATION_ID`];
    },
    extractUrl(resp) {
      return resp?.data?.publishPost?.post?.url;
    },
  },

  wordpress: {
    envNames: (B) => [`SEO_${B}_WORDPRESS_TOKEN`, `SEO_${B}_WORDPRESS_SITE`],
    build(brand, fm, body, html, env) {
      // WordPress.com's public REST API has no native canonical_url field on
      // Simple sites. Honest best-effort: append a visible attribution link.
      // True cross-domain rel=canonical requires Yoast/Jetpack SEO tools or a
      // Business-plan plugin — UNVERIFIED without one installed on the site.
      const withAttribution = `${html}\n<p><em>Originally published at <a href="${fm.canonical}">${fm.canonical}</a></em></p>`;
      return {
        method: 'POST',
        url: 'https://public-api.wordpress.com/rest/v1.1/sites/SITE_PLACEHOLDER/posts/new',
        headers: { 'content-type': 'application/json' },
        body: { title: fm.title, content: withAttribution, status: 'publish' },
      };
    },
    applyAuth(req, env, B) {
      req.headers['Authorization'] = `Bearer ${env[`SEO_${B}_WORDPRESS_TOKEN`]}`;
      req.url = req.url.replace('SITE_PLACEHOLDER', encodeURIComponent(env[`SEO_${B}_WORDPRESS_SITE`]));
    },
    extractUrl(resp) {
      return resp.URL || resp.url;
    },
  },

  tumblr: {
    envNames: (B) => [
      `SEO_${B}_TUMBLR_CONSUMER_KEY`,
      `SEO_${B}_TUMBLR_CONSUMER_SECRET`,
      `SEO_${B}_TUMBLR_TOKEN`,
      `SEO_${B}_TUMBLR_TOKEN_SECRET`,
      `SEO_${B}_TUMBLR_BLOG_ID`,
    ],
    build(brand, fm, body, html, env) {
      return {
        method: 'POST',
        url: 'https://api.tumblr.com/v2/blog/BLOG_PLACEHOLDER/post',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        // source_url is Tumblr's closest built-in field to a canonical
        // reference; it is NOT a rendered rel="canonical" HTML tag — honest
        // best-effort only. See docs/seo/FABLE-TIER-SEO.md.
        formParams: { type: 'text', title: fm.title, body: html, source_url: fm.canonical, format: 'html', state: 'published' },
      };
    },
    applyAuth(req, env, B) {
      const blogId = env[`SEO_${B}_TUMBLR_BLOG_ID`];
      req.url = req.url.replace('BLOG_PLACEHOLDER', encodeURIComponent(blogId));
      req.headers['Authorization'] = oauth1Header(
        req.method,
        req.url,
        req.formParams,
        env[`SEO_${B}_TUMBLR_CONSUMER_KEY`],
        env[`SEO_${B}_TUMBLR_CONSUMER_SECRET`],
        env[`SEO_${B}_TUMBLR_TOKEN`],
        env[`SEO_${B}_TUMBLR_TOKEN_SECRET`]
      );
      req.body = new URLSearchParams(req.formParams).toString();
    },
    extractUrl(resp) {
      return resp?.response?.post_url;
    },
  },

  blogger: {
    envNames: (B) => [`SEO_${B}_BLOGGER_TOKEN`, `SEO_${B}_BLOGGER_BLOG_ID`],
    build(brand, fm, body, html, env) {
      // Blogger's API has no canonical field either; templates self-canonical
      // every post. Honest best-effort: append a visible attribution link.
      const withAttribution = `${html}\n<p><em>Originally published at <a href="${fm.canonical}">${fm.canonical}</a></em></p>`;
      return {
        method: 'POST',
        url: 'https://www.googleapis.com/blogger/v3/blogs/BLOG_PLACEHOLDER/posts',
        headers: { 'content-type': 'application/json' },
        body: { title: fm.title, content: withAttribution },
      };
    },
    applyAuth(req, env, B) {
      req.headers['Authorization'] = `Bearer ${env[`SEO_${B}_BLOGGER_TOKEN`]}`;
      req.url = req.url.replace('BLOG_PLACEHOLDER', encodeURIComponent(env[`SEO_${B}_BLOGGER_BLOG_ID`]));
    },
    extractUrl(resp) {
      return resp.url;
    },
  },

  ghost: {
    envNames: (B) => [`SEO_${B}_GHOST_ADMIN_KEY`, `SEO_${B}_GHOST_API_URL`],
    build(brand, fm, body, html, env) {
      return {
        method: 'POST',
        url: 'API_URL_PLACEHOLDER/ghost/api/admin/posts/?source=html',
        headers: { 'content-type': 'application/json' },
        body: { posts: [{ title: fm.title, html, status: 'published', canonical_url: fm.canonical }] },
      };
    },
    applyAuth(req, env, B) {
      req.url = req.url.replace('API_URL_PLACEHOLDER', env[`SEO_${B}_GHOST_API_URL`].replace(/\/$/, ''));
      req.headers['Authorization'] = `Ghost ${ghostJwt(env[`SEO_${B}_GHOST_ADMIN_KEY`])}`;
    },
    extractUrl(resp) {
      return resp?.posts?.[0]?.url;
    },
  },
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function processOne(brand, platform, filePath, opts, env) {
  if (!existsSync(filePath)) die(EXIT.FILE, `File not found: ${filePath}`);
  const raw = readFileSync(filePath, 'utf8');
  const { frontmatter: fm, body } = parseFrontmatter(raw);

  if (!fm.canonical) die(EXIT.NO_CANONICAL, `MISSING CANONICAL in ${filePath}`);
  if (!fm.slug) die(EXIT.FILE, `MISSING SLUG in ${filePath}`);

  checkBanned(body);

  const ledger = readLedger();
  if (isDuplicate(ledger, brand, platform, fm.slug)) {
    if (opts.allNew) {
      console.log(`SKIP (already published): ${brand}/${platform}/${fm.slug}`);
      return;
    }
    die(EXIT.DUPLICATE, `DUPLICATE: ${brand}/${platform}/${fm.slug} already in ledger.`);
  }

  const html = mdToHtml(body) + `\n<p><a href="${utmUrl(fm.canonical, platform, brand, fm.slug)}">Read more at ${BRANDS[brand].name}</a></p>`;

  const adapter = PLATFORMS[platform];
  const B = BRANDS[brand].key;
  const req = adapter.build(brand, fm, body, html, env);

  if (opts.dryRun) {
    console.log('--- DRY RUN (auth header omitted) ---');
    console.log(`${req.method} ${req.url}`);
    console.log('headers:', JSON.stringify(req.headers, null, 2));
    console.log('body:', JSON.stringify(req.body ?? req.formParams, null, 2));
    console.log(`required env: ${adapter.envNames(B).join(', ')}`);
    return;
  }

  requireEnv(adapter.envNames(B), env);
  adapter.applyAuth(req, env, B);

  const fetchBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  let res;
  try {
    res = await fetch(req.url, { method: req.method, headers: req.headers, body: fetchBody });
  } catch (e) {
    die(EXIT.API_ERROR, `API_ERROR: network failure calling ${platform}: ${e.message}`);
  }
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    die(EXIT.API_ERROR, `API_ERROR: ${platform} responded ${res.status}: ${text.slice(0, 500)}`);
  }
  const url = adapter.extractUrl(json) || '(unknown — check platform dashboard)';
  const record = { brand, platform, slug: fm.slug, url, timestamp: new Date().toISOString() };
  appendLedger(record);
  console.log(`DONE: ${JSON.stringify(record)}`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const env = loadEnv();
  const brandCfg = BRANDS[opts.brand];

  if (opts.allNew) {
    if (!existsSync(brandCfg.draftsDir)) die(EXIT.FILE, `Drafts dir not found: ${brandCfg.draftsDir}`);
    const files = readdirSync(brandCfg.draftsDir).filter((f) => f.endsWith('.md'));
    if (!files.length) {
      console.log(`No draft files found in ${brandCfg.draftsDir}`);
      return;
    }
    for (const f of files) {
      await processOne(opts.brand, opts.platform, path.join(brandCfg.draftsDir, f), opts, env);
    }
  } else {
    await processOne(opts.brand, opts.platform, opts.file, opts, env);
  }
}

main().catch((e) => die(EXIT.API_ERROR, `UNEXPECTED ERROR: ${e.stack || e.message}`));
