// Addendum A1: Stream-Safe Redaction Layer for Mission Control (:3130).
// Scrubs live secrets, env setting names, customer PII, private repository names,
// and canonical banned / mission-surface wording from text, JSON, HTML, and HTTP responses.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CANONICAL_HOOK_PATHS = [
  path.resolve(HERE, '..', '.githooks', 'pre-commit-canonical'),
  path.resolve(process.cwd(), '.githooks', 'pre-commit-canonical'),
];

const REDACT_SECRET = '[REDACTED_SECRET]';
const REDACT_SETTING = '[REDACTED_SETTING]';
const REDACT_EMAIL = '[REDACTED_EMAIL]';
const REDACT_PHONE = '[REDACTED_PHONE]';
const REDACT_PII = '[REDACTED_PII]';
const REDACT_CUSTOMER = '[REDACTED_CUSTOMER]';
const REDACT_PRIVATE_REPO = '[REDACTED_PRIVATE_REPO]';
const REDACT_STREAM_SAFE = '[REDACTED_STREAM_SAFE]';

const WRAPPED_SYMBOL = Symbol('missionOsStreamSafeWrapped');

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function splitTopLevelAlternations(pattern) {
  if (!pattern) return [];
  const parts = [];
  let depth = 0;
  let escaped = false;
  let current = '';
  for (let i = 0; i < pattern.length; i += 1) {
    const ch = pattern[i];
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      current += ch;
      escaped = true;
      continue;
    }
    if (ch === '(') {
      depth += 1;
      current += ch;
      continue;
    }
    if (ch === ')' && depth > 0) {
      depth -= 1;
      current += ch;
      continue;
    }
    if (ch === '|' && depth === 0) {
      if (current) parts.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current) parts.push(current);
  return parts;
}

function loadCanonicalHookAlternatives() {
  for (const hookPath of CANONICAL_HOOK_PATHS) {
    try {
      if (!fs.existsSync(hookPath)) continue;
      const raw = fs.readFileSync(hookPath, 'utf8');
      const words = raw.match(/^BANNED_WORDS='([^']+)'/m)?.[1] || '';
      const splits = raw.match(/^BANNED_SPLITS='([^']+)'/m)?.[1] || '';
      return [...splitTopLevelAlternations(words), ...splitTopLevelAlternations(splits)];
    } catch {
      // Try fallback hook path
    }
  }
  return [];
}

function buildMissionWordingRegex() {
  const hookAlternatives = loadCanonicalHookAlternatives();
  const extraSurfacePatterns = [
    ['until', 'no', 'kid', 'in', 'need'].join('[\\s_-]*'),
    ['opus', 'has', 'hands'].join('[\\s_-]*'),
    ['ai', 'collab', '4', 'kids'].join('[\\s_-]*'),
    ['kids', 'in', 'need'].join('[\\s_-]*'),
    ['for', 'the', 'kids'].join('[\\s_-]*'),
    ['child', 'ren', "(?:['’]?s|&#0*39;s?|&apos;s?|&#x0*27;s?)?", '[\\s_-]+', 'hospital'].join(''),
    ['ped', 'iatric', 's?'].join(''),
  ];
  const combined = [...new Set([...hookAlternatives, ...extraSurfacePatterns])]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  return combined.length > 0 ? new RegExp(`(?:${combined.join('|')})`, 'gi') : null;
}

const MISSION_WORDING_RE = buildMissionWordingRegex();

const SECRET_ENV_NAME_RE =
  /^(?:DATABASE_URL|.*_(?:TOKEN|SECRET|PASSWORD|PASSWD|PWD|API_?KEY|ACCESS_?KEY|PRIVATE_?KEY|SERVER_?KEY|AUTH_?KEY|SIGNING_?KEY|ADMIN_?KEY|CLIENT_?KEY|ENCRYPTION_?KEY|MASTER_?KEY|WEBHOOK_?KEY|KEY|DB_URL|CONNECTION_STRING|CONN_STR|CREDENTIALS?|DSN)|(?:TOKEN|SECRET|PASSWORD|PASSWD|API_?KEY|CONNECTION_STRING|CREDENTIALS?)(?:_VALUE|_LIVE|_PRIMARY|_BACKUP|_V\d+)?)$/i;

