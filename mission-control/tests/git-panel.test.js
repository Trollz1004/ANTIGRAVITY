import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')
const repoRoot = path.resolve(root, '..') // C:\ANTIGRAVITY

const mod = await import('../lib/git-panel.mjs')
const clientMod = await import('../js/jarvis/ops.js')

function fakeExec(script) {
  return (cwd, args) => {
    const key = args.join(' ')
    for (const [pattern, out] of script) {
      if (pattern.test(key)) return out
    }
    throw new Error('unhandled git call: ' + key)
  }
}

describe('lib/git-panel.mjs — injected git calls (no real process)', () => {
  it('gitInfo reports branch, dirty count, ahead/behind, and last commits', () => {
    const exec = fakeExec([
      [/^rev-parse --abbrev-ref HEAD$/, 'main\n'],
      [/^status --porcelain$/, ' M file1.js\n?? file2.js\n'],
      [/^rev-parse --abbrev-ref --symbolic-full-name @\{u\}$/, 'origin/main\n'],
      [/^rev-list --left-right --count origin\/main\.\.\.HEAD$/, '2\t1\n'],
      [/^log -5 --pretty=format:%h %s$/, 'abc1234 first\ndef5678 second\n'],
    ])
    const r = mod.gitInfo('C:\\fake\\repo', { exec })
    expect(r.ok).toBe(true)
    expect(r.branch).toBe('main')
    expect(r.dirty).toBe(2)
    expect(r.behind).toBe(2)
    expect(r.ahead).toBe(1)
    expect(r.commits).toEqual(['abc1234 first', 'def5678 second'])
  })

  it('no upstream configured reports ahead/behind as null, never a fabricated zero', () => {
    const exec = (cwd, args) => {
      const key = args.join(' ')
      if (/^rev-parse --abbrev-ref HEAD$/.test(key)) return 'detached\n'
      if (/^status --porcelain$/.test(key)) return ''
      if (/^rev-parse --abbrev-ref --symbolic-full-name @\{u\}$/.test(key)) throw new Error('no upstream')
      if (/^log -5/.test(key)) return 'abc1234 only commit\n'
      throw new Error('unhandled: ' + key)
    }
    const r = mod.gitInfo('C:\\fake\\repo', { exec })
    expect(r.ok).toBe(true)
    expect(r.ahead).toBeNull()
    expect(r.behind).toBeNull()
    expect(r.dirty).toBe(0)
  })

  it('a failing git call reports { ok: false, error }, never throws', () => {
    const exec = () => { throw new Error('not a git repository') }
    const r = mod.gitInfo('C:\\not\\a\\repo', { exec })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/not a git repository/)
  })

  it('gitPanel maps every configured repo by id', () => {
    const exec = (cwd) => { throw new Error('boom: ' + cwd) }
    const out = mod.gitPanel([{ id: 'a', path: 'A' }, { id: 'b', path: 'B' }], { exec })
    expect(out.map((r) => r.id)).toEqual(['a', 'b'])
    expect(out.every((r) => r.ok === false)).toBe(true)
  })
})

describe('lib/git-panel.mjs — the real ANTIGRAVITY checkout (worked example)', () => {
  it('reports real branch and dirty count with no fetch performed', () => {
    const r = mod.gitInfo(repoRoot)
    expect(r.ok).toBe(true)
    expect(typeof r.branch).toBe('string')
    expect(r.branch.length).toBeGreaterThan(0)
    expect(typeof r.dirty).toBe('number')
    expect(Array.isArray(r.commits)).toBe(true)
    expect(r.commits.length).toBeGreaterThan(0)
  })
})

describe('JARVIS wiring — server.mjs, index.html', () => {
  it('server.mjs wires GET /api/git-panel through lib/git-panel.mjs, antigravity only (hermes clone dropped 2026-09-17 — archived repo, stale ~/hermes clone)', () => {
    const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf-8')
    expect(server).toContain("from './lib/git-panel.mjs'")
    expect(server).toMatch(/p === '\/api\/git-panel'/)
    expect(server).not.toContain("join(homedir(), 'hermes')")
  })

  it('index.html has the ops-git container', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8')
    expect(html).toContain('id="ops-git"')
  })
})

describe('js/jarvis/ops.js — git panel client slice', () => {
  it('exports the expected surface', () => {
    expect(typeof clientMod.loadGitPanel).toBe('function')
    expect(typeof clientMod.renderGitPanel).toBe('function')
  })

  it('renderGitPanel shows branch/dirty/ahead-behind and an error state honestly', () => {
    const el = { innerHTML: '' }
    clientMod.renderGitPanel(el, { repos: [{ id: 'antigravity', ok: true, branch: 'main', dirty: 3, ahead: 1, behind: 0, commits: ['abc first'] }] })
    expect(el.innerHTML).toContain('main')
    expect(el.innerHTML).toContain('dirty 3')
    expect(el.innerHTML).toContain('abc first')

    clientMod.renderGitPanel(el, { repos: [{ id: 'other-repo', ok: false, error: 'ENOENT: no such repo' }] })
    expect(el.innerHTML).toContain('ENOENT')
  })
})
