import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')
const repoRoot = path.resolve(root, '..', '..') // C:\ANTIGRAVITY

const mod = await import('../lib/task-commander.mjs')
const clientMod = await import('../js/jarvis/ops.js')

describe('lib/task-commander.mjs — pure parsing', () => {
  it('parseTasks counts done/total and collects unchecked text', () => {
    const r = mod.parseTasks('- [x] T001 done\n- [ ] T002 not done\n- [X] T003 also done\n- [ ] T004 also not done\n')
    expect(r.total).toBe(4)
    expect(r.done).toBe(2)
    expect(r.unchecked).toEqual(['T002 not done', 'T004 also not done'])
  })

  it('a file with no checkbox lines reports zero, not a throw', () => {
    expect(mod.parseTasks('no checkboxes here\n')).toEqual({ total: 0, done: 0, unchecked: [] })
    expect(mod.parseTasks('')).toEqual({ total: 0, done: 0, unchecked: [] })
  })
})

describe('lib/task-commander.mjs — isolated fixtures', () => {
  const tmp = path.join(root, 'tests', 'fixtures', 'task-commander-tmp')
  beforeAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true })
    fs.mkdirSync(path.join(tmp, 'alpha'), { recursive: true })
    fs.writeFileSync(path.join(tmp, 'alpha', 'tasks.md'), '- [x] done one\n- [ ] not done one\n')
    fs.mkdirSync(path.join(tmp, 'beta'), { recursive: true }) // no tasks.md at all
  })

  it('lists every feature, defaulting a missing tasks.md to zero/zero/empty', () => {
    const out = mod.listTaskCommander(tmp)
    const alpha = out.find((f) => f.id === 'alpha')
    const beta = out.find((f) => f.id === 'beta')
    expect(alpha).toEqual({ id: 'alpha', total: 2, done: 1, unchecked: ['not done one'] })
    expect(beta).toEqual({ id: 'beta', total: 0, done: 0, unchecked: [] })
  })

  it('an empty/missing specs directory returns an empty list, not an error', () => {
    expect(mod.listTaskCommander(path.join(tmp, 'does-not-exist'))).toEqual([])
  })
})

describe('lib/task-commander.mjs — the real specs/ directory', () => {
  it('reports 002-jarvis-absorb-emergent with a real done/total', () => {
    const out = mod.listTaskCommander(path.join(repoRoot, 'specs'))
    const f = out.find((x) => x.id === '002-jarvis-absorb-emergent')
    expect(f).toBeTruthy()
    expect(f.total).toBeGreaterThanOrEqual(10)
    expect(f.done).toBeLessThanOrEqual(f.total)
  })
})

describe('JARVIS wiring — server.mjs, index.html', () => {
  it('server.mjs wires GET /api/task-commander through lib/task-commander.mjs', () => {
    const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf-8')
    expect(server).toContain("from './lib/task-commander.mjs'")
    expect(server).toMatch(/p === '\/api\/task-commander'/)
  })

  it('index.html has the ops-tasks container', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8')
    expect(html).toContain('id="ops-tasks"')
  })
})

describe('js/jarvis/ops.js — task commander client slice', () => {
  it('exports the expected surface', () => {
    expect(typeof clientMod.loadTaskCommander).toBe('function')
    expect(typeof clientMod.renderTaskCommander).toBe('function')
  })

  it('renderTaskCommander shows done/total and unchecked items, honest empty state', () => {
    const el = { innerHTML: '' }
    clientMod.renderTaskCommander(el, { features: [] })
    expect(el.innerHTML).toMatch(/No specs/)
    clientMod.renderTaskCommander(el, { features: [{ id: 'alpha', total: 2, done: 1, unchecked: ['finish X'] }] })
    expect(el.innerHTML).toContain('alpha')
    expect(el.innerHTML).toContain('1/2')
    expect(el.innerHTML).toContain('finish X')
  })
})
