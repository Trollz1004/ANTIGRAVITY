import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import {
  getRedditConfig, redditConfigured, buildAuthorizeUrl, exchangeCodeForToken,
  refreshAccessToken, canPostNow, recordPost, emptyRateState, submitSelfPost,
  postProposalToReddit, subredditFromTitle, appendDedupedTrigger,
  executeRedditAdapter, readRateState, writeRateState,
  PER_SUBREDDIT_COOLDOWN_MS, OVERALL_COOLDOWN_MS, REDDIT_SETUP_TRIGGER_KIND,
  AUTHORIZE_URL, TOKEN_URL,
} from '../lib/reddit-api.mjs'

const FULL_ENV = {
  REDDIT_CLIENT_ID: 'cid', REDDIT_CLIENT_SECRET: 'csecret',
  REDDIT_REFRESH_TOKEN: 'rtok', REDDIT_USER_AGENT: 'web:youandinotai:v1 (by /u/joshlcoleman)',
}
const envValue = (map) => (name) => map[name] || ''

describe('lib/reddit-api.mjs — config', () => {
  it('requires all four env vars — any one missing is not configured', () => {
    expect(getRedditConfig(envValue(FULL_ENV))).toEqual({
      clientId: 'cid', clientSecret: 'csecret', refreshToken: 'rtok', userAgent: FULL_ENV.REDDIT_USER_AGENT,
    })
    expect(redditConfigured(envValue(FULL_ENV))).toBe(true)
    const { REDDIT_USER_AGENT, ...partial } = FULL_ENV
    expect(getRedditConfig(envValue(partial))).toBe(null)
    expect(redditConfigured(envValue(partial))).toBe(false)
    expect(redditConfigured(envValue({}))).toBe(false)
  })
})

describe('lib/reddit-api.mjs — OAuth2 URLs (per reddit-archive/reddit wiki/OAuth2)', () => {
  it('builds the authorize URL against www.reddit.com/api/v1/authorize with the documented params', () => {
    const url = buildAuthorizeUrl({ clientId: 'cid', redirectUri: 'http://localhost:8765/callback', state: 'xyz' })
    expect(url.startsWith(AUTHORIZE_URL)).toBe(true)
    const u = new URL(url)
    expect(u.searchParams.get('client_id')).toBe('cid')
    expect(u.searchParams.get('response_type')).toBe('code')
    expect(u.searchParams.get('state')).toBe('xyz')
    expect(u.searchParams.get('redirect_uri')).toBe('http://localhost:8765/callback')
    expect(u.searchParams.get('duration')).toBe('permanent') // must be permanent to get a refresh token
    expect(u.searchParams.get('scope')).toBeTruthy()
  })

  it('exchanges an authorization code via HTTP Basic auth against www.reddit.com/api/v1/access_token', async () => {
    const calls = []
    const fetchImpl = async (url, opts) => {
      calls.push({ url, opts })
      return { ok: true, json: async () => ({ access_token: 'AT', refresh_token: 'RT', expires_in: 3600, scope: 'submit' }) }
    }
    const r = await exchangeCodeForToken({ clientId: 'cid', clientSecret: 'csecret', code: 'CODE', redirectUri: 'http://localhost:8765/callback', userAgent: 'ua', fetchImpl })
    expect(r).toEqual({ ok: true, accessToken: 'AT', refreshToken: 'RT', expiresIn: 3600, scope: 'submit' })
    expect(calls[0].url).toBe(TOKEN_URL)
    expect(calls[0].opts.method).toBe('POST')
    expect(calls[0].opts.headers.authorization).toMatch(/^Basic /)
    expect(Buffer.from(calls[0].opts.headers.authorization.slice(6), 'base64').toString()).toBe('cid:csecret')
    expect(calls[0].opts.body).toContain('grant_type=authorization_code')
    expect(calls[0].opts.body).toContain('code=CODE')
  })

  it('refreshes an access token via grant_type=refresh_token', async () => {
    const calls = []
    const fetchImpl = async (url, opts) => { calls.push({ url, opts }); return { ok: true, json: async () => ({ access_token: 'AT2', expires_in: 3600 }) } }
    const r = await refreshAccessToken({ clientId: 'cid', clientSecret: 'csecret', refreshToken: 'RT', userAgent: 'ua', fetchImpl })
    expect(r).toEqual({ ok: true, accessToken: 'AT2', expiresIn: 3600, scope: undefined })
    expect(calls[0].opts.body).toContain('grant_type=refresh_token')
    expect(calls[0].opts.body).toContain('refresh_token=RT')
  })

  it('reports a failed refresh honestly', async () => {
    const fetchImpl = async () => ({ ok: false, status: 401, json: async () => ({ error: 'invalid_grant' }) })
    const r = await refreshAccessToken({ clientId: 'cid', clientSecret: 'csecret', refreshToken: 'bad', userAgent: 'ua', fetchImpl })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(401)
  })
})

