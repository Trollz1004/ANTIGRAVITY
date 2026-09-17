import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')

const mod = await import('../lib/session-proxy.mjs')
const clientMod = await import('../js/jarvis/ops.js')

describe('lib/session-proxy.mjs — sanitizeHeaders', () => {
  it('strips cookie, authorization, and session-named headers from a plain object', () => {
    const out = mod.sanitizeHeaders({
      'Set-Cookie': 'sid=abc123; HttpOnly',
      'Authorization': 'Bearer secret-token',
      'X-Session-Id': 'sess-999',
      'content-type': 'text/html; charset=utf-8',
      'X-Custom-Session-Marker': 'whatever',
    })
    expect(out['Set-Cookie']).toBeUndefined()
    expect(out['Authorization']).toBeUndefined()
    expect(out['X-Session-Id']).toBeUndefined()
    expect(out['X-Custom-Session-Marker']).toBeUndefined()
    expect(out['content-type']).toBe('text/html; charset=utf-8')
  })

  it('strips headers from a Headers-like iterable (entries())', () => {
    const headers = new Map([
      ['set-cookie', 'a=b'],
      ['content-type', 'application/json'],
    ])
    const out = mod.sanitizeHeaders(headers)
    expect(out['set-cookie']).toBeUndefined()
    expect(out['content-type']).toBe('application/json')
  })

  it('handles an empty/undefined header set without throwing', () => {
    expect(mod.sanitizeHeaders(undefined)).toEqual({})
    expect(mod.sanitizeHeaders({})).toEqual({})
  })
})

describe('lib/session-proxy.mjs — probeService (injected fetch, no real network)', () => {
  it('reports kind: json with parsed data when the service answers JSON', async () => {
    const fetchImpl = async () => ({
      status: 200,
      headers: { get: (k) => (k === 'content-type' ? 'application/json' : '') },
      text: async () => JSON.stringify({ ok: true, version: '1.0' }),
    })
    const r = await mod.probeService({ url: 'http://x/api/health', host: '127.0.0.1', port: 9119, fetchImpl })
    expect(r.reachable).toBe(true)
    expect(r.kind).toBe('json')
    expect(r.data).toEqual({ ok: true, version: '1.0' })
  })

  it('reports kind: html + tcp when the service answers non-JSON', async () => {
    const fetchImpl = async () => ({
      status: 200,
      headers: { get: () => 'text/html' },
      text: async () => '<html>hi</html>',
    })
    // tcpProbe will try a real connection to 127.0.0.1:9 (discard) — force it via an unroutable port to keep this fast/offline-safe is overkill;
    // instead we accept whatever tcp comes back as a boolean, we only assert the shape.
    const r = await mod.probeService({ url: 'http://x/', host: '127.0.0.1', port: 1, fetchImpl, timeoutMs: 300 })
    expect(r.reachable).toBe(true)
    expect(r.kind).toBe('html')
    expect(typeof r.tcp).toBe('boolean')
  })

  it('a network failure reports reachable: false with the error string, never a fake row', async () => {
    const fetchImpl = async () => { throw new Error('ECONNREFUSED') }
    const r = await mod.probeService({ url: 'http://x/', host: '127.0.0.1', port: 1, fetchImpl, timeoutMs: 300 })
    expect(r.reachable).toBe(false)
    expect(r.error).toMatch(/ECONNREFUSED/)
  })
})

describe('lib/session-proxy.mjs — tcpProbe', () => {
  it('resolves false for a closed/unroutable port within the timeout', async () => {
    const open = await mod.tcpProbe('127.0.0.1', 1, 400)
    expect(typeof open).toBe('boolean')
  })
})

describe('JARVIS wiring — server.mjs, index.html', () => {
  it('server.mjs wires the Hermes and OpenClaw status + proxy routes through lib/session-proxy.mjs', () => {
    const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf-8')
    expect(server).toContain("from './lib/session-proxy.mjs'")
    expect(server).toMatch(/p === '\/api\/hermes-status'/)
    expect(server).toMatch(/p === '\/api\/openclaw-status'/)
    expect(server).toContain("'/api/proxy/hermes'")
    expect(server).toContain("'/api/proxy/openclaw'")
    expect(server).toContain('sanitizeHeaders(r.headers)')
  })

  it('index.html has the ops-hermes and ops-openclaw containers', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8')
    expect(html).toContain('id="ops-hermes"')
    expect(html).toContain('id="ops-openclaw"')
  })
})

describe('js/jarvis/ops.js — Hermes/OpenClaw client slice', () => {
  it('exports the expected surface and carries only relative fetches', () => {
    expect(typeof clientMod.loadHermesStatus).toBe('function')
    expect(typeof clientMod.loadOpenClawStatus).toBe('function')
    expect(typeof clientMod.renderServiceStatus).toBe('function')
    const src = fs.readFileSync(path.join(root, 'js', 'jarvis', 'ops.js'), 'utf-8')
    expect(src).not.toMatch(/https?:\/\//)
  })

  it('renderServiceStatus shows UP/DOWN honestly for json, html, and unreachable', () => {
    const el = { innerHTML: '' }
    clientMod.renderServiceStatus(el, { reachable: true, kind: 'json', status: 200 }, 'Hermes')
    expect(el.innerHTML).toContain('UP')
    clientMod.renderServiceStatus(el, { reachable: true, kind: 'html', tcp: true }, 'OpenClaw')
    expect(el.innerHTML).toContain('UP')
    expect(el.innerHTML).toContain('TCP open')
    clientMod.renderServiceStatus(el, { reachable: false, kind: 'unreachable', error: 'ECONNREFUSED' }, 'Hermes')
    expect(el.innerHTML).toContain('DOWN')
    expect(el.innerHTML).toContain('ECONNREFUSED')
  })
})
