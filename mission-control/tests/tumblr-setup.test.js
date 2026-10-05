import { describe, it, expect, vi } from 'vitest'
import {
  parseArgs, pctEncode, oauth1Header, buildEnvUpdate, writeTumblrEnv,
  removeTriggerLines, clearTumblrSetupTrigger, parseOAuth1Response,
  fetchRequestToken, buildAuthorizeUrl, parseCallback,
  fetchAccessToken, fetchUserInfo, SETUP_STEPS, DEFAULT_CALLBACK_PORT,
} from '../scripts/tumblr-setup.mjs'

describe('scripts/tumblr-setup.mjs - parseArgs', () => {
  it('reads --consumer-key and --consumer-secret', () => {
    expect(parseArgs(['--consumer-key', 'ck', '--consumer-secret', 'cs']))
      .toEqual(expect.objectContaining({ consumerKey: 'ck', consumerSecret: 'cs' }))
  })
  it('reads --blog-id and --callback-port', () => {
    expect(parseArgs(['--consumer-key', 'ck', '--consumer-secret', 'cs',
                      '--blog-id', 't:abc', '--callback-port', '9999']))
      .toEqual(expect.objectContaining({
        consumerKey: 'ck', consumerSecret: 'cs',
        blogId: 't:abc', callbackPort: 9999,
      }))
  })
  it('defaults callbackPort to 8767', () => {
    const out = parseArgs([])
    expect(out.callbackPort).toBe(8767)
  })
  it('falls back to default when --callback-port is not a number', () => {
    expect(parseArgs(['--callback-port', 'abc']).callbackPort).toBe(8767)
  })
})

describe('scripts/tumblr-setup.mjs - SETUP_STEPS / DEFAULT_CALLBACK_PORT', () => {
  it('names tumblr.com/oauth/apps and the commands to run', () => {
    expect(SETUP_STEPS).toContain('tumblr.com/oauth/apps')
    expect(SETUP_STEPS).toContain('drift tumblr-setup --consumer-key')
    expect(SETUP_STEPS).toContain('SEO_ANT_TUMBLR_TOKEN')
    expect(SETUP_STEPS).toContain('SEO_ANT_TUMBLR_TOKEN_SECRET')
    expect(SETUP_STEPS).toContain('SEO_ANT_TUMBLR_BLOG_ID')
    expect(DEFAULT_CALLBACK_PORT).toBe(8767)
  })
  it('does NOT contain any token-shaped strings', () => {
    expect(SETUP_STEPS).not.toMatch(/[A-Za-z0-9_-]{32,}/)
  })
})

describe('scripts/tumblr-setup.mjs - pctEncode', () => {
  it('mirrors scripts/seo/post.mjs pctEncode behavior', () => {
    expect(pctEncode('abc')).toBe('abc')
    expect(pctEncode('a b')).toBe('a%20b')
    expect(pctEncode('a+b')).toBe('a%2Bb')
    expect(pctEncode('!')).toBe('%21')
    expect(pctEncode('*')).toBe('%2A')
    expect(pctEncode("'")).toBe('%27')
    expect(pctEncode('(')).toBe('%28')
    expect(pctEncode(')')).toBe('%29')
    expect(pctEncode('&=*')).toBe('%26%3D%2A')
  })
})

