import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')

describe('JARVIS wiring — server.mjs Fleet route (Phase D, unit 2)', () => {
  const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf-8')

  it('imports lib/fleet.mjs', () => {
    expect(server).toContain("from './lib/fleet.mjs'")
  })

  it('wires GET /api/fleet using buildFleet with all three lanes', () => {
    expect(server).toContain("p === '/api/fleet'")
    expect(server).toContain('buildFleet(')
    expect(server).toContain("lane: 'hermes'")
    expect(server).toContain("lane: 'openclaw'")
    expect(server).toContain("lane: 'opencode'")
  })

  it('OpenCode has no probe target configured (honest NOT CONFIGURED)', () => {
    expect(server).toMatch(/lane: 'opencode'[^}]*probe: null/)
  })

  it('redacts the fleet response', () => {
    expect(server).toMatch(/redact\(r\)\)/)
  })

  it('index.html has fleet rows in the Mission Control tab', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8')
    expect(html).toContain('id="fleet-panel"')
  })

  it('js/jarvis/fleet.js exists', () => {
    expect(fs.existsSync(path.join(root, 'js', 'jarvis', 'fleet.js'))).toBe(true)
  })
})
