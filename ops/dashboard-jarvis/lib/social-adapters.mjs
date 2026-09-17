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
 * Only two brands are postable: "DREAM Online" and "AI Solutions". A "date
 * app"/"youandinotai" brand is refused everywhere in this module, citing the
 * 2026-09-16 freeze ruling in CLAUDE.md.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const ALLOWED_BRANDS = ['DREAM Online', 'AI Solutions'];
export const BRAND_KEYS = { 'DREAM Online': 'DRE', 'AI Solutions': 'AIS' };

export const FREEZE_MESSAGE =
  'brand "date app"/youandinotai is frozen and for sale as of 2026-09-16 (CLAUDE.md, "Date App FROZEN AND FOR SALE") — no new social posts for it.';

/** Reject a date-app brand with the freeze citation; otherwise require one of the two allowed brands. */
export function validateBrand(brand) {
  const b = String(brand || '').trim();
  if (/date\s*app|youandinotai/i.test(b)) return { ok: false, error: FREEZE_MESSAGE };
  if (!ALLOWED_BRANDS.includes(b)) return { ok: false, error: `brand must be one of: ${ALLOWED_BRANDS.join(', ')}` };
  return { ok: true, brand: b, key: BRAND_KEYS[b] };
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
