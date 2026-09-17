import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')

describe('JARVIS wiring — server.mjs Social routes (Phase C, unit 4)', () => {
  const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf-8')

  it('imports the Phase C modules', () => {
    expect(server).toContain("from './lib/redact.mjs'")
    expect(server).toContain("from './lib/proposals.mjs'")
    expect(server).toContain("from './lib/compliance.mjs'")
    expect(server).toContain("from './lib/copy-score.mjs'")
    expect(server).toContain("from './lib/social-adapters.mjs'")
  })

  it('wires GET /api/social/platforms', () => {
    expect(server).toMatch(/p === '\/api\/social\/platforms'/)
    expect(server).toContain('listPlatforms(')
  })

  it('wires GET and POST /api/social/proposals, checking brand and running both checks', () => {
    expect(server).toMatch(/p === '\/api\/social\/proposals' && req\.method === 'GET'/)
    expect(server).toMatch(/p === '\/api\/social\/proposals' && req\.method === 'POST'/)
    expect(server).toContain('validateBrand(')
    expect(server).toContain('checkCompliance(')
    expect(server).toContain('scoreCopy(')
    expect(server).toContain('proposalStore.create(')
  })

  it('redacts the platforms and proposal-creation responses before sending', () => {
    expect(server).toMatch(/send\(res, 200, redact\(\{ platforms:/)
    expect(server).toMatch(/send\(res, 201, redact\(\{ proposal:/)
  })

  it('the proposal store is backed by data/proposals under this dashboard folder (gitignored)', () => {
    expect(server).toMatch(/createProposalStore\(\{ dir: join\(HERE, 'data', 'proposals'\) \}\)/)
  })
})
