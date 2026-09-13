import { describe, it, expect } from 'vitest'
import { hudContext, promptWithContext } from '../lib/hud-context.mjs'

describe('HUD context composer (server-verified JARVIS preamble)', () => {
  it('renders an honest empty preamble when every source is unreachable, with no undefined leaks', () => {
    const ctx = hudContext({ nodes: null, house: null, vault: null, agents: null, graph: null, config: {} })
    expect(ctx).toContain('sources unreachable')
    expect(ctx).not.toMatch(/undefined|\[object/)
  })

  it('summarizes per-node service state and names down services with their real reason', () => {
    const nodes = {
      nodes: [{
        name: 'Alienware', ip: '192.168.0.40', up: 1, total: 2,
        services: [
          { label: 'JARVIS HUD', port: 9150, up: true, state: 'UP', detail: 'identity ok', latencyMs: 3 },
          { label: 'Mission Control', port: 3151, up: false, state: 'DOWN', detail: 'timeout after 3000 ms' },
        ],
      }],
    }
    const ctx = hudContext({ nodes, config: {} })
    expect(ctx).toContain('Alienware (192.168.0.40): 1/2 up')
    expect(ctx).toContain('UP JARVIS HUD (:9150)')
    expect(ctx).toContain('DOWN Mission Control (:3151) — timeout after 3000 ms')
  })

  it('never reports WRONG SERVICE as up, but keeps the honest state word', () => {
    const nodes = { nodes: [{ name: 'S', ip: '10.0.0.1', up: 0, total: 1, services: [{ label: 'X', port: 1, up: false, state: 'WRONG SERVICE', detail: 'identity check failed' }] }] }
    const ctx = hudContext({ nodes, config: {} })
    expect(ctx).toContain('WRONG SERVICE X (:1)')
    expect(ctx).toMatch(/S \(10\.0\.0\.1\): 0\/1 up/)
  })

  it('includes vault notes, agent count, graph size; no Sabertooth mission-control line', () => {
    const ctx = hudContext({
      nodes: null,
      vault: { up: false, state: 'DOWN', detail: 'fetch failed' },
      agents: { count: 21, source: 'C:/skills' },
      graph: { notes: 44, links: 1 },
      config: { repo: 'C:/repo', vaultName: 'AlienwareDream', vaultPath: 'C:/v' },
    })
    expect(ctx).toContain('Vault AlienwareDream (C:/v): 44 notes, 1 wikilinks')
    expect(ctx).toContain('Obsidian REST DOWN — fetch failed')
    expect(ctx).toContain('21 skills loadable in C:/skills')
    expect(ctx).toContain('Repo: C:/repo')
    expect(ctx).not.toMatch(/192\.168\.0\.8:3151/)
  })

  it('reports the sentry house summary with a down-service list when present', () => {
    const house = { up: true, state: 'UP', services: [{ name: 'a', up: true }, { name: 'b', up: false }, { name: 'c', up: false }] }
    const ctx = hudContext({ house, config: {} })
    expect(ctx).toContain("Fable's Sentry: 1/3 up; down: b, c")
    const down = hudContext({ house: { up: false, state: 'DOWN', detail: 'HTTP 503' }, config: {} })
    expect(down).toContain("Fable's Sentry: DOWN — HTTP 503")
  })

  it('promptWithContext brackets the context, declares its provenance, and keeps the user prompt last', () => {
    const p = promptWithContext({ context: 'CTX', tab: 'graph', user: 'why is the graph empty?' })
    expect(p).toContain('[House context — server-verified')
    expect(p).toContain('CTX')
    expect(p).toContain('[/House context]')
    expect(p).toContain('Knowledge Graph')
    expect(p.trimEnd().endsWith('why is the graph empty?')).toBe(true)
    expect(p.indexOf('CTX')).toBeLessThan(p.indexOf('why is the graph empty?'))
  })
})
