import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')
const clientMod = await import('../js/jarvis/social.js')

describe('JARVIS wiring — server.mjs Social routes (Phase C, unit 4)', () => {
  const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf-8')

  it('imports the Phase C modules', () => {
    expect(server).toContain("from './lib/redact.mjs'")
    expect(server).toContain("from './lib/proposals.mjs'")
    expect(server).toContain("from './lib/compliance.mjs'")
    expect(server).toContain("from './lib/copy-score.mjs'")
    expect(server).toContain("from './lib/social-adapters.mjs'")
  })

  it('wires GET /api/social/platforms', () => {
    expect(server).toMatch(/p === '\/api\/social\/platforms'/)
    expect(server).toContain('listPlatforms(')
  })

  it('wires GET and POST /api/social/proposals, checking brand and running both checks', () => {
    expect(server).toMatch(/p === '\/api\/social\/proposals' && req\.method === 'GET'/)
    expect(server).toMatch(/p === '\/api\/social\/proposals' && req\.method === 'POST'/)
    expect(server).toContain('validateBrand(')
    expect(server).toContain('checkCompliance(')
    expect(server).toContain('scoreCopy(')
    expect(server).toContain('proposalStore.create(')
  })

  it('runs the extra date-app checks and stamps brandRuling only for the youandinotai brand', () => {
    expect(server).toContain('checkAdultVenue(')
    expect(server).toContain('checkBusinessOnly(')
    expect(server).toContain('DATEAPP_BRAND')
    expect(server).toContain('BRAND_RULING')
  })

  it('wires POST /api/social/draft to lib/fable-draft.mjs', () => {
    expect(server).toContain("from './lib/fable-draft.mjs'")
    expect(server).toMatch(/p === '\/api\/social\/draft' && req\.method === 'POST'/)
    expect(server).toContain('draftWithFable(')
  })

  it('redacts the platforms and proposal-creation responses before sending', () => {
    expect(server).toMatch(/send\(res, 200, redact\(\{ platforms:/)
    expect(server).toMatch(/send\(res, 201, redact\(\{ proposal:/)
  })

  it('the proposal store is backed by data/proposals under this dashboard folder (gitignored)', () => {
    expect(server).toMatch(/createProposalStore\(\{ dir: join\(HERE, 'data', 'proposals'\) \}\)/)
  })

  it('index.html has the Social nav tab and panel, the youandinotai brand option, and the Fable draft button', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8')
    expect(html).toContain('data-tab="social"')
    expect(html).toContain('id="tab-social"')
    expect(html).toContain('id="social-form"')
    expect(html).toContain('value="youandinotai"')
    expect(html).toContain('id="social-draft-fable"')
  })
})

describe('js/jarvis/social.js — client render (pure functions, no DOM globals)', () => {
  it('exports the expected surface', () => {
    expect(typeof clientMod.renderPlatformOptions).toBe('function')
    expect(typeof clientMod.renderCheckResult).toBe('function')
    expect(typeof clientMod.renderProposals).toBe('function')
    expect(typeof clientMod.draftWithFable).toBe('function')
  })

  it('draftWithFable POSTs to /api/social/draft', async () => {
    const calls = []
    const fetchImpl = async (url, opts) => {
      calls.push({ url, opts })
      return { ok: true, json: async () => ({ draft: 'a fine post', checks: {} }) }
    }
    const j = await clientMod.draftWithFable({ brand: 'youandinotai', platform: 'x', brief: 'launch day' }, fetchImpl)
    expect(calls[0].url).toBe('/api/social/draft')
    expect(JSON.parse(calls[0].opts.body)).toMatchObject({ brand: 'youandinotai', platform: 'x', brief: 'launch day' })
    expect(j.draft).toBe('a fine post')
  })

  it('renderPlatformOptions marks unconfigured platforms honestly', () => {
    const el = { innerHTML: '' }
    clientMod.renderPlatformOptions(el, [
      { id: 'devto', name: 'dev.to', configured: true },
      { id: 'x', name: 'X (Grok lane, grok.com path)', configured: true },
    ])
    expect(el.innerHTML).toContain('dev.to')
    expect(el.innerHTML).not.toContain('not configured')

    clientMod.renderPlatformOptions(el, [{ id: 'wordpress', name: 'WordPress', configured: false }])
    expect(el.innerHTML).toContain('not configured')
  })

  it('renderPlatformOptions is honest about an empty list', () => {
    const el = { innerHTML: '' }
    clientMod.renderPlatformOptions(el, [])
    expect(el.innerHTML).toContain('no platforms configured')
  })

  it('renderCheckResult shows compliance pass/fail and the copy score, never the rule catalogue', () => {
    const el = { innerHTML: '' }
    clientMod.renderCheckResult(el, { compliance: { pass: false, ruleIndex: 3, matched: 'widget-alpha' }, copyScore: { score: 4, tripped: [{ category: 'vocab', rule: 'leverage' }] } })
    expect(el.innerHTML).toContain('compliance: fail')
    expect(el.innerHTML).toContain('widget-alpha')
    expect(el.innerHTML).toContain('copy score: 4/5')
  })

  it('renderProposals shows brand/platform/state for each row, or an honest empty state', () => {
    const el = { innerHTML: '' }
    clientMod.renderProposals(el, [{ id: '1', brand: 'DREAM Online', platform: 'reddit', title: 'Launch', state: 'PROPOSED' }])
    expect(el.innerHTML).toContain('DREAM Online')
    expect(el.innerHTML).toContain('reddit')
    expect(el.innerHTML).toContain('PROPOSED')

    clientMod.renderProposals(el, [])
    expect(el.innerHTML).toContain('No proposals yet')
  })
})
