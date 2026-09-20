/**
 * Social command center — platform registry (Phase C, unit 4).
 *
 * Two families of adapter:
 *   - Syndication platforms (dev.to, Hashnode, WordPress, Tumblr, Blogger) —
 *     these reuse the exact env-var naming scripts/seo/post.mjs already
 *     wires up (SEO_<BRAND>_<PLATFORM>_*), so nothing new needs configuring
 *     if that poster already works for a brand.
 *   - Manual-handoff adapters (X via the Grok lane, Reddit, TikTok, YouTube
 *     via the Hermes lane) — there is no API call here on purpose. Approving
 *     one of these writes the approved copy to a file for the human/lane
 *     that actually posts it.
 *
 * Three brands are postable: "DREAM Online", "AI Solutions", and, as of the
 * 2026-09-19 ruling, "youandinotai" (aliases "YouAndINotAI" and "date app").
 * Features, checkout, and the for-sale listing stay frozen (CLAUDE.md,
 * "Date App FROZEN and FOR SALE") — only marketing copy was unfrozen, and
 * only through this proposal pipeline. A youandinotai proposal must also
 * clear checkAdultVenue and checkBusinessOnly below (server.mjs runs both,
 * in addition to the compliance + copy-score checks every brand gets) before
 * a proposal record is ever created, and every such proposal carries
 * `brandRuling: BRAND_RULING` so the ruling travels with the record.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const DATEAPP_BRAND = 'youandinotai';
export const ALLOWED_BRANDS = ['DREAM Online', 'AI Solutions', DATEAPP_BRAND];
export const BRAND_KEYS = { 'DREAM Online': 'DRE', 'AI Solutions': 'AIS', [DATEAPP_BRAND]: 'YAI' };

// Accepted spellings that all resolve to the canonical DATEAPP_BRAND value.
export const DATEAPP_ALIASES = [DATEAPP_BRAND, 'YouAndINotAI', 'date app'];

export const BRAND_RULING = 'marketing unfrozen 2026-09-19; features frozen; listing stays';

/** Resolve aliases to the canonical brand name; otherwise require one of the allowed brands. */
export function validateBrand(brand) {
  const b = String(brand || '').trim();
  if (DATEAPP_ALIASES.some((a) => a.toLowerCase() === b.toLowerCase())) {
    return { ok: true, brand: DATEAPP_BRAND, key: BRAND_KEYS[DATEAPP_BRAND] };
  }
  if (!ALLOWED_BRANDS.includes(b)) {
    return { ok: false, error: `brand must be one of: DREAM Online, AI Solutions, ${DATEAPP_BRAND} (aliases: ${DATEAPP_ALIASES.join(', ')})` };
  }
  return { ok: true, brand: b, key: BRAND_KEYS[b] };
}

// ---- extra gates for the date-app brand only (2026-09-19 ruling) ----------
// Both must pass before server.mjs is allowed to create a youandinotai
// proposal. Neither ever changes app features, checkout, or the listing —
// they only ever gate marketing copy headed for the approval inbox.

// Copy must never target or reference anyone who could be a minor.
const MINOR_TERMS = /\b(teen|teens|teenager|teenagers|minor|minors|underage|under-age|kid|kids|child|children|schools?|students?)\b/i;

// Copy must state or clearly imply an 18-and-over audience.
const ADULT_HINTS = /\b(18\s*\+|18\s*and\s*(?:over|up|older)|18-and-over|adults?[\s-]?only|must\s+be\s+18|ages?\s+18\s*\+|21\s*\+)\b/i;

/**
 * 18-and-over venue check. Rejects any minors-adjacent term outright (even
 * alongside an adult-audience statement — a single mention is enough to
 * fail), and otherwise requires the copy to state or clearly imply an
 * adults-only product.
 */
export function checkAdultVenue(text) {
  const t = String(text || '');
  const minorHit = MINOR_TERMS.exec(t);
  if (minorHit) return { pass: false, reason: 'copy mentions a disallowed minors-adjacent term: ' + minorHit[0] };
  if (!ADULT_HINTS.test(t)) return { pass: false, reason: 'copy does not state or clearly imply an adults-only (18+) product' };
  return { pass: true, reason: null };
}

// Internal governance / doctrine language that must never reach customer copy.
const GOVERNANCE_TERMS = /\b(judge\s+lane|paperclip|doctrine|mission\s+control|jarvis|founder\s+token|omniroute|s1\s+lift|hermes\s+lane|sabretooth)\b/i;

// The sale/listing must never be mentioned in customer-facing copy either.
const SALE_TERMS = /\b(for\s+sale|for-sale|sale\s+listing|listed\s+for\s+sale|listing\s+is\s+live|acquire\s+(?:this|the)\s+(?:app|brand|domain)|buy\s+(?:this|the)\s+(?:app|brand|domain)|frozen\s+for\s+(?:features|feature))\b/i;