function isSecretEnvName(name) {
  if (!name || typeof name !== 'string') return false;
  if (/^NON_?SECRET(?:_|$)/i.test(name)) return false;
  if (name === 'PUBLIC_KEY' || name.endsWith('_PUBLIC_KEY')) return false;
  return SECRET_ENV_NAME_RE.test(name);
}

function buildEnvSecretRegex(env) {
  if (!env || typeof env !== 'object') return null;
  const secrets = new Set();
  for (const [key, rawVal] of Object.entries(env)) {
    if (!isSecretEnvName(key)) continue;
    if (typeof rawVal !== 'string') continue;
    const val = rawVal.trim();
    if (val.length < 6) continue;
    if (val.startsWith('[REDACTED_') || val === 'LOCAL_SERVICE') continue;
    secrets.add(val);
  }
  if (secrets.size === 0) return null;
  const sorted = [...secrets].sort((a, b) => b.length - a.length).map(escapeRegExp);
  return new RegExp(sorted.join('|'), 'g');
}

// Category 1 pattern matchers (bounded quantifiers to prevent polynomial backtracking)
const CONN_STRING_CRED_RE =
  /(?<![A-Za-z0-9+.-])([a-zA-Z][a-zA-Z0-9+.-]{0,20}:\/\/[^:@/\s]{1,128}:)([^@/\s]{1,256})(@)/g;
const BEARER_AUTH_RE = /\b(Bearer|Basic)\s+(?!\[REDACTED_|<)([A-Za-z0-9\-_.~+/=]{6,2048})/gi;
const TELEGRAM_BOT_URL_RE = /\/bot\d{6,12}:[A-Za-z0-9_-]{16,128}/g;
const VENDOR_TOKEN_RE =
  /\b(?:github_pat_[A-Za-z0-9_]{12,}|gh[oprsu]_[A-Za-z0-9]{12,}|(?:sk|rk)[-_][A-Za-z0-9_-]{10,}|AIza[A-Za-z0-9_-]{12,}|EAAA[A-Za-z0-9_-]{12,}|eyJ[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}|\d{6,12}:AA[A-Za-z0-9_-]{16,}|SG\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}|xox[baprs]-[A-Za-z0-9-]{12,}|AKIA[A-Z0-9]{12,}|(?:hf|ntn|vck)_[A-Za-z0-9]{16,}|xai-[A-Za-z0-9]{16,})\b/g;

const NON_SECRET_PLACEHOLDER_WORDS = new Set([
  'true',
  'false',
  'null',
  'undefined',
  'none',
  'empty',
  'missing',
  'required',
  'configured',
  'unconfigured',
  'redacted',
  'expired',
  'stale',
  'invalid',
  'valid',
  'header',
  'string',
  'boolean',
  'number',
  'bearer',
  'basic',
]);

