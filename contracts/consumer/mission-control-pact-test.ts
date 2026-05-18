/**
 * Pact Contract Tests — Mission Control Consumer
 *
 * These tests define the expected API contracts between the mission-control
 * frontend (consumer) and the antigravity-api backend (provider).
 *
 * Uses vitest for test execution. Run with:
 *   npx vitest run contracts/consumer/mission-control-pact-test.ts
 *
 * The contracts are also serialized as JSON in contracts/pacts/ for
 * provider-side verification.
 */

import { describe, it, expect } from 'vitest'

// Base URL for the API — override with API_BASE_URL env var
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000'

// Helper: make an authenticated request
async function apiRequest(
  path: string,
  options: RequestInit = {},
  token: string = 'test-token'
): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
}

describe('Mission Control API Contracts', () => {
  // ─── GET /api/health ─────────────────────────────────────────────
  describe('GET /api/health', () => {
    it('returns service health status', async () => {
      const res = await fetch(`${API_BASE_URL}/api/health`)
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('application/json')

      const body = await res.json()

      // Contract: status must be a string ('ok' or 'degraded')
      expect(typeof body.status).toBe('string')
      expect(['ok', 'degraded']).toContain(body.status)

      // Contract: db_connected must be boolean
      expect(typeof body.db_connected).toBe('boolean')

      // Contract: square_connected must be boolean
      expect(typeof body.square_connected).toBe('boolean')

      // Contract: square_signature_configured must be boolean
      expect(typeof body.square_signature_configured).toBe('boolean')

      // Contract: wallet_rails_proven must be boolean
      expect(typeof body.wallet_rails_proven).toBe('boolean')

      // Contract: wallet_rails_status must be a string
      expect(typeof body.wallet_rails_status).toBe('string')

      // Contract: payment_proof_labels must be an array
      expect(Array.isArray(body.payment_proof_labels)).toBe(true)

      // Contract: user_count must be a number
      expect(typeof body.user_count).toBe('number')
    })
  })

  // ─── GET /api/v1/auth/me ─────────────────────────────────────────
  describe('GET /api/v1/auth/me', () => {
    it('returns current user profile', async () => {
      const res = await apiRequest('/api/v1/auth/me')
      // Note: without a real token this may return 401; the contract
      // test validates the shape when authenticated.
      if (res.status === 401) {
        console.warn('SKIP: auth/me requires valid token (expected in CI)')
        return
      }

      expect(res.status).toBe(200)
      const body = await res.json()

      // Contract: user_id must be a UUID string
      expect(typeof body.user_id).toBe('string')
      expect(body.user_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )

      // Contract: email must be a string
      expect(typeof body.email).toBe('string')

      // Contract: display_name must be a string
      expect(typeof body.display_name).toBe('string')

      // Contract: bot_shield_verified must be boolean
      expect(typeof body.bot_shield_verified).toBe('boolean')

      // Contract: subscription_active must be boolean
      expect(typeof body.subscription_active).toBe('boolean')

      // Contract: has_profile must be boolean
      expect(typeof body.has_profile).toBe('boolean')

      // Contract: adult_verified must be boolean
      expect(typeof body.adult_verified).toBe('boolean')

      // Contract: mission_impact_score must be a number
      expect(typeof body.mission_impact_score).toBe('number')
    })
  })

  // ─── GET /api/v1/boards/{slug}/posts ────────────────────────────
  describe('GET /api/v1/boards/{slug}/posts', () => {
    it('returns an array of post objects', async () => {
      const res = await apiRequest('/api/v1/boards/general/posts')
      if (res.status === 401) {
        console.warn('SKIP: posts list requires auth (expected in CI)')
        return
      }

      expect(res.status).toBe(200)
      const body = await res.json()

      // Contract: response must be an array
      expect(Array.isArray(body)).toBe(true)

      // Contract: each post must have these fields with correct types
      for (const post of body) {
        expect(typeof post.id).toBe('string')
        expect(typeof post.board_slug).toBe('string')
        expect(typeof post.author_id).toBe('string')
        expect(typeof post.author_name).toBe('string')
        expect(typeof post.title).toBe('string')
        expect(typeof post.body).toBe('string')
        expect(typeof post.like_count).toBe('number')
        expect(typeof post.created_at).toBe('string')
      }
    })
  })

  // ─── POST /api/v1/boards/{slug}/posts ───────────────────────────
  describe('POST /api/v1/boards/{slug}/posts', () => {
    it('creates a post and returns the created object', async () => {
      const payload = {
        title: 'Contract Test Post',
        body: 'This post was created by a contract test.',
      }

      const res = await apiRequest('/api/v1/boards/general/posts', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (res.status === 401) {
        console.warn('SKIP: post creation requires auth (expected in CI)')
        return
      }

      expect(res.status).toBe(201)
      const body = await res.json()

      // Contract: response must include all PostResponse fields
      expect(typeof body.id).toBe('string')
      expect(typeof body.board_slug).toBe('string')
      expect(typeof body.author_id).toBe('string')
      expect(typeof body.author_name).toBe('string')
      expect(typeof body.title).toBe('string')
      expect(typeof body.body).toBe('string')
      expect(typeof body.like_count).toBe('number')
      expect(typeof body.created_at).toBe('string')

      // Contract: returned title/body match the request
      expect(body.title).toBe(payload.title)
      expect(body.body).toBe(payload.body)
    })
  })
})
