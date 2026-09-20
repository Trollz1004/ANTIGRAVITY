import { describe, it, expect } from 'vitest'
import path from 'path'
import { draftWithFable, buildSystemPrompt, platformLimit, fetchOllamaTags, FABLE_MODEL } from '../lib/fable-draft.mjs'

const HOOK = path.resolve(__dirname, '..', '..', '.githooks', 'pre-commit-canonical')

function fakeFetch({ tags = [FABLE_MODEL], response = 'A fine 18+ post.', tagsFail = false, generateFail = false } = {}) {
  const calls = []
  const impl = async (url, opts) => {
    calls.push({ url, opts })
    if (String(url).endsWith('/api/tags')) {
      if (tagsFail) return { ok: false, status: 500, text: async () => '' }
      return { ok: true, status: 200, text: async () => JSON.stringify({ models: tags.map((name) => ({ name })) }) }
    }
    if (String(url).endsWith('/api/generate')) {
      if (generateFail) return { ok: false, status: 500, text: async () => '' }
      return { ok: true, status: 200, text: async () => JSON.stringify({ response, model: FABLE_MODEL, done: true }) }
    }
    throw new Error('unexpected url: ' + url)
  }
  impl.calls = calls
  return impl
}

describe('lib/fable-draft.mjs — platformLimit / buildSystemPrompt', () => {
  it('has sane limits for the manual-handoff and syndication platforms', () => {
    expect(platformLimit('x')).toBe(280)
    expect(platformLimit('reddit')).toBeGreaterThan(280)
    expect(platformLimit('unknown-platform')).toBeGreaterThan(0)
  })

  it('the system prompt is business-only, adults-18-and-over, no-promises, per-platform-limited', () => {
    const s = buildSystemPrompt({ platform: 'x', limit: 280 })
    expect(s).toMatch(/business-only/i)
    expect(s).toMatch(/18-and-over|adults-only/i)
    expect(s).toMatch(/no promises/i)
    expect(s).toMatch(/restricted words/i)
    expect(s).toMatch(/x/i)
    expect(s).toMatch(/280/)
  })
})

describe('lib/fable-draft.mjs — fetchOllamaTags', () => {
  it('returns installed model names', async () => {
    const fetchImpl = fakeFetch({ tags: [FABLE_MODEL, 'gemma4:e4b'] })
    const tags = await fetchOllamaTags({ base: 'http://127.0.0.1:11434', fetch: fetchImpl })
    expect(tags).toEqual([FABLE_MODEL, 'gemma4:e4b'])
  })
})

describe('lib/fable-draft.mjs — draftWithFable', () => {
  it('only drafts for the youandinotai brand (and its aliases)', async () => {
    const fetchImpl = fakeFetch()
    const r = await draftWithFable({ brand: 'DREAM Online', platform: 'x', brief: 'launch day', fetch: fetchImpl, hookPath: HOOK })
    expect(r.status).toBe(400)
    expect(r.body.error).toMatch(/youandinotai/i)
    expect(fetchImpl.calls.length).toBe(0) // never even reaches Ollama for the wrong brand
  })

  it('requires platform and brief', async () => {
    const fetchImpl = fakeFetch()
    const noPlatform = await draftWithFable({ brand: 'youandinotai', brief: 'launch day', fetch: fetchImpl, hookPath: HOOK })
    expect(noPlatform.status).toBe(400)
    const noBrief = await draftWithFable({ brand: 'youandinotai', platform: 'x', fetch: fetchImpl, hookPath: HOOK })
    expect(noBrief.status).toBe(400)
  })

  it('returns 503 "Fable model not present" when the model is missing from the tags list', async () => {
    const fetchImpl = fakeFetch({ tags: ['gemma4:e4b'] })
    const r = await draftWithFable({ brand: 'date app', platform: 'x', brief: 'launch day', fetch: fetchImpl, hookPath: HOOK })
    expect(r.status).toBe(503)
    expect(r.body.error).toBe('Fable model not present')
  })

  it('recognises the model when Ollama reports it with a ":latest" tag suffix, and calls generate with that exact tag', async () => {
    const fetchImpl = fakeFetch({ tags: [FABLE_MODEL + ':latest'], response: 'youandinotai is adults-only, 18+.' })
    const r = await draftWithFable({ brand: 'youandinotai', platform: 'x', brief: 'launch day', fetch: fetchImpl, hookPath: HOOK })
    expect(r.status).toBe(200)
    expect(r.body.model).toBe(FABLE_MODEL + ':latest')
    const genCall = fetchImpl.calls.find((c) => String(c.url).endsWith('/api/generate'))
    expect(JSON.parse(genCall.opts.body).model).toBe(FABLE_MODEL + ':latest')
  })

  it('returns 503 "Fable model not present" when the tags call itself fails', async () => {
    const fetchImpl = fakeFetch({ tagsFail: true })
    const r = await draftWithFable({ brand: 'youandinotai', platform: 'reddit', brief: 'launch day', fetch: fetchImpl, hookPath: HOOK })
    expect(r.status).toBe(503)
    expect(r.body.error).toBe('Fable model not present')
  })

  it('drafts, runs all four checks, and stamps the brand ruling, on a passing draft', async () => {
    const fetchImpl = fakeFetch({ response: 'youandinotai is an adults-only (18+) dating app. Real people, no gimmicks.' })
    const r = await draftWithFable({ brand: 'youandinotai', platform: 'x', brief: 'a warm launch-day post', fetch: fetchImpl, hookPath: HOOK })
    expect(r.status).toBe(200)
    expect(r.body.draft).toMatch(/adults-only/i)
    expect(r.body.model).toBe(FABLE_MODEL)
    expect(r.body.brandRuling).toBe('marketing unfrozen 2026-09-19; features frozen; listing stays')
    expect(r.body.checks.compliance.pass).toBe(true)
    expect(typeof r.body.checks.copyScore.score).toBe('number')
    expect(r.body.checks.adultVenue.pass).toBe(true)
    expect(r.body.checks.businessOnly.pass).toBe(true)
    // the generate call carried the system instruction + the brief as the prompt
    const genCall = fetchImpl.calls.find((c) => String(c.url).endsWith('/api/generate'))
    const sentBody = JSON.parse(genCall.opts.body)
    expect(sentBody.model).toBe(FABLE_MODEL)
    expect(sentBody.prompt).toBe('a warm launch-day post')
    expect(sentBody.system).toMatch(/business-only/i)
  })

  it('surfaces a failing check without throwing (a draft mentioning teens fails adultVenue)', async () => {
    const fetchImpl = fakeFetch({ response: 'Great for teens and students looking to meet people.' })
    const r = await draftWithFable({ brand: 'youandinotai', platform: 'x', brief: 'oops', fetch: fetchImpl, hookPath: HOOK })
    expect(r.status).toBe(200) // drafting itself succeeded; the checks report the failure
    expect(r.body.checks.adultVenue.pass).toBe(false)
  })

  it('returns 502 when the generate call itself fails', async () => {
    const fetchImpl = fakeFetch({ generateFail: true })
    const r = await draftWithFable({ brand: 'youandinotai', platform: 'x', brief: 'launch day', fetch: fetchImpl, hookPath: HOOK })
    expect(r.status).toBe(502)
  })
})
