import { useEffect, useState } from 'react';
import { apiGet, type Envelope } from './api';

/**
 * React Hook: Polled API Request
 *
 * Repeatedly fetches an API endpoint on an interval and exposes the latest
 * {@link Envelope} response as React state. Uses `useEffect` + `setInterval`
 * with a cancellation flag to prevent state updates after unmount.
 *
 * The hook performs an immediate fetch on mount, then re-fetches every
 * `interval` milliseconds. If `path` changes, the interval is reset.
 *
 * @template T - Expected shape of the API response `details` payload.
 *
 * @param path     - API path to poll (e.g. `'/health/all'`). If the empty
 *                   string is passed, no requests are made.
 * @param interval - Polling interval in milliseconds. Defaults to 10 000 ms (10 seconds).
 *
 * @returns An {@link Envelope<T>} augmented with a `loading` boolean.
 *          While the initial request is in-flight `loading` is `true` and
 *          the envelope fields are seeded with unreachable defaults.
 *          After the first response (successful or not) `loading` becomes `false`.
 *
 * @example
 * ```tsx
 * function HealthPanel() {
 *   const { status, details, loading } = usePoll<HealthAll>('/health/all', 15000);
 *   if (loading) return <Spinner />;
 *   if (status === 'unreachable') return <Error />;
 *   return <pre>{JSON.stringify(details)}</pre>;
 * }
 * ```
 */
export function usePoll<T = any>(path: string, interval = 10000): Envelope<T> & { loading: boolean } {
  // Seed with unreachable defaults so the UI can render a sensible
  // "no connection" state before the first response arrives.
  const [data, setData] = useState<Envelope<T> & { loading: boolean }>({
    status: 'unreachable',
    checked_at: '',
    latency_ms: 0,
    details: null as any,
    error: null,
    loading: true,
  });

  useEffect(() => {
    // Skip polling when no path is provided
    if (!path) return;

    // Cancelled flag prevents `setData` after unmount or path change
    let cancelled = false;

    const tick = async () => {
      const result = await apiGet<T>(path);
      if (!cancelled) setData({ ...result, loading: false });
    };

    // Fetch immediately on mount (no waiting for the first interval tick)
    tick();

    // Schedule recurring polls
    const id = setInterval(tick, interval);

    // Cleanup: stop interval and mark stale
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [path, interval]);

  return data;
}
