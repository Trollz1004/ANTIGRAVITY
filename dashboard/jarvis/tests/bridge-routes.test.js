import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'

// The bridge routes over real HTTP on an ephemeral port, with a fake `claude`
// process. Nothing here spawns a binary or touches the network.
const routes = await import('../lib/bridge-routes.mjs')

const FIXTURE = readFileSync(resolve(__dirname, 'fixtures', 'claude-stream.ndjson'), 'utf8')

function fakeSpawnFactory(log) {
  return (bin, args, opts) => {
    const child = new EventEmitter()
    child.pid = 777
    child.exitCode = null
    child.stdout = new PassThrough()
    child.stderr = new PassThrough()
    child.stdin = new PassThrough()
    let stdin = ''
    child.stdin.on('data', (c) => { stdin += c })
    child.kill = vi.fn(() => { child.exitCode = 1; child.emit('close', 1) })
    log.push({ bin, args, opts, child, get stdin() { return stdin } })
    setTimeout(() => {
      if (child.exitCode !== null) return
      // A Hermes one-shot prints the answer, then a session trailer; the Claude CLI prints NDJSON.
      child.stdout.write(/hermes/i.test(String(bin)) ? 'session_id: 20260913_000000_abcdef\nPONG\n' : FIXTURE)
      child.stdout.end()
      child.exitCode = 0
      child.emit('close', 0)
    }, 20)
    return child
  }
}

let server, port, spawned, deps, killed
beforeAll(async () => {
  spawned = []
  killed = []
  deps = {
    cfg: { repo: 'C:/some/repo', lanIp: '192.168.0.40', nodeName: 'TESTNODE' },
    envValue: (name) => ({ DASHBOARD_BRIDGE_TOKEN: 'abcdefghijklmnopqrstuvwx', CLAUDE_BRIDGE_PERMISSION_MODE: 'plan' }[name] || ''),
    spawn: fakeSpawnFactory(spawned),
    killTree: (child) => { killed.push(child.pid); child.kill() },
    resolveBinary: () => 'C:/Users/someone/.local/bin/claude.exe',
    resolveHermes: () => 'C:/Users/someone/AppData/Local/hermes/bin/hermes.exe',
    ollamaBase: 'http://127.0.0.1:11434',
    fetch: async (url) => {
      if (url.endsWith('/api/tags')) return { ok: true, status: 200, text: async () => JSON.stringify({ models: [{ name: 'gemma4:e4b' }] }), json: async () => ({ models: [{ name: 'gemma4:e4b' }] }) }
      const body = [JSON.stringify({ message: { content: 'Hi' }, done: false }), JSON.stringify({ message: { content: '!' }, done: false }), JSON.stringify({ message: { content: '' }, done: true, eval_count: 2 })].join('\n') + '\n'
      return { ok: true, status: 200, body: new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(body)); c.close() } }) }
    },
  }
  server = createServer(async (req, res) => {
    if (await routes.handleBridgeRoutes(req, res, deps)) return
    res.writeHead(200, { 'access-control-allow-origin': '*' }); res.end('fallthrough')
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  port = server.address().port
})
afterAll(() => new Promise((r) => server.close(r)))

const url = (p) => `http://127.0.0.1:${port}${p}`

describe('static deny', () => {
  it('refuses to serve server internals and tests as static files', async () => {
    for (const p of ['/lib/claude-bridge.mjs', '/tests/config.test.js', '/server.mjs', '/package.json']) {
      const r = await fetch(url(p))
      expect(r.status, p).toBe(404)
    }
    expect(await (await fetch(url('/js/app.js'))).text()).toBe('fallthrough')
  })
})

describe('GET /api/claude/status', () => {
  it('reports capability without CORS headers and without an absolute path', async () => {
    const r = await fetch(url('/api/claude/status'))
    expect(r.status).toBe(200)
    expect(r.headers.get('access-control-allow-origin')).toBeNull()
    const j = await r.json()
    expect(j.installed).toBe(true)
    expect(j.bin).toBe('claude.exe')
    expect(JSON.stringify(j)).not.toMatch(/Users|someone|C:/)
    expect(j.access).toMatchObject({ ok: true, local: true, tokenRequired: false })
    expect(j.permissionMode).toBe('plan')
    expect(j.cwdName).toBe('repo')
  })
  it('rejects a foreign Origin and any preflight', async () => {
    expect((await fetch(url('/api/claude/status'), { headers: { origin: 'http://evil.example' } })).status).toBe(403)
    const o = await fetch(url('/api/claude/chat'), { method: 'OPTIONS' })
    expect(o.status).toBe(403)
    expect(o.headers.get('access-control-allow-origin')).toBeNull()
  })
})

