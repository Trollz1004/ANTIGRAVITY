import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')
const clientMod = await import('../js/jarvis/inbox.js')

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

  it('index.html has the Inbox nav tab, panel, and header bell', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8')
    expect(html).toContain('data-tab="inbox"')
    expect(html).toContain('id="tab-inbox"')
    expect(html).toContain('id="jarvis-bell"')
    expect(html).toContain('id="jarvis-bell-count"')
    expect(html).toContain('id="jarvis-alerts-strip"')
  })
})

describe('js/jarvis/inbox.js — token storage (sessionStorage only, never localStorage)', () => {
  it('getToken/setToken degrade to empty/no-op without throwing when sessionStorage is unavailable', () => {
    expect(() => clientMod.setToken('abc')).not.toThrow()
    expect(typeof clientMod.getToken()).toBe('string')
  })

  it('never reads or writes localStorage for the founder token', () => {
    const src = fs.readFileSync(path.join(root, 'js', 'jarvis', 'inbox.js'), 'utf-8')
    expect(src).not.toMatch(/localStorage/)
  })
})

describe('js/jarvis/inbox.js — client render (pure functions, no DOM globals)', () => {
  it('renderItem shows actions only for an actionable, still-open item', () => {
    const proposed = clientMod.renderItem({ id: '1', source: 'social', kind: 'post', brand: 'DREAM Online', platform: 'reddit', title: 't', state: 'PROPOSED', checks: {} })
    expect(proposed).toContain('data-act="approve"')

    const executed = clientMod.renderItem({ id: '1', source: 'social', kind: 'post', title: 't', state: 'EXECUTED', checks: {} })
    expect(executed).not.toContain('data-act="approve"')

    const trigger = clientMod.renderItem({ id: 'tr1', source: 'trigger', kind: 'quota', title: 'quota low', state: 'PROPOSED', checks: {} })
    expect(trigger).not.toContain('data-act="approve"') // not proposal-store-backed, never a button that would just 404

    const sale = clientMod.renderItem({ id: 'sale-inbound-pending', source: 'sale', kind: 'inbound-email', title: 'Sale inbox — SOURCE: PENDING', state: 'PENDING', checks: {} })
    expect(sale).toContain('SOURCE: PENDING')
    expect(sale).not.toContain('data-act="approve"')
  })

  it('renderInbox is honest about zero open items', () => {
    const el = { innerHTML: '' }
    clientMod.renderInbox(el, { items: [] })
    expect(el.innerHTML).toContain('Nothing open')
  })

  it('renderBell shows/hides the unread count', () => {
    global.document = { getElementById: (id) => (id === 'jarvis-bell-count' ? badge : null) }
    const badge = { hidden: false, textContent: '' }
    clientMod.renderBell(3)
    expect(badge.hidden).toBe(false)
    expect(badge.textContent).toBe('3')
    clientMod.renderBell(0)
    expect(badge.hidden).toBe(true)
    delete global.document
  })

  it('renderAlertsStrip shows RED before a trigger, and hides when neither is present', () => {
    const strip = { hidden: true, textContent: '' }
    global.document = { getElementById: () => strip }
    clientMod.renderAlertsStrip({ items: [{ source: 'health', title: 'Sabretooth heartbeat is RED' }] })
    expect(strip.hidden).toBe(false)
    expect(strip.textContent).toContain('RED')

    clientMod.renderAlertsStrip({ items: [{ source: 'trigger', title: 'quota low' }] })
    expect(strip.hidden).toBe(false)
    expect(strip.textContent).toContain('Trigger open')

    clientMod.renderAlertsStrip({ items: [{ source: 'sale' }] })
    expect(strip.hidden).toBe(true)
    delete global.document
  })
})