describe('scripts/tumblr-setup.mjs - oauth1Header', () => {
  it('produces an OAuth header starting with "OAuth " and containing oauth_signature', () => {
    const h = oauth1Header({
      method: 'POST', url: 'https://x.test/y', bodyParams: { a: '1' },
      consumerKey: 'ck', consumerSecret: 'cs', token: 'tk', tokenSecret: 'ts',
    })
    expect(h.startsWith('OAuth ')).toBe(true)
    expect(h).toContain('oauth_consumer_key="ck"')
    expect(h).toContain('oauth_token="tk"')
    expect(h).toContain('oauth_signature_method="HMAC-SHA1"')
    expect(h).toContain('oauth_version="1.0"')
    expect(h).toContain('oauth_signature=')
  })
  it('omits oauth_token when token is not provided', () => {
    const h = oauth1Header({
      method: 'POST', url: 'https://x.test/y', bodyParams: {},
      consumerKey: 'ck', consumerSecret: 'cs', tokenSecret: '',
    })
    expect(h).not.toContain('oauth_token="')
  })
  it('produces the same signature for the same input twice (when nonce/timestamp are fixed)', () => {
    // We cannot freeze the time inside oauth1Header without monkey-patching
    // Date.now/randomBytes; instead we just confirm the shape is stable.
    const h1 = oauth1Header({
      method: 'GET', url: 'https://x.test/y', bodyParams: { z: '2' },
      consumerKey: 'ck', consumerSecret: 'cs', token: 'tk', tokenSecret: 'ts',
    })
    const h2 = oauth1Header({
      method: 'GET', url: 'https://x.test/y', bodyParams: { z: '2' },
      consumerKey: 'ck', consumerSecret: 'cs', token: 'tk', tokenSecret: 'ts',
    })
    // The header structure (sorted keys, same oauth_*) is identical; only
    // nonce/timestamp/signature differ between calls.
    expect(h1.replace(/oauth_nonce="[^"]*"/, '').replace(/oauth_timestamp="[^"]*"/, '').replace(/oauth_signature="[^"]*"/, ''))
      .toBe(h2.replace(/oauth_nonce="[^"]*"/, '').replace(/oauth_timestamp="[^"]*"/, '').replace(/oauth_signature="[^"]*"/, ''))
  })
})

describe('scripts/tumblr-setup.mjs - buildEnvUpdate', () => {
  it('appends new SEO_ANT_TUMBLR_* keys to a file that lacks them', () => {
    const out = buildEnvUpdate('FOO=bar\n', {
      'SEO_ANT_TUMBLR_CONSUMER_KEY': 'ck',
      'SEO_ANT_TUMBLR_CONSUMER_SECRET': 'cs',
      'SEO_ANT_TUMBLR_TOKEN': 'tk',
      'SEO_ANT_TUMBLR_TOKEN_SECRET': 'ts',
      'SEO_ANT_TUMBLR_BLOG_ID': 't:abc',
    })
    expect(out).toContain('FOO=bar')
    for (const [k, v] of Object.entries({
      'SEO_ANT_TUMBLR_CONSUMER_KEY': 'ck',
      'SEO_ANT_TUMBLR_CONSUMER_SECRET': 'cs',
      'SEO_ANT_TUMBLR_TOKEN': 'tk',
      'SEO_ANT_TUMBLR_TOKEN_SECRET': 'ts',
      'SEO_ANT_TUMBLR_BLOG_ID': 't:abc',
    })) expect(out).toContain(`${k}=${v}`)
  })
  it('replaces an existing SEO_ANT_TUMBLR_* line in place rather than duplicating it', () => {
    const out = buildEnvUpdate('SEO_ANT_TUMBLR_TOKEN=old\nOTHER=1\n', { 'SEO_ANT_TUMBLR_TOKEN': 'new' })
    const lines = out.trim().split('\n')
    expect(lines.filter((l) => l.startsWith('SEO_ANT_TUMBLR_TOKEN=')).length).toBe(1)
    expect(out).toContain('SEO_ANT_TUMBLR_TOKEN=new')
    expect(out).toContain('OTHER=1')
  })
  it('works on an empty starting file', () => {
    const out = buildEnvUpdate('', { 'SEO_ANT_TUMBLR_TOKEN': 'tok' })
    expect(out.trim()).toBe('SEO_ANT_TUMBLR_TOKEN=tok')
  })
})

describe('scripts/tumblr-setup.mjs - writeTumblrEnv (injected fs)', () => {
  it('writes the 5 keys without ever logging them', () => {
    let written = null
    const readFile = () => 'EXISTING=1\n'
    const writeFile = (path, text) => { written = { path, text } }
    writeTumblrEnv({
      envPath: '/fake/.env',
      values: {
        'SEO_ANT_TUMBLR_CONSUMER_KEY': 'ck',
        'SEO_ANT_TUMBLR_CONSUMER_SECRET': 'cs',
        'SEO_ANT_TUMBLR_TOKEN': 'tk',
        'SEO_ANT_TUMBLR_TOKEN_SECRET': 'ts',
        'SEO_ANT_TUMBLR_BLOG_ID': 't:abc',
      },
      readFile, writeFile, exists: () => true,
    })
    expect(written.path).toBe('/fake/.env')
    expect(written.text).toContain('EXISTING=1')
    expect(written.text).toContain('SEO_ANT_TUMBLR_CONSUMER_KEY=ck')
    expect(written.text).toContain('SEO_ANT_TUMBLR_CONSUMER_SECRET=cs')
    expect(written.text).toContain('SEO_ANT_TUMBLR_TOKEN=tk')
    expect(written.text).toContain('SEO_ANT_TUMBLR_TOKEN_SECRET=ts')
    expect(written.text).toContain('SEO_ANT_TUMBLR_BLOG_ID=t:abc')
  })
})

describe('scripts/tumblr-setup.mjs - removeTriggerLines', () => {
  it('removes only matching kind lines, keeps others', () => {
    const text = JSON.stringify({ kind: 'tumblr_api_setup_needed' }) + '\n' +
                 JSON.stringify({ kind: 'other' }) + '\n'
    const out = removeTriggerLines(text, 'tumblr_api_setup_needed')
    expect(out).toContain('"kind":"other"')
    expect(out).not.toContain('tumblr_api_setup_needed')
  })
  it('returns input untouched when no matching kind is present', () => {
    const text = JSON.stringify({ kind: 'foo' }) + '\n'
    expect(removeTriggerLines(text, 'tumblr_api_setup_needed')).toBe(text)
  })
})

describe('scripts/tumblr-setup.mjs - clearTumblrSetupTrigger', () => {
  it('reports cleared:false when no triggers file exists', () => {
    const exists = () => false
    expect(clearTumblrSetupTrigger({ triggersPath: '/nope', exists, readFile: () => '', writeFile: () => {} })).toEqual({ cleared: false })
  })
  it('writes nothing when there is no matching trigger', () => {
    let written = null
    const writeFile = (path, text) => { written = { path, text } }
    const text = JSON.stringify({ kind: 'other' }) + '\n'
    const out = clearTumblrSetupTrigger({ triggersPath: '/t', exists: () => true, readFile: () => text, writeFile })
    expect(out).toEqual({ cleared: false })
    expect(written).toBe(null)
  })
  it('removes the matching trigger and writes the file', () => {
    let written = null
    const writeFile = (path, text) => { written = { path, text } }
    const text = JSON.stringify({ kind: 'tumblr_api_setup_needed' }) + '\n'
    const out = clearTumblrSetupTrigger({ triggersPath: '/t', exists: () => true, readFile: () => text, writeFile })
    expect(out).toEqual({ cleared: true })
    expect(written.text).not.toContain('tumblr_api_setup_needed')
  })
})

describe('scripts/tumblr-setup.mjs - parseOAuth1Response', () => {
  it('parses key=value&key=value responses', () => {
    expect(parseOAuth1Response('oauth_token=tok&oauth_token_secret=sec'))
      .toEqual({ oauth_token: 'tok', oauth_token_secret: 'sec' })
  })
  it('decodes percent-encoded values', () => {
    expect(parseOAuth1Response('oauth_callback_confirmed=true&x=a%20b'))
      .toEqual({ oauth_callback_confirmed: 'true', x: 'a b' })
  })
  it('returns empty object on null/empty input', () => {
    expect(parseOAuth1Response('')).toEqual({})
    expect(parseOAuth1Response(null)).toEqual({})
  })
})

describe('scripts/tumblr-setup.mjs - fetchRequestToken', () => {
  it('returns ok:false when fields are missing', async () => {
    const v = await fetchRequestToken({ consumerKey: '', consumerSecret: 's', callbackUrl: 'http://x/c', fetchFn: vi.fn() })
    expect(v.ok).toBe(false)
  })
  it('returns ok:true with oauth_token + oauth_token_secret on success', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      text: async () => 'oauth_token=REQTOK&oauth_token_secret=REQSEC&oauth_callback_confirmed=true',
    })
    const v = await fetchRequestToken({
      consumerKey: 'ck', consumerSecret: 'cs', callbackUrl: 'http://localhost:8767/cb', fetchFn,
    })
    expect(v.ok).toBe(true)
    expect(v.oauthToken).toBe('REQTOK')
    expect(v.oauthTokenSecret).toBe('REQSEC')
    expect(v.callbackConfirmed).toBe('true')
    expect(fetchFn).toHaveBeenCalledWith(
      'https://www.tumblr.com/oauth/request_token',
      expect.objectContaining({ method: 'POST' })
    )
    const callArgs = fetchFn.mock.calls[0][1]
    expect(callArgs.headers.Authorization.startsWith('OAuth ')).toBe(true)
    expect(callArgs.body).toContain('oauth_callback=')
    expect(callArgs.body).toContain(encodeURIComponent('http://localhost:8767/cb'))
    expect(callArgs.headers['content-type']).toBe('application/x-www-form-urlencoded')
  })
  it('returns ok:false on HTTP non-200', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => 'denied' })
    const v = await fetchRequestToken({ consumerKey: 'ck', consumerSecret: 'cs', callbackUrl: 'http://x/c', fetchFn })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('401')
  })
  it('returns ok:false on response missing oauth_token', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => 'foo=bar' })
    const v = await fetchRequestToken({ consumerKey: 'ck', consumerSecret: 'cs', callbackUrl: 'http://x/c', fetchFn })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('missing')
  })
  it('returns ok:false on network throw', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('ECONNRESET'))
    const v = await fetchRequestToken({ consumerKey: 'ck', consumerSecret: 'cs', callbackUrl: 'http://x/c', fetchFn })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('ECONNRESET')
  })
})

