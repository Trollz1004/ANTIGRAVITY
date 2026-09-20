import { describe, it, expect } from 'vitest'
import {
  parseArgs, buildEnvUpdate, writeRedditEnv, removeTriggerLines,
  clearRedditSetupTrigger, parseCallback, SETUP_STEPS, REDIRECT_URI, CALLBACK_PORT,
} from '../scripts/reddit-setup.mjs'

describe('scripts/reddit-setup.mjs — parseArgs', () => {
  it('reads --client-id and --client-secret', () => {
    expect(parseArgs(['--client-id', 'abc', '--client-secret', 'xyz'])).toEqual({ clientId: 'abc', clientSecret: 'xyz' })
  })
  it('returns an empty object with no args (the print-steps path)', () => {
    expect(parseArgs([])).toEqual({})
  })
})

describe('scripts/reddit-setup.mjs — SETUP_STEPS / REDIRECT_URI', () => {
  it('names reddit.com/prefs/apps and the localhost:8765 callback', () => {
    expect(SETUP_STEPS).toContain('reddit.com/prefs/apps')
    expect(SETUP_STEPS).toContain(REDIRECT_URI)
    expect(CALLBACK_PORT).toBe(8765)
    expect(REDIRECT_URI).toBe('http://localhost:8765/callback')
  })
})

describe('scripts/reddit-setup.mjs — buildEnvUpdate (never prints, just returns text)', () => {
  it('appends new REDDIT_* keys to a file that lacks them', () => {
    const out = buildEnvUpdate('FOO=bar\n', { REDDIT_CLIENT_ID: 'cid', REDDIT_REFRESH_TOKEN: 'rtok' })
    expect(out).toContain('FOO=bar')
    expect(out).toContain('REDDIT_CLIENT_ID=cid')
    expect(out).toContain('REDDIT_REFRESH_TOKEN=rtok')
  })

  it('replaces an existing REDDIT_* line in place rather than duplicating it', () => {
    const out = buildEnvUpdate('REDDIT_CLIENT_ID=old\nOTHER=1\n', { REDDIT_CLIENT_ID: 'new' })
    const lines = out.trim().split('\n')
    expect(lines.filter((l) => l.startsWith('REDDIT_CLIENT_ID=')).length).toBe(1)
    expect(out).toContain('REDDIT_CLIENT_ID=new')
    expect(out).toContain('OTHER=1')
  })

  it('works on an empty starting file', () => {
    const out = buildEnvUpdate('', { REDDIT_USER_AGENT: 'ua' })
    expect(out.trim()).toBe('REDDIT_USER_AGENT=ua')
  })
})

describe('scripts/reddit-setup.mjs — writeRedditEnv (injected fs, never touches the real .env)', () => {
  it('reads the existing file, updates it, and writes it back — values never logged', () => {
    let written = null
    const readFile = () => 'EXISTING=1\n'
    const writeFile = (path, text) => { written = { path, text } }
    writeRedditEnv({ envPath: '/fake/.env', values: { REDDIT_CLIENT_ID: 'cid' }, readFile, writeFile, exists: () => true })
    expect(written.path).toBe('/fake/.env')
    expect(written.text).toContain('EXISTING=1')
    expect(written.text).toContain('REDDIT_CLIENT_ID=cid')
  })

  it('starts from empty text when the file does not exist yet', () => {
    let written = null
    const writeFile = (path, text) => { written = { path, text } }
    writeRedditEnv({ envPath: '/fake/.env', values: { REDDIT_CLIENT_ID: 'cid' }, readFile: () => { throw new Error('should not read') }, writeFile, exists: () => false })
    expect(written.text.trim()).toBe('REDDIT_CLIENT_ID=cid')
  })
})

describe('scripts/reddit-setup.mjs — removeTriggerLines / clearRedditSetupTrigger', () => {
  it('removes only lines matching the given kind', () => {
    const text = [
      JSON.stringify({ kind: 'reddit_api_setup_needed', text: 'x' }),
      JSON.stringify({ kind: 'other_trigger', text: 'y' }),
    ].join('\n')
    const out = removeTriggerLines(text, 'reddit_api_setup_needed')
    expect(out).not.toContain('reddit_api_setup_needed')
    expect(out).toContain('other_trigger')
  })

  it('clearRedditSetupTrigger is a no-op when the file does not exist', () => {
    const r = clearRedditSetupTrigger({ triggersPath: '/nope', exists: () => false })
    expect(r.cleared).toBe(false)
  })

  it('clearRedditSetupTrigger reports cleared:true and writes the filtered text', () => {
    let written = null
    const text = JSON.stringify({ kind: 'reddit_api_setup_needed', text: 'x' }) + '\n'
    const r = clearRedditSetupTrigger({
      triggersPath: '/fake/TRIGGERS.jsonl', exists: () => true,
      readFile: () => text, writeFile: (p, t) => { written = t },
    })
    expect(r.cleared).toBe(true)
    expect(written).not.toContain('reddit_api_setup_needed')
  })

  it('clearRedditSetupTrigger reports cleared:false when the kind is absent', () => {
    const text = JSON.stringify({ kind: 'other_trigger', text: 'y' }) + '\n'
    const r = clearRedditSetupTrigger({ triggersPath: '/fake/TRIGGERS.jsonl', exists: () => true, readFile: () => text, writeFile: () => { throw new Error('should not write') } })
    expect(r.cleared).toBe(false)
  })
})

describe('scripts/reddit-setup.mjs — parseCallback', () => {
  it('parses code/state from the redirect', () => {
    expect(parseCallback('/callback?code=ABC&state=xyz')).toEqual({ code: 'ABC', state: 'xyz', error: null })
  })
  it('parses a denied-consent error', () => {
    expect(parseCallback('/callback?error=access_denied&state=xyz')).toEqual({ code: null, state: 'xyz', error: 'access_denied' })
  })
})
