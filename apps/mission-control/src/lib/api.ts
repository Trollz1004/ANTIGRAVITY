/**
 * API Client Module
 *
 * Provides typed HTTP helpers for the Ops Control frontend to communicate
 * with the backend API. All requests use AbortController-based timeouts to
 * prevent hanging connections against unresponsive services.
 *
 * The base URL is configured via Vite's `VITE_API_URL` env var. When empty
 * (the default), requests use relative paths so the dashboard works regardless
 * of the origin it is served from (localhost, LAN IP, tunnel, etc.).
 *
 * @module api
 */

/**
 * Base URL for all API requests.
 *
 * Reads `VITE_API_URL` from the Vite environment. A trailing slash is stripped
 * so paths can be appended reliably (e.g. `${API_BASE}/health/all`).
 *
 * To override (e.g. when the Vite dev server runs separately from the API):
 *   echo "VITE_API_URL=http://localhost:8787" > apps/mission-control/.env.local
 */
export const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

/**
 * Standard API response envelope returned by all health-check and service
 * endpoints in the Ops Control backend.
 *
 * @template T - The shape of the `details` payload. Use a specific type
 *               (e.g. `Envelope<RepoDetails>`) for endpoints whose details
 *               are known, or leave as `any` for generic access.
 *
 * @property status       - Service health: `'ok'` | `'degraded'` | `'unreachable'`
 * @property checked_at   - ISO-8601 timestamp of when the check was performed
 * @property latency_ms   - Round-trip time in milliseconds
 * @property details      - Endpoint-specific payload (service-dependent shape)
 * @property error        - Human-readable error message, or `null` on success
 */
export type Envelope<T = any> = {
  status: 'ok' | 'degraded' | 'unreachable';
  checked_at: string;
  latency_ms: number;
  details: T;
  error: string | null;
};

/**
 * Sentinel envelope used as a fallback when a request fails completely
 * (network error, timeout, or non-OK HTTP status).
 */
const UNREACHABLE: Envelope = {
  status: 'unreachable',
  checked_at: '',
  latency_ms: 0,
  details: null,
  error: 'no response',
};

/**
 * Perform a GET request against the API and return a typed envelope.
 *
 * Uses {@link Envelope} as the return type so callers can check `status`
 * and `error` before accessing `details`.
 *
 * @template T - Expected shape of the response `details` payload.
 * @param path    - API path (appended to {@link API_BASE}), e.g. `'/health/all'`.
 * @param timeout - Maximum wait time in milliseconds before aborting. Defaults to 2500 ms.
 * @returns A resolved {@link Envelope<T>} — never rejects. On failure the
 *          envelope will have `status: 'unreachable'` and a descriptive `error`.
 *
 * @example
 * ```ts
 * const env = await apiGet<HealthAll>('/health/all', 15000);
 * if (env.status === 'ok') {
 *   console.log('All services healthy:', env.details);
 * }
 * ```
 */
export async function apiGet<T = any>(path: string, timeout = 2500): Promise<Envelope<T>> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) return { ...UNREACHABLE, error: `HTTP ${res.status}` };
    return await res.json();
  } catch (e: any) {
    clearTimeout(id);
    return { ...UNREACHABLE, error: e?.message ?? 'fetch failed' };
  }
}

/**
 * Perform a POST request with a JSON body.
 *
 * Useful for dispatching tasks, switching models, and triggering operations.
 * Returns the parsed JSON response on success, or `null` on any error.
 *
 * @template T - Expected shape of the successful JSON response body.
 * @param path    - API path (appended to {@link API_BASE}), e.g. `'/tasks/dispatch'`.
 * @param body    - Object to serialize as the JSON request body.
 * @param timeout - Maximum wait time in milliseconds before aborting. Defaults to 5000 ms.
 * @returns Parsed response body, or `null` if the request failed.
 *
 * @example
 * ```ts
 * const result = await apiPost<{ task_id: string }>('/tasks/dispatch', { brief: 'Do thing', agents: ['codex'] });
 * if (result) console.log(result.task_id);
 * ```
 */
export async function apiPost<T = any>(path: string, body: any, timeout = 5000): Promise<T | null> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(id);
    return null;
  }
}

/**
 * Perform a GET request and return a `{ data, error }` result tuple.
 *
 * A higher-level wrapper around {@link apiGet} that unwraps the envelope
 * so callers don't need to inspect `status` manually. When the request fails
 * or the server is unreachable, `data` is `null` and `error` is set.
 *
 * @template T - Expected shape of the response `details` payload.
 * @param path    - API path (appended to {@link API_BASE}).
 * @param timeout - Maximum wait time in milliseconds before aborting. Defaults to 5000 ms.
 * @returns An object with `data` (parsed response or `null`) and `error`
 *          (error message or `null`).
 *
 * @example
 * ```ts
 * const { data, error } = await apiJson<HealthAll>('/health/all');
 * if (error) console.error(error);
 * else setHealth(data);
 * ```
 */
export async function apiJson<T = any>(path: string, timeout = 5000): Promise<{ data: T | null; error: string | null }> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) return { data: null, error: `HTTP ${res.status}` };
    const data: T = await res.json();
    return { data, error: null };
  } catch (e: any) {
    clearTimeout(id);
    return { data: null, error: e?.message ?? 'fetch failed' };
  }
}

/**
 * Low-level fetch with timeout that returns the parsed JSON or an
 * unreachable sentinel. Similar to {@link apiGet} but accepts a full
 * URL (not just a path) and does not wrap the result in an envelope.
 *
 * Used for one-off requests where the caller does not need the full
 * envelope structure.
 *
 * @param url     - Fully-qualified URL to fetch.
 * @param init    - Optional `fetch` init options (method, headers, body, etc.).
 * @param timeout - Maximum wait time in milliseconds before aborting. Defaults to 2500 ms.
 * @returns Parsed JSON response, or `{ status: 'unreachable' }` on error.
 */
export async function fetchWithTimeout(url: string, init?: RequestInit, timeout = 2500): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(id);
    if (!response.ok) throw new Error('Network response not ok');
    return await response.json();
  } catch {
    clearTimeout(id);
    return { status: 'unreachable' };
  }
}
