import { describe, it, expect, vi } from 'vitest'
import {
  parseArgs, buildEnvUpdate, writeHashnodeEnv, removeTriggerLines,
  clearHashnodeSetupTrigger, fetchFirstPublication, SETUP_STEPS,
} from '../scripts/hashnode-setup.mjs'

describe('scripts/hashnode-setup.mjs - parseArgs', () => {
  it('reads --token', () => {
    expect(parseArgs(['--token', 'tok123'])).toEqual({ token: 'tok123' })
  })
  it('reads --token and --publication-id together', () => {
    expect(parseArgs(['--token', 'tok', '--publication-id', 'pub-id-abc'])).toEqual({
      token: 'tok',
      publicationId: 'pub-id-abc',
    })
  })
  it('returns an empty object with no args (the print-steps path)', () => {
    expect(parseArgs([])).toEqual({})
  })
})

describe('scripts/hashnode-setup.mjs - SETUP_STEPS', () => {
  it('names hashnode.com/settings/developer and the command to run', () => {
    expect(SETUP_STEPS).toContain('hashnode.com/settings/developer')
    expect(SETUP_STEPS).toContain('drift hashnode-setup --token')
    expect(SETUP_STEPS).toContain('SEO_ANT_HASHNODE_TOKEN')
    expect(SETUP_STEPS).toContain('SEO_ANT_HASHNODE_PUBLICATION_ID')
  })
  it('does NOT contain any token-shaped strings', () => {
    expect(SETUP_STEPS).not.toMatch(/[A-Za-z0-9]{32,}/)
  })
})

describe('scripts/hashnode-setup.mjs - buildEnvUpdate', () => {
  it('appends new SEO_ANT_HASHNODE_* keys to a file that lacks them', () => {
    const out = buildEnvUpdate('FOO=bar\n', {
      SEO_ANT_HASHNODE_TOKEN: 'tok123',
      SEO_ANT_HASHNODE_PUBLICATION_ID: 'pub-id',
    })
    expect(out).toContain('FOO=bar')
    expect(out).toContain('SEO_ANT_HASHNODE_TOKEN=tok123')
    expect(out).toContain('SEO_ANT_HASHNODE_PUBLICATION_ID=pub-id')
  })
  it('replaces an existing SEO_ANT_HASHNODE_* line in place rather than duplicating it', () => {
    const out = buildEnvUpdate('SEO_ANT_HASHNODE_TOKEN=old\nSEO_ANT_HASHNODE_PUBLICATION_ID=old-pub\nOTHER=1\n', {
      SEO_ANT_HASHNODE_TOKEN: 'new',
      SEO_ANT_HASHNODE_PUBLICATION_ID: 'new-pub',
    })
    const lines = out.trim().split('\n')
    expect(lines.filter((l) => l.startsWith('SEO_ANT_HASHNODE_TOKEN=')).length).toBe(1)
    expect(lines.filter((l) => l.startsWith('SEO_ANT_HASHNODE_PUBLICATION_ID=')).length).toBe(1)
    expect(out).toContain('SEO_ANT_HASHNODE_TOKEN=new')
    expect(out).toContain('SEO_ANT_HASHNODE_PUBLICATION_ID=new-pub')
    expect(out).toContain('OTHER=1')
  })
  it('works on an empty starting file', () => {
    const out = buildEnvUpdate('', { SEO_ANT_HASHNODE_TOKEN: 'tok' })
    expect(out.trim()).toBe('SEO_ANT_HASHNODE_TOKEN=tok')
  })
})

describe('scripts/hashnode-setup.mjs - writeHashnodeEnv (injected fs)', () => {
  it('writes the token + publication id without ever logging them', () => {
    let written = null
    const readFile = () => 'EXISTING=1\n'
    const writeFile = (path, text) => { written = { path, text } }
    writeHashnodeEnv({
      envPath: '/fake/.env',
      values: { SEO_ANT_HASHNODE_TOKEN: 'tok123', SEO_ANT_HASHNODE_PUBLICATION_ID: 'pub-id' },
      readFile, writeFile, exists: () => true,
    })
    expect(written.path).toBe('/fake/.env')
    expect(written.text).toContain('EXISTING=1')
    expect(written.text).toContain('SEO_ANT_HASHNODE_TOKEN=tok123')
    expect(written.text).toContain('SEO_ANT_HASHNODE_PUBLICATION_ID=pub-id')
  })
})