describe('POST /api/claude/chat', () => {
  it('streams init, delta, result and exit from the spawned CLI; the prompt goes over stdin; the child env has no CLAUDECODE', async () => {
    const r = await fetch(url('/api/claude/chat'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: 'ping from test', persona: 'jarvis', permissionMode: 'acceptEdits' }) })
    expect(r.status).toBe(200)
    expect(r.headers.get('content-type')).toMatch(/text\/event-stream/)
    expect(r.headers.get('access-control-allow-origin')).toBeNull()
    const text = await r.text()
    const types = [...text.matchAll(/^event: (\w+)$/gm)].map((m) => m[1])
    expect(types[0]).toBe('init')
    expect(types).toContain('delta')
    expect(types).toContain('result')
    expect(types.at(-1)).toBe('exit')
    const run = spawned.at(-1)
    expect(run.stdin).toBe('ping from test')
    expect(run.opts.env.CLAUDECODE).toBeUndefined()
    expect(run.args[run.args.indexOf('--permission-mode') + 1]).toBe('plan') // body cannot raise above .env
    expect(run.args).toContain('--strict-mcp-config')
    expect(run.opts.cwd).toBe('C:/some/repo')
  })
  it('validates the body', async () => {
    expect((await fetch(url('/api/claude/chat'), { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'x' })).status).toBe(415)
    expect((await fetch(url('/api/claude/chat'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status).toBe(400)
    expect((await fetch(url('/api/claude/chat'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: 'x', sessionId: 'no spaces allowed' }) })).status).toBe(400)
  })
  it('refuses a second concurrent run with 429 and kills the child when the client goes away', async () => {
    const ctrl = new AbortController()
    const slowSpawn = (bin, args, opts) => { const c = deps.spawn(bin, args, opts); c.stdout.pause(); return c }
    const saved = deps.spawn; deps.spawn = (bin, args, opts) => { const child = fakeSpawnFactory(spawned)(bin, args, opts); clearTimeout(child._t); return child }
    // a child that never finishes on its own
    deps.spawn = (bin, args, opts) => { const child = new EventEmitter(); child.pid = 999; child.exitCode = null; child.stdout = new PassThrough(); child.stderr = new PassThrough(); child.stdin = new PassThrough(); child.kill = vi.fn(() => { child.exitCode = 1; child.emit('close', 1) }); spawned.push({ bin, args, opts, child }); return child }
    const first = fetch(url('/api/claude/chat'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: 'slow' }), signal: ctrl.signal })
    await new Promise((r) => setTimeout(r, 50))
    const second = await fetch(url('/api/claude/chat'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: 'again' }) })
    expect(second.status).toBe(429)
    ctrl.abort()
    await first.catch(() => {})
    await new Promise((r) => setTimeout(r, 50))
    expect(killed).toContain(999)
    deps.spawn = saved
    void slowSpawn
  })
  it('POST /api/claude/stop reports whether something was running', async () => {
    const r = await fetch(url('/api/claude/stop'), { method: 'POST' })
    expect(r.status).toBe(200)
    expect(await r.json()).toMatchObject({ ok: true, killed: false })
  })
})

describe('LAN callers', () => {
  it('are refused without the token and admitted with it (unit call with a spoofed remote address)', async () => {
    const mk = (headers) => {
      const req = new EventEmitter(); req.method = 'POST'; req.url = '/api/claude/chat'; req.headers = { host: '192.168.0.40:9150', 'content-type': 'application/json', ...headers }; req.socket = { remoteAddress: '192.168.0.8' }
      setTimeout(() => { req.emit('data', Buffer.from(JSON.stringify({ prompt: 'hi' }))); req.emit('end') }, 0)
      const res = { code: 0, headers: null, body: '', writeHead(c, h) { this.code = c; this.headers = h }, write(s) { this.body += s }, end(s) { if (s) this.body += s; this.ended = true }, on() {} }
      return { req, res }
    }
    const a = mk({})
    expect(await routes.handleBridgeRoutes(a.req, a.res, deps)).toBe(true)
    expect(a.res.code).toBe(403)
    const b = mk({ 'x-bridge-token': 'abcdefghijklmnopqrstuvwx' })
    expect(await routes.handleBridgeRoutes(b.req, b.res, deps)).toBe(true)
    await new Promise((r) => setTimeout(r, 80))
    expect(b.res.code).toBe(200)
    expect(b.res.headers['content-type']).toMatch(/event-stream/)
  })
})

