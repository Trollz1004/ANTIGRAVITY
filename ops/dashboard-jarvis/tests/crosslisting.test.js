import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')

// The crosslisting package is a sibling of jarvis in dashboard/; allow override.
const pkgRoot = process.env.CROSSLISTING_ROOT
  || path.resolve(root, '..', 'crosslisting')

describe('Crosslisting dashboard attachment', () => {
  let html, js

  beforeAll(() => {
    html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8')
    js = fs.readFileSync(path.join(root, 'js', 'crosslisting.js'), 'utf-8')
  })

  it('nav data-tab=crosslisting has a matching tab-crosslisting section', () => {
    expect(html).toContain('data-tab="crosslisting"')
    expect(html).toContain('id="tab-crosslisting"')
  })

  it('loads crosslisting.js as a module', () => {
    expect(html).toContain('src="js/crosslisting.js"')
  })

  it('status probe targets only localhost:3000', () => {
    expect(js).toContain('http://127.0.0.1:3000')
    expect(js).not.toMatch(/20128|:3100|:9140/)
  })

  it('exports probeCrosslisting and CROSSLISTING_BASE', async () => {
    const mod = await import('../js/crosslisting.js')
    expect(typeof mod.probeCrosslisting).toBe('function')
    expect(mod.CROSSLISTING_BASE).toBe('http://127.0.0.1:3000')
  })
})

describe('Crosslisting package cleanliness', () => {
  it('package.json cleaned — no runtime tooling leftovers', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf-8'))
    expect(pkg.name).toBe('crosslisting')
    const all = JSON.stringify(pkg)
    expect(all).not.toMatch(/manus/i)
    expect(all).not.toMatch(/jsx-loc/)
  })

  it('vite config has no leftover debug plugins', () => {
    const v = fs.readFileSync(path.join(pkgRoot, 'vite.config.ts'), 'utf-8')
    expect(v).not.toMatch(/manus/i)
    expect(v).not.toMatch(/jsx-loc/)
    expect(v).toContain('@vitejs/plugin-react')
  })

  it('README is business-only', () => {
    const r = fs.readFileSync(path.join(pkgRoot, 'README.md'), 'utf-8')
    expect(r).toMatch(/Crosslisting/)
    expect(r).not.toMatch(/antigravity|paperclip|nsfw|trollz|youandin/i)
  })

  it('top-level docs carry no internal project vocabulary', () => {
    for (const f of ['README.md', 'todo.md']) {
      const p = path.join(pkgRoot, f)
      if (!fs.existsSync(p)) continue
      const t = fs.readFileSync(p, 'utf-8')
      expect(t, f).not.toMatch(/antigravity|paperclip|nsfw|trollz1004|youandinotai/i)
    }
  })
})
