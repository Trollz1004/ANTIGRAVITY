import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')
const mod = await import('../lib/agent-tools.mjs')

const tmp = path.join(root, 'tests', 'fixtures', 'agent-tools-tmp')

beforeAll(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
  fs.mkdirSync(path.join(tmp, 'sub'), { recursive: true })
  fs.writeFileSync(path.join(tmp, 'readme.md'), '# hello\nfindme here\n')
  fs.writeFileSync(path.join(tmp, 'sub', 'nested.txt'), 'findme too\nsecond line\n')
  fs.writeFileSync(path.join(tmp, '.env'), 'SECRET=1\n')
  fs.writeFileSync(path.join(tmp, 'big.txt'), 'x'.repeat(mod.MAX_READ_BYTES + 10))
})
afterAll(() => { fs.rmSync(tmp, { recursive: true, force: true }) })

describe('lib/agent-tools.mjs — read_file', () => {
  it('reads a normal file, redacted', () => {
    const r = mod.toolReadFile({ repo: tmp, path: 'readme.md' })
    expect(r.ok).toBe(true)
    expect(r.text).toContain('findme here')
  })

  it('refuses .. traversal', () => {
    const r = mod.toolReadFile({ repo: tmp, path: '../outside.txt' })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/\.\./)
  })

  it('refuses a path that resolves outside the repo root', () => {
    const r = mod.toolReadFile({ repo: tmp, path: 'sub/../../../etc/passwd' })
    expect(r.ok).toBe(false)
  })

  it('refuses .env files', () => {
    const r = mod.toolReadFile({ repo: tmp, path: '.env' })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/secret|credential/i)
  })

  it('refuses a *secret*-named file even with a normal extension', () => {
    fs.writeFileSync(path.join(tmp, 'my-secret-notes.txt'), 'nope')
    const r = mod.toolReadFile({ repo: tmp, path: 'my-secret-notes.txt' })
    expect(r.ok).toBe(false)
  })

  it('refuses a file over the size cap', () => {
    const r = mod.toolReadFile({ repo: tmp, path: 'big.txt' })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/exceeds/)
  })

  it('reports not found honestly', () => {
    const r = mod.toolReadFile({ repo: tmp, path: 'nope.md' })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/not found/)
  })
})

describe('lib/agent-tools.mjs — list_dir', () => {
  it('lists immediate entries only', () => {
    const r = mod.toolListDir({ repo: tmp, path: '.' })
    expect(r.ok).toBe(true)
    expect(r.entries.some((e) => e.name === 'sub' && e.type === 'dir')).toBe(true)
    expect(r.entries.some((e) => e.name === 'readme.md' && e.type === 'file')).toBe(true)
  })

  it('refuses traversal', () => {
    const r = mod.toolListDir({ repo: tmp, path: '../' })
    expect(r.ok).toBe(false)
  })
})

describe('lib/agent-tools.mjs — search_repo', () => {
  it('finds hits via the JS-walk fallback when ripgrep is unavailable', async () => {
    const exec = (bin, args, opts, cb) => cb(new Error('ENOENT'))
    const r = await mod.toolSearchRepo({ repo: tmp, pattern: 'findme', exec })
    expect(r.ok).toBe(true)
    expect(r.engine).toBe('js-walk')
    expect(r.hits.length).toBeGreaterThanOrEqual(2)
    expect(r.hits.some((h) => h.file.includes('readme.md'))).toBe(true)
  })

  it('parses ripgrep output when it is available', async () => {
    const exec = (bin, args, opts, cb) => cb(null, `readme.md:2:findme here\n`)
    const r = await mod.toolSearchRepo({ repo: tmp, pattern: 'findme', exec })
    expect(r.ok).toBe(true)
    expect(r.engine).toBe('ripgrep')
    expect(r.hits).toEqual([{ file: 'readme.md', line: 2, text: 'findme here' }])
  })

  it('requires a pattern', async () => {
    const r = await mod.toolSearchRepo({ repo: tmp, pattern: '' })
    expect(r.ok).toBe(false)
  })
})