const HEADER_VALUE_RE =
  /(?<![A-Za-z0-9_-])((?:X-Mission-OS-Token|X-API-Key|X-Auth-Token|Authorization)\s*:\s*)(?!(?:\[REDACTED_|<|(?:Bearer|Basic)\s))([^\s,;'"<>]{6,})/gi;
const INLINE_SECRET_KEY_WORDS =
  '(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|webhook[_-]?secret|session[_-]?id|sessionid|password|passwd|secret|token)';
const INLINE_KV_QUOTED_RE = new RegExp(
  `(?<![A-Za-z0-9_-])((?:"${INLINE_SECRET_KEY_WORDS}"|'${INLINE_SECRET_KEY_WORDS}'|${INLINE_SECRET_KEY_WORDS})\\s*[:=]\\s*)(?:"([^"\\r\\n]{4,})"|'([^'\\r\\n]{4,})')`,
  'gi',
);
const INLINE_KV_UNQUOTED_RE = new RegExp(
  `(?<![A-Za-z0-9_-])((?:"${INLINE_SECRET_KEY_WORDS}"|'${INLINE_SECRET_KEY_WORDS}'|${INLINE_SECRET_KEY_WORDS})\\s*[:=]\\s*)([A-Za-z0-9\\-_.+/=]{6,})`,
  'gi',
);

// Category 2 setting names (strictly case-sensitive)
const EXPLICIT_SETTING_NAMES = [
  'ORC_NOTIFY_TELEGRAM_TOKEN',
  'ORC_NOTIFY_TELEGRAM_CHAT',
  'HERMES_LEADGEN_TOKEN',
  'OBSIDIAN_REST_API_KEY',
  'SQUARE_ACCESS_TOKEN',
  'SWARM_COMMAND_TOKEN',
  'TELEGRAM_HOME_CHAT',
  'OFFICIAL_VOTE_TOKEN',
  'FLEET_SHARED_TOKEN',
  'TELEGRAM_BOT_TOKEN',
  'OLLAMA_GUARD_TOKEN',
  'DREAM_ENGINE_TOKEN',
  'POSTGRES_PASSWORD',
  'ANTHROPIC_API_KEY',
  'OMNIROUTE_API_KEY',
  'OMNI_ROUTE_API_KEY',
  'ONEMIN_SHIM_TOKEN',
  'MISSION_OS_TOKEN',
  'MISSION_MCP_TOKEN',
  'PANDA_ROUTER_TOKEN',
  'OBSIDIAN_API_KEY',
  'SENDGRID_API_KEY',
  'AI_MEMORY_TOKEN',
  'FCC_GUARD_TOKEN',
  'ENCRYPTION_KEY',
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
  'OPENAI_API_KEY',
  'API_SERVER_KEY',
  'DATABASE_URL',
  'JWT_SECRET',
  'SENTRY_DSN',
];
const SETTING_NAME_RE = new RegExp(
  `(?<![A-Z0-9_])(?!REDACTED_)(?:${EXPLICIT_SETTING_NAMES.join('|')}|[A-Z][A-Z0-9_]{1,}_(?:TOKEN|API_KEY|SECRET|PASSWORD|PASSWD|PWD|CHAT_ID|DB_URL|CONNECTION_STRING|ACCESS_KEY|WEBHOOK_SECRET|PRIVATE_KEY|DATABASE_URL|SERVER_KEY|CLIENT_SECRET|SIGNING_KEY|BOT_TOKEN|ACCESS_TOKEN|ENCRYPTION_KEY|DSN))(?![A-Z0-9_])`,
  'g',
);

// Category 3 PII patterns
const EMAIL_RE =
  /(?<![A-Za-z0-9._%+-])[A-Za-z0-9._%+-]{1,64}@(?:[A-Za-z0-9-]{1,63}\.)+(?!(?:service|png|jpg|jpeg|webp|svg|gif|css|mjs|js|json|html|woff2?)\b)[A-Za-z]{2,24}\b/g;
const SSN_RE = /(?<![\d.-])\b\d{3}-\d{2}-\d{4}\b(?![\d.-])/g;
const PHONE_NANP_RE =
  /(?<![\w-]|\d\.)(?:\(?1\)?[\s.-])?(?:\(\d{3}\)[\s.-]?|\d{3}[\s.-])\d{3}[\s.-]\d{4}(?![\w-]|\.\d)/g;
const PHONE_INTL_RE = /(?<![\w+]|\d\.)\+\d{1,3}(?:[\s.-]?\(?\d{1,4}\)?){2,5}(?![\w-]|\.\d)/g;

// Category 4 private repository names (longest-first)
const PRIVATE_REPO_RE =
  /(?<![A-Za-z0-9_-])(?:Trollz1004\/auto-freelance-hub|Trollz1004\/mission-loop|Trollz1004\/dream-intake|youandinotai\/youandinotai|Ai-Solutions-Store(?:\/[A-Za-z0-9._-]+)?|auto-freelance-hub|mission-loop|dream-intake)(?![A-Za-z0-9_-])/gi;

// JSON object key classifiers
const SETTING_KEY_RE = /^(?:key_?env|token_?env|auth_?token_?env|env_?var|secret_?env|api_?key_?env)$/i;
const CUSTOMER_PII_KEY_RE =
  /^(?:customer_?name|customer_?email|customer_?phone|full_?name|phone|phone_?number|email|email_?address|street_?address|billing_?address|shipping_?address|home_?address|dob|date_?of_?birth|ssn)$/i;
const SENSITIVE_KEY_RE =
  /^(?:.*(?:token|secret|password|passwd|pwd|apikey|api_key|access_key|private_key|signing_key|server_key|session_?id|connection_?string|database_?url|db_?url|credentials?|cookies?)|authorization|auth_?header|bearer)$/i;
const NON_SECRET_METADATA_SUFFIX_RE =
  /(?:env|configured|length|count|status|enabled|required|present|preview|source|header_?name)$/i;

function maskAllStrings(value, placeholder, active) {
  if (value == null) return value;
  if (typeof value === 'string') return value ? placeholder : value;
  if (Array.isArray(value)) {
    if (active.has(value)) return value;
    active.add(value);
    const res = value.map((item) => maskAllStrings(item, placeholder, active));
    active.delete(value);
    return res;
  }
  if (typeof value === 'object' && !(value instanceof Date)) {
    if (active.has(value)) return value;
    active.add(value);
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = maskAllStrings(v, placeholder, active);
    }
    active.delete(value);
    return out;
  }
  return value;
}

/**
 * Redacts all 5 Addendum A1 categories inside plain text.
 * Preserves normal operational telemetry (e.g. T5500, 192.168.0.15:3130, 2026-11-16).
 */
export function redactStreamText(text, { env = process.env } = {}) {
  if (typeof text !== 'string' || !text) return text;
  let out = text;

  // 1. Live secret values from env (longest-first)
  const envSecretRe = buildEnvSecretRegex(env);
  if (envSecretRe) {
    out = out.replace(envSecretRe, REDACT_SECRET);
  }

  // 2. Pattern-detected secrets (Category 1)
  out = out.replace(CONN_STRING_CRED_RE, (full, prefix, pass, at) =>
    pass === REDACT_SECRET ? full : `${prefix}${REDACT_SECRET}${at}`,
  );
  out = out.replace(BEARER_AUTH_RE, (_, scheme) => `${scheme} ${REDACT_SECRET}`);
  out = out.replace(TELEGRAM_BOT_URL_RE, `/bot${REDACT_SECRET}`);
  out = out.replace(VENDOR_TOKEN_RE, REDACT_SECRET);
  out = out.replace(HEADER_VALUE_RE, (full, prefix, val) => {
    if (NON_SECRET_PLACEHOLDER_WORDS.has(val.toLowerCase())) return full;
    return `${prefix}${REDACT_SECRET}`;
  });
  out = out.replace(INLINE_KV_QUOTED_RE, (full, prefix, dqVal, sqVal) => {
    const val = dqVal !== undefined ? dqVal : sqVal;
    if (!val || val.startsWith('[REDACTED_')) return full;
    const quote = dqVal !== undefined ? '"' : "'";
    return `${prefix}${quote}${REDACT_SECRET}${quote}`;
  });
  out = out.replace(INLINE_KV_UNQUOTED_RE, (full, prefix, val) => {
    if (NON_SECRET_PLACEHOLDER_WORDS.has(val.toLowerCase())) return full;
    return `${prefix}${REDACT_SECRET}`;
  });

  // 3. Customer PII (Category 3): email -> SSN -> phone
  out = out.replace(EMAIL_RE, REDACT_EMAIL);
  out = out.replace(SSN_RE, REDACT_PII);
  out = out.replace(PHONE_NANP_RE, REDACT_PHONE);
  out = out.replace(PHONE_INTL_RE, (match) => {
    if (/^\+\d{4}[-/]\d{2}[-/]\d{2}$/.test(match)) return match;
    const digits = match.replace(/\D/g, '').length;
    return digits >= 8 && digits <= 15 ? REDACT_PHONE : match;
  });

  // 4. Private repository names (Category 4)
  out = out.replace(PRIVATE_REPO_RE, REDACT_PRIVATE_REPO);

  // 5. Env setting names (Category 2, case-sensitive)
  out = out.replace(SETTING_NAME_RE, REDACT_SETTING);

  // 6. Mission / canonical banned wording (Category 5)
  if (MISSION_WORDING_RE) {
    out = out.replace(MISSION_WORDING_RE, REDACT_STREAM_SAFE);
  }

  return out;
}

function redactJsonWalk(value, env, active) {
  if (value == null) return value;
  if (typeof value === 'string') return redactStreamText(value, { env });
  if (typeof value !== 'object' || value instanceof Date) return value;

  if (active.has(value)) return value;
  active.add(value);

  if (Array.isArray(value)) {
    const out = value.map((item) => redactJsonWalk(item, env, active));
    active.delete(value);
    return out;
  }

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    const safeKey = redactStreamText(k, { env });
    if (SETTING_KEY_RE.test(k)) {
      if (typeof v === 'string' && v.trim() && v.trim() !== 'LOCAL_SERVICE') {
        out[safeKey] = REDACT_SETTING;
      } else {
        out[safeKey] = v;
      }
      continue;
    }
    if (CUSTOMER_PII_KEY_RE.test(k)) {
      out[safeKey] = maskAllStrings(v, REDACT_CUSTOMER, active);
      continue;
    }
    if (SENSITIVE_KEY_RE.test(k) && !NON_SECRET_METADATA_SUFFIX_RE.test(k)) {
      out[safeKey] = maskAllStrings(v, REDACT_SECRET, active);
      continue;
    }
    out[safeKey] = redactJsonWalk(v, env, active);
  }
  active.delete(value);
  return out;
}

/**
 * Deep-redacts any JSON-shaped value across all 5 Addendum A1 categories.
 */
export function redactStreamJson(value, { env = process.env } = {}) {
  return redactJsonWalk(value, env, new Set());
}

/**
 * Redacts HTML content while preserving markup tags, structure, and normal UI text.
 */
export function redactStreamHtml(html, { env = process.env } = {}) {
  return redactStreamText(html, { env });
}

function normalizeMime(rawContentType) {
  if (Array.isArray(rawContentType)) {
    rawContentType = rawContentType[0];
  }
  return String(rawContentType || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
}

function classifyMime(mime) {
  if (!mime) return 'unknown';
  if (mime === 'application/json' || mime.endsWith('+json')) return 'json';
  if (mime === 'text/html' || mime === 'application/xhtml+xml') return 'html';
  if (mime === 'text/event-stream') return 'sse';
  if (
    mime.startsWith('text/') ||
    mime === 'application/javascript' ||
    mime === 'text/javascript' ||
    mime === 'application/x-javascript' ||
    mime === 'application/xml' ||
    mime.endsWith('+xml') ||
    mime === 'application/x-ndjson' ||
    mime === 'application/ndjson'
  ) {
    return 'text';
  }
  return 'binary';
}

function stripContentLengthFromHeaders(headersArg) {
  if (!headersArg) return headersArg;
  if (Array.isArray(headersArg)) {
    if (headersArg.length > 0 && Array.isArray(headersArg[0])) {
      return headersArg.filter(([k]) => String(k).toLowerCase() !== 'content-length');
    }
    const out = [];
    for (let i = 0; i < headersArg.length; i += 2) {
      if (String(headersArg[i]).toLowerCase() !== 'content-length') {
        out.push(headersArg[i], headersArg[i + 1]);
      }
    }
    return out;
  }
  if (typeof headersArg === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(headersArg)) {
      if (k.toLowerCase() !== 'content-length') {
        out[k] = v;
      }
    }
    return out;
  }
  return headersArg;
}

function extractContentTypeFromHeaders(headersArg) {
  if (!headersArg) return null;
  if (Array.isArray(headersArg)) {
    if (headersArg.length > 0 && Array.isArray(headersArg[0])) {
      for (const [k, v] of headersArg) {
        if (String(k).toLowerCase() === 'content-type') return v;
      }
      return null;
    }
    for (let i = 0; i < headersArg.length; i += 2) {
      if (String(headersArg[i]).toLowerCase() === 'content-type') return headersArg[i + 1];
    }
    return null;
  }
  if (typeof headersArg === 'object') {
    for (const [k, v] of Object.entries(headersArg)) {
      if (k.toLowerCase() === 'content-type') return v;
    }
  }
  return null;
}

function parseWriteArgs(chunk, encodingOrCb, maybeCb) {
  let encoding = 'utf8';
  let cb;
  if (typeof encodingOrCb === 'function') {
    cb = encodingOrCb;
  } else if (typeof encodingOrCb === 'string') {
    encoding = encodingOrCb;
    if (typeof maybeCb === 'function') cb = maybeCb;
  } else if (typeof maybeCb === 'function') {
    cb = maybeCb;
  }
  return { chunk, encoding, cb };
}

function chunkToString(chunk, encoding = 'utf8') {
  if (typeof chunk === 'string') return chunk;
  const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
  return buf.toString(encoding === 'buffer' ? 'utf8' : encoding);
}

function looksBinaryBuffer(chunk) {
  if (typeof chunk === 'string') return false;
  const buf = Buffer.isBuffer(chunk) ? chunk : chunk instanceof Uint8Array ? Buffer.from(chunk) : null;
  if (!buf || buf.length < 4) return false;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true; // PNG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true; // JPEG
  if (buf.subarray(0, 4).toString('ascii') === 'GIF8') return true; // GIF
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  )
    return true;
  if (buf.subarray(0, 4).toString('ascii') === 'wOF2' || buf.subarray(0, 4).toString('ascii') === '%PDF') return true;
  if (buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04) return true; // ZIP
  if (buf[0] === 0x1f && buf[1] === 0x8b) return true; // GZIP
  if (buf[0] === 0x00 && buf[1] === 0x61 && buf[2] === 0x73 && buf[3] === 0x6d) return true; // WASM
  return false;
}

