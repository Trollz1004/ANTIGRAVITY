import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')

describe('JARVIS wiring — server.mjs Bridges routes (Phase F, unit 1)', () => {
  const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf-8')

  it('imports lib/bridges.mjs', () => {
    expect(server).toContain("from './lib/bridges.mjs'")
  })

  it('wires GET /api/bridges using buildBridges', () => {
    expect(server).toContain("p === '/api/bridges' && req.method === 'GET'")
    expect(server).toContain('buildBridges(')
  })

  it('wires GET /api/bridges/:id using findBridge', () => {
    expect(server).toContain('api\\/bridges\\/([^/]+)$')
    expect(server).toContain('findBridge(')
  })

  it('wires POST /api/bridges/:id/run creating a bridge.run proposal, never executing directly', () => {
    expect(server).toContain('api\\/bridges\\/([^/]+)\\/run$')
    expect(server).toContain('createBridgeRunProposal(')
  })

  it('wires POST /api/ask, running the agentic loop for omniroute and everything else through a proposal', () => {
    expect(server).toContain("p === '/api/ask' && req.method === 'POST'")
    expect(server).toContain('runAskAgent(')
  })

  it('wires GET /api/ask/models, the agentic-only model picker (specs/009)', () => {
    expect(server).toContain("p === '/api/ask/models' && req.method === 'GET'")
    expect(server).toContain('refreshAskModels(')
  })

  it('a bridge.run proposal is only executed after founder approve, via executeBridgeRun', () => {
    expect(server).toContain('executeBridgeRun(')
    expect(server).toContain('bridgeAdapters: bridgeExecutorAdapters')
  })

  it('redacts every bridges route response', () => {
    expect(server).toMatch(/redact\(r\)\)/)
  })

  it('index.html has a Bridges tab with a status panel and a run box', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8')
    expect(html).toContain('data-tab="bridges"')
    expect(html).toContain('id="tab-bridges"')
    expect(html).toContain('id="bridges-panel"')
    expect(html).toContain('id="bridges-run-select"')
  })

  it('js/jarvis/bridges.js exists', () => {
    expect(fs.existsSync(path.join(root, 'js', 'jarvis', 'bridges.js'))).toBe(true)
  })
})
