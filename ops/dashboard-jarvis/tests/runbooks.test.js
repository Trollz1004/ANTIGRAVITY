import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')
const repoRoot = path.resolve(root, '..', '..') // C:\ANTIGRAVITY

const mod = await import('../lib/runbooks.mjs')
const clientMod = await import('../js/jarvis/ops.js')

describe('lib/runbooks.mjs — isolated fixtures', () => {
  const tmp = path.join(root, 'tests', 'fixtures', 'runbooks-tmp')
  beforeAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true })
    fs.mkdirSync(tmp, { recursive: true })
    fs.writeFileSync(path.join(tmp, 'ALPHA.md'), '# Alpha Runbook\n\nStep one.\n')
    fs.writeFileSync(path.join(tmp, 'beta.md'), '# Beta Runbook\n')
    fs.writeFileSync(path.join(tmp, 'notes.txt'), 'not a runbook')
  })

  it('listRunbooks lists only .md files, sorted by name', () => {
    const out = mod.listRunbooks(tmp)
    expect(out.map((r) => r.name)).toEqual(['ALPHA.md', 'beta.md'])
    expect(out[0].bytes).toBeGreaterThan(0)
    expect(typeof out[0].modified).toBe('string')
  })

  it('an empty/missing directory returns an empty list, not an error', () => {
    expect(mod.listRunbooks(path.join(tmp, 'does-not-exist'))).toEqual([])
  })

  it('resolveRunbook returns the real markdown for a real file', () => {
    const r = mod.resolveRunbook(tmp, 'ALPHA.md')
    expect(r.ok).toBe(true)
    expect(r.markdown).toMatch(/Alpha Runbook/)
  })

  it('rejects path traversal and non-.md names', () => {
    expect(mod.resolveRunbook(tmp, '../CLAUDE.md').ok).toBe(false)
    expect(mod.resolveRunbook(tmp, 'notes.txt').ok).toBe(false)
    expect(mod.resolveRunbook(tmp, '..\\..\\CLAUDE.md').ok).toBe(false)
    expect(mod.resolveRunbook(tmp, '').ok).toBe(false)
  })

  it('reports not found for a real .md name that does not exist', () => {
    const r = mod.resolveRunbook(tmp, 'missing.md')
    expect(r.ok).toBe(false)
    expect(r.error).toBe('not found')
  })
})

describe('lib/runbooks.mjs — the real ops/runbook directory (worked example)', () => {
  it('lists the real runbook files', () => {
    const out = mod.listRunbooks(path.join(repoRoot, 'ops', 'runbook'))
    expect(out.length).toBeGreaterThan(0)
    expect(out.some((r) => r.name === 'SABRETOOTH-NODE-RUNBOOK.md')).toBe(true)
  })

  it('resolves the real runbook markdown', () => {
    const r = mod.resolveRunbook(path.join(repoRoot, 'ops', 'runbook'), 'SABRETOOTH-NODE-RUNBOOK.md')
    expect(r.ok).toBe(true)
    expect(r.markdown.length).toBeGreaterThan(0)
  })
})

describe('JARVIS wiring — server.mjs, index.html', () => {
  it('server.mjs wires GET /api/runbooks and GET /api/runbooks/:name through lib/runbooks.mjs', () => {
    const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf-8')
    expect(server).toContain("from './lib/runbooks.mjs'")
    expect(server).toMatch(/p === '\/api\/runbooks'/)
    expect(server).toMatch(/\/\^\\\/api\\\/runbooks\\\/.*exec\(p\)/)
  })

  it('index.html has the ops-runbook-list and ops-runbook-body containers', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8')
    expect(html).toContain('id="ops-runbook-list"')
    expect(html).toContain('id="ops-runbook-body"')
  })
})

describe('js/jarvis/ops.js — runbook viewer client slice (reuses the Spec Kit markdown renderer)', () => {
  it('exports the expected surface', () => {
    expect(typeof clientMod.loadRunbooks).toBe('function')
    expect(typeof clientMod.renderRunbookList).toBe('function')
    expect(typeof clientMod.selectRunbook).toBe('function')
  })

  it('imports renderMarkdown from speckit.js instead of re-implementing it', () => {
    const src = fs.readFileSync(path.join(root, 'js', 'jarvis', 'ops.js'), 'utf-8')
    expect(src).toContain("from './speckit.js'")
    expect(src).not.toMatch(/function renderMarkdown/)
  })

  it('runbookUrl builds a relative, encoded path', () => {
    expect(clientMod.runbookUrl('SABRETOOTH-NODE-RUNBOOK.md')).toBe('/api/runbooks/SABRETOOTH-NODE-RUNBOOK.md')
    expect(clientMod.runbookUrl('a b.md')).toBe('/api/runbooks/a%20b.md')
  })
})
