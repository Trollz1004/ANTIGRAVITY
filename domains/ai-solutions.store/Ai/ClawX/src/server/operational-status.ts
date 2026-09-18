export type OperationalIntegration = {
  id: 'hermes' | 'openclaw';
  name: string;
  statusUrl?: string;
  expectedMarker?: string;
};

export type OperationalStatus = 'connected' | 'offline' | 'mismatch' | 'auth-required' | 'not-configured';

export type OperationalStatusResult = OperationalIntegration & {
  status: OperationalStatus;
  lastSeen: string | null;
  detail: string;
};

type ProbeDependencies = {
  fetchImpl?: typeof fetch;
  now?: () => Date;
};

/**
 * A reachable port alone is not a trusted integration. A configured identity
 * marker must match the safe response body before the integration is connected.
 * The response body itself is never returned to clients or logs.
 */
export async function probeOperationalIntegration(
  integration: OperationalIntegration,
  dependencies: ProbeDependencies = {},
): Promise<OperationalStatusResult> {
  if (!integration.statusUrl) {
    return { ...integration, status: 'not-configured', lastSeen: null, detail: 'status URL not configured' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  const now = dependencies.now ?? (() => new Date());
  const fetchImpl = dependencies.fetchImpl ?? fetch;

  try {
    const response = await fetchImpl(integration.statusUrl, { signal: controller.signal });
    const observedAt = now().toISOString();

    if (response.status === 401 || response.status === 403) {
      return { ...integration, status: 'auth-required', lastSeen: observedAt, detail: 'service requires authorization' };
    }

    if (!response.ok) {
      return {
        ...integration,
        status: 'mismatch',
        lastSeen: observedAt,
        detail: 'service answered but did not satisfy the expected status contract',
      };
    }

    const expectedMarker = integration.expectedMarker?.trim().toLowerCase();
    if (!expectedMarker) {
      return {
        ...integration,
        status: 'connected',
        lastSeen: observedAt,
        detail: 'service answered status probe; identity marker not configured',
      };
    }

    const safeBody = (await response.text()).slice(0, 16_384).toLowerCase();
    if (!safeBody.includes(expectedMarker)) {
      return {
        ...integration,
        status: 'mismatch',
        lastSeen: observedAt,
        detail: 'service answered but the expected identity marker was absent',
      };
    }

    return { ...integration, status: 'connected', lastSeen: observedAt, detail: 'expected service identity verified' };
  } catch {
    return { ...integration, status: 'offline', lastSeen: null, detail: 'service did not answer status probe' };
  } finally {
    clearTimeout(timer);
  }
}
