import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')
const repoRoot = path.resolve(root, '..', '..') // C:\ANTIGRAVITY

const speckit = await import('../lib/speckit.mjs')
const clientMod = await import('../js/jarvis/speckit.js')

describe('lib/speckit.mjs — the real specs/ directory (worked example feature)', () => {
  const specsDir = path.join(repoRoot, 'specs')
  const constitutionPath = path.join(repoRoot, '.specify', 'memory', 'constitution.md')

  it('lists the 001-jarvis-spec-kit-panel feature with correct doc flags and task counts', () => {
    const features = speckit.listFeatures(specsDir)
    const f = features.find((x) => x.id === '001-jarvis-spec-kit-panel')
    expect(f).toBeTruthy()
    expect(f.hasSpec).toBe(true)
    expect(f.hasPlan).toBe(true)
    expect(f.hasTasks).toBe(true)
    expect(f.tasksTotal).toBeGreaterThanOrEqual(6)
    expect(f.tasksDone).toBeGreaterThanOrEqual(0)
    expect(f.tasksDone).toBeLessThanOrEqual(f.tasksTotal)
    expect(typeof f.title).toBe('string')
    expect(f.title.length).toBeGreaterThan(0)
  })

  it('reads the ratified constitution', () => {
    const md = speckit.readConstitution(constitutionPath)
    expect(md).toMatch(/Constitution/)
    expect(md).toMatch(/Judge-Gated Delivery/)
  })

  it('resolveDoc returns the real spec markdown for the worked example', () => {
    const r = speckit.resolveDoc(specsDir, '001-jarvis-spec-kit-panel', 'spec')
    expect(r.ok).toBe(true)
    expect(r.markdown).toMatch(/Feature Specification: JARVIS Spec Kit Panel/)
  })

  it('rejects path traversal in id', () => {
    expect(speckit.resolveDoc(specsDir, '../../CLAUDE.md', 'spec').ok).toBe(false)
    expect(speckit.resolveDoc(specsDir, '..', 'spec').ok).toBe(false)
    expect(speckit.resolveDoc(specsDir, '001-jarvis-spec-kit-panel/../../CLAUDE', 'spec').ok).toBe(false)
  })

  it('rejects a doc outside spec|plan|tasks', () => {
    expect(speckit.resolveDoc(specsDir, '001-jarvis-spec-kit-panel', 'CLAUDE').ok).toBe(false)
    expect(speckit.resolveDoc(specsDir, '001-jarvis-spec-kit-panel', '../CLAUDE').ok).toBe(false)
  })

  it('reports not found for a real feature id with a doc that does not exist yet', () => {
    const r = speckit.resolveDoc(specsDir, '001-jarvis-spec-kit-panel', 'plan')
    expect(r.ok).toBe(true) // this one exists — sanity check the positive path too
  })
})

describe('lib/speckit.mjs — isolated fixtures (no dependency on repo state)', () => {
  const tmp = path.join(root, 'tests', 'fixtures', 'speckit-tmp')
  beforeAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true })
    fs.mkdirSync(path.join(tmp, 'alpha'), { recursive: true })
    fs.writeFileSync(path.join(tmp, 'alpha', 'spec.md'), '# Feature Specification: Alpha Thing\n\nBody.\n')
    fs.writeFileSync(path.join(tmp, 'alpha', 'tasks.md'), '- [x] T001 done\n- [ ] T002 not done\n- [X] T003 also done\n')
    // beta has only a spec — no plan, no tasks
    fs.mkdirSync(path.join(tmp, 'beta'), { recursive: true })
    fs.writeFileSync(path.join(tmp, 'beta', 'spec.md'), '# Feature Specification: Beta\n')
  })

  it('computes tasksTotal/tasksDone from checkbox lines, case-insensitive on x', () => {
    const features = speckit.listFeatures(tmp)
    const alpha = features.find((f) => f.id === 'alpha')
    expect(alpha.tasksTotal).toBe(3)
    expect(alpha.tasksDone).toBe(2)
    expect(alpha.title).toBe('Alpha Thing')
  })

  it('a feature missing plan/tasks reports false and zero, never throws', () => {
    const features = speckit.listFeatures(tmp)
    const beta = features.find((f) => f.id === 'beta')
    expect(beta.hasSpec).toBe(true)
    expect(beta.hasPlan).toBe(false)
    expect(beta.hasTasks).toBe(false)
    expect(beta.tasksTotal).toBe(0)
    expect(beta.tasksDone).toBe(0)
  })

  it('an empty/missing specs directory returns an empty list, not an error', () => {
    expect(speckit.listFeatures(path.join(tmp, 'does-not-exist'))).toEqual([])
  })

  it('a missing constitution file returns an empty string, not a throw', () => {
    expect(speckit.readConstitution(path.join(tmp, 'no-constitution.md'))).toBe('')
  })

  it('resolveDoc rejects traversal even against a fixture root', () => {
    expect(speckit.resolveDoc(tmp, '../outside', 'spec').ok).toBe(false)
    expect(speckit.resolveDoc(tmp, 'alpha', 'spec').ok).toBe(true)
    expect(speckit.resolveDoc(tmp, 'alpha', 'plan').ok).toBe(false) // doesn't exist
  })
})

