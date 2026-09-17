/**
 * Server-side redactor (Phase C, unit 1) — applied to every new API response
 * added in this phase before it leaves the server. Masks API keys, bearer
 * tokens, session ids, passwords, connection strings, and any email address
 * other than Joshua's own (joshlcoleman@gmail.com) to "first 4 chars + ****".
 *
 * Pure functions, no side effects, no network. Two passes:
 *   1. key-hint pass — a value under an obviously secret-shaped field name
 *      (password, token, apiKey, sessionId, ...) is masked outright.
 *   2. pattern pass  — every string (values, or plain prose) is scanned for
 *      recognisable secret shapes (bearer headers, known key prefixes,
 *      connection-string credentials, "key=value" pairs, emails) even when
 *      the surrounding field name gives no hint.
 */

export const ALLOWED_EMAIL = 'joshlcoleman@gmail.com';

/** "first4chars****" — never echoes the rest of the value. */
export function maskValue(v, keepFirst = 4) {
  const s = String(v == null ? '' : v);
  if (!s) return s;
  return s.slice(0, keepFirst) + '****';
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// Field names that mean "the whole value is a secret" regardless of shape.
const SECRET_KEY_RE = /(api[_-]?key|apikey|access[_-]?token|auth[_-]?token|bearer|secret|password|passwd|pwd|session[_-]?id|sessionid|connection[_-]?string|conn[_-]?str|founder[_-]?token)/i;

// Recognisable secret shapes inside free text, with the capture group that
// holds the sensitive part (group 0 means "the whole match").
const PATTERNS = [
  // Authorization: Bearer <token>
  { re: /\bBearer\s+([A-Za-z0-9\-_.~+/=]{8,})/gi, group: 1 },
  // Common vendor key prefixes: Anthropic/OpenAI/Stripe (sk-…/sk_…), GitHub
  // (ghp_/gho_/ghu_/ghs_/ghr_), Slack (xox?-), Google (AIza…), AWS (AKIA…),
  // Square (sq0…).
  { re: /\b(sk[-_][A-Za-z0-9_-]{10,}|gh[oprsu]_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{12,}|sq0[a-z]{3}-[A-Za-z0-9_-]{10,})\b/g, group: 1 },
  // Connection-string credentials: proto://user:PASSWORD@host
  { re: /([a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^:@/\s]+:)([^@/\s]+)(@)/g, group: 2 },
  // key=value / token: "value" style pairs anywhere in prose or querystrings.
  { re: /\b((?:api[_-]?key|access[_-]?token|auth[_-]?token|secret|password|passwd|pwd|session[_-]?id|sessionid)\s*[:=]\s*"?)([A-Za-z0-9\-_.]{4,})/gi, group: 2 },
];

/** Redact recognisable secret shapes and non-Joshua emails inside a plain string. */
export function redactString(input) {
  if (typeof input !== 'string' || !input) return input;
  let out = input.replace(EMAIL_RE, (m) => (m.toLowerCase() === ALLOWED_EMAIL ? m : maskValue(m)));
  for (const { re, group } of PATTERNS) {
    out = out.replace(re, (full, ...rest) => {
      const target = group === 0 ? full : rest[group - 1];
      if (!target) return full;
      return full.split(target).join(maskValue(target));
    });
  }
  return out;
}

/** Redact one value, given the field name (if any) it was stored under. */
function redactValue(value, keyHint) {
  if (value == null) return value;
  if (typeof value === 'string') {
    if (keyHint && SECRET_KEY_RE.test(keyHint) && !EMAIL_RE.test(value)) return maskValue(value);
    return redactString(value);
  }
  if (Array.isArray(value)) return value.map((v) => redactValue(v, keyHint));
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = redactValue(v, k);
    return out;
  }
  return value;
}

/** Deep-redact any JSON-shaped value (string, object, array, or primitive). */
export function redact(input) {
  return redactValue(input, '');
}