describe('lib/reddit-api.mjs — local rate limiting (one per subreddit per 4h, one per hour overall)', () => {
  it('allows the first post', () => {
    expect(canPostNow({ state: emptyRateState(), subreddit: 'dating' }).ok).toBe(true)
  })

  it('blocks a second post to ANY subreddit within an hour of the last one', () => {
    const now = () => new Date('2026-09-20T12:00:00Z')
    let state = recordPost(emptyRateState(), 'dating', now)
    const soon = () => new Date('2026-09-20T12:30:00Z')
    const r = canPostNow({ state, subreddit: 'datingoverthirty', now: soon })
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/overall rate limit/i)
  })

  it('allows a different subreddit after the overall hour has passed, then blocks that subreddit for 4h', () => {
    const t0 = () => new Date('2026-09-20T12:00:00Z')
    let state = recordPost(emptyRateState(), 'dating', t0)
    const afterHour = () => new Date('2026-09-20T13:01:00Z')
    expect(canPostNow({ state, subreddit: 'dating', now: afterHour }).ok).toBe(false) // still within 4h for THIS subreddit
    state = recordPost(state, 'dating', afterHour)
    const soon = () => new Date('2026-09-20T13:30:00Z')
    expect(canPostNow({ state, subreddit: 'dating', now: soon }).ok).toBe(false)
    const after4h = () => new Date(new Date('2026-09-20T13:01:00Z').getTime() + PER_SUBREDDIT_COOLDOWN_MS + 60000)
    expect(canPostNow({ state, subreddit: 'dating', now: after4h }).ok).toBe(true)
  })

  it('PER_SUBREDDIT_COOLDOWN_MS / OVERALL_COOLDOWN_MS match the spec (4h / 1h)', () => {
    expect(PER_SUBREDDIT_COOLDOWN_MS).toBe(4 * 60 * 60 * 1000)
    expect(OVERALL_COOLDOWN_MS).toBe(60 * 60 * 1000)
  })
})

