import { describe, it, expect, vi } from 'vitest'
import {
  parseArgs, buildTokenRequestBody, buildEnvUpdate, writeWordpressEnv,
  removeTriggerLines, clearWordpressSetupTrigger,
  exchangeForToken, validateSite, SETUP_STEPS,
} from '../scripts/wordpress-setup.mjs'

describe('scripts/wordpress-setup.mjs - parseArgs', () => {
  it('reads --client-id and --client-secret', () => {
    expect(parseArgs(['--client-id', 'cid', '--client-secret', 'csec']))
      .toEqual({ clientId: 'cid', clientSecret: 'csec' })
  })
  it('reads all four required flags plus --site', () => {
    expect(parseArgs(['--client-id', 'cid', '--client-secret', 'csec',
                      '--username', 'me@x.com', '--password', 'abcd1234abcd1234abcd1234',
                      '--site', 'blog.wordpress.com']))
      .toEqual({ clientId: 'cid', clientSecret: 'csec',
                 username: 'me@x.com', password: 'abcd1234abcd1234abcd1234',
                 site: 'blog.wordpress.com' })
  })
  it('returns an empty object with no args (the print-steps path)', () => {
    expect(parseArgs([])).toEqual({})
  })
})

describe('scripts/wordpress-setup.mjs - SETUP_STEPS', () => {
  it('names developer.wordpress.com/apps and the commands to run', () => {
    expect(SETUP_STEPS).toContain('developer.wordpress.com/apps')
    expect(SETUP_STEPS).toContain('drift wordpress-setup')
    expect(SETUP_STEPS).toContain('SEO_ANT_WORDPRESS_TOKEN')
    expect(SETUP_STEPS).toContain('SEO_ANT_WORDPRESS_SITE')
  })
  it('does NOT contain any token-shaped strings', () => {
    expect(SETUP_STEPS).not.toMatch(/[A-Za-z0-9]{32,}/)
  })
})

describe('scripts/wordpress-setup.mjs - buildTokenRequestBody', () => {
  it('produces an x-www-form-urlencoded string with all 5 fields', () => {
    const body = buildTokenRequestBody({
      clientId: 'cid', clientSecret: 'csec', username: 'me@x.com', password: 'app-pw',
    })
    const params = new URLSearchParams(body)
    expect(params.get('client_id')).toBe('cid')
    expect(params.get('client_secret')).toBe('csec')
    expect(params.get('grant_type')).toBe('password')
    expect(params.get('username')).toBe('me@x.com')
    expect(params.get('password')).toBe('app-pw')
  })
  it('URL-encodes special characters in username/password', () => {
    const body = buildTokenRequestBody({
      clientId: 'cid', clientSecret: 'csec', username: 'a+b@x.com', password: 'p&w/='
    })
    expect(body).toContain('a%2Bb%40x.com')
    expect(body).toContain('p%26w%2F%3D')
  })
})

describe('scripts/wordpress-setup.mjs - buildEnvUpdate', () => {
  it('appends new SEO_ANT_WORDPRESS_* keys to a file that lacks them', () => {
    const out = buildEnvUpdate('FOO=bar\n', {
      SEO_ANT_WORDPRESS_TOKEN: 'tok',
      SEO_ANT_WORDPRESS_SITE: 'blog.wordpress.com',
    })
    expect(out).toContain('FOO=bar')
    expect(out).toContain('SEO_ANT_WORDPRESS_TOKEN=tok')
    expect(out).toContain('SEO_ANT_WORDPRESS_SITE=blog.wordpress.com')
  })
  it('replaces an existing SEO_ANT_WORDPRESS_* line in place rather than duplicating it', () => {
    const out = buildEnvUpdate('SEO_ANT_WORDPRESS_TOKEN=old\nSEO_ANT_WORDPRESS_SITE=old\nOTHER=1\n', {
      SEO_ANT_WORDPRESS_TOKEN: 'new',
      SEO_ANT_WORDPRESS_SITE: 'new.wordpress.com',
    })
    const lines = out.trim().split('\n')
    expect(lines.filter((l) => l.startsWith('SEO_ANT_WORDPRESS_TOKEN=')).length).toBe(1)
    expect(lines.filter((l) => l.startsWith('SEO_ANT_WORDPRESS_SITE=')).length).toBe(1)
    expect(out).toContain('SEO_ANT_WORDPRESS_TOKEN=new')
    expect(out).toContain('SEO_ANT_WORDPRESS_SITE=new.wordpress.com')
    expect(out).toContain('OTHER=1')
  })
  it('works on an empty starting file', () => {
    const out = buildEnvUpdate('', { SEO_ANT_WORDPRESS_TOKEN: 'tok' })
    expect(out.trim()).toBe('SEO_ANT_WORDPRESS_TOKEN=tok')
  })
})

describe('scripts/wordpress-setup.mjs - writeWordpressEnv (injected fs)', () => {
  it('writes the token + site without ever logging them', () => {
    let written = null
    const readFile = () => 'EXISTING=1\n'
    const writeFile = (path, text) => { written = { path, text } }
    writeWordpressEnv({
      envPath: '/fake/.env',
      values: { SEO_ANT_WORDPRESS_TOKEN: 'tok', SEO_ANT_WORDPRESS_SITE: 'x.wordpress.com' },
      readFile, writeFile, exists: () => true,
    })
    expect(written.path).toBe('/fake/.env')
    expect(written.text).toContain('EXISTING=1')
    expect(written.text).toContain('SEO_ANT_WORDPRESS_TOKEN=tok')
    expect(written.text).toContain('SEO_ANT_WORDPRESS_SITE=x.wordpress.com')
  })
})

