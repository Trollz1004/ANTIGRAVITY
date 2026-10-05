import { describe, it, expect, vi } from 'vitest'
import {
  parseArgs, buildAuthorizeUrl, buildTokenRequestBody,
  buildEnvUpdate, writeBloggerEnv, removeTriggerLines,
  clearBloggerSetupTrigger, parseCallback,
  exchangeCodeForToken, listBlogs, SETUP_STEPS,
  REDIRECT_URI, CALLBACK_PORT,
} from '../scripts/blogger-setup.mjs'

describe('scripts/blogger-setup.mjs - parseArgs', () => {
  it('reads --client-id and --client-secret', () => {
    expect(parseArgs(['--client-id', 'cid', '--client-secret', 'csec']))
      .toEqual({ clientId: 'cid', clientSecret: 'csec' })
  })
  it('reads --blog-id when provided', () => {
    expect(parseArgs(['--client-id', 'cid', '--client-secret', 'csec', '--blog-id', '1234567890']))
      .toEqual({ clientId: 'cid', clientSecret: 'csec', blogId: '1234567890' })
  })
  it('returns an empty object with no args (the print-steps path)', () => {
    expect(parseArgs([])).toEqual({})
  })
})

describe('scripts/blogger-setup.mjs - SETUP_STEPS / REDIRECT_URI / CALLBACK_PORT', () => {
  it('names console.cloud.google.com, the Blogger scope, and the command to run', () => {
    expect(SETUP_STEPS).toContain('console.cloud.google.com')
    expect(SETUP_STEPS).toContain('drift blogger-setup --client-id')
    expect(SETUP_STEPS).toContain('SEO_ANT_BLOGGER_TOKEN')
    expect(SETUP_STEPS).toContain('SEO_ANT_BLOGGER_REFRESH_TOKEN')
    expect(SETUP_STEPS).toContain('SEO_ANT_BLOGGER_BLOG_ID')
    expect(REDIRECT_URI).toBe('http://localhost:8766/callback')
    expect(CALLBACK_PORT).toBe(8766)
  })
  it('does NOT contain any token-shaped strings', () => {
    expect(SETUP_STEPS).not.toMatch(/[A-Za-z0-9_-]{32,}/)
  })
})

describe('scripts/blogger-setup.mjs - buildAuthorizeUrl', () => {
  it('builds the Google OAuth2 consent URL with all required params', () => {
    const u = buildAuthorizeUrl({ clientId: 'cid', redirectUri: 'http://localhost:8766/callback', state: 'abc' })
    const url = new URL(u)
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth')
    expect(url.searchParams.get('client_id')).toBe('cid')
    expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:8766/callback')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('access_type')).toBe('offline')
    expect(url.searchParams.get('prompt')).toBe('consent')
    expect(url.searchParams.get('state')).toBe('abc')
    expect(url.searchParams.get('scope')).toContain('blogger')
  })
})

describe('scripts/blogger-setup.mjs - buildTokenRequestBody', () => {
  it('produces an x-www-form-urlencoded body with all 5 fields', () => {
    const body = buildTokenRequestBody({
      clientId: 'cid', clientSecret: 'csec', code: 'AUTHCODE', redirectUri: 'http://localhost:8766/callback',
    })
    const params = new URLSearchParams(body)
    expect(params.get('client_id')).toBe('cid')
    expect(params.get('client_secret')).toBe('csec')
    expect(params.get('code')).toBe('AUTHCODE')
    expect(params.get('grant_type')).toBe('authorization_code')
    expect(params.get('redirect_uri')).toBe('http://localhost:8766/callback')
  })
})

