import { describe, expect, it } from 'vitest';
import { pingService } from './service-health.js';

describe('service identity health contract', () => {
  it('reports a refused connection as down rather than a service mismatch', async () => {
    const result = await pingService(
      { name: 'Date App Backend', url: 'http://127.0.0.1:3200/health' },
      {
        fetchImpl: async () => {
          throw new Error('connect ECONNREFUSED 127.0.0.1:3200');
        },
      },
    );

    expect(result.status).toBe('down');
    expect(result.detail).toBe('connection refused');
  });

  it('reports a successful response with the wrong identity marker as a mismatch', async () => {
    const result = await pingService(
      {
        name: 'Date App Backend',
        url: 'http://127.0.0.1:3200/health',
        expectedServiceMarker: { field: 'status', allowedValues: ['ok', 'degraded'] },
      },
      { fetchImpl: async () => new Response(JSON.stringify({ service: 'legacy-vite' }), { status: 200 }) },
    );

    expect(result.status).toBe('mismatch');
    expect(result.detail).toBe('wrong service response');
  });

  it('accepts the documented degraded Date App response as the correct service identity', async () => {
    const result = await pingService(
      {
        name: 'Date App Backend',
        url: 'http://127.0.0.1:3200/health',
        expectedServiceMarker: { field: 'status', allowedValues: ['ok', 'degraded'] },
      },
      { fetchImpl: async () => new Response(JSON.stringify({ status: 'degraded' }), { status: 503 }) },
    );

    expect(result.status).toBe('up');
    expect(result.detail).toContain('degraded');
  });

  it('reports a required authenticated gateway probe without credentials distinctly from a port outage', async () => {
    const result = await pingService({
      name: 'OmniRoute',
      url: 'http://127.0.0.1:20128/api/v1',
      requiresAuth: true,
      authConfigured: false,
    });

    expect(result.status).toBe('auth-required');
    expect(result.detail).toBe('bridge authorization not configured');
  });
});
