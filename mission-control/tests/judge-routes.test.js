import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')

describe('JARVIS wiring — server.mjs Judge Lanes routes (Phase D, unit 1)', () => {
  const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf-8')

  it('imports lib/judge.mjs', () => {
    expect(server).toContain("from './lib/judge.mjs'")
  })

  it('wires POST /api/judge/reviews using createReviewProposal', () => {
    expect(server).toContain("p === '/api/judge/reviews' && req.method === 'POST'")
    expect(server).toContain('createReviewProposal(')
  })

  it('wires GET /api/judge/feed using buildJudgeFeed', () => {
    expect(server).toContain("p === '/api/judge/feed' && req.method === 'GET'")
    expect(server).toContain('buildJudgeFeed(')
  })

  it('wires POST /api/judge/:id/verdict, reading x-judge-token and both lane tokens', () => {
    expect(server).toContain('api\\/judge\\/([^/]+)\\/verdict')
    expect(server).toContain('postVerdict(')
    expect(server).toContain("req.headers['x-judge-token']")
    expect(server).toContain("envValue('JARVIS_JUDGE_TOKEN_CLAUDE')")
    expect(server).toContain("envValue('JARVIS_JUDGE_TOKEN_CODEX')")
  })

  it('redacts every judge route response', () => {
    expect(server).toMatch(/redact\(r\.body\)/)
    expect(server).toMatch(/redact\(buildJudgeFeed\(/)
  })

  it('index.html has a Judge Lanes tab, feed, and two verdict columns', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8')
    expect(html).toContain('data-tab="judge"')
    expect(html).toContain('id="tab-judge"')
    expect(html).toContain('id="judge-feed"')
  })

  it('js/jarvis/judge.js exists and never touches localStorage for the judge token', () => {
    const src = fs.readFileSync(path.join(root, 'js', 'jarvis', 'judge.js'), 'utf-8')
    expect(src).not.toMatch(/localStorage/)
  })
})
