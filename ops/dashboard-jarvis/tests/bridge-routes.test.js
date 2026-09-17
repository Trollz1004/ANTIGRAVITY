import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createServer } from 'node:http'
import { readFileSync, rmSync as fsRmSync, mkdirSync as fsMkdirSync, writeFileSync as fsWriteFileSync, existsSync as fsExistsSync } from 'node:fs'
const fs = { rmSync: fsRmSync, mkdirSync: fsMkdirSync, writeFileSync: fsWriteFileSync, existsSync: fsExistsSync, readFileSync }
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
    jarvisMemory: { dataFile: resolve(__dirname, 'fixtures', 'test-jarvis-memory.json') },
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
    if (res.headersSent) { console.error('FALLTHROUGH-AFTER-HEADERS', req.method, req.url); return }
    res.writeHead(200, { 'access-control-allow-origin': '*' }); res.end('fallthrough')
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  port = server.address().port
})
afterAll(() => new Promise((r) => server.close(r)))

const url = (p) => `http://127.0.0.1:${port}${p}`

describe('static deny', () => {
  it('refuses to serve server internals and tests as static files', async () => {
    for (const p of ['/lib/claude-bridge.mjs', '/tests/config.test.js', '/server.mjs', '/package.json', '/data/jarvis-memory.json']) {
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
  it('handles GET /api/hud/context without falling through after writing the response', async () => {
    const r = await fetch(url('/api/hud/context'))
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(j).toMatchObject({ tab: 'hud' })
    expect(typeof j.context).toBe('string')
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
  it('reports honestly when FreeBuff is not installed', async () => {
    deps.resolveFreebuff = () => null
    expect((await fetch(url('/api/launch/freebuff'), { method: 'POST' })).status).toBe(503)
  })
  it('opens the FreeBuff CLI console on this host when installed', async () => {
    deps.resolveFreebuff = () => 'C:/Users/someone/AppData/Roaming/npm/freebuff.cmd'
    const r = await fetch(url('/api/launch/freebuff'), { method: 'POST' })
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(j.ok).toBe(true)
    expect(j.opened).toBe('freebuff.cmd')
  })
  it('POST /api/board/vote asks six brains concurrently, tallies honestly, abstains when a brain fails', async () => {
    const brains = [
      { name: 'B1', ask: async () => ({ text: 'YES because it holds' }) },
      { name: 'B2', ask: async () => ({ text: 'no, too risky' }) },
      { name: 'B3', ask: async () => ({ text: 'yes' }) },
      { name: 'B4', ask: async () => { throw new Error('down') } },
      { name: 'B5', ask: async () => ({ text: 'I cannot decide' }) },
      { name: 'B6', ask: async () => ({ text: 'YES — cap the risk' }) },
    ]
    deps.board = { brains }
    try {
      const started = Date.now()
      const r = await fetch(url('/api/board/vote'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: 'Ship the release?' }) })
      const j = await r.json()
      expect(r.status).toBe(200)
      expect(j.question).toBe('Ship the release?')
      expect(j.votes).toHaveLength(6)
      const b4 = j.votes.find((v) => v.name === 'B4')
      expect(b4.vote).toBe(null)
      expect(b4.reason).toMatch(/down/)
      expect(j).toMatchObject({ yes: 3, no: 1, abstain: 2, outcome: 'PASSED', tie: false })
      expect(j.at).toMatch(/^\d{4}-/)
      // concurrent: 6 asks on one event loop tick batch, not 6× the slowest serialized
      expect(Date.now() - started).toBeLessThan(1500)
    } finally { deps.board = null }
  })
  it('POST /api/board/vote passes the founder vote through and reports FOUNDER DECIDES on a 3-3 tie', async () => {
    const brains = [1, 2, 3].map((i) => ({ name: 'Y' + i, ask: async () => ({ text: 'yes' }) }))
      .concat([1, 2, 3].map((i) => ({ name: 'N' + i, ask: async () => ({ text: 'no' }) })))
    deps.board = { brains }
    try {
      const tie = await fetch(url('/api/board/vote'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: 'q' }) })
      expect((await tie.json()).outcome).toBe('FOUNDER DECIDES')
      const decided = await fetch(url('/api/board/vote'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: 'q', founderVote: 'NO' }) })
      const j = await decided.json()
      expect(j.outcome).toBe('FAILED')
      expect(j.tieBreak).toBe('NO')
    } finally { deps.board = null }
  })
  it('a seat that never answers abstains after the seat timeout instead of hanging the vote', async () => {
    const brains = [
      { name: 'Fast', ask: async () => ({ text: 'yes' }) },
      { name: 'Slow', ask: () => new Promise(() => {}) }, // never resolves
    ]
    deps.board = { brains, seatTimeoutMs: 60 }
    try {
      const t0 = Date.now()
      const r = await fetch(url('/api/board/vote'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: 'q' }) })
      const j = await r.json()
      expect(r.status).toBe(200)
      expect(Date.now() - t0).toBeLessThan(2000)
      const slow = j.votes.find((v) => v.name === 'Slow')
      expect(slow.vote).toBe(null)
      expect(slow.reason).toMatch(/no answer within/i)
    } finally { deps.board = null }
  })
  it('rejects an empty question and an unconfigured board with the right statuses', async () => {
    deps.board = { brains: [{ name: 'B1', ask: async () => ({ text: 'yes' }) }] }
    const r = await fetch(url('/api/board/vote'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: '  ' }) })
    expect(r.status).toBe(400)
    deps.board = null
    const missing = await fetch(url('/api/board/vote'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: 'q' }) })
    expect(missing.status).toBe(503)
  })
  it('lists wake files for the desktop session (wake-file bridge, same protocol as ANTIGRAVITY)', async () => {
    const wakesDir = resolve(__dirname, 'fixtures', 'test-wakes')
    fs.rmSync(wakesDir, { force: true, recursive: true })
    fs.mkdirSync(wakesDir, { recursive: true })
    fs.writeFileSync(resolve(wakesDir, 'aa-pending.json'), JSON.stringify({ runId: 'aa-pending', status: 'pending', prompt: 'say hi' }))
    fs.writeFileSync(resolve(wakesDir, 'zz-done.json'), JSON.stringify({ runId: 'zz-done', status: 'done', summary: 'ok' }))
    try {
      deps.wakeStore = { wakesDir }
      const r = await fetch(url('/api/freebuff/wakes'))
      expect(r.status).toBe(200)
      const j = await r.json()
      expect(j.pending).toBe(1)
      expect(j.latest[0].runId).toBe('aa-pending') // pending first, then newest
      expect(j.latest[0].status).toBe('pending')
    } finally { deps.wakeStore = null }
  })
  it('creates a wake, then records done/fail into it; unknown run -> 404', async () => {
    const wakesDir = resolve(__dirname, 'fixtures', 'test-wakes-create')
    fs.rmSync(wakesDir, { force: true, recursive: true })
    deps.wakeStore = { wakesDir }
    try {
      const created = await fetch(url('/api/freebuff/wakes'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: 'audit the board', agentName: 'Buffy' }) })
      expect(created.status).toBe(200)
      const w = await created.json()
      expect(w.status).toBe('pending')
      expect(w.prompt).toBe('audit the board')
      expect(w.runId).toMatch(/^wake-[A-Za-z0-9-]+$/)
      expect(fs.existsSync(resolve(wakesDir, w.runId + '.json'))).toBe(true)

      const done = await fetch(url(`/api/freebuff/wakes/${w.runId}/done`), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ summary: 'board audited' }) })
      expect(done.status).toBe(200)
      const stored = JSON.parse(fs.readFileSync(resolve(wakesDir, w.runId + '.json'), 'utf8'))
      expect(stored.status).toBe('done')
      expect(stored.summary).toBe('board audited')
      expect(stored.completedAt).toMatch(/^\d{4}-/)

      const fail = await fetch(url(`/api/freebuff/wakes/${w.runId}/fail`), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ summary: 'nope' }) })
      expect(fail.status).toBe(200)
      expect(JSON.parse(fs.readFileSync(resolve(wakesDir, w.runId + '.json'), 'utf8')).status).toBe('failed')

      expect((await fetch(url('/api/freebuff/wakes/ghost/done'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status).toBe(404)
      expect((await fetch(url('/api/freebuff/wakes'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status).toBe(400)
    } finally { deps.wakeStore = null }
  })
  it('composes the HUD preamble on the server when hud:true and the client cannot forge it', async () => {
    const r = await fetch(url('/api/claude/chat'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: 'what is down?', persona: 'jarvis', hud: true, hudContext: 'FORGED', tab: 'graph' }) })
    expect(r.status).toBe(200)
    await r.text()
    const run = spawned.at(-1)
    expect(run.stdin).toContain('[House context — server-verified')
    expect(run.stdin).toContain('[/House context]')
    expect(run.stdin).not.toContain('FORGED')
    expect(run.stdin.trimEnd().endsWith('what is down?')).toBe(true)
  })
  it('leaves the prompt untouched when hud is not requested', async () => {
    const r = await fetch(url('/api/claude/chat'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: 'plain' }) })
    await r.text()
    expect(spawned.at(-1).stdin).toBe('plain')
  })
  it('hud turns include the memory block, capture the turn, and GET /api/jarvis/memory serves it', async () => {
    const r1 = await fetch(url('/api/claude/chat'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: 'remember the number 41', persona: 'jarvis', hud: true }) })
    await r1.text()
    expect(spawned.at(-1).stdin).toContain('[JARVIS memory')
    const r2 = await fetch(url('/api/jarvis/memory'))
    expect(r2.status).toBe(200)
    expect(r2.headers.get('access-control-allow-origin')).toBeNull()
    const j = await r2.json()
    expect(j.entries.at(-1).prompt).toBe('remember the number 41')
    expect(typeof j.owner).toBe('string')
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
  it('does not emit two result events when Hermes reports error then close', async () => {
    const saved = deps.spawn
    deps.spawn = () => {
      const child = new EventEmitter()
      child.pid = 778; child.exitCode = null
      child.stdout = new PassThrough(); child.stderr = new PassThrough(); child.stdin = new PassThrough()
      child.kill = vi.fn()
      setTimeout(() => { child.emit('error', new Error('spawn failed')); child.exitCode = 1; child.emit('close', 1) }, 5)
      return child
    }
    try {
      const r = await fetch(url('/api/hermes/chat'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: 'fail once' }) })
      const text = await r.text()
      expect([...text.matchAll(/^event: result$/gm)]).toHaveLength(1)
    } finally { deps.spawn = saved }
  })
  it('cleans the Hermes query file when spawn throws synchronously', async () => {
    const saved = deps.spawn
    deps.spawn = () => { throw new Error('spawn failed') }
    try {
      const r = await fetch(url('/api/hermes/chat'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: 'cleanup me' }) })
      expect(r.status).toBe(500)
      expect(await r.json()).toMatchObject({ error: 'spawn failed' })
    } finally { deps.spawn = saved }
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