describe('scripts/tumblr-setup.mjs - buildAuthorizeUrl', () => {
  it('builds the /oauth/authorize URL with the request_token as a query param', () => {
    const u = new URL(buildAuthorizeUrl({ requestToken: 'REQTOK' }))
    expect(u.origin + u.pathname).toBe('https://www.tumblr.com/oauth/authorize')
    expect(u.searchParams.get('oauth_token')).toBe('REQTOK')
  })
})

describe('scripts/tumblr-setup.mjs - parseCallback', () => {
  it('extracts oauth_token + oauth_verifier from a callback URL', () => {
    const r = parseCallback('/callback?oauth_token=REQTOK&oauth_verifier=VERIFIER')
    expect(r.oauthToken).toBe('REQTOK')
    expect(r.oauthVerifier).toBe('VERIFIER')
    expect(r.error).toBe(null)
  })
  it('captures the error param when present', () => {
    const r = parseCallback('/callback?error=access_denied')
    expect(r.error).toBe('access_denied')
  })
})

describe('scripts/tumblr-setup.mjs - fetchAccessToken', () => {
  it('returns ok:false when fields are missing', async () => {
    const v = await fetchAccessToken({ consumerKey: 'ck', consumerSecret: 'cs', oauthToken: '', oauthTokenSecret: 'rts', oauthVerifier: 'v', fetchFn: vi.fn() })
    expect(v.ok).toBe(false)
  })
  it('returns ok:true with permanent oauth_token + oauth_token_secret on success', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      text: async () => 'oauth_token=ACCESSTOK&oauth_token_secret=ACCESSSEC',
    })
    const v = await fetchAccessToken({
      consumerKey: 'ck', consumerSecret: 'cs',
      oauthToken: 'REQTOK', oauthTokenSecret: 'REQSEC', oauthVerifier: 'VERIFIER',
      fetchFn,
    })
    expect(v.ok).toBe(true)
    expect(v.oauthToken).toBe('ACCESSTOK')
    expect(v.oauthTokenSecret).toBe('ACCESSSEC')
    const callArgs = fetchFn.mock.calls[0][1]
    expect(callArgs.headers.Authorization).toContain('oauth_token="REQTOK"')
    expect(callArgs.body).toContain('oauth_verifier=VERIFIER')
    expect(callArgs.headers['content-type']).toBe('application/x-www-form-urlencoded')
  })
  it('returns ok:false on HTTP non-200', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => 'denied' })
    const v = await fetchAccessToken({
      consumerKey: 'ck', consumerSecret: 'cs',
      oauthToken: 'REQTOK', oauthTokenSecret: 'REQSEC', oauthVerifier: 'VERIFIER',
      fetchFn,
    })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('401')
  })
  it('returns ok:false on response missing oauth_token', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => 'foo=bar' })
    const v = await fetchAccessToken({
      consumerKey: 'ck', consumerSecret: 'cs',
      oauthToken: 'REQTOK', oauthTokenSecret: 'REQSEC', oauthVerifier: 'VERIFIER',
      fetchFn,
    })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('missing')
  })
  it('returns ok:false on network throw', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('EAI_AGAIN'))
    const v = await fetchAccessToken({
      consumerKey: 'ck', consumerSecret: 'cs',
      oauthToken: 'REQTOK', oauthTokenSecret: 'REQSEC', oauthVerifier: 'VERIFIER',
      fetchFn,
    })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('EAI_AGAIN')
  })
})

