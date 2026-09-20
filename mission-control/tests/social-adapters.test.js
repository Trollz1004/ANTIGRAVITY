import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import {
  validateBrand, listPlatforms, isManualPlatform, isSyndicationPlatform,
  executeManualHandoff, syndicationConfigured, ALLOWED_BRANDS, PLATFORM_IDS,
  checkAdultVenue, checkBusinessOnly, BRAND_RULING, DATEAPP_BRAND,
} from '../lib/social-adapters.mjs'

describe('lib/social-adapters.mjs — validateBrand', () => {
  it('accepts the two legacy brands', () => {
    expect(validateBrand('DREAM Online').ok).toBe(true)
    expect(validateBrand('AI Solutions').ok).toBe(true)
  })

  it('accepts the date-app brand as of the 2026-09-19 marketing-unfreeze ruling', () => {
    const r = validateBrand('youandinotai')
    expect(r.ok).toBe(true)
    expect(r.brand).toBe(DATEAPP_BRAND)
  })

  it('resolves every documented alias to the canonical brand name', () => {
    expect(validateBrand('YouAndINotAI')).toMatchObject({ ok: true, brand: DATEAPP_BRAND })
    expect(validateBrand('date app')).toMatchObject({ ok: true, brand: DATEAPP_BRAND })
    expect(validateBrand('Date App')).toMatchObject({ ok: true, brand: DATEAPP_BRAND })
  })

  it('rejects any other unrecognised brand', () => {
    const r = validateBrand('Some Other Brand')
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/brand must be one of/i)
  })
})

describe('lib/social-adapters.mjs — checkAdultVenue (date-app 18-and-over gate)', () => {
  const ADULT_COPY = 'youandinotai is an adults-only (18+) dating app for people who want something real.'

  it('passes copy that clearly states an adults-only audience', () => {
    expect(checkAdultVenue(ADULT_COPY)).toMatchObject({ pass: true, reason: null })
  })

  it('rejects copy that never states or implies an 18+ audience', () => {
    const r = checkAdultVenue('youandinotai is a dating app for people who want something real.')
    expect(r.pass).toBe(false)
    expect(r.reason).toMatch(/18/)
  })

  it('rejects copy mentioning teens, even alongside an adult-audience statement', () => {
    const r = checkAdultVenue('An 18+ app, not for teens — youandinotai is for adults only.')
    expect(r.pass).toBe(false)
    expect(r.reason).toMatch(/teen/i)
  })

  it('rejects copy mentioning students or school', () => {
    expect(checkAdultVenue('18+ adults only — great for students on a night off.').pass).toBe(false)
    expect(checkAdultVenue('18+ adults only, back to school savings on us.').pass).toBe(false)
  })
})

describe('lib/social-adapters.mjs — checkBusinessOnly (date-app governance/sale gate)', () => {
  it('passes ordinary customer-facing copy', () => {
    expect(checkBusinessOnly('youandinotai: real people, real dates, 18+.')).toMatchObject({ pass: true, reason: null })
  })

  it('rejects copy that leaks internal governance language', () => {
    const r = checkBusinessOnly('Approved by the judge lane before it went out.')
    expect(r.pass).toBe(false)
    expect(r.reason).toMatch(/judge lane/i)
  })

  it('rejects copy mentioning Paperclip or Mission Control', () => {
    expect(checkBusinessOnly('Paperclip drafted this for us.').pass).toBe(false)
    expect(checkBusinessOnly('Straight from Mission Control.').pass).toBe(false)
  })

  it('rejects copy that mentions the sale or the listing', () => {
    expect(checkBusinessOnly('This app is for sale, act fast!').pass).toBe(false)
    expect(checkBusinessOnly('The listing is live, come see it.').pass).toBe(false)
  })
})

describe('lib/social-adapters.mjs — BRAND_RULING', () => {
  it('is the exact ruling text server.mjs records on a youandinotai proposal', () => {
    expect(BRAND_RULING).toBe('marketing unfrozen 2026-09-19; features frozen; listing stays')
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