describe('lib/agent-tools.mjs — createAgentTools dispatch', () => {
  it('wires every advertised tool name to a schema and a handler', () => {
    const tools = mod.createAgentTools({ repo: tmp })
    const schemaNames = tools.schemas.map((s) => s.function.name).sort()
    expect(schemaNames).toEqual(tools.names.slice().sort())
    expect(schemaNames).toEqual([
      'create_proposal', 'gods_eye', 'inbox_list', 'list_dir', 'node_health',
      'read_file', 'request_bridge_run', 'runbook', 'search_repo', 'specs_list',
    ])
  })

  it('node_health calls the injected getNodeHealth and redacts the result', async () => {
    const tools = mod.createAgentTools({ repo: tmp, getNodeHealth: async () => ({ ok: true, health: { overall: 'GREEN' }, token: 'sk-abcdefghijklmnop' }) })
    const r = await mod.callTool(tools.handlers, 'node_health', {})
    expect(r.ok).toBe(true)
    expect(r.health.overall).toBe('GREEN')
    expect(r.token).toMatch(/\*\*\*\*$/)
  })

  it('gods_eye summarizes down targets from the injected snapshot', async () => {
    const snapshot = { at: 'now', up: 1, down: 1, total: 2, byGroup: {}, targets: [{ id: 'a', up: true }, { id: 'b', up: false, status: 'DOWN', detail: 'closed', group: 'core' }] }
    const tools = mod.createAgentTools({ repo: tmp, getGodsEye: async () => snapshot })
    const r = await mod.callTool(tools.handlers, 'gods_eye', {})
    expect(r.down).toBe(1)
    expect(r.downTargets).toEqual([{ id: 'b', group: 'core', status: 'DOWN', detail: 'closed' }])
  })

  it('create_proposal only ever files a PROPOSED item through the store, never executes', async () => {
    const created = []
    const store = { create: (rec) => { const r = { id: 'p1', state: 'PROPOSED', ...rec }; created.push(r); return r } }
    const tools = mod.createAgentTools({ repo: tmp, proposalStore: store })
    const r = await mod.callTool(tools.handlers, 'create_proposal', { kind: 'post', title: 'T', body: 'B' })
    expect(r.ok).toBe(true)
    expect(r.filed).toBe(true)
    expect(r.proposalId).toBe('p1')
    expect(created).toHaveLength(1)
    expect(created[0].source).toBe('judge')
  })

  it('create_proposal requires kind/title/body', async () => {
    const tools = mod.createAgentTools({ repo: tmp, proposalStore: { create: () => ({ id: 'x', state: 'PROPOSED' }) } })
    const r = await mod.callTool(tools.handlers, 'create_proposal', { kind: 'post' })
    expect(r.ok).toBe(false)
  })

  it('request_bridge_run only ever files a bridge.run proposal, never executes a bridge', async () => {
    const store = { create: () => ({}) }
    const createBridgeRunProposalFn = (args) => ({ status: 201, body: { proposal: { id: 'b1', state: 'PROPOSED', bridge: args.id } } })
    const tools = mod.createAgentTools({ repo: tmp, proposalStore: store, createBridgeRunProposalFn, getBridgeRow: async () => ({ id: 'hermes', canRun: true }) })
    const r = await mod.callTool(tools.handlers, 'request_bridge_run', { bridge: 'hermes', prompt: 'do a thing' })
    expect(r.ok).toBe(true)
    expect(r.proposalId).toBe('b1')
  })

  it('request_bridge_run surfaces a refusal (e.g. read-only bridge) honestly', async () => {
    const createBridgeRunProposalFn = () => ({ status: 400, body: { error: '"omniroute" is read-only' } })
    const tools = mod.createAgentTools({ repo: tmp, proposalStore: { create: () => ({}) }, createBridgeRunProposalFn, getBridgeRow: async () => null })
    const r = await mod.callTool(tools.handlers, 'request_bridge_run', { bridge: 'omniroute', prompt: 'x' })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/read-only/)
  })

  it('callTool never throws for an unknown tool name', async () => {
    const tools = mod.createAgentTools({ repo: tmp })
    const r = await mod.callTool(tools.handlers, 'not_a_real_tool', {})
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/unknown tool/)
  })

  it('runbook lists when no name is given and reads one when a name is given', async () => {
    const tools = mod.createAgentTools({
      repo: tmp,
      listRunbooksFn: () => [{ name: 'A.md' }],
      readRunbookFn: (name) => ({ ok: true, name, markdown: '# ' + name }),
    })
    const list = await mod.callTool(tools.handlers, 'runbook', {})
    expect(list.runbooks).toEqual([{ name: 'A.md' }])
    const one = await mod.callTool(tools.handlers, 'runbook', { name: 'A.md' })
    expect(one.markdown).toBe('# A.md')
  })
})
