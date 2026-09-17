import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')

const mod = await import('../lib/ledger.mjs')
const clientMod = await import('../js/jarvis/ops.js')

describe('lib/ledger.mjs — createLedgerReader (injected runner, no real process)', () => {
  it('returns the parsed lines on success and caches for cacheMs', async () => {
    let calls = 0
    const runner = async () => { calls++; return { ok: true, output: 'line one\nline two\n' } }
    let t = 1000
    const readLedger = mod.createLedgerReader({ cwd: 'C:\\fake', runner, cacheMs: 60000, now: () => t })
    const r1 = await readLedger()
    expect(r1.ok).toBe(true)
    expect(r1.lines).toEqual(['line one', 'line two'])
    expect(r1.cached).toBe(false)
    expect(calls).toBe(1)

    t += 10000 // still within the cache window
    const r2 = await readLedger()
    expect(r2.cached).toBe(true)
    expect(r2.lines).toEqual(['line one', 'line two'])
    expect(calls).toBe(1) // runner not called again

    t += 60000 // past the cache window
    const r3 = await readLedger()
    expect(r3.cached).toBe(false)
    expect(calls).toBe(2)
  })

  it('a failing command reports the exact error string, never a fake row', async () => {
    const runner = async () => ({ ok: false, error: 'ledger.sh: bash not found' })
    const readLedger = mod.createLedgerReader({ cwd: 'C:\\fake', runner })
    const r = await readLedger()
    expect(r.ok).toBe(false)
    expect(r.error).toBe('ledger.sh: bash not found')
    expect(r.lines).toBeUndefined()
  })

  it('a failure is also cached for cacheMs so a hung command is not retried on every load', async () => {
    let calls = 0
    const runner = async () => { calls++; return { ok: false, error: 'timeout' } }
    let t = 0
    const readLedger = mod.createLedgerReader({ cwd: 'C:\\fake', runner, cacheMs: 60000, now: () => t })
    await readLedger()
    t += 1000
    await readLedger()
    expect(calls).toBe(1)
  })
})

describe('JARVIS wiring — server.mjs, index.html', () => {
  it('server.mjs wires GET /api/ledger through lib/ledger.mjs (createLedgerReader)', () => {
    const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf-8')
    expect(server).toContain("from './lib/ledger.mjs'")
    expect(server).toContain('createLedgerReader')
    expect(server).toMatch(/p === '\/api\/ledger'/)
  })

  it('index.html has the ops-ledger container', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8')
    expect(html).toContain('id="ops-ledger"')
  })
})

describe('js/jarvis/ops.js — ledger client slice', () => {
  it('exports the expected surface', () => {
    expect(typeof clientMod.loadLedger).toBe('function')
    expect(typeof clientMod.renderLedger).toBe('function')
  })

  it('renderLedger shows the real lines and the exact error string on failure, never a fake row', () => {
    const el = { innerHTML: '' }
    clientMod.renderLedger(el, { ok: true, lines: ['line one', 'line two'] })
    expect(el.innerHTML).toContain('line one')
    expect(el.innerHTML).toContain('line two')

    clientMod.renderLedger(el, { ok: false, error: 'ledger.sh: bash not found' })
    expect(el.innerHTML).toContain('ledger.sh: bash not found')
    expect(el.innerHTML).not.toMatch(/<pre>/)
  })
})
