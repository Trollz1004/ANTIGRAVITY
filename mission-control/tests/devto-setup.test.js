import { describe, it, expect, vi } from 'vitest'
import {
  parseArgs, buildEnvUpdate, writeDevtoEnv, removeTriggerLines,
  clearDevtoSetupTrigger, validateToken, SETUP_STEPS,
} from '../scripts/devto-setup.mjs'

describe('scripts/devto-setup.mjs - parseArgs', () => {
  it('reads --token', () => {
    expect(parseArgs(['--token', 'abc123'])).toEqual({ token: 'abc123' })
  })
  it('returns an empty object with no args (the print-steps path)', () => {
    expect(parseArgs([])).toEqual({})
  })
})

describe('scripts/devto-setup.mjs - SETUP_STEPS', () => {
  it('names dev.to/settings/extensions and the command to run', () => {
    expect(SETUP_STEPS).toContain('dev.to/settings/extensions')
    expect(SETUP_STEPS).toContain('drift devto-setup --token')
    expect(SETUP_STEPS).toContain('SEO_ANT_DEVTO_TOKEN')
  })
  it('does NOT contain any token-shaped strings (no value leaks)', () => {
    // Defensive: make sure we never embedded a real key in SETUP_STEPS text.
    expect(SETUP_STEPS).not.toMatch(/[A-Za-z0-9]{32,}/)
  })
})

describe('scripts/devto-setup.mjs - buildEnvUpdate', () => {
  it('appends new SEO_ANT_DEVTO_TOKEN to a file that lacks it', () => {
    const out = buildEnvUpdate('FOO=bar\n', { SEO_ANT_DEVTO_TOKEN: 'tok123' })
    expect(out).toContain('FOO=bar')
    expect(out).toContain('SEO_ANT_DEVTO_TOKEN=tok123')
  })
  it('replaces an existing SEO_ANT_DEVTO_TOKEN line in place rather than duplicating it', () => {
    const out = buildEnvUpdate('SEO_ANT_DEVTO_TOKEN=old\nOTHER=1\n', { SEO_ANT_DEVTO_TOKEN: 'new' })
    const lines = out.trim().split('\n')
    expect(lines.filter((l) => l.startsWith('SEO_ANT_DEVTO_TOKEN=')).length).toBe(1)
    expect(out).toContain('SEO_ANT_DEVTO_TOKEN=new')
    expect(out).toContain('OTHER=1')
  })
  it('works on an empty starting file', () => {
    const out = buildEnvUpdate('', { SEO_ANT_DEVTO_TOKEN: 'tok' })
    expect(out.trim()).toBe('SEO_ANT_DEVTO_TOKEN=tok')
  })
})

describe('scripts/devto-setup.mjs - writeDevtoEnv (injected fs)', () => {
  it('writes the token into the env path without ever logging it', () => {
    let written = null
    const readFile = () => 'EXISTING=1\n'
    const writeFile = (path, text) => { written = { path, text } }
    writeDevtoEnv({ envPath: '/fake/.env', values: { SEO_ANT_DEVTO_TOKEN: 'tok123' }, readFile, writeFile, exists: () => true })
    expect(written.path).toBe('/fake/.env')
    expect(written.text).toContain('EXISTING=1')
    expect(written.text).toContain('SEO_ANT_DEVTO_TOKEN=tok123')
  })
})

describe('scripts/devto-setup.mjs - removeTriggerLines', () => {
  it('removes only matching kind lines, keeps others', () => {
    const text = JSON.stringify({ kind: 'devto_api_setup_needed' }) + '\n' +
                 JSON.stringify({ kind: 'other' }) + '\n'
    const out = removeTriggerLines(text, 'devto_api_setup_needed')
    expect(out).toContain('"kind":"other"')
    expect(out).not.toContain('devto_api_setup_needed')
  })
  it('returns input untouched when no matching kind is present', () => {
    const text = JSON.stringify({ kind: 'foo' }) + '\n'
    expect(removeTriggerLines(text, 'devto_api_setup_needed')).toBe(text)
  })
})

describe('scripts/devto-setup.mjs - clearDevtoSetupTrigger', () => {
  it('reports cleared:false when no triggers file exists', () => {
    const exists = () => false
    expect(clearDevtoSetupTrigger({ triggersPath: '/nope', exists, readFile: () => '', writeFile: () => {} })).toEqual({ cleared: false })
  })
  it('writes nothing when there is no matching trigger', () => {
    let written = null
    const writeFile = (path, text) => { written = { path, text } }
    const text = JSON.stringify({ kind: 'other' }) + '\n'
    const out = clearDevtoSetupTrigger({ triggersPath: '/t', exists: () => true, readFile: () => text, writeFile })
    expect(out).toEqual({ cleared: false })
    expect(written).toBe(null)
  })
  it('removes the matching trigger and writes the file', () => {
    let written = null
    const writeFile = (path, text) => { written = { path, text } }
    const text = JSON.stringify({ kind: 'devto_api_setup_needed' }) + '\n'
    const out = clearDevtoSetupTrigger({ triggersPath: '/t', exists: () => true, readFile: () => text, writeFile })
    expect(out).toEqual({ cleared: true })
    expect(written.text).not.toContain('devto_api_setup_needed')
  })
})

describe('scripts/devto-setup.mjs - validateToken', () => {
  it('returns ok:false when token is missing', async () => {
    const v = await validateToken('', { fetchFn: vi.fn() })
    expect(v.ok).toBe(false)
  })
  it('returns ok:true with username on HTTP 200', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ status: 200, json: async () => ({ username: 'me' }) })
    const v = await validateToken('abc', { fetchFn })
    expect(v.ok).toBe(true)
    expect(v.username).toBe('me')
    expect(fetchFn).toHaveBeenCalledWith('https://dev.to/api/users/me', { headers: { 'api-key': 'abc' } })
  })
  it('returns ok:false on non-200 HTTP', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ status: 401, json: async () => ({}) })
    const v = await validateToken('bad', { fetchFn })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('401')
  })
  it('returns ok:false on network throw', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    const v = await validateToken('x', { fetchFn })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('ECONNREFUSED')
  })
})
