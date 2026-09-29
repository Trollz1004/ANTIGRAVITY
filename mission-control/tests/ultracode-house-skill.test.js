import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NODES, NODES_OFF, SERVICES } from '../lib/nodes.mjs'
import { BRIDGE_IDS } from '../lib/bridges.mjs'
import { HARNESSES } from '../lib/fleet.mjs'
import { MCP_TOOL_NAMES } from '../lib/mcp-server.mjs'
import { LANES, TRACKS } from '../lib/lanes.mjs'

// The one map must name what the registries name. Derived from the code, so a
// registry change that the skill does not follow fails here, not in a session.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const skillPath = path.join(root, '.agents', 'skills', 'ultracode-house', 'SKILL.md')
const skill = fs.readFileSync(skillPath, 'utf8')
const lines = skill.split(/\r?\n/)
const SECTIONS = ['## 1. Read first', '## 2. Nodes', '## 3. Dashboards', '## 4. Lanes', '## 5. MCP', '## 6. Brains and memory', '## 7. Journals', '## 8. Rulings digest', '## 9. Token savers', "## 10. Joshua's clicks still open"]

describe('ultracode-house skill: shape', () => {
  it('is ALWAYS LOAD, 240 lines or fewer, ten sections in order', () => {
    expect(skill).toMatch(/^description: "ALWAYS LOAD\./m)
    expect(lines.length).toBeLessThanOrEqual(240)
    const idx = SECTIONS.map((h) => lines.findIndex((l) => l.startsWith(h)))
    expect(idx.every((i) => i >= 0)).toBe(true)
    expect([...idx].sort((a, b) => a - b)).toEqual(idx)
  })
  it('carries no loopback name and no em dash', () => {
    expect(skill).not.toMatch(new RegExp('local' + 'host'))
    expect(skill).not.toContain(String.fromCharCode(0x2014))
  })
})

describe('ultracode-house skill: coverage of the registries', () => {
  it('names every node address and every OFF node', () => {
    for (const n of NODES) expect(skill, n.id).toContain(n.ip === 'internet' ? n.id : n.ip)
    for (const n of NODES_OFF) expect(skill, n.id).toContain(n.name.split(' (')[0])
  })
  it('names every SERVICES id with its port', () => {
    for (const s of SERVICES) expect(skill, s.id).toMatch(new RegExp(s.id.replace(/[-]/g, '[-]') + '\\s+' + s.port))
  })
  it('names every bridge id, every fleet harness, every lane, every track and every MCP tool', () => {
    for (const id of BRIDGE_IDS) expect(skill, id).toContain(id)
    for (const id of HARNESSES) expect(skill, id).toContain(id)
    for (const l of LANES) expect(skill, l.id).toContain(l.id)
    for (const t of TRACKS) expect(skill, t.id).toContain(t.name)
    for (const t of MCP_TOOL_NAMES) expect(skill, t).toContain('`' + t + '`')
  })
  it('names every journal directory on disk', () => {
    const dirs = fs.readdirSync(path.join(root, '.agents', 'journals'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
    expect(dirs.length).toBeGreaterThan(5)
    for (const d of dirs) expect(skill, d).toContain(d)
  })
})
