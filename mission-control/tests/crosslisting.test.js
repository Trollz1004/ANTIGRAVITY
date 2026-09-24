import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')

// Live package lives under mission-control/crosslisting-os (not the retired sibling path).
const pkgRoot = process.env.CROSSLISTING_ROOT
  || path.resolve(root, 'crosslisting-os')

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

  it('status probe goes through the same-origin server, never hardcodes a port URL', () => {
      expect(js).toContain('/api/crosslisting/status')
      // No hardcoded runtime URL — base comes from /api/config.
      expect(js).not.toMatch(/https?:\/\/127\.0\.0\.1:\d+/)
      expect(js).not.toMatch(/https?:\/\/192\.168\.\d+\.\d+:\d+/)
    })

  it('exports probeCrosslisting and the status URL', async () => {
    const mod = await import('../js/crosslisting.js')
    expect(typeof mod.probeCrosslisting).toBe('function')
    expect(mod.STATUS_URL).toBe('/api/crosslisting/status')
  })
})

// Embed: iframe src is set from /api/config.crosslisting.base (LAN) with
// same-origin proxy as fallback. Never hardcode a port in HTML.
describe('Crosslisting embed is config-driven (no hardcoded ports in HTML)', () => {
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

  it('crosslisting.js builds the iframe/open link from /api/config, with proxy fallback', () => {
    expect(js).toMatch(/fetch\(['"]\/api\/config['"]/)
    expect(js).toContain('cfg.crosslisting')
    expect(js).toContain('/api/proxy/crosslisting/')
    expect(js).toContain('base || EMBED_URL')
  })

  it('exports the embed helpers', async () => {
    const mod = await import('../js/crosslisting.js')
    expect(mod.EMBED_URL).toBe('/api/proxy/crosslisting/')
    expect(typeof mod.wireEmbed).toBe('function')
  })

  it('server.mjs proxies /api/proxy/crosslisting/* to the configured Crosslisting base', () => {
    expect(server).toMatch(/['"]\/api\/proxy\/crosslisting['"]/)
    expect(server).toContain("CROSSLISTING + p.slice('/api/proxy/crosslisting'.length)")
  })
})

describe('Crosslisting package is local + no-login ready', () => {
  it('package exists at mission-control/crosslisting-os', () => {
    expect(fs.existsSync(path.join(pkgRoot, 'package.json'))).toBe(true)
    expect(fs.existsSync(path.join(pkgRoot, 'server', '_core', 'trpc.ts'))).toBe(true)
  })

  it('AUTH_DISABLED bypass is wired in server tRPC + context', () => {
    const trpc = fs.readFileSync(path.join(pkgRoot, 'server', '_core', 'trpc.ts'), 'utf-8')
    const ctx = fs.readFileSync(path.join(pkgRoot, 'server', '_core', 'context.ts'), 'utf-8')
    expect(trpc).toContain('authDisabled')
    expect(trpc).toContain('LOCAL_OWNER')
    expect(ctx).toContain('authDisabled()')
    expect(ctx).toContain('LOCAL_OWNER')
  })

  it('client never forces Manus login when VITE_AUTH_DISABLED is set', () => {
    const layout = fs.readFileSync(path.join(pkgRoot, 'client', 'src', 'components', 'DashboardLayout.tsx'), 'utf-8')
    const main = fs.readFileSync(path.join(pkgRoot, 'client', 'src', 'main.tsx'), 'utf-8')
    expect(layout).toContain('VITE_AUTH_DISABLED')
    expect(layout).toContain('!user && !authDisabled')
    expect(main).toContain('VITE_AUTH_DISABLED')
  })

  it('README is business-only', () => {
    const r = fs.readFileSync(path.join(pkgRoot, 'README.md'), 'utf-8')
    expect(r).toMatch(/Crosslisting/)
    expect(r).not.toMatch(/antigravity|paperclip|nsfw|trollz|youandin/i)
  })

  it('README carries no internal project vocabulary', () => {
      const p = path.join(pkgRoot, 'README.md')
      const t = fs.readFileSync(p, 'utf-8')
      expect(t).not.toMatch(/antigravity|paperclip|nsfw|trollz1004|youandinotai/i)
    })

  it('dev script is Windows-safe (no bare NODE_ENV= prefix)', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf-8'))
    expect(pkg.scripts.dev).not.toMatch(/^NODE_ENV=/)
    expect(pkg.scripts.dev).toContain('tsx')
  })

  it('AI Curb Scout router and page exist with hard rules (Price <= $10, Photo Required)', () => {
    const curbRouter = fs.readFileSync(path.join(pkgRoot, 'server', 'routers', 'curbAlerts.ts'), 'utf-8')
    const curbPage = fs.readFileSync(path.join(pkgRoot, 'client', 'src', 'pages', 'CurbAlerts.tsx'), 'utf-8')
    const appRouter = fs.readFileSync(path.join(pkgRoot, 'server', 'routers.ts'), 'utf-8')

    expect(curbRouter).toContain('maxPrice: z.number().max(10)')
    expect(curbRouter).toContain('hasPhotoOnly: z.boolean()')
    expect(curbRouter).toContain('importToCatalog')

    expect(curbPage).toContain('AI Curb Scout & Free Finder')
    expect(curbPage).toContain('Import & Crosslist')

    expect(appRouter).toContain('curbAlerts: curbAlertsRouter')
  })
})
