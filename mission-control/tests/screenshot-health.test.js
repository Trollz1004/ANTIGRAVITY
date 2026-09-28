import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadTargets, verdictOf, summarize, readScreenshotHealth, DEFAULT_TARGETS_PATH } from '../lib/screenshot-health.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

describe('lib/screenshot-health.mjs — targets', () => {
  it('ships a real target file with the dashboards and every domain, ids safe for a URL segment', () => {
    const t = loadTargets(DEFAULT_TARGETS_PATH)
    const ids = t.map((x) => x.id)
    for (const id of ['jarvis', 'domains-server', 'dashboard-aidoesitall', 'youandinotai', 'untilnokidinneed', 'untilnokidinneed-dao', 'dream-online-net', 'ai-solutions-store', 'onlinerecycle-net']) expect(ids).toContain(id)
    for (const x of t) { expect(x.id).toMatch(/^[a-z0-9-]+$/); expect(x.url).toMatch(/^https?:\/\//); expect(typeof x.identity).toBe('string') }
    expect(t.find((x) => x.id === 'dashboard-aidoesitall').access).toBe(true)
  })
  it('rejects a target without an identity string (a port answering is not health)', () => {
    expect(() => loadTargets('x.json', { readFile: () => JSON.stringify({ targets: [{ id: 'a', url: 'http://x/' }] }) })).toThrow(/identity/)
    expect(() => loadTargets('x.json', { readFile: () => JSON.stringify({ targets: [{ id: 'Bad Id', url: 'http://x/', identity: 'x' }] }) })).toThrow(/id/)
  })
})

describe('lib/screenshot-health.mjs — verdict rule', () => {
  const t = { id: 'a', url: 'https://a/', identity: 'Until No Kid In Need' }
  it('UP only when the identity is in the visible text or title', () => {
    expect(verdictOf(t, { status: 200, text: 'welcome to Until No Kid In Need', title: 'x' }).state).toBe('UP')
    expect(verdictOf(t, { status: 200, text: 'parking page', title: 'IONOS' }).state).toBe('WRONG SERVICE')
  })
  it('a 200 with the wrong page is WRONG SERVICE, a 5xx is DOWN, a DNS failure is PENDING NAMESERVERS', () => {
    expect(verdictOf(t, { status: 503, text: 'Until No Kid In Need' }).state).toBe('DOWN')
    expect(verdictOf(t, { error: 'page.goto: net::ERR_NAME_NOT_RESOLVED at https://a/' }).state).toBe('PENDING NAMESERVERS')
    expect(verdictOf(t, { error: 'page.goto: net::ERR_CONNECTION_REFUSED' }).state).toBe('DOWN')
  })
  it('a Cloudflare Access sign-in page is the expected UP for an access target and not for others', () => {
    const o = { status: 200, finalUrl: 'https://team.cloudflareaccess.com/cdn-cgi/access/login/x', title: 'Sign in ・ Cloudflare Access', text: '' }
    expect(verdictOf({ ...t, access: true }, o)).toMatchObject({ state: 'ACCESS SIGN-IN', up: true })
    expect(verdictOf(t, o)).toMatchObject({ state: 'ACCESS SIGN-IN', up: false })
  })
})

describe('lib/screenshot-health.mjs — summary and reader', () => {
  it('summarises honestly: an empty list is RED, pending nameservers is YELLOW, a required DOWN is RED', () => {
    expect(summarize([]).overall).toBe('RED')
    expect(summarize([{ up: true }, { up: false, state: 'PENDING NAMESERVERS' }]).overall).toBe('YELLOW')
    expect(summarize([{ up: true }, { up: false, state: 'DOWN', optional: true }]).overall).toBe('YELLOW')
    expect(summarize([{ up: true }, { up: false, state: 'DOWN' }]).overall).toBe('RED')
    expect(summarize([{ up: true }, { up: true }]).overall).toBe('GREEN')
  })
  it('reports NOT CONFIGURED with the path when the runner has never written a result', () => {
    const r = readScreenshotHealth({ jsonPath: '/nowhere/screenshot-health.json', exists: () => false })
    expect(r.ok).toBe(false); expect(r.state).toBe('NOT CONFIGURED'); expect(r.detail).toContain('/nowhere/screenshot-health.json'); expect(r.targets).toEqual([])
  })
  it('reads a real result file, tolerates a BOM, and flags one older than two hours as STALE', () => {
    const at = '2026-09-28T12:00:00.000Z'
    const body = '\ufeff' + JSON.stringify({ at, targets: [{ id: 'jarvis', up: true, state: 'UP' }], shotsDir: 'evidence/health-shots/2026-09-28' })
    const fresh = readScreenshotHealth({ jsonPath: 'x', exists: () => true, readFile: () => body, now: () => Date.parse(at) + 60000 })
    expect(fresh.ok).toBe(true); expect(fresh.state).toBe('FRESH'); expect(fresh.summary.overall).toBe('GREEN'); expect(fresh.targets[0].id).toBe('jarvis')
    const stale = readScreenshotHealth({ jsonPath: 'x', exists: () => true, readFile: () => body, now: () => Date.parse(at) + 3 * 3600 * 1000 })
    expect(stale.state).toBe('STALE')
    const nc = readScreenshotHealth({ jsonPath: 'x', exists: () => true, readFile: () => JSON.stringify({ at, state: 'NOT CONFIGURED', detail: 'playwright missing' }) })
    expect(nc.state).toBe('NOT CONFIGURED'); expect(nc.detail).toContain('playwright')
  })
  it('the runner script exists, resolves playwright honestly and never fabricates a row', () => {
    const src = fs.readFileSync(path.join(root, 'scripts', 'screenshot-health.mjs'), 'utf8')
    expect(src).toContain("NOT CONFIGURED")
    expect(src).toContain('screenshot-health.json')
    expect(src).toContain('page.screenshot(')
    expect(src).toContain('document.body.innerText')
  })
})

describe('JARVIS wiring — /api/screenshot-health', () => {
  const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf8')
  it('imports the reader and serves the result file and the PNGs by safe id', () => {
    expect(server).toContain("from './lib/screenshot-health.mjs'")
    expect(server).toContain("p === '/api/screenshot-health'")
    expect(server).toMatch(/\/api\\\/screenshot-health\\\/shot\\\/\(\[a-z0-9-\]\+\)/)
  })
  it('the result file and log are gitignored (they are node state, not source)', () => {
    const gi = fs.readFileSync(path.join(root, '..', '.gitignore'), 'utf8')
    expect(gi).toContain('ops/heartbeat/screenshot-health.json')
    expect(gi).toContain('ops/heartbeat/screenshot-health.log')
  })
})