/** Business-only check: no internal governance words, no mention of the sale or the listing. */
export function checkBusinessOnly(text) {
  const t = String(text || '');
  const gov = GOVERNANCE_TERMS.exec(t);
  if (gov) return { pass: false, reason: 'copy mentions internal governance language: ' + gov[0] };
  const sale = SALE_TERMS.exec(t);
  if (sale) return { pass: false, reason: 'copy mentions the sale or the listing: ' + sale[0] };
  return { pass: true, reason: null };
}

// Env-var names per syndication platform, exactly matching scripts/seo/post.mjs's PLATFORMS.
const SYNDICATION = {
  devto: { name: 'dev.to', envNames: (B) => [`SEO_${B}_DEVTO_TOKEN`] },
  hashnode: { name: 'Hashnode', envNames: (B) => [`SEO_${B}_HASHNODE_TOKEN`, `SEO_${B}_HASHNODE_PUBLICATION_ID`] },
  wordpress: { name: 'WordPress', envNames: (B) => [`SEO_${B}_WORDPRESS_TOKEN`, `SEO_${B}_WORDPRESS_SITE`] },
  tumblr: {
    name: 'Tumblr',
    envNames: (B) => [`SEO_${B}_TUMBLR_CONSUMER_KEY`, `SEO_${B}_TUMBLR_CONSUMER_SECRET`, `SEO_${B}_TUMBLR_TOKEN`, `SEO_${B}_TUMBLR_TOKEN_SECRET`, `SEO_${B}_TUMBLR_BLOG_ID`],
  },
  blogger: { name: 'Blogger', envNames: (B) => [`SEO_${B}_BLOGGER_TOKEN`, `SEO_${B}_BLOGGER_BLOG_ID`] },
};

// Manual-handoff platforms: no API, no env — approval writes a file for a human/lane to post.
const MANUAL = {
  x: { name: 'X (Grok lane, grok.com path)' },
  reddit: { name: 'Reddit (manual handoff)' },
  tiktok: { name: 'TikTok (manual handoff)' },
  youtube: { name: 'YouTube (Hermes lane)' },
};

export const PLATFORM_IDS = [...Object.keys(SYNDICATION), ...Object.keys(MANUAL)];

/** `GET /api/social/platforms` payload: adapter config presence by env var name only, never values. */
export function listPlatforms({ envValue }) {
  const out = [];
  for (const [id, def] of Object.entries(SYNDICATION)) {
    const envVarNames = ALLOWED_BRANDS.flatMap((brand) => def.envNames(BRAND_KEYS[brand]));
    const configuredByBrand = ALLOWED_BRANDS.some((brand) =>
      def.envNames(BRAND_KEYS[brand]).every((n) => Boolean(envValue(n))));
    out.push({ id, name: def.name, brandScope: ALLOWED_BRANDS, configured: configuredByBrand, envVarNames });
  }
  for (const [id, def] of Object.entries(MANUAL)) {
    out.push({ id, name: def.name, brandScope: ALLOWED_BRANDS, configured: true, envVarNames: [] });
  }
  return out;
}

export function isSyndicationPlatform(id) { return Object.prototype.hasOwnProperty.call(SYNDICATION, id); }
export function isManualPlatform(id) { return Object.prototype.hasOwnProperty.call(MANUAL, id); }

/**
 * Execute a manual-handoff adapter: write the approved copy to
 * ops/marketing-inbox/approved/<date>-<platform>-<id>.md for the lane that
 * actually posts it. Returns { ok, path } or { ok:false, error }.
 */
export function executeManualHandoff({ inboxDir, platform, id, title, body, brand, date = new Date() }) {
  if (!isManualPlatform(platform)) return { ok: false, error: 'not a manual-handoff platform: ' + platform };
  const iso = date.toISOString().slice(0, 10);
  const fileName = `${iso}-${platform}-${id}.md`;
  const full = join(inboxDir, fileName);
  const md = `---\nbrand: ${brand}\nplatform: ${platform}\nid: ${id}\ndate: ${iso}\n---\n\n# ${title || '(untitled)'}\n\n${body || ''}\n`;
  try {
    mkdirSync(inboxDir, { recursive: true });
    writeFileSync(full, md, 'utf8');
    return { ok: true, path: full, fileName };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}

/** True when a syndication platform has every env var it needs for the given brand. */
export function syndicationConfigured({ platform, brand, envValue }) {
  const def = SYNDICATION[platform];
  if (!def) return false;
  const key = BRAND_KEYS[brand];
  if (!key) return false;
  return def.envNames(key).every((n) => Boolean(envValue(n)));
}
