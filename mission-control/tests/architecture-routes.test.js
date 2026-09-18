import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')

describe('JARVIS wiring — server.mjs Architecture routes (Phase E, unit 3)', () => {
  const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf-8')

  it('imports lib/architecture.mjs', () => {
    expect(server).toContain("from './lib/architecture.mjs'")
  })

  it('wires GET /api/architecture.json using buildArchitecture', () => {
    expect(server).toContain("p === '/api/architecture.json'")
    expect(server).toContain('buildArchitecture(')
  })

  it('wires GET /api/architecture with a 5-minute cache and the archify CLI shell-out', () => {
    expect(server).toContain("p === '/api/architecture'")
    expect(server).toContain('renderArchitectureHtml(')
    expect(server).toContain('ARCHITECTURE_CACHE_MS')
  })

  it('wires GET /api/architecture/diff for a chosen commit range', () => {
    expect(server).toContain("p === '/api/architecture/diff'")
    expect(server).toContain('renderArchitectureDiff(')
  })

  it('index.html has an Architecture tab with a refresh button and an iframe', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8')
    expect(html).toContain('data-tab="architecture"')
    expect(html).toContain('id="tab-architecture"')
    expect(html).toContain('id="architecture-refresh"')
    expect(html).toContain('id="architecture-frame"')
  })

  it('js/jarvis/architecture.js exists', () => {
    expect(fs.existsSync(path.join(root, 'js', 'jarvis', 'architecture.js'))).toBe(true)
  })

  it('archify is vendored (gitignored) rather than committed in bulk', () => {
    const gi = fs.readFileSync(path.join(root, '.gitignore'), 'utf-8')
    expect(gi).toMatch(/vendor\//)
    expect(fs.existsSync(path.join(root, 'vendor', 'archify', 'bin', 'archify.mjs'))).toBe(true)
  })
})