describe('scripts/wordpress-setup.mjs - removeTriggerLines', () => {
  it('removes only matching kind lines, keeps others', () => {
    const text = JSON.stringify({ kind: 'wordpress_api_setup_needed' }) + '\n' +
                 JSON.stringify({ kind: 'other' }) + '\n'
    const out = removeTriggerLines(text, 'wordpress_api_setup_needed')
    expect(out).toContain('"kind":"other"')
    expect(out).not.toContain('wordpress_api_setup_needed')
  })
  it('returns input untouched when no matching kind is present', () => {
    const text = JSON.stringify({ kind: 'foo' }) + '\n'
    expect(removeTriggerLines(text, 'wordpress_api_setup_needed')).toBe(text)
  })
})

describe('scripts/wordpress-setup.mjs - clearWordpressSetupTrigger', () => {
  it('reports cleared:false when no triggers file exists', () => {
    const exists = () => false
    expect(clearWordpressSetupTrigger({ triggersPath: '/nope', exists, readFile: () => '', writeFile: () => {} })).toEqual({ cleared: false })
  })
  it('writes nothing when there is no matching trigger', () => {
    let written = null
    const writeFile = (path, text) => { written = { path, text } }
    const text = JSON.stringify({ kind: 'other' }) + '\n'
    const out = clearWordpressSetupTrigger({ triggersPath: '/t', exists: () => true, readFile: () => text, writeFile })
    expect(out).toEqual({ cleared: false })
    expect(written).toBe(null)
  })
  it('removes the matching trigger and writes the file', () => {
    let written = null
    const writeFile = (path, text) => { written = { path, text } }
    const text = JSON.stringify({ kind: 'wordpress_api_setup_needed' }) + '\n'
    const out = clearWordpressSetupTrigger({ triggersPath: '/t', exists: () => true, readFile: () => text, writeFile })
    expect(out).toEqual({ cleared: true })
    expect(written.text).not.toContain('wordpress_api_setup_needed')
  })
})

describe('scripts/wordpress-setup.mjs - exchangeForToken', () => {
  it('returns ok:false when any required field is missing', async () => {
    const v = await exchangeForToken({ clientId: '', clientSecret: 's', username: 'u', password: 'p', fetchFn: vi.fn() })
    expect(v.ok).toBe(false)
  })
  it('returns ok:true with access_token + blog_id on HTTP 200', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ access_token: 'at-abc', blog_id: '123', scope: 'posts' }),
    })
    const v = await exchangeForToken({
      clientId: 'cid', clientSecret: 'csec', username: 'u', password: 'p', fetchFn,
    })
    expect(v.ok).toBe(true)
    expect(v.accessToken).toBe('at-abc')
    expect(v.blogId).toBe('123')
    expect(fetchFn).toHaveBeenCalledWith(
      'https://public-api.wordpress.com/oauth2/token',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'content-type': 'application/x-www-form-urlencoded' }),
      })
    )
  })
  it('returns ok:false on HTTP non-200 with the error_description', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false, status: 403,
      json: async () => ({ error: 'invalid_request', error_description: 'password is not an app password' }),
    })
    const v = await exchangeForToken({
      clientId: 'cid', clientSecret: 'csec', username: 'u', password: 'p', fetchFn,
    })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('not an app password')
  })
  it('returns ok:false when no access_token is in the response', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ something: 'else' }),
    })
    const v = await exchangeForToken({
      clientId: 'cid', clientSecret: 'csec', username: 'u', password: 'p', fetchFn,
    })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('no access_token')
  })
  it('returns ok:false on network throw', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    const v = await exchangeForToken({
      clientId: 'cid', clientSecret: 'csec', username: 'u', password: 'p', fetchFn,
    })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('ECONNREFUSED')
  })
})

describe('scripts/wordpress-setup.mjs - validateSite', () => {
  it('returns ok:false when token is missing', async () => {
    const v = await validateSite({ token: '', site: 'x.wordpress.com', fetchFn: vi.fn() })
    expect(v.ok).toBe(false)
  })
  it('returns ok:false when site is missing', async () => {
    const v = await validateSite({ token: 't', site: '', fetchFn: vi.fn() })
    expect(v.ok).toBe(false)
  })
  it('returns ok:true with site URL + name on HTTP 200', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ URL: 'https://youandinotai.wordpress.com', name: 'YouAndINotAI' }),
    })
    const v = await validateSite({ token: 't', site: 'youandinotai.wordpress.com', fetchFn })
    expect(v.ok).toBe(true)
    expect(v.site).toBe('https://youandinotai.wordpress.com')
    expect(v.name).toBe('YouAndINotAI')
    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/sites/youandinotai.wordpress.com/me'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer t' }) })
    )
  })
  it('returns ok:false on HTTP non-200', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) })
    const v = await validateSite({ token: 't', site: 'bad', fetchFn })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('404')
  })
  it('returns ok:false on network throw', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('EAI_AGAIN'))
    const v = await validateSite({ token: 't', site: 'x', fetchFn })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('EAI_AGAIN')
  })
})
