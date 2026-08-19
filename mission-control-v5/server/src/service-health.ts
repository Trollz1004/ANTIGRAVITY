export type ServiceState = 'UP' | 'DOWN' | 'WRONG SERVICE' | 'AUTH MISSING' | 'AUTH REJECTED' | 'NOT CONFIGURED';

export interface ExpectedServiceMarker {
  field: string;
  allowedValues?: readonly string[];
  requiresArray?: boolean;
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
  if (!marker) return undefined;
  if (marker.requiresArray) return `${marker.field}=[array]`;
  return `${marker.field}=${(marker.allowedValues ?? []).join('|')}`;
}

function markerMatches(marker: ExpectedServiceMarker, value: unknown): boolean {
  if (marker.requiresArray) return Array.isArray(value);
  return (marker.allowedValues ?? []).includes(String(value));
}

/**
 * Resolves a service only through an expected identity response. A reachable port
 * without an identity rule is NOT CONFIGURED; a different responder is WRONG SERVICE.
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
    return { ...base, status: 'NOT CONFIGURED', ms: 0, detail: 'status probe not configured', checkedAt };
  }
  if (probe.requiresAuth && !probe.authConfigured) {
    return { ...base, status: 'AUTH MISSING', ms: 0, detail: 'bridge authorization not configured', checkedAt };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(probe.url, { signal: controller.signal, headers: probe.headers });
    const ms = now() - started;
    if (response.status === 401 || response.status === 403) {
      return {
        ...base,
        status: probe.authConfigured ? 'AUTH REJECTED' : 'AUTH MISSING',
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

    if (!probe.expectedServiceMarker) {
      return { ...base, status: 'NOT CONFIGURED', ms, detail: 'identity marker not configured', checkedAt };
    }

    const marker = probe.expectedServiceMarker;
    if (!markerMatches(marker, body?.[marker.field])) {
      return { ...base, status: 'WRONG SERVICE', ms, detail: 'wrong service response', checkedAt };
    }

    return {
      ...base,
      status: 'UP',
      ms,
      detail: String(body?.[marker.field]) === 'degraded' ? 'identified service reports degraded' : 'identified service response verified',
      checkedAt,
    };
  } catch (error) {
    return { ...base, status: 'DOWN', ms: now() - started, detail: transportDetail(error, timeoutMs), checkedAt };
  } finally {
    clearTimeout(timer);
  }
}