describe('scripts/hashnode-setup.mjs - removeTriggerLines', () => {
  it('removes only matching kind lines, keeps others', () => {
    const text = JSON.stringify({ kind: 'hashnode_api_setup_needed' }) + '\n' +
                 JSON.stringify({ kind: 'other' }) + '\n'
    const out = removeTriggerLines(text, 'hashnode_api_setup_needed')
    expect(out).toContain('"kind":"other"')
    expect(out).not.toContain('hashnode_api_setup_needed')
  })
  it('returns input untouched when no matching kind is present', () => {
    const text = JSON.stringify({ kind: 'foo' }) + '\n'
    expect(removeTriggerLines(text, 'hashnode_api_setup_needed')).toBe(text)
  })
})

describe('scripts/hashnode-setup.mjs - clearHashnodeSetupTrigger', () => {
  it('reports cleared:false when no triggers file exists', () => {
    const exists = () => false
    expect(clearHashnodeSetupTrigger({ triggersPath: '/nope', exists, readFile: () => '', writeFile: () => {} })).toEqual({ cleared: false })
  })
  it('writes nothing when there is no matching trigger', () => {
    let written = null
    const writeFile = (path, text) => { written = { path, text } }
    const text = JSON.stringify({ kind: 'other' }) + '\n'
    const out = clearHashnodeSetupTrigger({ triggersPath: '/t', exists: () => true, readFile: () => text, writeFile })
    expect(out).toEqual({ cleared: false })
    expect(written).toBe(null)
  })
  it('removes the matching trigger and writes the file', () => {
    let written = null
    const writeFile = (path, text) => { written = { path, text } }
    const text = JSON.stringify({ kind: 'hashnode_api_setup_needed' }) + '\n'
    const out = clearHashnodeSetupTrigger({ triggersPath: '/t', exists: () => true, readFile: () => text, writeFile })
    expect(out).toEqual({ cleared: true })
    expect(written.text).not.toContain('hashnode_api_setup_needed')
  })
})

describe('scripts/hashnode-setup.mjs - fetchFirstPublication', () => {
  it('returns ok:false when token is missing', async () => {
    const v = await fetchFirstPublication({ token: '', fetchFn: vi.fn() })
    expect(v.ok).toBe(false)
  })
  it('returns ok:true with first publication on success', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({
        data: {
          me: {
            publications: {
              edges: [
                { node: { id: 'pub-1', title: 'My Blog' } },
                { node: { id: 'pub-2', title: 'Second' } },
              ],
            },
          },
        },
      }),
    })
    const v = await fetchFirstPublication({ token: 'abc', fetchFn })
    expect(v.ok).toBe(true)
    expect(v.id).toBe('pub-1')
    expect(v.title).toBe('My Blog')
    expect(v.count).toBe(2)
    expect(fetchFn).toHaveBeenCalledWith(
      'https://gql.hashnode.com',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'abc' }),
      })
    )
  })
  it('returns ok:false on HTTP non-200', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ status: 401, json: async () => ({}) })
    const v = await fetchFirstPublication({ token: 'bad', fetchFn })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('401')
  })
  it('returns ok:false on GraphQL errors payload', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ errors: [{ message: 'invalid token' }] }),
    })
    const v = await fetchFirstPublication({ token: 'bad', fetchFn })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('invalid token')
  })
  it('returns ok:false when the user has no publications', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ data: { me: { publications: { edges: [] } } } }),
    })
    const v = await fetchFirstPublication({ token: 'abc', fetchFn })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('no publications')
  })
  it('returns ok:false on network throw', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    const v = await fetchFirstPublication({ token: 'x', fetchFn })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('ECONNREFUSED')
  })
})