describe('scripts/blogger-setup.mjs - buildEnvUpdate', () => {
  it('appends new SEO_ANT_BLOGGER_* keys to a file that lacks them', () => {
    const out = buildEnvUpdate('FOO=bar\n', {
      SEO_ANT_BLOGGER_TOKEN: 'at',
      SEO_ANT_BLOGGER_REFRESH_TOKEN: 'rt',
      SEO_ANT_BLOGGER_BLOG_ID: '1234567890',
    })
    expect(out).toContain('FOO=bar')
    expect(out).toContain('SEO_ANT_BLOGGER_TOKEN=at')
    expect(out).toContain('SEO_ANT_BLOGGER_REFRESH_TOKEN=rt')
    expect(out).toContain('SEO_ANT_BLOGGER_BLOG_ID=1234567890')
  })
  it('replaces an existing SEO_ANT_BLOGGER_* line in place rather than duplicating it', () => {
    const out = buildEnvUpdate('SEO_ANT_BLOGGER_TOKEN=old\nSEO_ANT_BLOGGER_REFRESH_TOKEN=old\nSEO_ANT_BLOGGER_BLOG_ID=old\nOTHER=1\n', {
      SEO_ANT_BLOGGER_TOKEN: 'new',
      SEO_ANT_BLOGGER_REFRESH_TOKEN: 'newr',
      SEO_ANT_BLOGGER_BLOG_ID: '9999',
    })
    const lines = out.trim().split('\n')
    expect(lines.filter((l) => l.startsWith('SEO_ANT_BLOGGER_TOKEN=')).length).toBe(1)
    expect(lines.filter((l) => l.startsWith('SEO_ANT_BLOGGER_REFRESH_TOKEN=')).length).toBe(1)
    expect(lines.filter((l) => l.startsWith('SEO_ANT_BLOGGER_BLOG_ID=')).length).toBe(1)
    expect(out).toContain('OTHER=1')
  })
  it('works on an empty starting file', () => {
    const out = buildEnvUpdate('', { SEO_ANT_BLOGGER_TOKEN: 'tok' })
    expect(out.trim()).toBe('SEO_ANT_BLOGGER_TOKEN=tok')
  })
})

describe('scripts/blogger-setup.mjs - writeBloggerEnv (injected fs)', () => {
  it('writes the token + refresh + blog id without ever logging them', () => {
    let written = null
    const readFile = () => 'EXISTING=1\n'
    const writeFile = (path, text) => { written = { path, text } }
    writeBloggerEnv({
      envPath: '/fake/.env',
      values: { SEO_ANT_BLOGGER_TOKEN: 'at', SEO_ANT_BLOGGER_REFRESH_TOKEN: 'rt', SEO_ANT_BLOGGER_BLOG_ID: '9999' },
      readFile, writeFile, exists: () => true,
    })
    expect(written.path).toBe('/fake/.env')
    expect(written.text).toContain('EXISTING=1')
    expect(written.text).toContain('SEO_ANT_BLOGGER_TOKEN=at')
    expect(written.text).toContain('SEO_ANT_BLOGGER_REFRESH_TOKEN=rt')
    expect(written.text).toContain('SEO_ANT_BLOGGER_BLOG_ID=9999')
  })
})

describe('scripts/blogger-setup.mjs - removeTriggerLines', () => {
  it('removes only matching kind lines, keeps others', () => {
    const text = JSON.stringify({ kind: 'blogger_api_setup_needed' }) + '\n' +
                 JSON.stringify({ kind: 'other' }) + '\n'
    const out = removeTriggerLines(text, 'blogger_api_setup_needed')
    expect(out).toContain('"kind":"other"')
    expect(out).not.toContain('blogger_api_setup_needed')
  })
  it('returns input untouched when no matching kind is present', () => {
    const text = JSON.stringify({ kind: 'foo' }) + '\n'
    expect(removeTriggerLines(text, 'blogger_api_setup_needed')).toBe(text)
  })
})

describe('scripts/blogger-setup.mjs - clearBloggerSetupTrigger', () => {
  it('reports cleared:false when no triggers file exists', () => {
    const exists = () => false
    expect(clearBloggerSetupTrigger({ triggersPath: '/nope', exists, readFile: () => '', writeFile: () => {} })).toEqual({ cleared: false })
  })
  it('writes nothing when there is no matching trigger', () => {
    let written = null
    const writeFile = (path, text) => { written = { path, text } }
    const text = JSON.stringify({ kind: 'other' }) + '\n'
    const out = clearBloggerSetupTrigger({ triggersPath: '/t', exists: () => true, readFile: () => text, writeFile })
    expect(out).toEqual({ cleared: false })
    expect(written).toBe(null)
  })
  it('removes the matching trigger and writes the file', () => {
    let written = null
    const writeFile = (path, text) => { written = { path, text } }
    const text = JSON.stringify({ kind: 'blogger_api_setup_needed' }) + '\n'
    const out = clearBloggerSetupTrigger({ triggersPath: '/t', exists: () => true, readFile: () => text, writeFile })
    expect(out).toEqual({ cleared: true })
    expect(written.text).not.toContain('blogger_api_setup_needed')
  })
})

