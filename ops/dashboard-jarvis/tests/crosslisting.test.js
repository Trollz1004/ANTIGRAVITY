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

  it('status probe goes through the same-origin server, never cross-origin :3000', () => {
    expect(js).toContain('/api/crosslisting/status')
    expect(js).not.toMatch(/127\.0\.0\.1:3000|20128|:3100|:9140/)
  })

  it('exports probeCrosslisting and the status URL', async () => {
    const mod = await import('../js/crosslisting.js')
    expect(typeof mod.probeCrosslisting).toBe('function')
    expect(mod.STATUS_URL).toBe('/api/crosslisting/status')
  })
})

// Tunnel-safe embed: behind a single-port tunnel (VS Code dev tunnel on :9150) the
// browser can reach ONLY the JARVIS origin, so the iframe and the "open app" link
// must never be hardcoded to another port — see SABRETOOTH-NODE-RUNBOOK.md §11.
describe('Crosslisting embed is tunnel-safe (no direct :3000 in the client)', () => {
  let html, js, server

  beforeAll(() => {
    html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8')
    js = fs.readFileSync(path.join(root, 'js', 'crosslisting.js'), 'utf-8')
    server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf-8')
  })

  it('the iframe and "open app" link carry no hardcoded loopback/LAN src or href', () => {
    expect(html).not.toMatch(/iframe[^>]*src="http/i)
    expect(html).not.toMatch(/id="crosslisting-open"[^>]*href="http/i)
    expect(html).toContain('<iframe id="crosslisting-frame"')
    expect(html).toContain('id="crosslisting-open"')
  })

  it('crosslisting.js sets the iframe to the same-origin proxy route, not a direct port', () => {
    expect(js).toContain('/api/proxy/crosslisting/')
    expect(js).not.toMatch(/127\.0\.0\.1:3000|20128|:3100|:9140/)
  })

  it('crosslisting.js builds the "open app" link from /api/config rather than hardcoding a URL', () => {
    expect(js).toMatch(/fetch\(['"]\/api\/config['"]/)
    expect(js).toContain('cfg.crosslisting')
  })

  it('exports the embed helpers', async () => {
    const mod = await import('../js/crosslisting.js')
    expect(mod.EMBED_URL).toBe('/api/proxy/crosslisting/')
    expect(typeof mod.wireEmbed).toBe('function')
  })

  it('server.mjs proxies /api/proxy/crosslisting/* to the configured Crosslisting base, same-origin', () => {
    expect(server).toMatch(/['"]\/api\/proxy\/crosslisting['"]/)
    expect(server).toContain("CROSSLISTING + p.slice('/api/proxy/crosslisting'.length)")
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
