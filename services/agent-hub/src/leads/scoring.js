// Lead scoring — heuristic_score is a pure function (no I/O, no network, no DB),
// safe to unit test without a database. oneMinScore is an OPTIONAL enrichment
// layer gated entirely behind process.env.ONEMINAI_API_KEY; it must never throw
// uncaught and must never block a lead insert/update — callers should treat it
// as best-effort and always have heuristic_score as the guaranteed fallback.
//
// Weights below are a reasonable first-pass product decision (not derived from
// any external formula — none was ever exposed by the source Emergent CRM).
// Tune freely; scoring.test.js only asserts on relative ordering and bounds,
// not exact point values, so weight tweaks won't break the test suite.

const SOURCE_WEIGHTS = {
  referral: 20,
  event: 15,
  partner: 15,
  landing_page: 10,
  website: 8,
  social_media: 5,
  cold_outreach: 0
};

const MAX_SCORE = 100;
const MIN_SCORE = 0;

function clamp(n, min = MIN_SCORE, max = MAX_SCORE) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Pure heuristic lead-quality score, 0-100.
 * Signals used (all present on the ported CRM lead shape):
 *   - source: some acquisition channels convert better than others
 *   - contact completeness: phone + email present
 *   - interests: more declared interests = more engaged signup
 *   - engagement: email_opens / email_clicks (capped contribution)
 *   - prior conversion_value: any past conversion is a strong positive signal
 *   - tags: "vip" / "high-value" tags count as a manual override boost
 *
 * @param {object} lead
 * @returns {number} integer 0-100
 */
function heuristic_score(lead) {
  if (!lead || typeof lead !== 'object') return 0;

  let score = 0;

  // Source channel quality (0-20)
  const source = typeof lead.source === 'string' ? lead.source : '';
  score += SOURCE_WEIGHTS[source] ?? 5;

  // Contact completeness (0-15)
  if (lead.email) score += 10;
  if (lead.phone) score += 5;

  // Declared interests (0-15, 5 per interest up to 3)
  const interests = Array.isArray(lead.interests) ? lead.interests : [];
  score += Math.min(interests.length, 3) * 5;

  // Engagement signals (0-25)
  const opens = Number.isFinite(lead.email_opens) ? lead.email_opens : 0;
  const clicks = Number.isFinite(lead.email_clicks) ? lead.email_clicks : 0;
  score += Math.min(opens, 10) * 1.5;
  score += Math.min(clicks, 5) * 2;

  // Prior conversion value is a strong signal (0-15)
  const conversionValue = Number.isFinite(lead.conversion_value) ? lead.conversion_value : 0;
  if (conversionValue > 0) score += 15;

  // Manual-override tags (0-10)
  const tags = Array.isArray(lead.tags) ? lead.tags : [];
  if (tags.includes('vip') || tags.includes('high-value')) score += 10;

  return Math.round(clamp(score));
}

/**
 * Optional AI-assisted scorer via a 1min.AI (OpenAI-compatible) endpoint.
 * Disabled by default — only activates if ONEMINAI_API_KEY is set and truthy.
 * NEVER throws; NEVER blocks the caller for long — has its own timeout and
 * always resolves (falls back to heuristic_score on any failure).
 *
 * @param {object} lead
 * @returns {Promise<number>} integer 0-100
 */
async function oneMinScore(lead) {
  const apiKey = process.env.ONEMINAI_API_KEY;
  const fallback = heuristic_score(lead);

  if (!apiKey || !apiKey.trim()) return fallback;

  const baseUrl = process.env.ONEMINAI_BASE_URL || 'https://api.1min.ai/v1';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.ONEMINAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You score sales/volunteer leads from 0-100 based on quality. Respond with ONLY an integer.'
          },
          { role: 'user', content: JSON.stringify(lead) }
        ],
        max_tokens: 10
      }),
      signal: controller.signal
    });

    if (!res.ok) return fallback;

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    const parsed = parseInt(String(text).trim(), 10);

    if (!Number.isFinite(parsed)) return fallback;
    return Math.round(clamp(parsed));
  } catch {
    // Network error, timeout, abort, bad JSON — always fall back silently.
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { heuristic_score, oneMinScore, SOURCE_WEIGHTS, MAX_SCORE, MIN_SCORE };