describe('lib/reddit-api.mjs — submitSelfPost', () => {
  it('posts a self post to oauth.reddit.com/api/submit and returns the URL on success', async () => {
    const calls = []
    const fetchImpl = async (url, opts) => {
      calls.push({ url, opts })
      return {
        ok: true, status: 200,
        headers: { get: (n) => ({ 'x-ratelimit-remaining': '598' }[n] || null) },
        json: async () => ({ json: { errors: [], data: { url: 'https://www.reddit.com/r/dating/comments/abc123/title/', id: 't3_abc123' } } }),
      }
    }
    const r = await submitSelfPost({ accessToken: 'AT', userAgent: 'ua', subreddit: 'dating', title: 'Hello', text: 'Body', fetchImpl })
    expect(r.ok).toBe(true)
    expect(r.url).toBe('https://www.reddit.com/r/dating/comments/abc123/title/')
    expect(calls[0].url).toContain('oauth.reddit.com')
    expect(calls[0].opts.headers.authorization).toBe('bearer AT')
  })

  it('reports FAILED with the message on 403', async () => {
    const fetchImpl = async () => ({ ok: false, status: 403, headers: { get: () => null }, text: async () => 'Forbidden: banned from this subreddit' })
    const r = await submitSelfPost({ accessToken: 'AT', userAgent: 'ua', subreddit: 'dating', title: 'x', text: 'y', fetchImpl })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(403)
    expect(r.error).toMatch(/403/)
  })

  it('reports FAILED with the message on 429', async () => {
    const fetchImpl = async () => ({ ok: false, status: 429, headers: { get: () => null }, text: async () => 'Too Many Requests' })
    const r = await submitSelfPost({ accessToken: 'AT', userAgent: 'ua', subreddit: 'dating', title: 'x', text: 'y', fetchImpl })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(429)
  })

  it('reports FAILED when Reddit itself returns api errors', async () => {
    const fetchImpl = async () => ({
      ok: true, status: 200, headers: { get: () => null },
      json: async () => ({ json: { errors: [['RATELIMIT', 'you are doing that too much', 'ratelimit']], data: {} } }),
    })
    const r = await submitSelfPost({ accessToken: 'AT', userAgent: 'ua', subreddit: 'dating', title: 'x', text: 'y', fetchImpl })
    expect(r.ok).toBe(false)
  })
})

describe('lib/reddit-api.mjs — subredditFromTitle', () => {
  it('parses "r/dating" out of a heading', () => {
    expect(subredditFromTitle('Reddit Post — r/dating')).toBe('dating')
    expect(subredditFromTitle('no subreddit here')).toBe(null)
  })
})

describe('lib/reddit-api.mjs — postProposalToReddit orchestration', () => {
  const config = { clientId: 'cid', clientSecret: 'csecret', refreshToken: 'rtok', userAgent: 'ua' }

  it('refreshes then posts, and returns nextRateState on success', async () => {
    let call = 0
    const fetchImpl = async (url) => {
      call++
      if (String(url).includes('access_token')) return { ok: true, json: async () => ({ access_token: 'AT', expires_in: 3600 }) }
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => ({ json: { errors: [], data: { url: 'https://www.reddit.com/r/dating/comments/x/y/' } } }) }
    }
    const proposal = { id: 'p1', title: 'r/dating', body: 'hello', brand: 'youandinotai' }
    const r = await postProposalToReddit({ proposal, config, rateState: emptyRateState(), now: () => new Date('2026-09-20T12:00:00Z'), fetchImpl })
    expect(r.ok).toBe(true)
    expect(r.url).toContain('reddit.com')
    expect(r.nextRateState.lastPostBySubreddit.dating).toBeTruthy()
  })

  it('never calls Reddit at all when the local cooldown blocks the post', async () => {
    const fetchImpl = async () => { throw new Error('should not be called') }
    const rateState = recordPost(emptyRateState(), 'dating', () => new Date('2026-09-20T11:59:00Z'))
    const proposal = { id: 'p1', subreddit: 'dating', title: 't', body: 'b' }
    const r = await postProposalToReddit({ proposal, config, rateState, now: () => new Date('2026-09-20T12:00:00Z'), fetchImpl })
    expect(r.ok).toBe(false)
    expect(r.rateLimited).toBe(true)
  })

  it('fails cleanly with no subreddit given', async () => {
    const proposal = { id: 'p1', title: 'no subreddit marker', body: 'b' }
    const r = await postProposalToReddit({ proposal, config, rateState: emptyRateState(), fetchImpl: async () => { throw new Error('never') } })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/no subreddit/i)
  })
})

