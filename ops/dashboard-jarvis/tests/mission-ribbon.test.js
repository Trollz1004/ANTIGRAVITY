import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')
const repoRoot = path.resolve(root, '..', '..') // C:\ANTIGRAVITY

const mod = await import('../lib/mission-ribbon.mjs')
const clientMod = await import('../js/jarvis/ops.js')

describe('lib/mission-ribbon.mjs — pure parsing', () => {
  it('extractRulingHeadings keeps headings that mention a ruling or carry a date', () => {
    const md = [
      '# Title',
      '## Current Reality',
      '## Mission Control',
      '## One Mission Control (ruling 2026-09-17)',
      '## Date App FROZEN and FOR SALE (ruling 2026-09-16)',
      '## Plain heading with no signal',
    ].join('\n')
    const out = mod.extractRulingHeadings(md)
    expect(out).toContain('One Mission Control (ruling 2026-09-17)')
    expect(out).toContain('Date App FROZEN and FOR SALE (ruling 2026-09-16)')
    expect(out).not.toContain('Current Reality')
    expect(out).not.toContain('Plain heading with no signal')
  })

  it('extractJournalEntries reads the last N entries with their next: line', () => {
    const state = [
      '## 2026-09-01 (judge, a)',
      '- did: thing one',
      '- next: do the first follow-up',
      '',
      '## 2026-09-02 (judge, b)',
      '- did: thing two',
      '- next: do the second follow-up',
      '',
      '## 2026-09-03 (judge, c)',
      '- did: thing three',
      '- next: do the third follow-up',
      '',
      '## 2026-09-04 (judge, d)',
      '- did: thing four',
      '- next: do the fourth follow-up',
    ].join('\n')
    const out = mod.extractJournalEntries(state, 3)
    expect(out).toHaveLength(3)
    expect(out[0].heading).toBe('2026-09-02 (judge, b)')
    expect(out[2].heading).toBe('2026-09-04 (judge, d)')
    expect(out[2].next).toBe('do the fourth follow-up')
  })

  it('an entry with no next: line reports null, never a fabricated string', () => {
    const state = '## 2026-09-01 (judge, a)\n- did: thing\n- verified: ok\n'
    const out = mod.extractJournalEntries(state, 3)
    expect(out).toHaveLength(1)
    expect(out[0].next).toBeNull()
  })

  it('readMissionRibbon reports an honest error for a missing file instead of throwing', () => {
    const tmp = path.join(root, 'tests', 'fixtures', 'mission-ribbon-tmp')
    fs.rmSync(tmp, { recursive: true, force: true })
    fs.mkdirSync(tmp, { recursive: true })
    const claudeMd = path.join(tmp, 'CLAUDE.md')
    fs.writeFileSync(claudeMd, '## A ruling (2026-01-01)\nbody\n')
    const missing = path.join(tmp, 'does-not-exist.md')
    const r = mod.readMissionRibbon({ claudeMdPath: claudeMd, stateMdPath: missing })
    expect(r.ok).toBe(false)
    expect(r.errors.some((e) => /STATE\.md/.test(e))).toBe(true)
    expect(r.rulings).toContain('A ruling (2026-01-01)')
    expect(r.recentNext).toEqual([])
  })
})

describe('lib/mission-ribbon.mjs — the real repo files (worked example)', () => {
  it('reads real rulings from CLAUDE.md and real next: lines from the judge journal', () => {
    const r = mod.readMissionRibbon({
      claudeMdPath: path.join(repoRoot, 'CLAUDE.md'),
      stateMdPath: path.join(repoRoot, '.agents', 'journals', 'paperclip-judge', 'STATE.md'),
    })
    expect(r.ok).toBe(true)
    expect(r.rulings.length).toBeGreaterThan(0)
    expect(r.recentNext.length).toBeGreaterThan(0)
    expect(r.recentNext.length).toBeLessThanOrEqual(3)
  })
})

describe('JARVIS wiring — index.html, server.mjs', () => {
  let html, server

  it('index.html has the Ops nav tab and section, loads js/jarvis/ops.js', () => {
    html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8')
    expect(html).toContain('data-tab="ops"')
    expect(html).toContain('id="tab-ops"')
    expect(html).toContain('id="ops-ribbon"')
    expect(html).toContain('src="js/jarvis/ops.js"')
  })

  it('the Ops nav tab carries no emoji', () => {
    html = html || fs.readFileSync(path.join(root, 'index.html'), 'utf-8')
    const navMatch = /<li class="nav-tab" data-tab="ops">[\s\S]*?<\/li>/.exec(html)
    expect(navMatch).toBeTruthy()
    // eslint-disable-next-line no-control-regex
    expect(navMatch[0]).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u)
  })

  it('server.mjs wires GET /api/mission-ribbon through lib/mission-ribbon.mjs', () => {
    server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf-8')
    expect(server).toContain("from './lib/mission-ribbon.mjs'")
    expect(server).toMatch(/p === '\/api\/mission-ribbon'/)
  })
})

describe('js/jarvis/ops.js — client module (mission ribbon slice)', () => {
  const src = fs.readFileSync(path.join(root, 'js', 'jarvis', 'ops.js'), 'utf-8')

  it('exports the expected surface', () => {
    expect(typeof clientMod.fetchJson).toBe('function')
    expect(typeof clientMod.loadMissionRibbon).toBe('function')
    expect(typeof clientMod.renderMissionRibbon).toBe('function')
    expect(typeof clientMod.initOps).toBe('function')
  })

  it('carries no absolute URL — relative fetches only, so the tunnel keeps working', () => {
    expect(src).not.toMatch(/https?:\/\//)
    expect(src).not.toMatch(/127\.0\.0\.1|0\.0\.0\.0|:9150|:9119|:18789|:3100|:3151|:3210/)
  })

  it('fetchJson calls the relative API with an injected fetch (no live network)', async () => {
    let calledUrl = null
    const fakeFetch = async (url) => { calledUrl = url; return { ok: true, json: async () => ({ ok: true }) } }
    const r = await clientMod.fetchJson('/api/mission-ribbon', fakeFetch)
    expect(calledUrl).toBe('/api/mission-ribbon')
    expect(r.ok).toBe(true)
  })

  it('renderMissionRibbon shows rulings and next: lines without throwing on empty data', () => {
    const el = { innerHTML: '' }
    clientMod.renderMissionRibbon(el, { rulings: [], recentNext: [] })
    expect(el.innerHTML).toMatch(/No ruling headings/)
    clientMod.renderMissionRibbon(el, { rulings: ['A ruling'], recentNext: [{ heading: 'H', next: 'do X' }] })
    expect(el.innerHTML).toContain('A ruling')
    expect(el.innerHTML).toContain('do X')
  })
})
