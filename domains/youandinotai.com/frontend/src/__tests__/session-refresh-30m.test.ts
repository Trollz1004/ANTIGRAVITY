import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../lib/api';

describe('30-minute access token expiry — single-flight refresh rotation', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('deduplicates concurrent 401s into a single /auth/refresh call and keeps the user signed in', async () => {
    localStorage.setItem('access_token', 'expired-access-token-after-30m');
    localStorage.setItem('refresh_token', 'refresh-token-gen-1');

    let refreshCalls = 0;
    const usedRefreshTokens = new Set<string>();

    globalThis.fetch = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const headers = (init?.headers || {}) as Record<string, string>;
        const authHeader = headers['Authorization'] || '';

        if (url.endsWith('/auth/refresh')) {
          refreshCalls += 1;
          const body = JSON.parse(String(init?.body || '{}')) as {
            refresh_token?: string;
          };
          const token = body.refresh_token || '';

          // Simulate network latency so concurrent 401 callers overlap in flight
          await new Promise(resolve => setTimeout(resolve, 25));

          // Backend OPU-47 reuse detection: reusing an already-rotated token revokes all sessions
          if (usedRefreshTokens.has(token)) {
            return new Response(
              JSON.stringify({
                detail: 'Refresh token reuse detected. All sessions revoked.',
              }),
              { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
          }
          usedRefreshTokens.add(token);

          return new Response(
            JSON.stringify({
              access_token: 'fresh-access-token-gen-2',
              refresh_token: 'refresh-token-gen-2',
              token_type: 'bearer',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        if (authHeader === 'Bearer expired-access-token-after-30m') {
          return new Response(
            JSON.stringify({ detail: 'Invalid or expired token' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }

        if (authHeader === 'Bearer fresh-access-token-gen-2') {
          if (url.endsWith('/auth/me')) {
            return new Response(
              JSON.stringify({
                user_id: 'u-1',
                email: 'member1@youandinotai.com',
                display_name: 'Member One',
                bot_shield_verified: true,
                subscription_active: true,
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }
          if (url.endsWith('/matches')) {
            return new Response(
              JSON.stringify([
                { match_id: 'm-1', user_id: 'u-2', display_name: 'Member Two' },
              ]),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }
          if (url.endsWith('/messages/m-1')) {
            return new Response(
              JSON.stringify([
                {
                  id: 'msg-1',
                  sender_id: 'u-2',
                  content: 'Still signed in after 30 minutes!',
                  created_at: '2026-11-16T20:00:00Z',
                },
              ]),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }

        return new Response('Unexpected request', { status: 500 });
      }
    ) as typeof fetch;

    const [me, matches, messages] = await Promise.all([
      api.get<{ user_id: string; bot_shield_verified: boolean }>('/auth/me'),
      api.get<Array<{ match_id: string }>>('/matches'),
      api.get<Array<{ id: string; content: string }>>('/messages/m-1'),
    ]);

    expect(refreshCalls).toBe(1);
    expect(me.user_id).toBe('u-1');
    expect(matches).toHaveLength(1);
    expect(messages[0].content).toBe('Still signed in after 30 minutes!');
    expect(localStorage.getItem('access_token')).toBe(
      'fresh-access-token-gen-2'
    );
    expect(localStorage.getItem('refresh_token')).toBe('refresh-token-gen-2');
  });

  it('clears the in-flight lock after completion so a later 30-minute expiry can refresh again', async () => {
    localStorage.setItem('access_token', 'expired-token-1');
    localStorage.setItem('refresh_token', 'refresh-token-1');

    let refreshCalls = 0;

    globalThis.fetch = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const headers = (init?.headers || {}) as Record<string, string>;
        const authHeader = headers['Authorization'] || '';

        if (url.endsWith('/auth/refresh')) {
          refreshCalls += 1;
          return new Response(
            JSON.stringify({
              access_token: `fresh-token-${refreshCalls}`,
              refresh_token: `refresh-token-${refreshCalls + 1}`,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        if (authHeader.startsWith('Bearer expired-')) {
          return new Response(JSON.stringify({ detail: 'Expired' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ ok: true, auth: authHeader }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    ) as typeof fetch;

    const first = await api.get<{ ok: boolean }>('/auth/me');
    expect(first.ok).toBe(true);
    expect(refreshCalls).toBe(1);

    // Simulate another 30-minute window expiring
    localStorage.setItem('access_token', 'expired-token-2');
    const second = await api.get<{ ok: boolean }>('/auth/me');
    expect(second.ok).toBe(true);
    expect(refreshCalls).toBe(2);
    expect(localStorage.getItem('access_token')).toBe('fresh-token-2');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-token-3');
  });
});