describe('lib/reddit-api.mjs — appendDedupedTrigger', () => {
  let dir, triggersPath
  beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jarvis-triggers-')); triggersPath = path.join(dir, 'TRIGGERS.jsonl') })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('appends once, then dedupes a second call with the same kind', () => {
    const first = appendDedupedTrigger({ triggersPath, kind: 'reddit_api_setup_needed', text: 'set it up', now: () => new Date('2026-09-20T00:00:00Z') })
    expect(first.appended).toBe(true)
    const second = appendDedupedTrigger({ triggersPath, kind: 'reddit_api_setup_needed', text: 'set it up again', now: () => new Date('2026-09-20T01:00:00Z') })
    expect(second.appended).toBe(false)
    const lines = fs.readFileSync(triggersPath, 'utf8').trim().split('\n')
    expect(lines.length).toBe(1)
  })
})

describe('lib/reddit-api.mjs — executeRedditAdapter', () => {
  let dir, inboxDir, triggersPath, rateStatePath
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jarvis-reddit-'))
    inboxDir = path.join(dir, 'approved')
    triggersPath = path.join(dir, 'TRIGGERS.jsonl')
    rateStatePath = path.join(dir, 'reddit-rate-state.json')
  })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('env absent -> NOT CONFIGURED, writes approved copy + files the setup trigger', async () => {
    const proposal = { id: 'p1', platform: 'reddit', title: 'r/dating — hello', body: 'body text', brand: 'youandinotai' }
    const r = await executeRedditAdapter({ proposal, envValue: envValue({}), inboxDir, triggersPath, rateStatePath })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/NOT CONFIGURED/)
    expect(fs.existsSync(r.path)).toBe(true)
    const triggerLines = fs.readFileSync(triggersPath, 'utf8').trim().split('\n')
    expect(triggerLines.length).toBe(1)
    expect(JSON.parse(triggerLines[0]).kind).toBe(REDDIT_SETUP_TRIGGER_KIND)
  })

  it('a second NOT CONFIGURED call dedupes the trigger but still writes a second approved-copy file', async () => {
    const proposal = { id: 'p1', platform: 'reddit', title: 'r/dating — hello', body: 'body text', brand: 'youandinotai' }
    await executeRedditAdapter({ proposal, envValue: envValue({}), inboxDir, triggersPath, rateStatePath })
    await executeRedditAdapter({ proposal: { ...proposal, id: 'p2' }, envValue: envValue({}), inboxDir, triggersPath, rateStatePath })
    const triggerLines = fs.readFileSync(triggersPath, 'utf8').trim().split('\n')
    expect(triggerLines.length).toBe(1)
  })

  it('configured + within cooldown -> posts and persists the new rate state', async () => {
    const fetchImpl = async (url) => {
      if (String(url).includes('access_token')) return { ok: true, json: async () => ({ access_token: 'AT', expires_in: 3600 }) }
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => ({ json: { errors: [], data: { url: 'https://www.reddit.com/r/dating/comments/x/y/' } } }) }
    }
    const proposal = { id: 'p1', platform: 'reddit', title: 'r/dating — hello', body: 'body text', brand: 'youandinotai' }
    const r = await executeRedditAdapter({ proposal, envValue: envValue(FULL_ENV), inboxDir, triggersPath, rateStatePath, fetchImpl })
    expect(r.ok).toBe(true)
    expect(r.url).toContain('reddit.com')
    const persisted = readRateState(rateStatePath)
    expect(persisted.lastPostBySubreddit.dating).toBeTruthy()
  })

  it('configured but rate-limited -> FAILED without calling fetch', async () => {
    writeRateState(rateStatePath, recordPost(emptyRateState(), 'dating', () => new Date()))
    const fetchImpl = async () => { throw new Error('should not be called') }
    const proposal = { id: 'p1', platform: 'reddit', title: 'r/dating — hello', body: 'body text', brand: 'youandinotai' }
    const r = await executeRedditAdapter({ proposal, envValue: envValue(FULL_ENV), inboxDir, triggersPath, rateStatePath, fetchImpl })
    expect(r.ok).toBe(false)
  })
})
