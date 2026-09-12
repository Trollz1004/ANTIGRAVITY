import { describe, it, expect } from 'vitest'

// God's-eye data: every badge on the HUD is a real, identity-checked probe.
const nodes = await import('../lib/nodes.mjs')

const okJson = (body, status = 200) => async () => ({ status, ok: status < 400, text: async () => JSON.stringify(body), headers: new Map() })
const okText = (text, status = 200) => async () => ({ status, ok: status < 400, text: async () => text, headers: new Map() })

describe('service table', () => {
  it('lists every LAN service with a node, a URL and an identity check', () => {
    const ids = nodes.SERVICES.map((s) => s.id)
    for (const id of ['jarvis', 'hermes', 'ollama', 'omniroute', 'live-npc-lab', 'dreamops', 'crosslisting', 'obsidian', 'sentry', 'mission-control']) expect(ids).toContain(id)
    for (const s of nodes.SERVICES) {
      expect(['alienware', 'sabertooth']).toContain(s.node)
      expect(s.url).toMatch(/^http:\/\/(127\.0\.0\.1|192\.168\.0\.\d+):\d+\//)
      expect(typeof s.identity).toBe('function')
    }
  })
  it('knows both nodes with their LAN IPs', () => {
    expect(nodes.NODES.find((n) => n.id === 'alienware').ip).toBe('192.168.0.40')
    expect(nodes.NODES.find((n) => n.id === 'sabertooth').ip).toBe('192.168.0.8')
  })
})

describe('probeService', () => {
  it('reports UP only when the identity check passes', async () => {
    const svc = nodes.SERVICES.find((s) => s.id === 'jarvis')
    const up = await nodes.probeService(svc, { fetch: okJson({ service: 'airi-dashboard' }) })
    expect(up.state).toBe('UP'); expect(up.up).toBe(true); expect(typeof up.latencyMs).toBe('number')
    const wrong = await nodes.probeService(svc, { fetch: okJson({ service: 'something-else' }) })
    expect(wrong.state).toBe('WRONG SERVICE'); expect(wrong.up).toBe(false)
  })
  it('reports DOWN with the reason when the fetch fails or times out', async () => {
    const svc = nodes.SERVICES.find((s) => s.id === 'ollama')
    const down = await nodes.probeService(svc, { fetch: async () => { throw new Error('ECONNREFUSED') } })
    expect(down.state).toBe('DOWN'); expect(down.detail).toMatch(/ECONNREFUSED/)
    const slow = await nodes.probeService(svc, { fetch: (_u, o) => new Promise((_r, rej) => o.signal.addEventListener('abort', () => rej(new Error('aborted')))), timeoutMs: 5 })
    expect(slow.state).toBe('DOWN'); expect(slow.detail).toMatch(/timeout|aborted/i)
  })
  it('treats an auth challenge from OmniRoute as reachable (the key is never sent by the probe)', async () => {
    const svc = nodes.SERVICES.find((s) => s.id === 'omniroute')
    const r = await nodes.probeService(svc, { fetch: okJson({ error: 'unauthorized' }, 401) })
    expect(r.state).toBe('UP')
  })
  it('identity checks read the body, not just the status code', async () => {
    const hermes = nodes.SERVICES.find((s) => s.id === 'hermes')
    expect((await nodes.probeService(hermes, { fetch: okJson({ ok: true, version: '0.21.2' }) })).state).toBe('UP')
    expect((await nodes.probeService(hermes, { fetch: okText('<html>parking page</html>') })).state).toBe('WRONG SERVICE')
    const obsidian = nodes.SERVICES.find((s) => s.id === 'obsidian')
    expect((await nodes.probeService(obsidian, { fetch: okText('{"service":"Obsidian Local REST API"}') })).state).toBe('UP')
  })
})

describe('probeAll', () => {
  it('probes every service concurrently and groups the result by node', async () => {
    const calls = []
    const fetch = async (url) => { calls.push(url); return { status: 200, ok: true, text: async () => JSON.stringify({ service: 'airi-dashboard', ok: true, status: 'ok' }), headers: new Map() } }
    const out = await nodes.probeAll({ fetch, timeoutMs: 50 })
    expect(calls.length).toBe(nodes.SERVICES.length)
    expect(out.nodes.map((n) => n.id).sort()).toEqual(['alienware', 'sabertooth'])
    for (const n of out.nodes) { expect(Array.isArray(n.services)).toBe(true); expect(typeof n.up).toBe('number'); expect(typeof n.total).toBe('number') }
    expect(out.at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})
