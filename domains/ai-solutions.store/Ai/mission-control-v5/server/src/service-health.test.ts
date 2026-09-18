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

    expect(result.status).toBe('DOWN');
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

    expect(result.status).toBe('WRONG SERVICE');
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

    expect(result.status).toBe('UP');
    expect(result.detail).toContain('degraded');
  });

  it('reports a required authenticated gateway probe without credentials distinctly from a port outage', async () => {
    const result = await pingService({
      name: 'OmniRoute',
      url: 'http://192.168.0.8:20128/v1',
      requiresAuth: true,
      authConfigured: false,
    });

    expect(result.status).toBe('AUTH MISSING');
    expect(result.detail).toBe('bridge authorization not configured');
  });

  it('reports an optional onemin-shim as not configured until its explicit status URL is enabled', async () => {
    const result = await pingService({
      name: 'onemin-shim',
      url: '',
      expectedServiceMarker: { field: 'service', allowedValues: ['onemin-shim'] },
    });

    expect(result.status).toBe('NOT CONFIGURED');
    expect(result.detail).toBe('status probe not configured');
  });

  it('reports an unconfigured Date App backend without attempting a retired-host probe', async () => {
    let fetched = false;
    const result = await pingService(
      {
        name: 'Date App Backend',
        url: '',
        expectedServiceMarker: { field: 'status', allowedValues: ['ok', 'degraded'] },
      },
      {
        fetchImpl: async () => {
          fetched = true;
          throw new Error('Date App probe should not run when unconfigured');
        },
      },
    );

    expect(result.status).toBe('NOT CONFIGURED');
    expect(result.detail).toBe('status probe not configured');
    expect(fetched).toBe(false);
  });

  it('reports configured credentials rejected by an authenticated identity endpoint', async () => {
    const result = await pingService(
      {
        name: 'OmniRoute',
        url: 'http://192.168.0.8:20128/v1',
        requiresAuth: true,
        authConfigured: true,
        expectedServiceMarker: { field: 'service', allowedValues: ['omniroute'] },
      },
      { fetchImpl: async () => new Response(null, { status: 403 }) },
    );

    expect(result.status).toBe('AUTH REJECTED');
  });

  it('does not mark an unidentifiable HTTP response as up', async () => {
    const result = await pingService(
      { name: 'Unidentified', url: 'http://127.0.0.1:9999/health' },
      { fetchImpl: async () => new Response(JSON.stringify({ ok: true }), { status: 200 }) },
    );

    expect(result.status).toBe('NOT CONFIGURED');
    expect(result.detail).toBe('identity marker not configured');
  });

  it('accepts an identity response with a documented array-shaped marker', async () => {
    const result = await pingService(
      {
        name: 'Ollama Fail-safe',
        url: 'http://127.0.0.1:11434/api/tags',
        expectedServiceMarker: { field: 'models', requiresArray: true },
      },
      { fetchImpl: async () => new Response(JSON.stringify({ models: [] }), { status: 200 }) },
    );

    expect(result.status).toBe('UP');
  });
});
