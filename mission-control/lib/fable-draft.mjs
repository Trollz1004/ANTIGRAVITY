/**
 * Fable drafting (2026-09-19 ruling: marketing is unfrozen for the
 * youandinotai brand, and Joshua's own Ollama model `joshlcoleman/Fable` is
 * the mandatory drafting voice for date-app marketing copy — see CLAUDE.md,
 * "Date App FROZEN and FOR SALE"). This module only ever returns a draft
 * plus its check results; it never creates a proposal itself — that only
 * ever happens through POST /api/social/proposals, and only after a human
 * reviews the draft.
 */
import { checkCompliance } from './compliance.mjs';
import { scoreCopy } from './copy-score.mjs';
import { checkAdultVenue, checkBusinessOnly, validateBrand, DATEAPP_BRAND, BRAND_RULING } from './social-adapters.mjs';

export const FABLE_MODEL = 'joshlcoleman/Fable';
export const DEFAULT_OLLAMA_BASE = 'http://127.0.0.1:11434';

// Rough per-platform post length ceilings. Only platforms this dashboard
// already knows about (lib/social-adapters.mjs PLATFORM_IDS) are listed;
// anything else falls back to a conservative default.
export const PLATFORM_LIMITS = {
  x: 280,
  reddit: 10000,
  tiktok: 2200,
  youtube: 5000,
  devto: 60000,
  hashnode: 60000,
  wordpress: 60000,
  tumblr: 4096,
  blogger: 60000,
};

export function platformLimit(platform) {
  return PLATFORM_LIMITS[platform] || 2000;
}

/** The system instruction Fable drafts under. Pure function, easy to test/read. */
export function buildSystemPrompt({ platform, limit }) {
  return [
    'You draft social marketing copy for the youandinotai.com dating app, in Joshua\'s own voice.',
    'Business-only: never mention internal governance, judge lanes, Paperclip, doctrine, Mission Control, JARVIS, or founder tooling, and never mention that the app, its brand, or its domains are for sale or listed.',
    'Adults only: this is an 18-and-over product. State or clearly imply an adults-only audience where the platform allows it, and never mention teens, students, school, or anyone who could be underage.',
    'No promises: never guarantee an outcome (no "you will find love", no guaranteed matches) and never invent user counts or other proof numbers.',
    'No restricted words: stick to the dating-app product itself, never money-sharing or cause-related language of any kind.',
    `Write exactly one post for ${platform}, under ${limit} characters total, ready to publish as-is — no markup, no preamble, no explanation of what you wrote, just the post text.`,
  ].join(' ');
}

/** GET <base>/api/tags -> array of installed model names. Throws on a network/HTTP failure. */
export async function fetchOllamaTags({ base = DEFAULT_OLLAMA_BASE, fetch: fetchImpl } = {}) {
  const r = await fetchImpl(String(base).replace(/\/$/, '') + '/api/tags');
  if (!r.ok) throw new Error('ollama /api/tags ' + r.status);
  const j = JSON.parse(await r.text());
  return (j.models || []).map((m) => m.name);
}

/**
 * Draft one post in the Fable voice for the youandinotai brand.
 * Returns { status, body } shaped for a direct `send(res, status, body)`.
 * Never creates a proposal; the caller decides what to do with the draft.
 */
export async function draftWithFable({
  brand, platform, brief,
  fetch: fetchImpl,
  ollamaBase = DEFAULT_OLLAMA_BASE,
  model = FABLE_MODEL,
  hookPath,
} = {}) {
  const brandCheck = validateBrand(brand);
  if (!brandCheck.ok || brandCheck.brand !== DATEAPP_BRAND) {
    return { status: 400, body: { error: 'Fable drafting is only wired for the youandinotai (date app) brand' } };
  }
  if (!platform) return { status: 400, body: { error: 'platform required' } };
  const briefText = String(brief || '').trim();
  if (!briefText) return { status: 400, body: { error: 'brief required' } };
  if (typeof fetchImpl !== 'function') return { status: 500, body: { error: 'no fetch implementation available' } };

  let tags = [];
  try {
    tags = await fetchOllamaTags({ base: ollamaBase, fetch: fetchImpl });
  } catch (e) {
    return { status: 503, body: { error: 'Fable model not present', detail: String((e && e.message) || e) } };
  }
  // Ollama tags carry a ":tag" suffix (":latest" by default) that a bare
  // model name never includes — match the name with or without one.
  const present = tags.some((t) => t === model || t.split(':')[0] === model);
  if (!present) {
    return { status: 503, body: { error: 'Fable model not present', model } };
  }
  // Use the exact installed tag (e.g. "joshlcoleman/Fable:latest") so the
  // generate call names a model Ollama actually has, not a guess.
  const resolvedModel = tags.find((t) => t === model || t.split(':')[0] === model) || model;

  const limit = platformLimit(platform);
  const system = buildSystemPrompt({ platform, limit });
  let draft = '';
  try {
    const r = await fetchImpl(String(ollamaBase).replace(/\/$/, '') + '/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: resolvedModel, system, prompt: briefText, stream: false }),
    });
    if (!r.ok) throw new Error('ollama /api/generate ' + r.status);
    const j = JSON.parse(await r.text());
    draft = String(j.response || '').trim();
  } catch (e) {
    return { status: 502, body: { error: 'Fable generate failed: ' + String((e && e.message) || e) } };
  }

  const compliance = checkCompliance(draft, { hookPath });
  const copyScore = scoreCopy(draft);
  const adultVenue = checkAdultVenue(draft);
  const businessOnly = checkBusinessOnly(draft);

  return {
    status: 200,
    body: {
      draft, model: resolvedModel, platform, brand: DATEAPP_BRAND, brandRuling: BRAND_RULING,
      checks: { compliance, copyScore, adultVenue, businessOnly },
    },
  };
}