describe('Ollama routes', () => {
  it('lists local tags without a gate and streams chat as SSE deltas then a result', async () => {
    const tags = await (await fetch(url('/api/ollama/tags'))).json()
    expect(tags).toMatchObject({ available: true, models: ['gemma4:e4b'] })
    const r = await fetch(url('/api/ollama/chat'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }) })
    expect(r.status).toBe(200)
    const text = await r.text()
    expect([...text.matchAll(/^event: (\w+)$/gm)].map((m) => m[1])).toEqual(['delta', 'delta', 'result'])
    expect(text).toContain('"text":"Hi!"')
  })
  it('returns 503 when no model is installed', async () => {
    const savedFetch = deps.fetch
    deps.fetch = async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ models: [] }), json: async () => ({ models: [] }) })
    const r = await fetch(url('/api/ollama/chat'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }) })
    expect(r.status).toBe(503)
    deps.fetch = savedFetch
  })
})

describe('Hermes as a brain', () => {
  it('GET /api/hermes/status reports the binary name only and the last latency', async () => {
    const r = await fetch(url('/api/hermes/status'))
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(j.bin).toBe('hermes.exe')
    expect(JSON.stringify(j)).not.toMatch(/Users|someone|C:/)
    expect(j).toHaveProperty('installed')
    expect(j).toHaveProperty('lastLatencyMs')
  })
  it('POST /api/hermes/chat runs a named one-shot session over a query file and streams the plain reply as one result event', async () => {
    const before = spawned.length
    const r = await fetch(url('/api/hermes/chat'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: 'ping hermes' }) })
    expect(r.status).toBe(200)
    expect(r.headers.get('content-type')).toMatch(/event-stream/)
    const text = await r.text()
    const run = spawned.slice(before).find((s) => /hermes/i.test(s.bin))
    expect(run).toBeTruthy()
    expect(run.args).toContain('--query-file')
    expect(run.args).toContain('--oneshot')
    expect(run.args).toContain('-Q')
    expect(run.args.slice(run.args.indexOf('-c') + 1)[0]).toBe('jarvis-hud')
    expect(run.args).toContain('--create-if-missing')
    expect(run.args.join(' ')).not.toContain('ping hermes') // prompt travels in the query file
    expect(text).toMatch(/^event: result$/m)
    expect(text).toContain('"text":"PONG"')
    expect(text).not.toContain('session_id')
  })
  it('refuses a foreign Origin like the Claude bridge', async () => {
    expect((await fetch(url('/api/hermes/chat'), { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://evil.example' }, body: JSON.stringify({ prompt: 'x' }) })).status).toBe(403)
  })
})

describe('GET /api/owner', () => {
  it('returns the first word of the Hermes USER.md memory when it looks like a name, else an empty string', async () => {
    deps.readOwnerFile = () => 'Joshua is the operator.\nMore lines.'
    expect(await (await fetch(url('/api/owner'))).json()).toEqual({ name: 'Joshua' })
    deps.readOwnerFile = () => '# Notes about the user\n'
    expect(await (await fetch(url('/api/owner'))).json()).toEqual({ name: '' })
    deps.readOwnerFile = () => { throw new Error('ENOENT') }
    expect(await (await fetch(url('/api/owner'))).json()).toEqual({ name: '' })
    delete deps.readOwnerFile
  })
})

describe('POST /api/launch/claude', () => {
  it('is gated like the bridge and opens the resolved binary on this node', async () => {
    const r = await fetch(url('/api/launch/claude'), { method: 'POST' })
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(j).toMatchObject({ ok: true, on: 'TESTNODE' })
    expect(JSON.stringify(j)).not.toMatch(/someone/)
    const launch = spawned.at(-1)
    expect(launch.bin).toMatch(/powershell/i)
    expect((await fetch(url('/api/launch/claude'), { method: 'POST', headers: { origin: 'http://evil.example' } })).status).toBe(403)
  })
})