/**
 * Wraps a Node http.ServerResponse (or compatible mock) so all text/JSON/HTML/SSE
 * output is automatically redacted for Addendum A1 before leaving the server.
 */
export function wrapStreamSafeResponse(res, { env = process.env } = {}) {
  if (!res || res[WRAPPED_SYMBOL]) return res;
  res[WRAPPED_SYMBOL] = true;

  const origSetHeader = typeof res.setHeader === 'function' ? res.setHeader.bind(res) : null;
  const origWriteHead = typeof res.writeHead === 'function' ? res.writeHead.bind(res) : null;
  const origWrite = typeof res.write === 'function' ? res.write.bind(res) : null;
  const origEnd = typeof res.end === 'function' ? res.end.bind(res) : null;

  let trackedContentType = '';
  const bufferedChunks = [];
  let allBufferedAreBuffers = true;
  let hasBufferedChunks = false;
  let ended = false;
  let flushing = false;

  function currentMime() {
    const raw = trackedContentType || (typeof res.getHeader === 'function' ? res.getHeader('content-type') : '') || '';
    return normalizeMime(raw);
  }

  function isRedactableKind(kind) {
    return kind === 'json' || kind === 'html' || kind === 'sse' || kind === 'text';
  }

  function withFlushing(fn) {
    flushing = true;
    try {
      return fn();
    } finally {
      flushing = false;
    }
  }

  function forwardOrigEnd(payload, cb) {
    return withFlushing(() => {
      if (payload === undefined) {
        return cb ? origEnd(cb) : origEnd();
      }
      if (typeof payload === 'string') {
        return cb ? origEnd(payload, 'utf8', cb) : origEnd(payload, 'utf8');
      }
      return cb ? origEnd(payload, cb) : origEnd(payload);
    });
  }

  if (origSetHeader) {
    res.setHeader = function setHeaderSafe(name, value) {
      const lower = String(name || '').toLowerCase();
      if (lower === 'content-type') {
        trackedContentType = Array.isArray(value) ? String(value[0] || '') : String(value || '');
        const kind = classifyMime(normalizeMime(trackedContentType));
        if (isRedactableKind(kind) && !res.headersSent && typeof res.removeHeader === 'function') {
          res.removeHeader('content-length');
        }
      } else if (lower === 'content-length') {
        const kind = classifyMime(currentMime());
        if (isRedactableKind(kind)) {
          return res;
        }
      }
      return origSetHeader(name, value);
    };
  }

  if (origWriteHead) {
    res.writeHead = function writeHeadSafe(statusCode, reasonOrHeaders, maybeHeaders) {
      let reason;
      let headersArg;
      if (typeof reasonOrHeaders === 'string') {
        reason = reasonOrHeaders;
        headersArg = maybeHeaders;
      } else {
        headersArg = reasonOrHeaders;
      }
      const explicitCt = extractContentTypeFromHeaders(headersArg);
      if (explicitCt != null) {
        trackedContentType = Array.isArray(explicitCt) ? String(explicitCt[0] || '') : String(explicitCt || '');
      }
      const kind = classifyMime(currentMime());
      if (isRedactableKind(kind)) {
        if (!res.headersSent && typeof res.removeHeader === 'function') {
          res.removeHeader('content-length');
        }
        headersArg = stripContentLengthFromHeaders(headersArg);
      }
      if (reason !== undefined) {
        return headersArg !== undefined
          ? origWriteHead(statusCode, reason, headersArg)
          : origWriteHead(statusCode, reason);
      }
      return headersArg !== undefined ? origWriteHead(statusCode, headersArg) : origWriteHead(statusCode);
    };
  }

  function redactBufferedBody(kind, rawBody) {
    if (!rawBody) return rawBody;
    if (kind === 'json') {
      try {
        const parsed = JSON.parse(rawBody);
        return JSON.stringify(redactStreamJson(parsed, { env }));
      } catch {
        return redactStreamText(rawBody, { env });
      }
    }
    if (kind === 'html') {
      return redactStreamHtml(rawBody, { env });
    }
    return redactStreamText(rawBody, { env });
  }

  function redactStreamingChunk(chunk, encoding) {
    const text = chunkToString(chunk, encoding);
    const redacted = redactStreamText(text, { env });
    if (Buffer.isBuffer(chunk) || chunk instanceof Uint8Array) {
      return Buffer.from(redacted, 'utf8');
    }
    return redacted;
  }

  if (origWrite) {
    res.write = function writeSafe(rawChunk, encodingOrCb, maybeCb) {
      if (flushing) {
        return origWrite(rawChunk, encodingOrCb, maybeCb);
      }
      const { chunk, encoding, cb } = parseWriteArgs(rawChunk, encodingOrCb, maybeCb);
      const kind = classifyMime(currentMime());

      if (kind === 'binary' || (kind === 'unknown' && looksBinaryBuffer(chunk))) {
        return origWrite(rawChunk, encodingOrCb, maybeCb);
      }
      if (kind === 'json' || kind === 'html') {
        if (chunk !== undefined) {
          hasBufferedChunks = true;
          if (!Buffer.isBuffer(chunk) && !(chunk instanceof Uint8Array)) {
            allBufferedAreBuffers = false;
          }
          bufferedChunks.push(chunkToString(chunk, encoding));
        }
        if (cb) cb();
        return true;
      }

      if (chunk === undefined) {
        return origWrite(rawChunk, encodingOrCb, maybeCb);
      }
      const outChunk = redactStreamingChunk(chunk, encoding);
      if (typeof outChunk === 'string') {
        return cb ? origWrite(outChunk, 'utf8', cb) : origWrite(outChunk, 'utf8');
      }
      return cb ? origWrite(outChunk, cb) : origWrite(outChunk);
    };
  }

  if (origEnd) {
    res.end = function endSafe(rawChunk, encodingOrCb, maybeCb) {
      if (ended) {
        return origEnd();
      }
      ended = true;

      let chunk = rawChunk;
      let encoding = 'utf8';
      let cb;
      if (typeof rawChunk === 'function') {
        cb = rawChunk;
        chunk = undefined;
      } else {
        ({ chunk, encoding, cb } = parseWriteArgs(rawChunk, encodingOrCb, maybeCb));
      }

      const kind = classifyMime(currentMime());

      if (
        kind === 'binary' ||
        (kind === 'unknown' && !hasBufferedChunks && chunk !== undefined && looksBinaryBuffer(chunk))
      ) {
        return withFlushing(() => origEnd(rawChunk, encodingOrCb, maybeCb));
      }

      if (kind === 'json' || kind === 'html') {
        if (chunk !== undefined) {
          hasBufferedChunks = true;
          if (!Buffer.isBuffer(chunk) && !(chunk instanceof Uint8Array)) {
            allBufferedAreBuffers = false;
          }
          bufferedChunks.push(chunkToString(chunk, encoding));
        }
        if (!hasBufferedChunks) {
          return forwardOrigEnd(undefined, cb);
        }
        const rawBody = bufferedChunks.join('');
        const redactedBody = redactBufferedBody(kind, rawBody);
        const payload = allBufferedAreBuffers ? Buffer.from(redactedBody, 'utf8') : redactedBody;
        return forwardOrigEnd(payload, cb);
      }

      if (chunk === undefined) {
        return forwardOrigEnd(undefined, cb);
      }
      return forwardOrigEnd(redactStreamingChunk(chunk, encoding), cb);
    };
  }

  return res;
}