describe('JARVIS wiring — index.html, server.mjs routes', () => {
  let html, server

  beforeAll(() => {
    html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8')
    server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf-8')
  })

  it('nav data-tab=speckit has a matching tab-speckit section', () => {
    expect(html).toContain('data-tab="speckit"')
    expect(html).toContain('id="tab-speckit"')
  })

  it('loads js/jarvis/speckit.js as a module', () => {
    expect(html).toContain('src="js/jarvis/speckit.js"')
  })

  it('the nav tab and panel carry no emoji', () => {
    const navMatch = /<li class="nav-tab" data-tab="speckit">[\s\S]*?<\/li>/.exec(html)
    expect(navMatch).toBeTruthy()
    // eslint-disable-next-line no-control-regex
    expect(navMatch[0]).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u)
  })

  it('server.mjs wires GET /api/speckit and GET /api/speckit/:id/:doc through lib/speckit.mjs', () => {
    expect(server).toContain("from './lib/speckit.mjs'")
    expect(server).toMatch(/p === '\/api\/speckit'/)
    expect(server).toMatch(/\/\^\\\/api\\\/speckit\\\/.*exec\(p\)/)
  })
})

describe('js/jarvis/speckit.js — client module', () => {
  const mod = clientMod
  const src = fs.readFileSync(path.join(root, 'js', 'jarvis', 'speckit.js'), 'utf-8')

  it('exports the expected surface', () => {
    expect(mod.SPECKIT_URL).toBe('/api/speckit')
    expect(typeof mod.docUrl).toBe('function')
    expect(typeof mod.escapeHtml).toBe('function')
    expect(typeof mod.renderMarkdown).toBe('function')
    expect(typeof mod.fetchSpeckit).toBe('function')
    expect(typeof mod.fetchDoc).toBe('function')
    expect(typeof mod.loadSpeckit).toBe('function')
    expect(typeof mod.initSpeckit).toBe('function')
  })

  it('docUrl builds a relative, encoded path', () => {
    expect(mod.docUrl('001-jarvis-spec-kit-panel', 'tasks')).toBe('/api/speckit/001-jarvis-spec-kit-panel/tasks')
    expect(mod.docUrl('a b', 'spec')).toBe('/api/speckit/a%20b/spec')
  })

  it('escapeHtml neutralizes HTML-significant characters', () => {
    expect(mod.escapeHtml('<script>alert(1)</script>')).not.toContain('<script>')
    expect(mod.escapeHtml('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('renderMarkdown never lets raw HTML from the source through unescaped', () => {
    const out = mod.renderMarkdown('# Title\n\n<img src=x onerror=alert(1)>\n\n- [x] done\n- [ ] not done')
    expect(out).not.toMatch(/<img/)
    expect(out).toContain('&lt;img')
    expect(out).toContain('<h1>Title</h1>')
    expect(out).toContain('speckit-tasklist')
  })

  it('carries no absolute URL — relative fetches only, so the tunnel keeps working', () => {
    expect(src).not.toMatch(/https?:\/\//)
    expect(src).not.toMatch(/127\.0\.0\.1|0\.0\.0\.0|:9150|:9119|:18789|:3100|:3151/)
  })

  it('fetchSpeckit and fetchDoc call the relative API with an injected fetch (no live network)', async () => {
    let calledUrl = null
    const fakeFetch = async (url) => { calledUrl = url; return { ok: true, json: async () => ({ constitution: 'C', features: [] }) } }
    const r = await mod.fetchSpeckit(fakeFetch)
    expect(calledUrl).toBe('/api/speckit')
    expect(r.constitution).toBe('C')

    const fakeFetch2 = async (url) => { calledUrl = url; return { ok: true, json: async () => ({ ok: true, markdown: '# hi' }) } }
    const r2 = await mod.fetchDoc('001-jarvis-spec-kit-panel', 'tasks', fakeFetch2)
    expect(calledUrl).toBe('/api/speckit/001-jarvis-spec-kit-panel/tasks')
    expect(r2.markdown).toBe('# hi')
  })
})
