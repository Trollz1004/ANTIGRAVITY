import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')

describe('JARVIS wiring, server.mjs Board Room route (2026-09-29)', () => {
  const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf-8')

  it('imports the Board Room composer from lib/lanes.mjs', () => {
    expect(server).toContain("from './lib/lanes.mjs'")
    expect(server).toContain('composeBoardRoom')
  })

  it('wires GET /api/boardroom, redacted like every other route, answering an error instead of crashing', () => {
    expect(server).toContain("p === '/api/boardroom' && req.method === 'GET'")
    expect(server).toMatch(/redact\(await buildBoardRoom\(\)\)/)
    expect(server).toMatch(/send\(res, 502, \{ error: 'Board Room unavailable: '/)
  })

  it('feeds the composer the same bridge and fleet builders the other routes use, with no second set of probes', () => {
    expect(server).toContain('getBridges: () => buildBridges(BRIDGE_DEPS_LIVE)')
    expect(server).toContain('getFleet: buildFleetLive')
    // buildFleet is called in exactly one place; /api/fleet and the Board Room both go through it
    expect(server.match(/\bbuildFleet\(/g)).toHaveLength(1)
    expect(server).toMatch(/p === '\/api\/fleet'\) \{\s+const r = await buildFleetLive\(\)/)
  })

  it('reads the GitHub token only on the server, from the same env/.env reader as the other secrets', () => {
    expect(server).toContain("token: envValue('GITHUB_TOKEN')")
    expect(server.match(/GITHUB_TOKEN/g).length).toBeLessThanOrEqual(3) // header comment, the read, one comment
  })

  it('passes the configured wing link, the cloud address and the repo root the track records and TRUST.md files are checked under', () => {
    expect(server).toContain('wingUrl: EMERGENT_WING_URL')
    expect(server).toContain('cloudUrl: CLOUD_DASHBOARD_URL')
    expect(server).toContain('repoRoot: REPO')
  })

  it('is not a vote room: no vote payload is built in the server, the founder\'s ClawX board keeps it', () => {
    expect(server).not.toMatch(/vote: \{/)
    expect(server).toMatch(/nothing here votes/)
  })

  it('keeps the word the privacy guard reserves out of server.mjs (the lib owns the branch board)', () => {
    expect(server).not.toMatch(/drift/)
  })

  it('adds the three MCP deps beside the existing ones: the same Board Room builder, backup health, the house map', () => {
    expect(server).toContain('getBoardRoom: () => buildBoardRoom()')
    expect(server).toContain('getBackupHealth: () => readBackupHealth({ file: BACKUP_HEALTH_JSON_PATH })')
    expect(server).toMatch(/getHouseMap: \(\) => redact\(readHouseMap\(\)\)/)
    expect(server).toContain("join(REPO, '.agents', 'skills', 'ultracode-house', 'SKILL.md')")
    expect(server).toMatch(/NOT CONFIGURED: \.agents\/skills\/ultracode-house\/SKILL\.md is not on this node/)
    // still inside the handleMcpRequest deps object, next to the original six
    const mcp = server.slice(server.indexOf("p === '/mcp'"))
    for (const dep of ['getHealth:', 'getBridges:', 'listStateRecords, readStateRecord', 'getBoardRoom:', 'getBackupHealth:', 'getHouseMap:']) expect(mcp).toContain(dep)
  })

  it('the brief the affiliate block points at exists in this checkout', () => {
    expect(fs.existsSync(path.join(root, '..', 'ops', 'handoffs', 'PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md'))).toBe(true)
  })
})

describe('index.html, Board Room tab', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8')

  it('has a Board Room nav item right after Bridges, with a lucide svg and no emoji', () => {
    const m = /(<li class="nav-tab" data-tab="bridges">[\s\S]*?<\/li>)\s*(<li class="nav-tab" data-tab="boardroom">[\s\S]*?<\/li>)/.exec(html)
    expect(m).toBeTruthy()
    expect(m[2]).toContain('lucide-icon')
    expect(m[2]).toContain('<svg viewBox="0 0 24 24"')
    expect(m[2]).toContain('Board Room</li>')
    expect(m[2]).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u)
  })

  it('has the section with its header, the think tank description and five widget cards, the tracks first', () => {
    const section = /<section id="tab-boardroom" class="tab-content">[\s\S]*?<\/section>/.exec(html)
    expect(section).toBeTruthy()
    expect(section[0]).toContain('<h2>Board Room</h2>')
    expect(section[0]).toContain("The mission's think tank, the House of Representatives; the founder's ClawX board is the Supreme Court. Every AI lane has a seat, files its own trust record, and reviews the drift the others leave behind.")
    const ids = [...section[0].matchAll(/<div id="(boardroom-[a-z]+)">/g)].map((m) => m[1])
    expect(ids).toEqual(['boardroom-tracks', 'boardroom-lanes', 'boardroom-drift', 'boardroom-affiliate', 'boardroom-links'])
    expect(section[0].match(/class="widget-card"/g)).toHaveLength(5)
    expect(section[0]).toContain('<h3>Think tank tracks</h3>')
  })

  it('carries no vote link or button', () => {
    const section = /<section id="tab-boardroom" class="tab-content">[\s\S]*?<\/section>/.exec(html)[0]
    expect(section).not.toMatch(/<button|data-goto-tab|call the vote/i)
  })

  it('loads js/jarvis/boardroom.js as a module beside the others, and carries no key', () => {
    expect(html).toContain('<script type="module" src="js/jarvis/boardroom.js"></script>')
    expect(fs.existsSync(path.join(root, 'js', 'jarvis', 'boardroom.js'))).toBe(true)
    expect(html).not.toMatch(/GITHUB_TOKEN/)
  })

  it('css/jarvis.css colours the four drift statuses', () => {
    const css = fs.readFileSync(path.join(root, 'css', 'jarvis.css'), 'utf-8')
    for (const s of ['DEAD', 'STALE', 'LIVE', 'WORKING']) expect(css).toContain(`.drift-badge.drift-${s}`)
  })
})
