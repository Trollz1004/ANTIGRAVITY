import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')
const repoRoot = path.resolve(root, '..') // C:\ANTIGRAVITY

const mod = await import('../lib/heartbeat.mjs')
const clientMod = await import('../js/jarvis/ops.js')

describe('lib/heartbeat.mjs — BOM-tolerant JSON + log tail', () => {
  it('stripBom removes a leading UTF-8 BOM and leaves plain text alone', () => {
    expect(mod.stripBom('\uFEFF{"a":1}')).toBe('{"a":1}')
    expect(mod.stripBom('{"a":1}')).toBe('{"a":1}')
    expect(mod.stripBom('')).toBe('')
  })

  it('parseHealthJson parses a BOM-prefixed JSON file', () => {
    const j = mod.parseHealthJson('\uFEFF' + JSON.stringify({ overall: 'GREEN' }))
    expect(j.overall).toBe('GREEN')
  })

  it('tailLines returns at most the last N non-empty lines', () => {
    const text = Array.from({ length: 15 }, (_, i) => `line ${i}`).join('\n')
    const out = mod.tailLines(text, 10)
    expect(out).toHaveLength(10)
    expect(out[9]).toBe('line 14')
    expect(out[0]).toBe('line 5')
  })
})

describe('lib/heartbeat.mjs — isolated fixtures', () => {
  const tmp = path.join(root, 'tests', 'fixtures', 'heartbeat-tmp')
  const jsonPath = path.join(tmp, 'sabretooth-health.json')
  const logPath = path.join(tmp, 'health.log')

  beforeAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true })
    fs.mkdirSync(tmp, { recursive: true })
    fs.writeFileSync(jsonPath, '\uFEFF' + JSON.stringify({ overall: 'YELLOW', required: { postgres_5432: { status: 'UP', detail: 'pg_isready' } }, optional: {} }))
    fs.writeFileSync(logPath, Array.from({ length: 3 }, (_, i) => `[2026-09-17T0${i}:00:00Z] line ${i}`).join('\n') + '\n')
  })

  it('readHeartbeat parses the BOM-prefixed json and tails the log', () => {
    const r = mod.readHeartbeat({ jsonPath, logPath })
    expect(r.ok).toBe(true)
    expect(r.health.overall).toBe('YELLOW')
    expect(r.logTail).toHaveLength(3)
    expect(r.errors).toEqual([])
  })

  it('a missing json file reports an honest error, never a fabricated overall', () => {
    const r = mod.readHeartbeat({ jsonPath: path.join(tmp, 'nope.json'), logPath })
    expect(r.ok).toBe(false)
    expect(r.health).toBeNull()
    expect(r.errors.some((e) => /not found/.test(e))).toBe(true)
  })

  it('a malformed json file reports the parse error, never throws', () => {
    const badPath = path.join(tmp, 'bad.json')
    fs.writeFileSync(badPath, '{not json')
    const r = mod.readHeartbeat({ jsonPath: badPath, logPath })
    expect(r.ok).toBe(false)
    expect(r.errors.some((e) => /sabretooth-health\.json/.test(e))).toBe(true)
  })
})

describe('lib/heartbeat.mjs — the real ops/heartbeat files (worked example)', () => {
  it('reads the real heartbeat json and log tail', () => {
    const r = mod.readHeartbeat({
      jsonPath: path.join(repoRoot, 'ops', 'heartbeat', 'sabretooth-health.json'),
      logPath: path.join(repoRoot, 'ops', 'heartbeat', 'health.log'),
    })
    expect(r.ok).toBe(true)
    expect(typeof r.health.overall).toBe('string')
    expect(r.logTail.length).toBeGreaterThan(0)
  })
})

describe('JARVIS wiring — server.mjs, index.html (merged into Mission Control, not a new tab)', () => {
  it('server.mjs wires GET /api/heartbeat through lib/heartbeat.mjs', () => {
    const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf-8')
    expect(server).toContain("from './lib/heartbeat.mjs'")
    expect(server).toMatch(/p === '\/api\/heartbeat'/)
  })

  it('the heartbeat panel lives inside tab-mission-control, no new "system status" tab was added', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8')
    const missionSection = /<section id="tab-mission-control"[\s\S]*?<\/section>/.exec(html)[0]
    expect(missionSection).toContain('id="heartbeat-status"')
    expect(html).not.toContain('data-tab="system-status"')
  })
})

describe('js/jarvis/ops.js — heartbeat client slice', () => {
  it('exports the expected surface', () => {
    expect(typeof clientMod.loadHeartbeat).toBe('function')
    expect(typeof clientMod.renderHeartbeat).toBe('function')
  })

  it('renderHeartbeat shows overall + stage rows + log tail, and an honest error state', () => {
    const el = { innerHTML: '' }
    clientMod.renderHeartbeat(el, { ok: false, errors: ['sabretooth-health.json: not found'] })
    expect(el.innerHTML).toContain('not found')

    clientMod.renderHeartbeat(el, {
      ok: true,
      health: { overall: 'GREEN', ts: '2026-09-17T00:00:00Z', required: { postgres_5432: { status: 'UP', detail: 'pg_isready' } }, optional: {} },
      logTail: ['[2026-09-17T00:00:00Z] line'],
    })
    expect(el.innerHTML).toContain('GREEN')
    expect(el.innerHTML).toContain('postgres_5432')
    expect(el.innerHTML).toContain('pg_isready')
  })
})