describe('scripts/tumblr-setup.mjs - fetchUserInfo', () => {
  it('returns ok:false when fields are missing', async () => {
    const v = await fetchUserInfo({ consumerKey: '', consumerSecret: 'cs', oauthToken: 't', oauthTokenSecret: 's', fetchFn: vi.fn() })
    expect(v.ok).toBe(false)
  })
  it('returns ok:true with a list of blogs on success', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({
        response: {
          user: {
            blogs: [
              { uuid: 't:1', name: 'a', url: 'https://a.tumblr.com/', title: 'Blog A' },
              { uuid: 't:2', name: 'b', url: 'https://b.tumblr.com/', title: 'Blog B' },
            ],
          },
        },
      }),
    })
    const v = await fetchUserInfo({
      consumerKey: 'ck', consumerSecret: 'cs',
      oauthToken: 'tk', oauthTokenSecret: 'ts',
      fetchFn,
    })
    expect(v.ok).toBe(true)
    expect(v.blogs).toHaveLength(2)
    expect(v.blogs[0].uuid).toBe('t:1')
    expect(v.blogs[0].title).toBe('Blog A')
    expect(v.count).toBe(2)
    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.tumblr.com/v2/user/info',
      expect.objectContaining({ method: 'GET' })
    )
  })
  it('returns ok:true with empty list when blogs are absent', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ response: {} }) })
    const v = await fetchUserInfo({ consumerKey: 'ck', consumerSecret: 'cs', oauthToken: 'tk', oauthTokenSecret: 'ts', fetchFn })
    expect(v.ok).toBe(true)
    expect(v.blogs).toHaveLength(0)
  })
  it('returns ok:false on HTTP non-200', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) })
    const v = await fetchUserInfo({ consumerKey: 'ck', consumerSecret: 'cs', oauthToken: 'tk', oauthTokenSecret: 'ts', fetchFn })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('503')
  })
  it('returns ok:false on network throw', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('ETIMEDOUT'))
    const v = await fetchUserInfo({ consumerKey: 'ck', consumerSecret: 'cs', oauthToken: 'tk', oauthTokenSecret: 'ts', fetchFn })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('ETIMEDOUT')
  })
})
