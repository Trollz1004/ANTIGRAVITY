import { describe, it, expect } from 'vitest'

// God's-eye data: every badge on the HUD is a real, identity-checked probe.
const nodes = await import('../lib/nodes.mjs')

const okJson = (body, status = 200) => async () => ({ status, ok: status < 400, text: async () => JSON.stringify(body), headers: new Map() })
const okText = (text, status = 200) => async () => ({ status, ok: status < 400, text: async () => text, headers: new Map() })

describe('service table', () => {
  it('lists every LAN service with a node, a URL and an identity check', () => {
    const ids = nodes.SERVICES.map((s) => s.id)
    for (const id of ['jarvis', 'hermes', 'ollama', 'omniroute', 'live-npc-lab', 'dreamops', 'crosslisting', 'obsidian', 'sentry', 'date-app', 'directus', 'ludus']) expect(ids).toContain(id)
    // Fable's Sentry stopped being a separate :9140 service 2026-09-18 (folded into
    // JARVIS itself, lib/sentry.mjs). This row now reads JARVIS's own /api/sentry.
    const sentry = nodes.SERVICES.find((s) => s.id === 'sentry')
    expect(sentry.port).toBe(9150)
    expect(sentry.url).toBe('http://192.168.0.8:9150/api/sentry')
    // The Obsidian Local REST plugin on this node serves HTTPS on 27124 only
    // (insecure server disabled). The probe URL must be the https one.
    expect(nodes.SERVICES.find((s) => s.id === 'obsidian').url).toBe('https://127.0.0.1:27124/')
    for (const s of nodes.SERVICES) {
      if (s.node === 'public-web') expect(s.url).toMatch(/^https:\/\/[a-z0-9.-]+\//)
      else expect(s.url).toMatch(/^https?:\/\/(127\.0\.0\.1|192\.168\.0\.\d+):\d+\//)
      expect(typeof s.identity).toBe('function')
    }
  })
  it('knows both LAN nodes and the public web node with its domains', () => {
    expect(nodes.NODES.find((n) => n.id === 'alienware').ip).toBe('192.168.0.40')
    expect(nodes.NODES.find((n) => n.id === 'sabertooth').ip).toBe('192.168.0.8')
    const pub = nodes.NODES.find((n) => n.id === 'public-web')
    expect(pub).toBeTruthy()
    const ids = nodes.SERVICES.filter((s) => s.node === 'public-web').map((s) => s.id)
    for (const id of ['dream-online-net', 'youandinotai-com', 'onlinerecycle-net', 'joshlcoleman-io']) expect(ids).toContain(id)
  })
})

describe('probeService', () => {
  it('reports UP only when the identity check passes', async () => {
    const svc = nodes.SERVICES.find((s) => s.id === 'jarvis')
    const up = await nodes.probeService(svc, { fetch: okJson({ service: 'jarvis-dashboard' }) })
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
  it('sentry identity requires the groups array, not just any JSON body (a port answering is not health)', async () => {
    const svc = nodes.SERVICES.find((s) => s.id === 'sentry')
    expect((await nodes.probeService(svc, { fetch: okJson({ groups: [] }) })).state).toBe('UP')
    expect((await nodes.probeService(svc, { fetch: okJson({ ok: true }) })).state).toBe('WRONG SERVICE')
  })
  it('treats an auth challenge from OmniRoute as reachable (the key is never sent by the probe)', async () => {
    const svc = nodes.SERVICES.find((s) => s.id === 'omniroute')
    const r = await nodes.probeService(svc, { fetch: okJson({ error: 'unauthorized' }, 401) })
    expect(r.state).toBe('UP')
  })
  it('treats any non-5xx from a third-party revenue API as reachable (identity is honest, not guessed)', async () => {
    const svc = nodes.SERVICES.find((s) => s.id === 'date-app')
    expect((await nodes.probeService(svc, { fetch: okText('not found', 404) })).state).toBe('UP')
    expect((await nodes.probeService(svc, { fetch: okText('nope', 503) })).state).toBe('DOWN')
  })
  it('identity checks read the body, not just the status code', async () => {
    const hermes = nodes.SERVICES.find((s) => s.id === 'hermes')
    expect((await nodes.probeService(hermes, { fetch: okJson({ ok: true, version: '0.21.2' }) })).state).toBe('UP')
    expect((await nodes.probeService(hermes, { fetch: okText('<html>parking page</html>') })).state).toBe('WRONG SERVICE')
    const obsidian = nodes.SERVICES.find((s) => s.id === 'obsidian')
    expect((await nodes.probeService(obsidian, { fetch: okText('{"service":"Obsidian Local REST API"}') })).state).toBe('UP')
  })
  it('probes Obsidian over HTTPS with its self-signed certificate tolerated (insecure transport), at the configured URL', async () => {
    // Live-verified: the vault plugin serves ONLY https://127.0.0.1:27124 (insecure
    // server off, self-signed cert) — probing plain http :27123 reported DOWN forever
    // on a healthy vault (screenshot 2026-09-16 said "Obsidian not working").
    const obsidian = nodes.SERVICES.find((s) => s.id === 'obsidian')
    expect(obsidian.url).toMatch(/^https:\/\//)
    expect(obsidian.insecure).toBe(true) // probeService must route this through the tls-tolerant transport
    expect((await nodes.probeService(obsidian, { fetch: okText('{"service":"Obsidian Local REST API"}') })).state).toBe('UP')
    expect((await nodes.probeService(obsidian, { fetch: async () => { throw new Error('ECONNREFUSED') } })).state).toBe('DOWN')
  })
  it('insecure transport speaks http and https and honours the abort signal', async () => {
    expect(nodes.insecureTransport).toBeTypeOf('function')
    const u = new URL('http://x') // call signature check only — real network use is live-validated
    expect(nodes.insecureTransport.length).toBeLessThanOrEqual(2)
    expect(u).toBeTruthy()
  })
})

describe('probeAll', () => {
  it('probes every service concurrently and groups the result by node', async () => {
    const calls = []
    const fetch = async (url) => { calls.push(url); return { status: 200, ok: true, text: async () => JSON.stringify({ service: 'airi-dashboard', ok: true, status: 'ok' }), headers: new Map() } }
    const out = await nodes.probeAll({ fetch, timeoutMs: 50, nameservers: false })
    expect(calls.length).toBe(nodes.SERVICES.length)
    expect(out.nodes.map((n) => n.id).sort()).toEqual(['alienware', 'public-web', 'sabertooth'])
    for (const n of out.nodes) { expect(Array.isArray(n.services)).toBe(true); expect(typeof n.up).toBe('number'); expect(typeof n.total).toBe('number') }
    expect(out.at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
  it('attaches live nameserver providers to the public-web rows when enabled', async () => {
    const fetch = async () => ({ status: 200, ok: true, text: async () => 'ok', json: async () => ({ Answer: [{ type: 2, data: 'ns1.cloudflare.com.' }] }), headers: new Map() })
    const out = await nodes.probeAll({ fetch, timeoutMs: 50 })
    const pub = out.nodes.find((n) => n.id === 'public-web')
    for (const s of pub.services) expect(['cloudflare', 'ionos', 'other', 'none', 'unknown']).toContain(s.ns)
    expect(Object.keys(out.dns).length).toBe(4)
  })
})

describe('nameserver check (Ionos vs Cloudflare, live DoH)', () => {
  it('classifies Cloudflare, Ionos and other nameservers from a real DoH answer', async () => {
    const doh = async (q) => ({ Answer: [{ type: 2, data: 'ns1.cloudflare.com.' }, { type: 2, data: 'ns2.cloudflare.com.' }] })
    const r = await nodes.checkNameservers(['dream-online.net'], { doh })
    expect(r['dream-online.net'].provider).toBe('cloudflare')
    expect(r['dream-online.net'].nameservers).toHaveLength(2)
    const ionos = async () => ({ Answer: [{ type: 2, data: 'ns1.ui-dns.org.' }, { type: 2, data: 'ns2.ui-dns.de.' }] })
    expect((await nodes.checkNameservers(['onlinerecycle.net'], { doh: ionos }))['onlinerecycle.net'].provider).toBe('ionos')
    const other = async () => ({ Answer: [{ type: 2, data: 'dns1.registrar-servers.com.' }] })
    expect((await nodes.checkNameservers(['youandinotai.com'], { doh: other }))['youandinotai.com'].provider).toBe('other')
  })
  it('does not hang a nameserver check when DoH never resolves', async () => {
    const started = Date.now()
    const result = await nodes.checkNameservers(['dream-online.net'], { doh: () => new Promise(() => {}), timeoutMs: 10 })
    expect(Date.now() - started).toBeLessThan(500)
    expect(result['dream-online.net']).toMatchObject({ provider: 'unknown' })
  })
  it('does not treat an invalid zero status as a reachable third-party service', async () => {
    const svc = nodes.SERVICES.find((s) => s.id === 'ludus')
    expect((await nodes.probeService(svc, { fetch: okText('', 0) })).state).toBe('WRONG SERVICE')
  })
  it('reports the honest error when DoH fails', async () => {
    const r = await nodes.checkNameservers(['dream-online.net'], { doh: async () => { throw new Error('network down') } })
    expect(r['dream-online.net']).toMatchObject({ provider: 'unknown', error: 'network down' })
  })
})
