export type ServiceState = 'up' | 'down' | 'mismatch' | 'auth-required' | 'auth-rejected' | 'not-configured';

export interface ExpectedServiceMarker {
  field: string;
  allowedValues: readonly string[];
}

export interface ServiceProbe {
  name: string;
  url: string;
  timeoutMs?: number;
  lanReachable?: boolean;
  headers?: Record<string, string>;
  openUrl?: string;
  expectedServiceMarker?: ExpectedServiceMarker;
  requiresAuth?: boolean;
  authConfigured?: boolean;
  /** Use only when the service has no documented identity response yet. */
  anyHttpResponseMeansReachable?: boolean;
}

export interface ServiceStatus {
  name: string;
  url: string;
  openUrl: string;
  lanReachable: boolean;
  status: ServiceState;
  ms: number;
  detail: string;
  checkedAt: string;
  expectedServiceMarker?: string;
}

export interface ServiceHealthOptions {
  fetchImpl?: typeof fetch;
  now?: () => number;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function transportDetail(error: unknown, timeoutMs: number): string {
  if (error instanceof Error && error.name === 'AbortError') return `timeout (${timeoutMs}ms)`;
  const message = error instanceof Error ? error.message : String(error);
  if (/ECONNREFUSED|connection refused/i.test(message)) return 'connection refused';
  if (/ENOTFOUND|EHOSTUNREACH|network/i.test(message)) return 'network unreachable';
  return 'unreachable';
}

function markerDescription(marker?: ExpectedServiceMarker): string | undefined {
  return marker ? `${marker.field}=${marker.allowedValues.join('|')}` : undefined;
}

/**
 * Probes reachability and, where available, verifies the identity of the
 * service that responded. A listening but unexpected application is a
 * mismatch, never an UP result.
 */
export async function pingService(probe: ServiceProbe, options: ServiceHealthOptions = {}): Promise<ServiceStatus> {
  const timeoutMs = probe.timeoutMs ?? 2500;
  const now = options.now ?? Date.now;
  const fetchImpl = options.fetchImpl ?? fetch;
  const started = now();
  const checkedAt = new Date().toISOString();
  const base = {
    name: probe.name,
    url: probe.url,
    openUrl: probe.openUrl ?? probe.url,
    lanReachable: probe.lanReachable ?? false,
    expectedServiceMarker: markerDescription(probe.expectedServiceMarker),
  };

  if (!probe.url.trim()) {
    return { ...base, status: 'not-configured', ms: 0, detail: 'status probe not configured', checkedAt };
  }

  if (probe.requiresAuth && !probe.authConfigured) {
    return { ...base, status: 'auth-required', ms: 0, detail: 'bridge authorization not configured', checkedAt };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(probe.url, { signal: controller.signal, headers: probe.headers });
    const ms = now() - started;
    const authGated = response.status === 401 || response.status === 403;
    if (authGated) {
      return {
        ...base,
        status: probe.authConfigured ? 'auth-rejected' : 'auth-required',
        ms,
        detail: probe.authConfigured ? 'bridge authorization rejected' : 'bridge authorization required',
        checkedAt,
      };
    }

    let body: Record<string, unknown> | null = null;
    try {
      body = asRecord(await response.json());
    } catch {
      body = null;
    }

    if (probe.expectedServiceMarker) {
      const marker = probe.expectedServiceMarker;
      const value = body?.[marker.field];
      if (!marker.allowedValues.includes(String(value))) {
        return {
          ...base,
          status: 'mismatch',
          ms,
          detail: 'wrong service response',
          checkedAt,
        };
      }
      return {
        ...base,
        status: 'up',
        ms,
        detail: String(value) === 'degraded' ? 'identified service reports degraded' : 'identified service response verified',
        checkedAt,
      };
    }

    if (response.ok || probe.anyHttpResponseMeansReachable) {
      const count = Array.isArray(body?.data) ? body.data.length : Array.isArray(body?.models) ? body.models.length : null;
      return {
        ...base,
        status: 'up',
        ms,
        detail: count === null ? 'OK' : `OK · ${count} models`,
        checkedAt,
      };
    }

    return { ...base, status: 'down', ms, detail: `HTTP ${response.status}`, checkedAt };
  } catch (error) {
    return {
      ...base,
      status: 'down',
      ms: now() - started,
      detail: transportDetail(error, timeoutMs),
      checkedAt,
    };
  } finally {
    clearTimeout(timer);
  }
}
