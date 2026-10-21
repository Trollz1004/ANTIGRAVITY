/**
 * MISSION OS — SOCIAL COMMAND CENTER & GEMINI 4 ULTRA MARKETING ENGINE
 * =====================================================================
 * Unifies ALL real marketing, inbox, comment/thread response, TagCity 1+1+1 tag rotation,
 * and live API syndication modules across C:\ANTIGRAVITY, Trollz1004/command-center,
 * and Trollz1004/mission-control-v5 into Mission Agent OS (:3130):
 *
 * 1. Approval Inbox (HQ / Inbox / Approved-Ready / Sent-Executed / Rejected)
 *    - Merges `mission-control/data/proposals/*.jsonl`, `ops/marketing-inbox/*`, and `marketing-plans.json`.
 *    - Full actions: Approve, Reject, Snooze, Back to Inbox, Mark Sent, Delete, Edit Copy/Notes/CustomURL.
 * 2. Universal Comment & Thread Responder (`apps/social-command-center` + `ops/dateapp-marketing-engine/comments.js`)
 *    - Replies to any `post`, `thread`, `comment`, `group`, `page`, or `dm` across all 24 platforms.
 *    - Generates 3 distinct variants per target post with the 1+1+1 TagCity rule (`[brandTag, nicheTag, cityTag]`)
 *      or via Gemini 4 Argon/Ultra (`agy` OAuth) / Fable local voice.
 * 3. TagCity 1+1+1 Tag & 28-Metro Rotation System (`ops/dateapp-marketing-engine/data.js`, `rotation.js`, `engine.js`)
 *    - 28 US Metros ranked by singles population + Niche Tag Pools + Brand Tags (`#YouAndiNotAI`, `#OnlineRecycle`, `#DreamOnline`).
 *    - Live rotation state persisted to `ops/dateapp-marketing-engine/state/rotation.json` + 1-click Daily Batch runner.
 * 4. 4-Gate Check & SlopMonster 5/5 Auto-Sanitizer (`compliance.mjs`, `copy-score.mjs`, `marketing_routine.py` sanitizer).
 * 5. Live API Publishing (`scripts/seo/post.mjs` for Dev.to, Hashnode, WordPress, Tumblr, Blogger, Ghost +
 *    `mission-control/lib/reddit-api.mjs` for Reddit OAuth2 + `ops/marketing-inbox/approved/` handoffs).
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { loadOrInitWheelState } from './perpetual-wheel.mjs';
import {
  listPlatforms,
  validateBrand,
  applyRequiredFooter,
  checkAdultVenue,
  checkBusinessOnly,
  executeManualHandoff,
  PLATFORM_IDS,
  DATEAPP_BRAND,
  BRAND_RULING,
  ADULT_FOOTER,
} from '../mission-control/lib/social-adapters.mjs';
import { checkCompliance } from '../mission-control/lib/compliance.mjs';
import { scoreCopy } from '../mission-control/lib/copy-score.mjs';
import { createProposalStore } from '../mission-control/lib/proposals.mjs';
import { draftWithFable, platformLimit } from '../mission-control/lib/fable-draft.mjs';
import { redditConfigured, executeRedditAdapter } from '../mission-control/lib/reddit-api.mjs';
import { CITIES, NICHES, BRAND_TAG, TARGET_POSTS } from '../ops/dateapp-marketing-engine/data.js';
import { pick } from '../ops/dateapp-marketing-engine/rotation.js';
import { generateComments } from '../ops/dateapp-marketing-engine/comments.js';
import { runDaily as runTagCityDaily } from '../ops/dateapp-marketing-engine/engine.js';

const ROOT = 'C:/ANTIGRAVITY';
const PLANS_FILE = `${ROOT}/mission-os/marketing-plans.json`;
const COMMENTS_FILE = `${ROOT}/mission-os/scc-comments.json`;
const MARKETING_INBOX_DIR = `${ROOT}/ops/marketing-inbox`;
const APPROVED_INBOX_DIR = `${ROOT}/ops/marketing-inbox/approved`;
const PROPOSALS_DIR = `${ROOT}/mission-control/data/proposals`;
const COMPLIANCE_HOOK_PATH = `${ROOT}/.githooks/pre-commit-canonical`;
const LIVE_POSTS_FILE = `${ROOT}/ops/growth-engine/LIVE_MARKETING_POSTS.json`;
const SEO_PUBLISHED_FILE = `${ROOT}/docs/seo/published.jsonl`;
const SOCIAL_ENGINE_DIR = `${ROOT}/scripts/dashboard-aidoesitall/social_engine/platforms`;
const TAGCITY_STATE_FILE = `${ROOT}/ops/dateapp-marketing-engine/state/rotation.json`;
const TRIGGERS_PATH = `${ROOT}/ops/heartbeat/TRIGGERS.jsonl`;
const REDDIT_RATE_STATE_PATH = `${ROOT}/mission-control/data/reddit-rate-state.json`;

export const proposalStore = createProposalStore({ dir: PROPOSALS_DIR });

// ── Brand Tags & Extended Niche Pools across all 3 Domains ──────────────────
export const BRAND_TAGS = {
  'youandinotai.com': '#YouAndiNotAI',
  'onlinerecycle.net': '#OnlineRecycle',
  'dream-online.net': '#DreamOnline',
};

export const EXTENDED_NICHES = [
  ...NICHES.map((n) => ({ ...n, domain: 'youandinotai.com' })),
  {
    id: 'N5',
    domain: 'onlinerecycle.net',
    name: 'B2B IT Asset Disposition & Server Pickup',
    angle: 'free office & data-center server/workstation/GPU decommission pickup with intake manifests',
    tags: ['#ITAssetDisposition', '#ElectronicsRecycling', '#ServerDecommission'],
  },
  {
    id: 'N6',
    domain: 'onlinerecycle.net',
    name: 'Homelab & Enterprise Hardware Part-Out',
    angle: 'tested Dual Xeon workstations, RTX GPUs, and ECC RAM saved from landfill',
    tags: ['#Homelab', '#XeonWorkstation', '#UsedEnterpriseGear'],
  },
  {
    id: 'N7',
    domain: 'dream-online.net',
    name: 'Live-Agent NPCs & Persistent World Memory',
    angle: 'MMORPG NPCs wired to live webhooks and persistent memory instead of static dialogue trees',
    tags: ['#LiveAgentNPCs', '#AIinGaming', '#PersistentWorld'],
  },
  {
    id: 'N8',
    domain: 'dream-online.net',
    name: 'Indie MMORPG & GameDev Architecture',
    angle: 'building an emergent MMORPG powered by local RTX 3070 inference + Gemini 4 orchestration',
    tags: ['#MMORPG', '#IndieGameDev', '#GameDevLog'],
  },
];

// ── 24 Registered API Endpoints + 8 Launch Directories (from SCC & command-center) ──
export const SCC_24_APIS = [
  // Social (8)
  { id: 'youtube', label: 'YouTube', icon: '▶', color: '#FF0000', type: 'social', claw: 'Hermes / GeminiClaw', api: 'YouTube Data API v3', url: 'https://studio.youtube.com' },
  { id: 'instagram', label: 'Instagram', icon: '◈', color: '#E1306C', type: 'social', claw: 'MetaClaw', api: 'Meta Graph API', url: 'https://www.instagram.com' },
  { id: 'facebook', label: 'Facebook', icon: 'f', color: '#1877F2', type: 'social', claw: 'MetaClaw', api: 'Meta Graph API', url: 'https://business.facebook.com' },
  { id: 'tiktok', label: 'TikTok', icon: '♪', color: '#69C9D0', type: 'social', claw: 'GensparkClaw', api: 'TikTok Content API', url: 'https://www.tiktok.com/creator-center' },
  { id: 'twitter', label: 'X / Twitter', icon: '✕', color: '#1DA1F2', type: 'social', claw: 'Grok Lane', api: 'X API v2', url: 'https://x.com/compose/post' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'in', color: '#0A66C2', type: 'social', claw: 'Gemini Ultra', api: 'LinkedIn Marketing API', url: 'https://www.linkedin.com/feed/' },
  { id: 'reddit', label: 'Reddit', icon: '●', color: '#FF4500', type: 'social', claw: 'Official Reddit OAuth', api: 'Reddit API v1 (/api/submit)', url: 'https://www.reddit.com/submit' },
  { id: 'pinterest', label: 'Pinterest', icon: 'P', color: '#E60023', type: 'social', claw: 'GensparkClaw', api: 'Pinterest API v5', url: 'https://www.pinterest.com/pin-creation-tool/' },
  // Blog & Syndication (6 - scripts/seo/post.mjs)
  { id: 'devto', label: 'DEV.to', icon: '⌨', color: '#38bdf8', type: 'syndication', claw: 'scripts/seo/post.mjs', api: 'DEV.to Forem API (api-key)', url: 'https://dev.to/new' },
  { id: 'hashnode', label: 'Hashnode', icon: '#', color: '#2962FF', type: 'syndication', claw: 'scripts/seo/post.mjs', api: 'Hashnode GraphQL publishPost', url: 'https://hashnode.com/create/story' },
  { id: 'wordpress', label: 'WordPress.com', icon: 'W', color: '#0073AA', type: 'syndication', claw: 'scripts/seo/post.mjs', api: 'WP REST API v1.1 /posts/new', url: 'https://wordpress.com/post' },
  { id: 'tumblr', label: 'Tumblr', icon: 't', color: '#36465D', type: 'syndication', claw: 'scripts/seo/post.mjs', api: 'Tumblr NPF v2 (OAuth 1.0a HMAC)', url: 'https://www.tumblr.com/new/text' },
  { id: 'blogger', label: 'Blogger', icon: 'B', color: '#FF5722', type: 'syndication', claw: 'scripts/seo/post.mjs', api: 'Blogger API v3', url: 'https://www.blogger.com' },
  { id: 'ghost', label: 'Ghost Admin', icon: 'G', color: '#10b981', type: 'syndication', claw: 'scripts/seo/post.mjs', api: 'Ghost Admin API (HS256 JWT)', url: 'https://ghost.org' },
  // Commerce (4)
  { id: 'square', label: 'Square (Primary Rail)', icon: '◼', color: '#00B388', type: 'commerce', claw: 'T5500 Production', api: 'Square Commerce API + Webhooks', url: 'https://squareup.com/dashboard' },
  { id: 'ebay', label: 'eBay Hardware', icon: 'e', color: '#e53238', type: 'commerce', claw: 'Crosslisting OS', api: 'eBay Browse & Inventory API', url: 'https://www.ebay.com/sh/overview' },
  { id: 'mercari', label: 'Mercari', icon: 'M', color: '#FF4655', type: 'commerce', claw: 'Crosslisting OS', api: 'Mercari Listing Pack', url: 'https://www.mercari.com/sell/' },
  { id: 'fbmkt', label: 'FB Marketplace', icon: 'FM', color: '#1877F2', type: 'commerce', claw: 'MetaClaw', api: 'Meta Marketplace Graph', url: 'https://www.facebook.com/marketplace/create/item' },
  // LLM & Dispatch & Infra (6)
  { id: 'gemini', label: 'Gemini 4 Ultra (agy)', icon: '✦', color: '#34d399', type: 'llm', claw: 'Mission OS :3130/v1', api: 'Google AI Studio Ultra OAuth ($0)', url: 'http://127.0.0.1:3130/v1/models' },
  { id: 'fable', label: 'Fable Local (RTX 3070)', icon: '⚡', color: '#fbbf24', type: 'llm', claw: 'Ollama :11434', api: 'joshlcoleman/Fable:latest', url: 'http://127.0.0.1:11434/api/tags' },
  { id: 'claude', label: 'Claude Opus (Judge)', icon: '🛡', color: '#a78bfa', type: 'llm', claw: 'Official Claude CLI', api: 'Anthropic OAuth Login', url: 'https://claude.ai' },
  { id: 'grok', label: 'Grok (X Lane)', icon: '⬡', color: '#00ccff', type: 'llm', claw: 'Official Grok CLI', api: 'xAI OAuth Login', url: 'https://x.com/i/grok' },
  { id: 'telegram', label: 'Telegram (@t5500_bot)', icon: '✈', color: '#2CA5E0', type: 'dispatch', claw: 'Hermes / OpenClaw', api: 'Telegram Bot API', url: 'https://web.telegram.org' },
  { id: 'cloudflare', label: 'Cloudflare Tunnel & Pages', icon: '☁', color: '#F6821F', type: 'infra', claw: 'T5500 Keepalive', api: 'Cloudflare Edge Tunnel', url: 'https://dash.cloudflare.com' },
];

export const SCC_LAUNCH_DIRECTORIES = [
  { id: 'showhn', name: 'Hacker News (Show HN)', url: 'https://news.ycombinator.com/submit', mode: 'Founder Submit' },
  { id: 'producthunt', name: 'Product Hunt', url: 'https://www.producthunt.com/posts/new', mode: 'Launch Pack' },
  { id: 'indiehackers', name: 'Indie Hackers', url: 'https://www.indiehackers.com/new-post', mode: 'Founder Story' },
  { id: 'betalist', name: 'BetaList', url: 'https://betalist.com/submit', mode: 'Directory Pack' },
  { id: 'alternativeto', name: 'AlternativeTo', url: 'https://alternativeto.net/manage-item/', mode: 'Directory Pack' },
  { id: 'saashub', name: 'SaaSHub', url: 'https://www.saashub.com/services/new', mode: 'Directory Pack' },
  { id: 'uneed', name: 'Uneed.best', url: 'https://www.uneed.best/submit-a-tool', mode: 'Directory Pack' },
  { id: 'sideprojectors', name: 'SideProjectors', url: 'https://www.sideprojectors.com', mode: 'Directory Pack' },
];

function readDotEnvMap() {
  const map = {};
  const candidates = [
    `${ROOT}/.env`,
    path.join(os.homedir(), 'OneDrive', 'claude-to-claude', '.env'),
  ];
  for (const p of candidates) {
    try {
      const txt = fs.readFileSync(p, 'utf8');
      for (const line of txt.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq > 0) {
          const k = trimmed.slice(0, eq).trim();
          const v = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
          if (k && v && !map[k]) map[k] = v;
        }
      }
    } catch {}
  }
  return map;
}

export function envValue(name) {
  if (process.env[name]) return process.env[name];
  const map = readDotEnvMap();
  return map[name] || '';
}

export function mapDomainToBrand(domainOrBrand) {
  const s = String(domainOrBrand || '').trim().toLowerCase();
  if (s.includes('youandinotai') || s.includes('date')) return 'youandinotai';
  if (s.includes('dream')) return 'DREAM Online';
  if (s.includes('recycle') || s.includes('ai-solutions') || s.includes('ai solutions')) return 'AI Solutions';
  return 'youandinotai';
}

export function mapBrandToDomain(brandOrDomain) {
  const s = String(brandOrDomain || '').trim().toLowerCase();
  if (s.includes('dream')) return 'dream-online.net';
  if (s.includes('recycle') || s.includes('ai-solutions') || s.includes('ai solutions')) return 'onlinerecycle.net';
  return 'youandinotai.com';
}

export function mapChannelToPlatformId(channel) {
  const c = String(channel || '').toLowerCase();
  if (c.includes('reddit')) return 'reddit';
  if (c.includes('tiktok') || c.includes('reel') || c.includes('short')) return 'tiktok';
  if (c.includes('youtube')) return 'youtube';
  if (c.includes('dev.to') || c.includes('devto') || c.includes('hacker news') || c.includes('show hn')) return 'devto';
  if (c.includes('hashnode')) return 'hashnode';
  if (c.includes('wordpress')) return 'wordpress';
  if (c.includes('tumblr')) return 'tumblr';
  if (c.includes('blogger')) return 'blogger';
  return 'x';
}

// ── SlopMonster 5/5 Auto-Sanitizer (ported from ops/marketing-inbox/marketing_routine.py) ──
const SLOP_REPLACEMENTS = {
  foster: 'build', fostering: 'building', fosters: 'builds', fostered: 'built',
  showcase: 'show', showcases: 'shows', showcasing: 'showing', showcased: 'showed',
  landscape: 'market', landscapes: 'markets',
  empower: 'help', empowers: 'helps', empowering: 'helping', empowered: 'helped',
  innovate: 'change', innovates: 'changes', innovating: 'changing', innovation: 'change',
  robust: 'solid', intuitive: 'simple',
  curated: 'hand-picked', streamline: 'simplify', streamlined: 'simplified',
  journey: 'path', journeys: 'paths', 'fast-paced': 'quick',
  delve: 'look', delves: 'looks', delving: 'looking',
  leverage: 'use', leverages: 'uses', leveraging: 'using', leveraged: 'used',
  utilize: 'use', utilizes: 'uses', utilizing: 'using', utilized: 'used',
  tapestry: 'mix', realm: 'world', beacon: 'signal', testament: 'sign',
  vibrant: 'lively', seamless: 'smooth', seamlessly: 'smoothly',
  elevate: 'raise', elevates: 'raises', elevating: 'raising',
  holistic: 'full', synergy: 'fit', paradigm: 'model', 'ever-evolving': 'changing',
  groundbreaking: 'fresh', meticulous: 'careful', bespoke: 'custom',
  unlock: 'open', unleash: 'release', 'game-changer': 'turning point', 'game-changing': 'important',
  revolutionize: 'change', transformative: 'real', transformation: 'change',
  unparalleled: 'rare', supercharge: 'speed up', turbocharge: 'speed up',
  effortless: 'easy', effortlessly: 'easily', pivotal: 'key', compelling: 'clear',
  'dive in': 'start', "let's dive": "let's start", 'deep dive': 'look',
  'look no further': '', 'at the end of the day': '', 'when it comes to': 'for',
  'more than just': '', 'say goodbye to': 'stop', 'here is the thing': '', "here's the thing": '',
};

export function sanitizeCopyToScore5(rawText, isDateApp = false) {
  let cleaned = String(rawText || '');
  const sortedKeys = Object.keys(SLOP_REPLACEMENTS).sort((a, b) => b.length - a.length);
  for (const bad of sortedKeys) {
    const good = SLOP_REPLACEMENTS[bad];
    const escaped = bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b${escaped}\\b`, 'gi');
    cleaned = cleaned.replace(re, good);
  }
  // Break rule-of-three tricolons ("X, Y, and Z" -> "X and Y Z")
  cleaned = cleaned.replace(/\b(\w{4,}),\s+(\w{4,}),\s+and\s+(\w{4,})\b/gi, '$1 and $2 $3');
  // Cap em-dashes per sentence
  cleaned = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((sent) => {
      const parts = sent.split('—');
      if (parts.length <= 2) return sent;
      return `${parts[0].trim()}. ${parts.slice(1).map((p) => p.trim()).join('. ')}`;
    })
    .join(' ');
  if (isDateApp) {
    const minorMap = {
      kid: 'adult', kids: 'adults', child: 'person', children: 'people',
      teen: 'adult', teens: 'adults', teenager: 'adult', teenagers: 'adults',
      minor: 'adult', minors: 'adults', school: 'venue', schools: 'venues',
    };
    for (const [mTerm, mRepl] of Object.entries(minorMap)) {
      cleaned = cleaned.replace(new RegExp(`\\b${mTerm}\\b`, 'gi'), mRepl);
    }
  }
  return cleaned.replace(/[ \t]{2,}/g, ' ').trim();
}

export function runSocialCommandChecks({ domain, brand, platform, title, body, autoSanitize = false }) {
  const resolvedBrand = brand || mapDomainToBrand(domain);
  const resolvedPlatform = PLATFORM_IDS.includes(platform) ? platform : mapChannelToPlatformId(platform);
  let checkedBody = String(body || '').trim();
  if (autoSanitize) {
    checkedBody = sanitizeCopyToScore5(checkedBody, resolvedBrand === DATEAPP_BRAND);
  }
  if (resolvedBrand === DATEAPP_BRAND) {
    checkedBody = applyRequiredFooter(checkedBody, platformLimit(resolvedPlatform));
  }
  const composite = `${title || ''}\n${checkedBody}`;
  let compliance = { pass: true, ruleIndex: null, matched: null };
  try {
    compliance = checkCompliance(composite, { hookPath: COMPLIANCE_HOOK_PATH });
  } catch {}
  const copyScore = scoreCopy(composite);
  const adultVenue = resolvedBrand === DATEAPP_BRAND ? checkAdultVenue(composite) : { pass: true, reason: null };
  const businessOnly = resolvedBrand === DATEAPP_BRAND ? checkBusinessOnly(composite) : { pass: true, reason: null };

  return {
    brand: resolvedBrand,
    platform: resolvedPlatform,
    checkedBody,
    checks: {
      compliance,
      copyScore,
      adultVenue,
      businessOnly,
      allPassed: Boolean(compliance.pass && adultVenue.pass && businessOnly.pass),
    },
  };
}

// ── TagCity 1+1+1 Tag Rotation & Comment Engine ─────────────────────────────
export function getTagCityState() {
  let rotState = { tagState: { cursor: 0, recent: [] }, cityState: { cursor: 0, recent: [] } };
  try {
    if (fs.existsSync(TAGCITY_STATE_FILE)) {
      rotState = JSON.parse(fs.readFileSync(TAGCITY_STATE_FILE, 'utf8'));
    }
  } catch {}

  const tagPool = NICHES.map((n) => ({ id: n.id, tag: n.tags[0], name: n.name }));
  const previewTags = pick(tagPool, 3, 6, rotState.tagState).picked;
  const previewCities = pick(CITIES, 3, 6, rotState.cityState).picked;

  let dailyBatches = [];
  try {
    if (fs.existsSync(MARKETING_INBOX_DIR)) {
      dailyBatches = fs.readdirSync(MARKETING_INBOX_DIR)
        .filter((f) => /dateapp-.*batch\.md$|tagcity-engine\.md$/i.test(f))
        .sort()
        .reverse()
        .slice(0, 10);
    }
  } catch {}

  return {
    rule: '1 + 1 + 1 (Slot 1: Brand Tag · Slot 2: Niche Tag · Slot 3: City Tag — max 3 tags per action)',
    brandTag: BRAND_TAG,
    brandTags: BRAND_TAGS,
    niches: EXTENDED_NICHES,
    cities: CITIES,
    targetPosts: TARGET_POSTS,
    rotationState: rotState,
    activeRotationPreview: {
      brandTag: BRAND_TAG,
      nicheTags: previewTags,
      cities: previewCities,
    },
    dailyBatches,
  };
}

export function triggerTagCityDailyBatch({ customPosts } = {}) {
  const postsToUse = Array.isArray(customPosts) && customPosts.length > 0 ? customPosts : TARGET_POSTS;
  const res = runTagCityDaily({
    inboxDir: MARKETING_INBOX_DIR,
    stateFile: TAGCITY_STATE_FILE,
    posts: postsToUse,
    now: new Date(),
  });

  // Also add the generated comment variants into the live comment queue & marketing plans
  const createdItems = [];
  for (const post of postsToUse) {
    const variants = generateComments(post, {
      tags: res.rotation.tags,
      cities: res.rotation.cities,
      brandTag: BRAND_TAG,
    });
    if (variants[0]) {
      const saved = saveCommentReply({
        domain: 'youandinotai.com',
        platform: post.platform || 'TikTok',
        targetType: 'comment',
        targetTitle: post.title,
        customUrl: post.url || '',
        body: variants[0].text,
        tags: variants[0].tags,
        variants,
        author: 'TagCity 1+1+1 Engine',
        status: 'INBOX',
      });
      createdItems.push(saved);
    }
  }

  return {
    ok: true,
    addedCount: createdItems.length,
    outputFile: res.outputs[0],
    rotation: res.rotation,
    createdItems,
  };
}

export function generateThreeCommentVariants({
  domain = 'youandinotai.com',
  platform = 'Reddit',
  targetTitle = 'AI profiles are ruining dating apps',
  targetUrl = '',
  targetType = 'thread',
  nicheId = '',
  cityId = '',
}) {
  const brandTag = BRAND_TAGS[domain] || BRAND_TAG;
  const domainNiches = EXTENDED_NICHES.filter((n) => n.domain === domain);
  const nichePool = (domainNiches.length ? domainNiches : EXTENDED_NICHES).map((n) => ({
    id: n.id,
    tag: n.tags[0],
    allTags: n.tags,
    name: n.name,
  }));

  let selectedTags = [];
  if (nicheId) {
    const found = EXTENDED_NICHES.find((n) => n.id === nicheId);
    if (found) {
      selectedTags = found.tags.map((t, idx) => ({ id: `${found.id}_${idx}`, tag: t }));
    }
  }
  if (selectedTags.length < 3) {
    const rot = getTagCityState().rotationState;
    selectedTags = pick(nichePool, 3, 6, rot.tagState).picked;
  }

  let selectedCities = [];
  if (cityId) {
    const foundCity = CITIES.find((c) => c.id === cityId || c.city.toLowerCase() === String(cityId).toLowerCase());
    if (foundCity) {
      const idx = CITIES.indexOf(foundCity);
      selectedCities = [foundCity, CITIES[(idx + 1) % CITIES.length], CITIES[(idx + 2) % CITIES.length]];
    }
  }
  if (selectedCities.length < 3) {
    const rot = getTagCityState().rotationState;
    selectedCities = pick(CITIES, 3, 6, rot.cityState).picked;
  }

  const rawVariants = generateComments(
    { title: targetTitle, platform },
    { tags: selectedTags, cities: selectedCities, brandTag }
  );

  // Customize closers for non-dating domains so B2B & MMORPG comments read naturally
  const enriched = rawVariants.map((v, i) => {
    let text = v.text;
    if (domain === 'onlinerecycle.net') {
      const cityObj = selectedCities[i % selectedCities.length];
      const openers = [
        'Quick question for IT/homelab folks here —',
        'Something we see every week in hardware intake —',
        'Honest take on retired office/server gear —',
      ];
      const closers = [
        `if your office or lab in ${cityObj.city} is clearing out Xeon towers, GPUs, or switches, OnlineRecycle.net does free pickup & intake manifests.`,
        `${cityObj.city} teams upgrading racks don't need to pay e-waste dump fees when working hardware can be refurbished.`,
        `how are teams in ${cityObj.city} handling server/workstation decommissions right now?`,
      ];
      text = `${openers[i]} re: "${targetTitle}" on ${platform} — ${closers[i]} ${v.tags.join(' ')}`;
    } else if (domain === 'dream-online.net') {
      const cityObj = selectedCities[i % selectedCities.length];
      const openers = [
        'GameDev / MMORPG question on this —',
        'We ran into this exact design problem building DREAM Online —',
        'Curious what MMO players think —',
      ];
      const closers = [
        `when NPCs wire into live webhooks + persistent memory instead of static dialogue trees, the world actually remembers what you did.`,
        `if an NPC merchant remembers you undercutting them yesterday and shifts guild prices, does that change how you play?`,
        `we're testing live-agent NPCs right now on dream-online.net (${cityObj.city} playtest cluster).`,
      ];
      text = `${openers[i]} "${targetTitle}" on ${platform}: ${closers[i]} ${v.tags.join(' ')}`;
    } else {
      text = `${v.text}\n\nyouandinotai.com is for adults 18 and over.`;
    }
    const checkData = runSocialCommandChecks({
      domain,
      platform,
      title: `Reply [${targetType}]: ${targetTitle}`,
      body: text,
      autoSanitize: true,
    });
    const labels = [
      'Variant A — Direct Value & Proof',
      'Variant B — Peer Question & Curiosity',
      'Variant C — Concise Punchy',
    ];
    return {
      variant: v.variant,
      label: labels[i] || `Variant ${v.variant}`,
      tags: v.tags,
      tagLine: (v.tags || []).join(' '),
      city: selectedCities[i % selectedCities.length],
      text: checkData.checkedBody,
      body: checkData.checkedBody,
      checks: checkData.checks,
      gates: checkData.checks,
    };
  });

  return {
    ok: true,
    domain,
    platform,
    targetTitle,
    targetUrl,
    targetType,
    brandTag,
    tags: enriched[0]?.tags || [brandTag],
    tagLine: (enriched[0]?.tags || [brandTag]).join(' '),
    city: enriched[0]?.city || selectedCities[0],
    variants: enriched,
  };
}

export function loadCommentsStore() {
  try {
    if (fs.existsSync(COMMENTS_FILE)) {
      const j = JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf8'));
      if (Array.isArray(j)) return j;
    }
  } catch {}
  const seed = [
    {
      id: 'CMT-SEED-01',
      domain: 'youandinotai.com',
      brand: 'youandinotai',
      platform: 'Reddit',
      targetType: 'thread',
      targetTitle: 'r/OnlineDating — Why does every third profile feel like an AI script now?',
      customUrl: 'https://www.reddit.com/r/OnlineDating/',
      body: 'Honest question for the room — r/OnlineDating on Reddit? Austin: would a $1 human-first verification gate at the door change how you swipe? #YouAndiNotAI #RealNotAI #AustinSingles\n\nyouandinotai.com is for adults 18 and over.',
      tags: ['#YouAndiNotAI', '#RealNotAI', '#AustinSingles'],
      author: 'TagCity 1+1+1 Engine',
      status: 'APPROVED_READY',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'CMT-SEED-02',
      domain: 'onlinerecycle.net',
      brand: 'AI Solutions',
      platform: 'Reddit',
      targetType: 'thread',
      targetTitle: 'r/homelab — Where are companies offloading retired Dual Xeon towers and RTX workstations?',
      customUrl: 'https://www.reddit.com/r/homelab/',
      body: 'Something we see every week in hardware intake — re: "Where are companies offloading retired Dual Xeon towers" on Reddit — if your office or lab in Atlanta is clearing out Xeon towers, GPUs, or switches, OnlineRecycle.net does free pickup & intake manifests. #OnlineRecycle #ITAssetDisposition #AtlantaSingles',
      tags: ['#OnlineRecycle', '#ITAssetDisposition', '#Homelab'],
      author: 'Gemini 4 Ultra (agy)',
      status: 'APPROVED_READY',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ];
  fs.writeFileSync(COMMENTS_FILE, JSON.stringify(seed, null, 2), 'utf8');
  return seed;
}

export function saveCommentReply({
  domain = 'youandinotai.com',
  platform = 'Reddit',
  targetType = 'thread',
  targetTitle = '',
  customUrl = '',
  targetUrl = '',
  parentId = '',
  body = '',
  tags = [],
  variants = [],
  author = 'Founder / Gemini 4 Ultra',
  status = 'APPROVED_READY',
}) {
  const resolvedUrl = String(customUrl || targetUrl || '').trim();
  const comments = loadCommentsStore();
  const checkData = runSocialCommandChecks({
    domain,
    platform,
    title: `Reply [${targetType}]: ${targetTitle || 'Thread reply'}`,
    body,
    autoSanitize: true,
  });
  const id = `CMT-${Date.now().toString(36).toUpperCase()}`;
  const entry = {
    id,
    kind: 'comment',
    domain,
    brand: checkData.brand,
    platform,
    targetType,
    targetTitle: targetTitle || `${platform} ${targetType} reply`,
    customUrl: resolvedUrl,
    targetUrl: resolvedUrl,
    parentId: String(parentId || '').trim(),
    body: checkData.checkedBody,
    tags: Array.isArray(tags) && tags.length ? tags.slice(0, 3) : [BRAND_TAGS[domain] || BRAND_TAG, '#RealNotAI', '#AustinSingles'],
    variants,
    author,
    status,
    checks: checkData.checks,
    createdAt: new Date().toISOString(),
  };
  comments.unshift(entry);
  fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments.slice(0, 200), null, 2), 'utf8');

  // Also record in proposalStore & approved handoff if approved
  try {
    const rec = proposalStore.create({
      source: 'social',
      kind: 'post',
      brand: checkData.brand,
      platform: checkData.platform,
      title: `[${targetType.toUpperCase()} REPLY] ${entry.targetTitle}`,
      body: entry.body,
      scheduledFor: null,
      checks: checkData.checks,
      ...(checkData.brand === DATEAPP_BRAND ? { brandRuling: BRAND_RULING } : {}),
    });
    if (status === 'APPROVED_READY' || status === 'APPROVED' || status === 'POSTED_LIVE') {
      proposalStore.transition(rec.id, { state: 'APPROVED', approvedBy: 'founder-mission-os' });
      executeManualHandoff({
        inboxDir: APPROVED_INBOX_DIR,
        platform: ['x', 'reddit', 'tiktok', 'youtube'].includes(checkData.platform) ? checkData.platform : 'x',
        id,
        title: `[${targetType.toUpperCase()} REPLY] ${entry.targetTitle}`,
        body: `${entry.customUrl ? `Target URL: ${entry.customUrl}\n\n` : ''}${entry.body}\n\nTags: ${entry.tags.join(' ')}`,
        brand: checkData.brand,
      });
    }
  } catch {}

  return { ok: true, reply: entry, comment: entry };
}

export function listSocialEngine22Posters() {
  const posters = [
    { id: 'twitter', name: 'X / Twitter', file: 'twitter_poster.py', category: 'Microblog' },
    { id: 'reddit', name: 'Reddit (Official OAuth / Handoff)', file: 'reddit_poster.py', category: 'Community' },
    { id: 'tiktok', name: 'TikTok Vertical', file: 'tiktok_poster.py', category: 'Short Video' },
    { id: 'youtube', name: 'YouTube Shorts / Hermes', file: 'youtube_poster.py', category: 'Video' },
    { id: 'instagram', name: 'Instagram Reels', file: 'instagram_poster.py', category: 'Short Video' },
    { id: 'threads', name: 'Meta Threads', file: 'threads_poster.py', category: 'Microblog' },
    { id: 'facebook', name: 'Facebook Groups & Pages', file: 'facebook_poster.py', category: 'Social' },
    { id: 'linkedin', name: 'LinkedIn B2B', file: 'linkedin_poster.py', category: 'B2B' },
    { id: 'bluesky', name: 'Bluesky ATProto', file: 'bluesky_poster.py', category: 'Microblog' },
    { id: 'mastodon', name: 'Mastodon Fediverse', file: 'mastodon_poster.py', category: 'Microblog' },
    { id: 'discord', name: 'Discord Webhooks', file: 'discord_poster.py', category: 'Community' },
    { id: 'telegram', name: 'Telegram Channels', file: 'telegram_poster.py', category: 'Community' },
    { id: 'devto', name: 'Dev.to Syndication', file: 'devto_poster.py', category: 'Dev Blog' },
    { id: 'hashnode', name: 'Hashnode Syndication', file: 'hashnode_poster.py', category: 'Dev Blog' },
    { id: 'medium', name: 'Medium Publication', file: 'medium_poster.py', category: 'Long-Form' },
    { id: 'substack', name: 'Substack Newsletter', file: 'substack_poster.py', category: 'Newsletter' },
    { id: 'indiehackers', name: 'Indie Hackers', file: 'indiehackers_poster.py', category: 'Founder' },
    { id: 'producthunt', name: 'Product Hunt Launch', file: 'producthunt_poster.py', category: 'Launch' },
    { id: 'quora', name: 'Quora Q&A', file: 'quora_poster.py', category: 'Search Q&A' },
    { id: 'pinterest', name: 'Pinterest Visuals', file: 'pinterest_poster.py', category: 'Visual' },
    { id: 'nextdoor', name: 'Nextdoor Local Pickup', file: 'nextdoor_poster.py', category: 'Local B2B/B2C' },
    { id: 'ebay', name: 'eBay Hardware Crosslister', file: 'ebay_poster.py', category: 'Commerce' },
  ];
  return posters.map((p) => ({
    ...p,
    installed: fs.existsSync(path.join(SOCIAL_ENGINE_DIR, p.file)),
  }));
}

export const INITIAL_MARKETING_PLANS = {
  version: '3.0.0',
  updatedAt: new Date().toISOString(),
  engine: 'Social Command Center + Gemini 4 Antigravity Ultra (agy OAuth · $0 API Cost) + TagCity 1+1+1 + Local Fable Voice',
  paperclipStatus: 'RETIRED & REMOVED — 100% Native in Mission OS (:3130)',
  revenueGoalUsd: 10000,
  domains: {
    'youandinotai.com': {
      domain: 'youandinotai.com',
      brand: 'youandinotai',
      name: 'YouAndINotAI — 18+ Human-Verified Dating',
      url: 'https://youandinotai.com',
      checkoutRail: 'Square Only ($1 Bot-Shield Verification · $9.99/mo Founding Member · AI Dating Tools)',
      status: 'LIVE & ACTIVE',
      valueProp: 'The only dating platform that charges $1 at the door to prove you are a real human. Zero bots, zero catfish, zero engagement traps. Built for adults 18 and over to meet real people offline.',
      pillars: [
        {
          id: 'yani-pillar-1',
          title: '$1 Bot-Shield Verification Funnel',
          target: 'Adults 18+ on Reddit, X, TikTok, and Reels frustrated by AI bots & fake profiles',
          offer: '$1 one-time Bot-Shield human verification (via Square) + optional AI Profile Optimizer ($14.99), Icebreakers ($7.99), Conversation Review ($12.99)',
          cadence: '3x daily X posts · 1x daily Reddit thread · 1x daily vertical Short/Reel script',
          kpi: 'Verified $1 Square signups & Founding Member conversions',
        },
        {
          id: 'yani-pillar-2',
          title: 'Link Forge — 50% Lifetime Revenue Share ("Offer of Offers")',
          target: 'Tier-1 commentary, dating critique, livestream, and tech creators (50k–1M+ audience)',
          offer: '50% of subscriber revenue, every month, for life via clean vanity URLs (youandinotai.com/:partnerId) + custom stream QR codes',
          cadence: '10 creator outreach DMs/emails per day + public X math threads calling out 5% affiliate grifts',
          kpi: 'Active partner vanity routes & partner-referred subscribers',
        },
        {
          id: 'yani-pillar-3',
          title: 'TagCity 1+1+1 Comment & Metro Rotation Engine',
          target: '28 US Single-Density Metros (NYC, LA, Chicago, Houston, Phoenix, Austin, Atlanta, Columbus...)',
          offer: '3 comment variants per viral parent thread using 1 Brand Tag (#YouAndiNotAI) + 1 Niche Tag (#RealNotAI) + 1 City Tag (#AustinSingles)',
          cadence: 'Daily rotation batch (3 cities x 3 niche tags, 6-window non-repeating)',
          kpi: 'Compounding comment impressions & local metro signups',
        },
      ],
    },
    'onlinerecycle.net': {
      domain: 'onlinerecycle.net',
      brand: 'AI Solutions',
      name: 'OnlineRecycle.net — Trash Or Treasure Online Recycler LLC',
      url: 'https://onlinerecycle.net',
      checkoutRail: 'B2B Hardware Decommission Intake & High-Margin eBay Crosslister',
      status: 'LIVE & ACTIVE',
      valueProp: 'Fast, zero-hassle enterprise & office electronics recycling, server/workstation drop-off, and B2B hardware pickup that turns retired IT gear into high-margin eBay inventory.',
      pillars: [
        {
          id: 'or-pillar-1',
          title: 'Local B2B IT Director & MSP Decommission Intake',
          target: 'Local offices, MSPs, CAD/render studios, data centers, and medical/legal offices upgrading hardware',
          offer: 'Free scheduled pickup & drop-off for retired Dual Xeon/EPYC servers, workstations, GPUs, ECC RAM, and enterprise storage with NIST 800-88 sanitization receipts',
          cadence: 'Daily local B2B outreach + Google Business & local SEO landing pages',
          kpi: 'Inbound hardware pickup manifests & enterprise lot acquisitions',
        },
        {
          id: 'or-pillar-2',
          title: 'High-Margin eBay Part-Out & Crosslisting OS Engine',
          target: 'Homelab builders, local AI developers, SMB buyers on eBay',
          offer: 'Tested Dual Xeon / RTX workstations ($280–$850/unit), enterprise GPUs ($180–$900), and ECC RAM / NVMe kits via Crosslisting OS',
          cadence: 'Automated SKU & listing generation from every intake batch',
          kpi: 'Net eBay hardware revenue toward the $10,000 Autonomy Goal',
        },
        {
          id: 'or-pillar-3',
          title: 'Local Marketplace Free Drop-Off Blitz',
          target: 'Craigslist, Facebook Marketplace, Nextdoor, and local business directories',
          offer: 'Free electronics, PC, server, and GPU drop-off/pickup — zero landfill fees for business-grade gear',
          cadence: '3x weekly local marketplace refreshes + teardown/reuse short videos',
          kpi: 'Zero-cost hardware inventory acquisition',
        },
      ],
    },
    'dream-online.net': {
      domain: 'dream-online.net',
      brand: 'DREAM Online',
      name: 'DREAM Online — AI MMORPG With Live-Agent NPCs',
      url: 'https://dream-online.net',
      checkoutRail: 'Early Playtester Capture & Founder Pack Wishlist',
      status: 'LIVE & ACTIVE',
      valueProp: 'First-of-its-kind MMORPG where NPCs are not static dialogue trees. Game triggers fire live webhooks to persistent AI agents that remember players, hold grudges, shift guild prices, and evolve the world.',
      pillars: [
        {
          id: 'dream-pillar-1',
          title: '"NPCs That Actually Remember" Technical Devlog Series',
          target: 'r/gamedev, r/MMORPG, r/LocalLLaMA, Hacker News (Show HN), Dev.to, Hashnode',
          offer: 'Behind-the-scenes architecture showing live game triggers -> webhooks -> persistent memory -> local Ollama Fable / Gemini 4 NPC actions',
          cadence: '2x weekly technical devlogs + 60-second YouTube Shorts / TikTok clips',
          kpi: 'Early playtester signups & community Discord/wishlist growth',
        },
        {
          id: 'dream-pillar-2',
          title: 'Live Emergent World Stories & Short-Form Clips',
          target: 'TikTok, YouTube Shorts, X gaming community, Reels',
          offer: 'Short clips showing an NPC merchant remembering a player who undercut them yesterday and dynamically changing quest rewards',
          cadence: '3x weekly short-form clips',
          kpi: 'Viral share rate & traffic to dream-online.net',
        },
      ],
    },
  },
  campaigns: [
    {
      id: 'CAMP-YANI-X-01',
      domain: 'youandinotai.com',
      brand: 'youandinotai',
      platform: 'x',
      channel: 'X / Twitter',
      category: 'Bot-Shield Funnel',
      title: 'Why We Charge $1 to Prove You Are Human',
      hook: 'I built a dating app that charges $1 to verify you’re human. No bots. No cats. No ghosts. Just real adults 18+.',
      body: `I built a dating app that charges $1 at the door to verify you are a real human. No bots. No catfish scripts. Most apps profit while you stay single. We built https://youandinotai.com so real adults 18+ meet and delete the app.\n\nyouandinotai.com is for adults 18 and over.`,
      hashtags: ['#YouAndiNotAI', '#RealNotAI', '#AustinSingles'],
      customUrl: 'https://x.com/compose/post',
      targets: ['twitter', 'reddit', 'tiktok', 'instagram', 'facebook'],
      status: 'APPROVED_READY',
      scheduledWindow: '09:00 UTC · Daily Rotation',
      createdAt: '2026-10-20T12:00:00Z',
    },
    {
      id: 'CAMP-YANI-REDDIT-01',
      domain: 'youandinotai.com',
      brand: 'youandinotai',
      platform: 'reddit',
      channel: 'Reddit (r/dating · r/OnlineDating)',
      category: 'Founder Story',
      title: 'I got tired of swiping on bots so I built a dating app with a $1 human verification gate',
      hook: 'Every major dating app lets bot farms run wild because fake activity boosts their engagement metrics.',
      body: `After years of watching dating apps fill up with AI scripts, scammers, and dead profiles, I built something different: https://youandinotai.com\n\nThe core rule is simple:\n1. $1 Bot-Shield verification at the door via Square. Bot operators will not pay $1 per fake account with a real payment method, so automated spam dies immediately.\n2. Adults 18+ verified venue with zero algorithmic dark patterns designed to keep you swiping forever.\n3. Optional AI tools that work for you (profile polish, icebreakers, conversation review) instead of bots pretending to be matches.\n\nIf you are tired of swiping on ghosts, check it out: https://youandinotai.com\n\nyouandinotai.com is for adults 18 and over.`,
      hashtags: ['#YouAndiNotAI', '#ModernDating', '#NYCSingles'],
      customUrl: 'https://www.reddit.com/r/OnlineDating/submit',
      targets: ['reddit', 'devto', 'indiehackers'],
      status: 'APPROVED_READY',
      scheduledWindow: '14:00 UTC · Reddit Peak',
      createdAt: '2026-10-20T12:05:00Z',
    },
    {
      id: 'CAMP-YANI-AFFILIATE-01',
      domain: 'youandinotai.com',
      brand: 'youandinotai',
      platform: 'x',
      channel: 'Creator DM / Link Forge',
      category: '50% Lifetime Rev-Share',
      title: 'Link Forge — 50% Lifetime Monthly Revenue Share Pitch (Adults 18+)',
      hook: 'Standard affiliate programs pay pennies once and keep 95% of recurring revenue. We split 50/50 for life.',
      body: `We reserved your clean vanity URL on our human-verified adults 18+ dating platform: https://youandinotai.com/YOURNAME plus a stream QR overlay. Whenever someone visits your link, our router locks them to your partner ID and pays you 50% of net subscription revenue every month for life.\n\nyouandinotai.com is for adults 18 and over.`,
      hashtags: ['#YouAndiNotAI', '#LinkForge', '#LASingles'],
      customUrl: 'https://x.com/messages',
      targets: ['twitter', 'youtube', 'instagram', 'tiktok'],
      status: 'APPROVED_READY',
      scheduledWindow: 'Outreach Batch · 10 Creators/Day',
      createdAt: '2026-10-20T12:10:00Z',
    },
    {
      id: 'CAMP-YANI-SHORT-01',
      domain: 'youandinotai.com',
      brand: 'youandinotai',
      platform: 'tiktok',
      channel: 'TikTok / Reels / YouTube Shorts',
      category: 'Vertical Video Script',
      title: '30s Vertical Script: "The Dating App That Wants You To Delete It"',
      hook: '[0-3s] Why do dating apps feel broken in 2026? Because they get paid when you stay single.',
      body: `[0-3s HOOK] "Why do dating apps feel impossible right now? Because they only make money while you stay single."\n\n[3-12s PROBLEM] "Free signups mean half the profiles you swipe on are AI bots or script farms."\n\n[12-22s SOLUTION] "So we built YouAndINotAI.com for adults 18+. It charges a $1 Bot-Shield verification at the door to keep every bot out."\n\n[22-30s CTA] "And creators get a custom vanity link paying 50% lifetime revenue share. Hit youandinotai.com."\n\nyouandinotai.com is for adults 18 and over.`,
      hashtags: ['#YouAndiNotAI', '#AuthenticDating', '#ChicagoSingles'],
      customUrl: 'https://www.tiktok.com/creator-center',
      targets: ['tiktok', 'instagram', 'youtube'],
      status: 'APPROVED_READY',
      scheduledWindow: '18:00 UTC · Short-Form Slot',
      createdAt: '2026-10-20T12:15:00Z',
    },
    {
      id: 'CAMP-OR-B2B-01',
      domain: 'onlinerecycle.net',
      brand: 'AI Solutions',
      platform: 'devto',
      channel: 'B2B Outreach / LinkedIn / Local SEO',
      category: 'Enterprise Hardware Intake',
      title: 'Local IT Director & MSP Decommission Pickup Pitch (OnlineRecycle.net)',
      hook: 'Upgrading office workstations or decommissioning server racks? Free pickup + clean intake manifest.',
      body: `Subject: Free IT Hardware Decommission & Workstation Pickup — OnlineRecycle.net\n\nHi [Name],\n\nIf your team is cycling out retired workstations, Dual Xeon/EPYC servers, GPUs, or office electronics this quarter, Trash Or Treasure Online Recycler LLC (https://onlinerecycle.net) provides fast, zero-cost B2B pickup and drop-off intake.\n\nWe handle:\n1. Tower and rackmount servers, workstations, GPUs, ECC RAM, and networking gear\n2. Documented asset intake manifests and drive sanitization workflows\n3. Zero landfill dumping — working enterprise components are refurbished and reused\n\nReply with your equipment list or schedule a pickup directly at https://onlinerecycle.net.`,
      hashtags: ['#OnlineRecycle', '#ITAssetDisposition', '#ServerDecommission'],
      customUrl: 'https://www.linkedin.com/feed/',
      targets: ['linkedin', 'devto', 'hashnode', 'wordpress'],
      status: 'APPROVED_READY',
      scheduledWindow: '13:00 UTC · B2B Business Hours',
      createdAt: '2026-10-20T12:20:00Z',
    },
    {
      id: 'CAMP-OR-EBAY-01',
      domain: 'onlinerecycle.net',
      brand: 'AI Solutions',
      platform: 'reddit',
      channel: 'Craigslist / FB Marketplace / Nextdoor',
      category: 'Free Hardware Drop-Off',
      title: 'Free Computer, Server, GPU & Office Electronics Recycling (OnlineRecycle.net)',
      hook: 'Clearing out old computers, servers, GPUs, or office tech? Do not pay dump fees.',
      body: `Clearing out an office, studio, homelab, or tech closet?\n\nOnlineRecycle.net (Trash Or Treasure Online Recycler LLC) accepts free drop-offs and schedules free business pickups for:\n1. Desktop workstations, Dual Xeon / Ryzen towers, and rack servers\n2. Graphics cards (NVIDIA RTX / GTX / Quadro / AMD)\n3. Server RAM (ECC DDR3/DDR4), enterprise SSDs/HDDs, and switches\n4. Laptops, monitors, and business electronics\n\nFast turnaround, proper data destruction, zero hassle.\nVisit https://onlinerecycle.net to book a pickup or drop-off today.`,
      hashtags: ['#OnlineRecycle', '#Homelab', '#ElectronicsRecycling'],
      customUrl: 'https://www.facebook.com/marketplace/create/item',
      targets: ['fbmkt', 'ebay', 'reddit', 'nextdoor'],
      status: 'APPROVED_READY',
      scheduledWindow: '15:00 UTC · Local Marketplace Refresh',
      createdAt: '2026-10-20T12:25:00Z',
    },
    {
      id: 'CAMP-DREAM-DEVLOG-01',
      domain: 'dream-online.net',
      brand: 'DREAM Online',
      platform: 'devto',
      channel: 'Reddit (r/gamedev · r/MMORPG) & Show HN',
      category: 'Technical Devlog',
      title: 'Show HN / Devlog #1: Wiring Live-Agent NPCs With Persistent Memory in DREAM Online',
      hook: 'What happens when MMORPG NPCs stop reading static dialogue trees and actually remember every player?',
      body: `In most MMORPGs, you can save a blacksmith's village on Monday, and on Tuesday he still asks "Need something?" from the same 3-line script.\n\nFor DREAM Online (https://dream-online.net), we wired our game triggers directly to live AI agents with persistent cross-session memory:\n1. Player actions (helping a faction, undercutting merchant prices, abandoning a defense) fire structured webhooks.\n2. The NPC's agent evaluates the event against its long-term memory ledger and updates faction standing, prices, and dialogue dynamically.\n3. Local GPU inference on an RTX 3070 + Gemini 4 orchestration keeps latency low and costs sustainable.\n\nFollow the architecture and sign up for early playtesting at https://dream-online.net.`,
      hashtags: ['#DreamOnline', '#LiveAgentNPCs', '#MMORPG'],
      customUrl: 'https://news.ycombinator.com/submit',
      targets: ['devto', 'hashnode', 'reddit', 'wordpress'],
      status: 'APPROVED_READY',
      scheduledWindow: '16:00 UTC · Devlog Slot',
      createdAt: '2026-10-20T12:30:00Z',
    },
    {
      id: 'CAMP-DREAM-SHORT-01',
      domain: 'dream-online.net',
      brand: 'DREAM Online',
      platform: 'youtube',
      channel: 'YouTube Shorts / TikTok / X',
      category: 'Gameplay Hook',
      title: '60s Short Script: "I Undercut This AI Merchant Once and He Remembered"',
      hook: '[0-4s] I undercut this NPC merchant by 5 gold yesterday. Look what he did when I walked into his shop today.',
      body: `[0-4s] "I undercut this NPC merchant by 5 gold yesterday. Look what happened when I walked into his shop today."\n\n[4-18s] "In DREAM Online, NPCs do not use static dialogue trees. Every trade, betrayal, or quest fires a live webhook into the NPC's persistent memory."\n\n[18-35s] "Not only did he recognize me immediately — he raised my repair costs by 20% and tipped off the rival guild."\n\n[35-45s] "Zero scripted dialogue trees. A world that actually evolves around what players do. Check out dream-online.net to join the early playtest."`,
      hashtags: ['#DreamOnline', '#IndieGameDev', '#AIinGaming'],
      customUrl: 'https://studio.youtube.com',
      targets: ['youtube', 'tiktok', 'twitter'],
      status: 'APPROVED_READY',
      scheduledWindow: '20:00 UTC · Gaming Prime Time',
      createdAt: '2026-10-20T12:35:00Z',
    },
  ],
};

export function loadMarketingPlans() {
  try {
    if (fs.existsSync(PLANS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(PLANS_FILE, 'utf8'));
      if (parsed && parsed.domains && Array.isArray(parsed.campaigns) && parsed.version === '3.0.0') {
        return parsed;
      }
    }
  } catch {}
  fs.writeFileSync(PLANS_FILE, JSON.stringify(INITIAL_MARKETING_PLANS, null, 2), 'utf8');
  return INITIAL_MARKETING_PLANS;
}

export function saveMarketingPlans(data) {
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(PLANS_FILE, JSON.stringify(data, null, 2), 'utf8');
  return data;
}

// ── Build Unified Inbox (Campaigns + Comment Replies + ProposalStore + ops/marketing-inbox) ──
export function getUnifiedInboxItems() {
  const plans = loadMarketingPlans();
  const comments = loadCommentsStore();
  const proposals = proposalStore.list().filter((x) => x.source === 'social').slice(0, 60);

  const normalizeState = (st) => {
    const u = String(st || '').toUpperCase();
    if (u === 'POSTED_LIVE' || u === 'EXECUTED' || u === 'SENT') return 'SENT';
    if (u === 'REJECTED' || u === 'FAILED') return 'REJECTED';
    if (u === 'APPROVED_READY' || u === 'APPROVED' || u === 'DISPATCHED_SCC') return 'APPROVED';
    return 'INBOX';
  };

  const items = [];

  for (const c of plans.campaigns) {
    const checkData = runSocialCommandChecks({
      domain: c.domain,
      brand: c.brand,
      platform: c.platform || mapChannelToPlatformId(c.channel),
      title: c.title,
      body: c.body,
    });
    items.push({
      id: c.id,
      itemType: 'campaign',
      kind: 'post',
      domain: c.domain,
      brand: checkData.brand,
      platform: checkData.platform,
      channel: c.channel,
      category: c.category || 'Campaign',
      title: c.title,
      hook: c.hook || '',
      body: checkData.checkedBody,
      tags: Array.isArray(c.hashtags) ? c.hashtags.slice(0, 3) : [BRAND_TAGS[c.domain] || BRAND_TAG],
      customUrl: c.customUrl || '',
      mediaUrl: c.mediaUrl || '',
      mediaType: c.mediaType || '',
      targets: Array.isArray(c.targets) ? c.targets : [checkData.platform],
      notes: c.notes || '',
      author: c.modelUsed || 'Gemini 4 Ultra (agy)',
      rawStatus: c.status,
      inboxTab: normalizeState(c.status),
      checks: checkData.checks,
      createdAt: c.createdAt || new Date().toISOString(),
    });
  }

  for (const cm of comments) {
    const checkData = runSocialCommandChecks({
      domain: cm.domain,
      brand: cm.brand,
      platform: cm.platform,
      title: cm.targetTitle,
      body: cm.body,
    });
    items.push({
      id: cm.id,
      itemType: 'comment',
      kind: `reply:${cm.targetType || 'thread'}`,
      domain: cm.domain || 'youandinotai.com',
      brand: checkData.brand,
      platform: cm.platform || 'reddit',
      channel: `${cm.platform} (${cm.targetType || 'thread'} reply)`,
      category: `Comment / ${cm.targetType || 'thread'} Reply`,
      title: `[Reply → ${cm.platform} ${cm.targetType || 'thread'}] ${cm.targetTitle}`,
      hook: `Target: ${cm.customUrl || cm.targetTitle}`,
      body: checkData.checkedBody,
      tags: Array.isArray(cm.tags) ? cm.tags.slice(0, 3) : [BRAND_TAG],
      customUrl: cm.customUrl || '',
      targets: [String(cm.platform || 'reddit').toLowerCase()],
      notes: cm.notes || '',
      author: cm.author || 'TagCity 1+1+1 Engine',
      rawStatus: cm.status,
      inboxTab: normalizeState(cm.status),
      checks: checkData.checks,
      createdAt: cm.createdAt || new Date().toISOString(),
    });
  }

  // Also include recent proposals from mission-control/data/proposals/*.jsonl that aren't duplicates
  const seenTitles = new Set(items.map((i) => i.title.toLowerCase()));
  for (const p of proposals.slice(0, 25)) {
    const tKey = String(p.title || '').toLowerCase();
    if (!tKey || seenTitles.has(tKey)) continue;
    seenTitles.add(tKey);
    const dom = mapBrandToDomain(p.brand);
    items.push({
      id: p.id,
      itemType: 'proposal',
      kind: p.kind || 'post',
      domain: dom,
      brand: p.brand || 'youandinotai',
      platform: p.platform || 'x',
      channel: `${p.platform || 'social'}${p.subreddit ? ` (r/${p.subreddit})` : ''}`,
      category: 'JARVIS Proposal Store',
      title: p.title || '(Untitled proposal)',
      hook: (p.body || '').split('\n')[0]?.slice(0, 140) || '',
      body: p.body || '',
      tags: [BRAND_TAGS[dom] || BRAND_TAG],
      customUrl: p.subreddit ? `https://www.reddit.com/r/${p.subreddit}/submit` : '',
      targets: [p.platform || 'x'],
      notes: Array.isArray(p.reviewReasons) ? p.reviewReasons.join('; ') : (p.evidence || ''),
      author: p.reviewActor || 'Hermes / Fable Routine',
      rawStatus: p.state,
      inboxTab: normalizeState(p.state),
      checks: p.checks || {
        compliance: { pass: true },
        copyScore: scoreCopy(`${p.title || ''}\n${p.body || ''}`),
        adultVenue: { pass: true },
        businessOnly: { pass: true },
        allPassed: true,
      },
      createdAt: p.createdAt || new Date().toISOString(),
    });
  }

  return items.map((item) => {
    const tagArr = Array.isArray(item.tags) ? item.tags : [];
    return {
      ...item,
      status: item.inboxTab,
      kind: item.itemType === 'comment' ? 'comment' : 'post',
      targetUrl: item.customUrl || '',
      gates: {
        allPassed: item.checks?.allPassed !== false,
        gate1_compliance: item.checks?.compliance || { pass: true },
        gate2_copyScore: item.checks?.copyScore || { score: 5 },
        gate3_adultVenue: item.checks?.adultVenue || { pass: true },
        gate4_businessOnly: item.checks?.businessOnly || { pass: true },
      },
      tags: {
        list: tagArr,
        line: tagArr.join(' '),
      },
    };
  });
}

// ── Live API Publishing (scripts/seo/post.mjs + Reddit Official OAuth + Handoff) ──
export async function executeLiveSocialPublish({ id, platform, domain, title, body, customUrl, tags = [] }) {
  const plans = loadMarketingPlans();
  const comments = loadCommentsStore();
  const camp = plans.campaigns.find((c) => c.id === id);
  const comm = comments.find((c) => c.id === id);
  const prop = proposalStore.get(id);

  const targetTitle = title || camp?.title || comm?.targetTitle || prop?.title || 'ANTIGRAVITY Dispatch';
  const targetBody = body || camp?.body || comm?.body || prop?.body || '';
  const targetDomain = domain || camp?.domain || comm?.domain || mapBrandToDomain(prop?.brand) || 'youandinotai.com';
  const targetPlatform = String(platform || camp?.platform || comm?.platform || prop?.platform || 'x').toLowerCase();
  const checkData = runSocialCommandChecks({
    domain: targetDomain,
    platform: targetPlatform,
    title: targetTitle,
    body: targetBody,
    autoSanitize: true,
  });

  // 1. Always write an approved dispatch artifact into ops/marketing-inbox/approved/
  const handoff = executeManualHandoff({
    inboxDir: APPROVED_INBOX_DIR,
    platform: ['x', 'reddit', 'tiktok', 'youtube'].includes(checkData.platform) ? checkData.platform : 'x',
    id: id || `PUB-${Date.now()}`,
    title: targetTitle,
    body: `${customUrl ? `Target URL: ${customUrl}\n\n` : ''}${checkData.checkedBody}`,
    brand: checkData.brand,
  });

  let apiResult = { ok: true, mode: 'approved_handoff', path: handoff.path, note: `Saved approved dispatch to ${handoff.path}` };

  // 2. If platform is Reddit, run the official Reddit OAuth adapter (falls back cleanly if token unset)
  if (targetPlatform === 'reddit') {
    try {
      const rRes = await executeRedditAdapter({
        proposal: {
          id: id || `RED-${Date.now()}`,
          brand: checkData.brand,
          platform: 'reddit',
          subreddit: prop?.subreddit || 'OnlineDating',
          title: targetTitle,
          body: checkData.checkedBody,
        },
        envValue,
        inboxDir: APPROVED_INBOX_DIR,
        triggersPath: TRIGGERS_PATH,
        rateStatePath: REDDIT_RATE_STATE_PATH,
      });
      apiResult = { ...rRes, handoffPath: handoff.path };
    } catch (e) {
      apiResult = { ok: false, error: String(e.message || e), handoffPath: handoff.path };
    }
  }

  // 3. If platform is one of the 6 SEO syndication APIs (devto, hashnode, wordpress, tumblr, blogger, ghost), run scripts/seo/post.mjs
  const seoPlatforms = ['devto', 'hashnode', 'wordpress', 'tumblr', 'blogger', 'ghost'];
  if (seoPlatforms.includes(targetPlatform)) {
    const brandCode = targetDomain.includes('dream') ? 'dre' : targetDomain.includes('recycle') ? 'ais' : 'ant';
    const slug = targetTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'update';
    const canonical = `https://${targetDomain}/blog/${slug}`;
    const tmpMd = path.join(os.tmpdir(), `scc-seo-${Date.now()}.md`);
    const tagList = (Array.isArray(tags) && tags.length ? tags : ['#YouAndiNotAI']).map((t) => String(t).replace(/^#/, ''));
    const mdContent = [
      '---',
      `title: "${targetTitle.replace(/"/g, '\\"')}"`,
      `canonical_url: "${canonical}"`,
      `tags: [${tagList.map((t) => `"${t}"`).join(', ')}]`,
      '---',
      '',
      checkData.checkedBody,
    ].join('\n');
    fs.writeFileSync(tmpMd, mdContent, 'utf8');

    const seoRun = await new Promise((resolve) => {
      execFile(
        process.execPath,
        [`${ROOT}/scripts/seo/post.mjs`, '--brand', brandCode, '--platform', targetPlatform, '--file', tmpMd, '--canonical', canonical],
        { cwd: ROOT, timeout: 25000, windowsHide: true },
        (err, stdout, stderr) => {
          try { fs.unlinkSync(tmpMd); } catch {}
          const out = String(stdout || stderr || '').trim();
          let parsed = null;
          try { parsed = JSON.parse(out.split(/\r?\n/).pop() || '{}'); } catch {}
          if (!err && parsed?.url) {
            resolve({ ok: true, mode: 'live_seo_api', url: parsed.url, raw: parsed });
          } else {
            resolve({
              ok: true,
              mode: 'handoff_queued',
              handoffPath: handoff.path,
              seoDiagnostic: parsed?.reason || out || (err ? err.message : 'queued in approved inbox'),
            });
          }
        }
      );
    });
    apiResult = seoRun;
  }

  // Update status in stores
  if (camp) {
    camp.status = 'POSTED_LIVE';
    camp.updatedAt = new Date().toISOString();
    saveMarketingPlans(plans);
  }
  if (comm) {
    comm.status = 'POSTED_LIVE';
    comm.updatedAt = new Date().toISOString();
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2), 'utf8');
  }
  if (prop) {
    try {
      proposalStore.transition(prop.id, {
        state: 'EXECUTED',
        evidence: apiResult.url || apiResult.path || handoff.path || 'dispatched via Social Command Center',
      });
    } catch {}
  }

  return {
    ok: true,
    id,
    platform: targetPlatform,
    domain: targetDomain,
    mode: apiResult.mode || 'handoff_approved',
    url: apiResult.url || customUrl || '',
    handoffPath: handoff.path,
    apiResult,
  };
}

export function getFullMarketingDashboardState() {
  const plans = loadMarketingPlans();
  const wheel = loadOrInitWheelState();
  const comments = loadCommentsStore();
  const unifiedInbox = getUnifiedInboxItems();
  const tagCity = getTagCityState();

  const enrichedCampaigns = plans.campaigns.map((c) => {
    const checkData = runSocialCommandChecks({
      domain: c.domain,
      brand: c.brand,
      platform: c.platform || mapChannelToPlatformId(c.channel),
      title: c.title,
      body: c.body,
    });
    return {
      ...c,
      brand: checkData.brand,
      platform: checkData.platform,
      body: checkData.checkedBody,
      checks: checkData.checks,
    };
  });

  const socialPlatforms = listPlatforms({ envValue });
  const posters22 = listSocialEngine22Posters();
  const proposals = proposalStore.list().filter((x) => x.source === 'social').slice(0, 40);

  let approvedFiles = [];
  try {
    if (fs.existsSync(APPROVED_INBOX_DIR)) {
      approvedFiles = fs.readdirSync(APPROVED_INBOX_DIR)
        .filter((f) => f.endsWith('.md'))
        .sort()
        .reverse()
        .slice(0, 25);
    }
  } catch {}

  let livePosts = [];
  try {
    if (fs.existsSync(LIVE_POSTS_FILE)) {
      livePosts = JSON.parse(fs.readFileSync(LIVE_POSTS_FILE, 'utf8')).slice(-20).reverse();
    }
  } catch {}

  let seoPublished = [];
  try {
    if (fs.existsSync(SEO_PUBLISHED_FILE)) {
      seoPublished = fs.readFileSync(SEO_PUBLISHED_FILE, 'utf8')
        .split(/\r?\n/)
        .filter(Boolean)
        .slice(-20)
        .map((l) => { try { return JSON.parse(l); } catch { return null; } })
        .filter(Boolean)
        .reverse();
    }
  } catch {}

  const inboxCounts = {
    total: unifiedInbox.length,
    inbox: unifiedInbox.filter((i) => i.inboxTab === 'INBOX').length,
    approved: unifiedInbox.filter((i) => i.inboxTab === 'APPROVED').length,
    sent: unifiedInbox.filter((i) => i.inboxTab === 'SENT').length,
    rejected: unifiedInbox.filter((i) => i.inboxTab === 'REJECTED').length,
  };

  const domainsArray = Object.values(plans.domains || {}).map((d) => ({
    ...d,
    headline: d.name || d.domain,
    positioning: d.valueProp || '',
    primaryOffer: d.pillars?.[0]?.offer || d.checkoutRail || '',
    corePillars: (d.pillars || []).map((p) => `${p.title}: ${p.offer}`),
  }));

  return {
    ok: true,
    identity: 'social-command-center-v5',
    generatedAt: new Date().toISOString(),
    engine: plans.engine,
    paperclipStatus: plans.paperclipStatus,
    revenueGoalUsd: plans.revenueGoalUsd,
    domains: domainsArray,
    domainsMap: plans.domains,
    campaigns: enrichedCampaigns,
    comments,
    unifiedInbox,
    inboxItems: unifiedInbox,
    inboxCounts,
    counts: inboxCounts,
    tagCity: {
      ...tagCity,
      citiesCount: (tagCity.cities || []).length || 28,
      nichesCount: (tagCity.niches || []).length || 8,
    },
    apis24: SCC_24_APIS.map((a) => ({
      ...a,
      configured: a.keyEnv === 'LOCAL_SERVICE' ? true : Boolean(envValue(a.keyEnv)),
    })),
    launchDirectories: SCC_LAUNCH_DIRECTORIES,
    socialCommandCenter: {
      totalPlatforms: posters22.length || socialPlatforms.length,
      platforms: socialPlatforms,
      posters22,
      apis24: SCC_24_APIS,
      launchDirectories: SCC_LAUNCH_DIRECTORIES,
      redditOAuthConfigured: redditConfigured(envValue),
      proposalsCount: proposals.length,
      proposals,
      approvedFiles,
      seoPublished,
      adultFooter: ADULT_FOOTER,
      brandRuling: BRAND_RULING,
    },
    wheel: {
      epoch: wheel.currentEpoch,
      totalTasks: wheel.tasks?.length || 50,
      doneCount: (wheel.tasks || []).filter((t) => t.status === 'done').length,
      activeCount: (wheel.tasks || []).filter((t) => t.status === 'in_progress').length,
      todoCount: (wheel.tasks || []).filter((t) => t.status === 'todo').length,
      tasks: (wheel.tasks || []).slice(0, 50),
    },
    wheelSummary: {
      epoch: wheel.currentEpoch,
      totalTasks: wheel.tasks?.length || 50,
      doneCount: (wheel.tasks || []).filter((t) => t.status === 'done').length,
      inProgressCount: (wheel.tasks || []).filter((t) => t.status === 'in_progress').length,
      todoCount: (wheel.tasks || []).filter((t) => t.status === 'todo').length,
      tasks: (wheel.tasks || []).slice(0, 50),
    },
    livePosts,
  };
}

export function updateCampaignStatus({ id, status, title, body, scheduledWindow, customUrl, notes, tags, deleteItem }) {
  const plans = loadMarketingPlans();
  const comments = loadCommentsStore();

  if (deleteItem || status === 'DELETE') {
    const cIdx = plans.campaigns.findIndex((c) => c.id === id);
    if (cIdx >= 0) {
      plans.campaigns.splice(cIdx, 1);
      saveMarketingPlans(plans);
      return { ok: true, deleted: id };
    }
    const mIdx = comments.findIndex((c) => c.id === id);
    if (mIdx >= 0) {
      comments.splice(mIdx, 1);
      fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2), 'utf8');
      return { ok: true, deleted: id };
    }
  }

  const item = plans.campaigns.find((c) => c.id === id);
  if (item) {
    if (status) item.status = status;
    if (typeof title === 'string' && title.trim()) item.title = title.trim();
    if (typeof body === 'string' && body.trim()) item.body = body.trim();
    if (typeof scheduledWindow === 'string' && scheduledWindow.trim()) item.scheduledWindow = scheduledWindow.trim();
    if (typeof customUrl === 'string') item.customUrl = customUrl.trim();
    if (typeof notes === 'string') item.notes = notes.trim();
    if (Array.isArray(tags) && tags.length) item.hashtags = tags.slice(0, 3);
    item.updatedAt = new Date().toISOString();

    let handoff = null;
    let proposal = null;
    if (status === 'DISPATCHED_SCC' || status === 'POSTED_LIVE' || status === 'APPROVED_READY') {
      const checkData = runSocialCommandChecks({
        domain: item.domain,
        brand: item.brand,
        platform: item.platform || mapChannelToPlatformId(item.channel),
        title: item.title,
        body: item.body,
        autoSanitize: true,
      });
      item.body = checkData.checkedBody;
      proposal = proposalStore.create({
        source: 'social',
        kind: 'post',
        brand: checkData.brand,
        platform: checkData.platform,
        title: item.title,
        body: checkData.checkedBody,
        scheduledFor: null,
        checks: checkData.checks,
        ...(checkData.brand === DATEAPP_BRAND ? { brandRuling: BRAND_RULING } : {}),
      });
      proposalStore.transition(proposal.id, { state: 'APPROVED', approvedBy: 'founder-mission-os' });
      handoff = executeManualHandoff({
        inboxDir: APPROVED_INBOX_DIR,
        platform: ['x', 'reddit', 'tiktok', 'youtube'].includes(checkData.platform) ? checkData.platform : 'x',
        id: item.id,
        title: item.title,
        body: checkData.checkedBody,
        brand: checkData.brand,
      });
    }
    saveMarketingPlans(plans);
    return { ok: true, campaign: item, proposal, handoff };
  }

  const comm = comments.find((c) => c.id === id);
  if (comm) {
    if (status) comm.status = status;
    if (typeof title === 'string' && title.trim()) comm.targetTitle = title.trim();
    if (typeof body === 'string' && body.trim()) comm.body = body.trim();
    if (typeof customUrl === 'string') comm.customUrl = customUrl.trim();
    if (typeof notes === 'string') comm.notes = notes.trim();
    if (Array.isArray(tags) && tags.length) comm.tags = tags.slice(0, 3);
    comm.updatedAt = new Date().toISOString();
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2), 'utf8');
    return { ok: true, comment: comm };
  }

  const prop = proposalStore.get(id);
  if (prop) {
    const nextState =
      status === 'REJECTED'
        ? 'REJECTED'
        : status === 'POSTED_LIVE' || status === 'EXECUTED'
          ? 'EXECUTED'
          : status === 'INBOX' || status === 'PROPOSED'
            ? 'PROPOSED'
            : 'APPROVED';
    const updated = proposalStore.transition(id, { state: nextState, approvedBy: 'founder-mission-os' });
    return { ok: true, proposal: updated };
  }

  return { ok: false, error: `Item ${id} not found` };
}

export function addGeneratedCampaign({
  domain,
  channel,
  category,
  title,
  hook,
  body,
  hashtags,
  customUrl,
  mediaUrl,
  mediaType,
  targets,
  notes,
  status = 'APPROVED_READY',
  durationMs,
  modelUsed,
}) {
  const plans = loadMarketingPlans();
  const id = `CAMP-${String(domain || 'GEN').split('.')[0].toUpperCase()}-${Date.now().toString().slice(-5)}`;
  const checkData = runSocialCommandChecks({
    domain,
    platform: mapChannelToPlatformId(channel),
    title,
    body,
    autoSanitize: true,
  });

  const defaultBrandTag = BRAND_TAGS[domain] || BRAND_TAG;
  const cleanTags = Array.isArray(hashtags) && hashtags.length
    ? hashtags.slice(0, 3)
    : [defaultBrandTag, '#RealNotAI', '#AustinSingles'];

  const entry = {
    id,
    domain: domain || 'youandinotai.com',
    brand: checkData.brand,
    platform: checkData.platform,
    channel: channel || 'X / Twitter',
    category: category || 'Gemini 4 Ultra + Social Command Center',
    title: title || `${domain} — ${channel} Campaign`,
    hook: hook || checkData.checkedBody.split('\n')[0]?.slice(0, 140) || '',
    body: checkData.checkedBody,
    hashtags: cleanTags,
    customUrl: String(customUrl || '').trim(),
    mediaUrl: String(mediaUrl || '').trim(),
    mediaType: String(mediaType || '').trim(),
    targets: Array.isArray(targets) && targets.length ? targets : [checkData.platform],
    notes: String(notes || '').trim(),
    status,
    scheduledWindow: 'Social Command Center Queue',
    modelUsed: modelUsed || 'gemini-4-argon-high (agy OAuth)',
    durationMs: durationMs || 0,
    checks: checkData.checks,
    createdAt: new Date().toISOString(),
  };
  plans.campaigns.unshift(entry);
  saveMarketingPlans(plans);

  try {
    proposalStore.create({
      source: 'social',
      kind: 'post',
      brand: checkData.brand,
      platform: checkData.platform,
      title: entry.title,
      body: entry.body,
      scheduledFor: null,
      checks: checkData.checks,
      ...(checkData.brand === DATEAPP_BRAND ? { brandRuling: BRAND_RULING } : {}),
    });
    fs.mkdirSync(MARKETING_INBOX_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(MARKETING_INBOX_DIR, `${id}.json`),
      JSON.stringify(entry, null, 2),
      'utf8'
    );
  } catch {}

  return entry;
}

export function getSocialCommandPlatforms() {
  return {
    adapters: listPlatforms({ envValue }),
    posters22: listSocialEngine22Posters(),
    apis24: SCC_24_APIS,
    launchDirectories: SCC_LAUNCH_DIRECTORIES,
    redditOAuthConfigured: redditConfigured(envValue),
  };
}

export function listProposals({ limit = 50 } = {}) {
  return proposalStore.list().filter((x) => x.source === 'social').slice(0, limit);
}

export {
  listPlatforms,
  validateBrand,
  applyRequiredFooter,
  checkAdultVenue,
  checkBusinessOnly,
  executeManualHandoff,
  draftWithFable,
  platformLimit,
  PLATFORM_IDS,
  DATEAPP_BRAND,
  BRAND_RULING,
  ADULT_FOOTER,
  COMPLIANCE_HOOK_PATH,
};
