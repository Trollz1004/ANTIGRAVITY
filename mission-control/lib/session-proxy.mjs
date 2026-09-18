/**
 * Session-stripping proxy helpers (Phase B) — shared by the Hermes router
 * (:9119) and OpenClaw support (:18789) panels. A session/auth token from
 * either service must never reach the browser, so every response header is
 * sanitized before it leaves this server, and every probe reports honest
 * state (reachable/unreachable, TCP open/closed) instead of guessing an
 * identity from an HTML page neither service documents as an API.
 */
import { connect } from 'node:net';

// Header names (case-insensitive) that could carry a session, auth, or cookie value.
const SESSION_HEADER_RE = /^(set-cookie|cookie|authorization|proxy-authorization|x-session-id|x-session-token|x-auth-token|x-api-key)$/i;

/** Strip session/auth/cookie headers from a plain object or a Headers-like iterable. Returns a plain object. */
export function sanitizeHeaders(headers) {
  const out = {};
  const entries = typeof headers?.entries === 'function' ? headers.entries() : Object.entries(headers || {});
  for (const [key, value] of entries) {
    if (SESSION_HEADER_RE.test(key)) continue;
    if (/session/i.test(key)) continue;
    out[key] = value;
  }
  return out;
}

/** Raw TCP reachability, independent of any HTTP semantics — used when a service serves plain HTML with no health JSON. */
export function tcpProbe(host, port, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const socket = connect({ host, port, timeout: timeoutMs });
    const done = (open) => { try { socket.destroy(); } catch {} resolve(open); };
    socket.on('connect', () => done(true));
    socket.on('timeout', () => done(false));
    socket.on('error', () => done(false));
  });
}

/**
 * Probe a service for the router/support panels. Tries an HTTP GET first; a
 * JSON body is reported as `kind: 'json'` with its parsed content (headers
 * already sanitized upstream by the caller if relayed further). Any non-JSON
 * 2xx/3xx/4xx response is `kind: 'html'` — reachable, but not an API this
 * server can interpret — and is followed by a raw TCP check per the spec
 * ("if only HTML, show reachable + TCP"). A network failure falls back to
 * the TCP probe alone.
 */
export async function probeService({ url, host, port, fetchImpl = fetch, timeoutMs = 4000 }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetchImpl(url, { signal: ctrl.signal });
    const contentType = (r.headers && typeof r.headers.get === 'function' ? r.headers.get('content-type') : '') || '';
    const text = await r.text();
    if (/application\/json/i.test(contentType)) {
      let json = null;
      try { json = JSON.parse(text); } catch { /* fall through to html */ }
      if (json) return { reachable: true, status: r.status, kind: 'json', data: json };
    }
    const tcp = await tcpProbe(host, port, timeoutMs);
    return { reachable: true, status: r.status, kind: 'html', tcp };
  } catch (e) {
    clearTimeout(timer);
    const tcp = await tcpProbe(host, port, timeoutMs);
    return { reachable: false, kind: tcp ? 'html' : 'unreachable', tcp, error: String((e && e.message) || e) };
  } finally {
    clearTimeout(timer);
  }
}
