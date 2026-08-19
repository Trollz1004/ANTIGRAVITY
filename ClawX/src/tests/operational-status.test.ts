import { describe, expect, it } from 'vitest';
import { probeOperationalIntegration } from '../server/operational-status';

describe('operational integration identity status', () => {
  it('reports not configured without a status URL', async () => {
    const status = await probeOperationalIntegration({ id: 'hermes', name: 'Hermes' });

    expect(status).toMatchObject({ status: 'not-configured', lastSeen: null });
  });

  it('distinguishes an authenticated service response from a service outage', async () => {
    const status = await probeOperationalIntegration(
      { id: 'openclaw', name: 'OpenClaw', statusUrl: 'https://example.invalid/status' },
      { fetchImpl: async () => new Response('', { status: 401 }) },
    );

    expect(status).toMatchObject({ status: 'auth-required', lastSeen: expect.any(String) });
  });

  it('reports a mismatched identity when an expected service marker is absent', async () => {
    const status = await probeOperationalIntegration(
      {
        id: 'openclaw',
        name: 'OpenClaw',
        statusUrl: 'https://example.invalid/status',
        expectedMarker: 'openclaw',
      },
      { fetchImpl: async () => new Response('{"service":"legacy"}', { status: 200 }) },
    );

    expect(status).toMatchObject({ status: 'mismatch', lastSeen: expect.any(String) });
  });

  it('reports connected only when the expected identity marker is present', async () => {
    const status = await probeOperationalIntegration(
      {
        id: 'hermes',
        name: 'Hermes',
        statusUrl: 'https://example.invalid/status',
        expectedMarker: 'hermes',
      },
      { fetchImpl: async () => new Response('{"service":"hermes"}', { status: 200 }) },
    );

    expect(status).toMatchObject({ status: 'connected', lastSeen: expect.any(String) });
  });
});
