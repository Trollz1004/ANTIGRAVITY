import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')

describe('JARVIS wiring — server.mjs MCP endpoint (Phase F, unit 4)', () => {
  const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf-8')

  it('imports lib/mcp-server.mjs', () => {
    expect(server).toContain("from './lib/mcp-server.mjs'")
  })

  it('wires POST /mcp using handleMcpRequest, gated on JARVIS_MCP_TOKEN', () => {
    expect(server).toContain("p === '/mcp' && req.method === 'POST'")
    expect(server).toContain('handleMcpRequest(')
    expect(server).toContain("envValue('JARVIS_MCP_TOKEN')")
  })

  it('exposes all six read-only deps: health, triggers, proposals, bridges, runbook, state record', () => {
    expect(server).toContain('getHealth:')
    expect(server).toContain('getTriggers:')
    expect(server).toContain('getProposals:')
    expect(server).toContain('getBridges:')
    expect(server).toContain('listRunbooks,')
    expect(server).toContain('listStateRecords, readStateRecord')
  })

  it('README documents the remote-Claude connect line', () => {
    const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf-8')
    expect(readme).toMatch(/claude mcp add --transport http jarvis/)
    expect(readme).toContain('JARVIS_MCP_TOKEN')
  })
})
