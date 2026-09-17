import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')

describe('JARVIS wiring — server.mjs Inbox routes (Phase C, unit 5)', () => {
  const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf-8')

  it('imports lib/inbox.mjs', () => {
    expect(server).toContain("from './lib/inbox.mjs'")
  })

  it('wires GET /api/inbox', () => {
    expect(server).toMatch(/p === '\/api\/inbox' && req\.method === 'GET'/)
    expect(server).toContain('buildInbox(')
  })

  it('wires POST /api/inbox/:id/{approve|reject|snooze}', () => {
    expect(server).toContain('api\\/inbox\\/([^/]+)\\/(approve|reject|snooze)')
    expect(server).toContain('performAction(')
  })

  it('reads the founder token from JARVIS_FOUNDER_TOKEN and the x-founder-token header', () => {
    expect(server).toContain("envValue('JARVIS_FOUNDER_TOKEN')")
    expect(server).toContain("req.headers['x-founder-token']")
  })

  it('redacts every inbox response before sending', () => {
    expect(server).toMatch(/send\(res, 200, redact\(buildInbox\(/)
    expect(server).toMatch(/send\(res, r\.status, redact\(r\.body\)\)/)
  })

  it('manual-handoff approval writes to ops/marketing-inbox/approved, syndication is never auto-posted', () => {
    expect(server).toContain("join(REPO, 'ops', 'marketing-inbox', 'approved')")
    expect(server).toMatch(/syndication auto-post not wired/)
  })
})