describe('scripts/blogger-setup.mjs - parseCallback', () => {
  it('extracts code, state, error from a callback URL', () => {
    const r = parseCallback('/callback?code=AUTHCODE&state=abc&error=access_denied')
    expect(r).toEqual({ code: 'AUTHCODE', state: 'abc', error: 'access_denied' })
  })
  it('returns nulls when nothing is present', () => {
    const r = parseCallback('/callback')
    expect(r).toEqual({ code: null, state: null, error: null })
  })
})

describe('scripts/blogger-setup.mjs - exchangeCodeForToken', () => {
  it('returns ok:false when any required field is missing', async () => {
    const v = await exchangeCodeForToken({ clientId: '', clientSecret: 's', code: 'c', redirectUri: 'r', fetchFn: vi.fn() })
    expect(v.ok).toBe(false)
  })
  it('returns ok:true with access_token + refresh_token on HTTP 200', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ access_token: 'at-abc', refresh_token: 'rt-xyz', expires_in: 3600 }),
    })
    const v = await exchangeCodeForToken({
      clientId: 'cid', clientSecret: 'csec', code: 'c', redirectUri: 'r', fetchFn,
    })
    expect(v.ok).toBe(true)
    expect(v.accessToken).toBe('at-abc')
    expect(v.refreshToken).toBe('rt-xyz')
    expect(fetchFn).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ 'content-type': 'application/x-www-form-urlencoded' }) })
    )
  })
  it('returns ok:false on HTTP non-200 with the error_description', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false, status: 400,
      json: async () => ({ error: 'invalid_grant', error_description: 'bad code' }),
    })
    const v = await exchangeCodeForToken({
      clientId: 'cid', clientSecret: 'csec', code: 'bad', redirectUri: 'r', fetchFn,
    })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('bad code')
  })
  it('returns ok:false when no access_token in the response', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
    const v = await exchangeCodeForToken({
      clientId: 'cid', clientSecret: 'csec', code: 'c', redirectUri: 'r', fetchFn,
    })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('no access_token')
  })
  it('returns ok:false on network throw', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('ETIMEDOUT'))
    const v = await exchangeCodeForToken({
      clientId: 'cid', clientSecret: 'csec', code: 'c', redirectUri: 'r', fetchFn,
    })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('ETIMEDOUT')
  })
})

describe('scripts/blogger-setup.mjs - listBlogs', () => {
  it('returns ok:false when token is missing', async () => {
    const v = await listBlogs({ token: '', fetchFn: vi.fn() })
    expect(v.ok).toBe(false)
  })
  it('returns ok:true with a list of blogs on HTTP 200', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({
        items: [
          { id: '111', name: 'First Blog', url: 'https://first.blogspot.com/' },
          { id: '222', name: 'Second', url: 'https://second.blogspot.com/' },
        ],
      }),
    })
    const v = await listBlogs({ token: 't', fetchFn })
    expect(v.ok).toBe(true)
    expect(v.blogs).toHaveLength(2)
    expect(v.blogs[0].id).toBe('111')
    expect(v.blogs[0].name).toBe('First Blog')
    expect(v.count).toBe(2)
    expect(fetchFn).toHaveBeenCalledWith(
      'https://www.googleapis.com/blogger/v3/users/me/blogs',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer t' }) })
    )
  })
  it('returns ok:true with empty list when there are no blogs', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ status: 200, json: async () => ({ items: [] }) })
    const v = await listBlogs({ token: 't', fetchFn })
    expect(v.ok).toBe(true)
    expect(v.blogs).toHaveLength(0)
    expect(v.count).toBe(0)
  })
  it('returns ok:true with empty list when items is missing from response', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ status: 200, json: async () => ({}) })
    const v = await listBlogs({ token: 't', fetchFn })
    expect(v.ok).toBe(true)
    expect(v.blogs).toHaveLength(0)
  })
  it('returns ok:false on HTTP non-200', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ status: 403, json: async () => ({}) })
    const v = await listBlogs({ token: 'bad', fetchFn })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('403')
  })
  it('returns ok:false on network throw', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('EAI_AGAIN'))
    const v = await listBlogs({ token: 't', fetchFn })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('EAI_AGAIN')
  })
})
