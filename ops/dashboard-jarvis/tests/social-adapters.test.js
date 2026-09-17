import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import {
  validateBrand, listPlatforms, isManualPlatform, isSyndicationPlatform,
  executeManualHandoff, syndicationConfigured, ALLOWED_BRANDS, PLATFORM_IDS,
} from '../lib/social-adapters.mjs'

describe('lib/social-adapters.mjs — validateBrand', () => {
  it('accepts the two allowed brands', () => {
    expect(validateBrand('DREAM Online').ok).toBe(true)
    expect(validateBrand('AI Solutions').ok).toBe(true)
  })

  it('rejects a date-app brand citing the freeze ruling', () => {
    const r = validateBrand('date app')
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/frozen/i)
    expect(r.error).toMatch(/2026-09-16/)
  })

  it('rejects the youandinotai name the same way', () => {
    const r = validateBrand('youandinotai')
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/frozen/i)
  })

  it('rejects any other unrecognised brand without the freeze wording', () => {
    const r = validateBrand('Some Other Brand')
    expect(r.ok).toBe(false)
    expect(r.error).not.toMatch(/frozen/i)
  })
})

describe('lib/social-adapters.mjs — listPlatforms', () => {
  it('reports every platform id with names/values never exposed, only booleans + names', () => {
    const platforms = listPlatforms({ envValue: () => '' })
    const ids = platforms.map((p) => p.id)
    expect(ids.sort()).toEqual([...PLATFORM_IDS].sort())
    for (const p of platforms) {
      expect(p.brandScope).toEqual(ALLOWED_BRANDS)
      expect(typeof p.configured).toBe('boolean')
      expect(Array.isArray(p.envVarNames)).toBe(true)
      // never a value, only names
      for (const n of p.envVarNames) expect(typeof n).toBe('string')
    }
  })

  it('devto is configured when either brand has its token set', () => {
    const env = { SEO_DRE_DEVTO_TOKEN: 'x' }
    const platforms = listPlatforms({ envValue: (n) => env[n] || '' })
    const devto = platforms.find((p) => p.id === 'devto')
    expect(devto.configured).toBe(true)
    expect(devto.envVarNames).toContain('SEO_DRE_DEVTO_TOKEN')
    expect(devto.envVarNames).toContain('SEO_AIS_DEVTO_TOKEN')
  })

  it('devto is not configured when no brand has its token set', () => {
    const platforms = listPlatforms({ envValue: () => '' })
    expect(platforms.find((p) => p.id === 'devto').configured).toBe(false)
  })

  it('manual-handoff platforms are always configured (no env dependency)', () => {
    const platforms = listPlatforms({ envValue: () => '' })
    for (const id of ['x', 'reddit', 'tiktok', 'youtube']) {
      const p = platforms.find((x) => x.id === id)
      expect(p.configured).toBe(true)
      expect(p.envVarNames).toEqual([])
    }
  })
})

describe('lib/social-adapters.mjs — platform kind helpers', () => {
  it('classifies syndication vs manual platforms', () => {
    expect(isSyndicationPlatform('devto')).toBe(true)
    expect(isManualPlatform('devto')).toBe(false)
    expect(isManualPlatform('x')).toBe(true)
    expect(isSyndicationPlatform('x')).toBe(false)
  })
})

describe('lib/social-adapters.mjs — syndicationConfigured', () => {
  it('requires every env var for the given brand', () => {
    const env = { SEO_AIS_HASHNODE_TOKEN: 'x' } // missing the publication id
    const envValue = (n) => env[n] || ''
    expect(syndicationConfigured({ platform: 'hashnode', brand: 'AI Solutions', envValue })).toBe(false)
    env.SEO_AIS_HASHNODE_PUBLICATION_ID = 'y'
    expect(syndicationConfigured({ platform: 'hashnode', brand: 'AI Solutions', envValue })).toBe(true)
  })
})

describe('lib/social-adapters.mjs — executeManualHandoff', () => {
  let dir
  beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jarvis-inbox-')) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('writes approved copy to ops/marketing-inbox/approved/<date>-<platform>-<id>.md', () => {
    const r = executeManualHandoff({
      inboxDir: dir, platform: 'reddit', id: 'abc123', title: 'Launch day',
      body: 'We shipped it.', brand: 'DREAM Online', date: new Date('2026-09-17T00:00:00Z'),
    })
    expect(r.ok).toBe(true)
    expect(r.fileName).toBe('2026-09-17-reddit-abc123.md')
    const written = fs.readFileSync(r.path, 'utf8')
    expect(written).toContain('Launch day')
    expect(written).toContain('We shipped it.')
    expect(written).toContain('brand: DREAM Online')
  })

  it('refuses a non-manual platform id', () => {
    const r = executeManualHandoff({ inboxDir: dir, platform: 'devto', id: 'x', title: 't', body: 'b', brand: 'DREAM Online' })
    expect(r.ok).toBe(false)
  })
})
