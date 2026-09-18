import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')

describe('JARVIS wiring — server.mjs Skills/Plugins/MCP route (Phase F, unit 3)', () => {
  const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf-8')

  it('imports lib/skills-panel.mjs', () => {
    expect(server).toContain("from './lib/skills-panel.mjs'")
  })

  it('wires GET /api/skills using buildSkillsPanel, redacted', () => {
    expect(server).toContain("p === '/api/skills' && req.method === 'GET'")
    expect(server).toContain('buildSkillsPanel(')
    expect(server).toMatch(/redact\(r\)\)/)
  })

  it('never shells out with args/env in cleartext beyond the documented CLI calls', () => {
    expect(server).toContain("spawnSyncJson('claude', ['plugin', 'list', '--json'])")
    expect(server).toContain("spawnSyncText('claude', ['mcp', 'list'])")
  })

  it('index.html has a Skills + MCP tab', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8')
    expect(html).toContain('data-tab="skills"')
    expect(html).toContain('id="tab-skills"')
    expect(html).toContain('id="skills-panel"')
  })

  it('js/jarvis/skills.js exists', () => {
    expect(fs.existsSync(path.join(root, 'js', 'jarvis', 'skills.js'))).toBe(true)
  })
})
