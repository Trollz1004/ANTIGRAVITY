import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const NOW = Date.parse('2026-09-29T12:00:00Z')
const daysAgo = (n) => new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString()

const byId = {}
let tabHandlers
beforeEach(() => {
  for (const id of ['boardroom-tracks', 'boardroom-lanes', 'boardroom-drift', 'boardroom-affiliate', 'boardroom-links']) byId[id] = { innerHTML: '' }
  tabHandlers = {}
  const tabs = ['bridges', 'boardroom', 'board'].map((name) => ({ dataset: { tab: name }, addEventListener: (ev, fn) => { if (ev === 'click') tabHandlers[name] = fn } }))
  global.document = {
    getElementById: (id) => byId[id] || null,
    querySelectorAll: (sel) => (sel === '.nav-tab' ? tabs : []),
    querySelector: () => null,
    addEventListener: vi.fn(),
  }
})

async function load() {
  return await import('../js/jarvis/boardroom.js')
}

const lane = (o) => ({
  id: 'claude', name: 'Claude Code', role: 'judge lane', connects: 'official CLI', node: ['sabretooth', 'alienware', 'cloud'],
  status: 'UP', detail: '2.1.275 (Claude Code)', source: 'bridge', bridge: { id: 'claude', status: 'UP', identity: '2.1.275 (Claude Code)' }, fleet: null,
  journal: '.agents/journals/claude-judge/STATE.md', note: 'Official signed-in Claude CLI.', ...o,
})

describe('boardroom client, think tank tracks', () => {
  const tracks = [
    { id: 'mission', name: '#UntilNoKidInNeed', kind: 'mission', lead: 'joshua', record: 'domains/untilnokidinneed.com/dao/index.html', recordExists: true, status: 'ON RECORD' },
    { id: 'marketing', name: 'Marketing collab', kind: 'collab', lead: 'emergent', record: 'ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md', recordExists: false, status: 'NOT CONFIGURED', detail: 'no record on disk yet' },
    { id: 'education', name: 'Education collab', kind: 'collab', lead: null, record: null, recordExists: false, status: 'NOT CONFIGURED', detail: 'no record on disk yet' },
  ]

  it('renders one row per track under a header, with kind, lead, status and the record', async () => {
    const { renderTracks } = await load()
    const el = { innerHTML: '' }
    renderTracks(el, tracks)
    expect(el.innerHTML).toContain('mission-head')
    expect(el.innerHTML).toContain('data-track-id="mission"')
    expect(el.innerHTML).toContain('#UntilNoKidInNeed')
    expect(el.innerHTML).toContain('>collab<')
    expect(el.innerHTML).toContain('>joshua<')
    expect(el.innerHTML).toContain('domains/untilnokidinneed.com/dao/index.html')
    expect((el.innerHTML.match(/class="mission-row boardroom-track"/g) || [])).toHaveLength(3)
  })

  it('ON RECORD gets a green dot; a track with no record on disk is NOT CONFIGURED with a neutral dot and says so', async () => {
    const { renderTrackRow } = await load()
    const on = renderTrackRow(tracks[0])
    expect(on).toContain('<span class="dot ok"></span>')
    expect(on).toContain('>ON RECORD<')
    const missing = renderTrackRow(tracks[1])
    expect(missing).toContain('<span class="dot "></span>')
    expect(missing).toContain('>NOT CONFIGURED<')
    expect(missing).toContain('no record on disk yet (ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md)')
    expect(missing).not.toContain('dot ok')
  })

  it('invents nothing for a track with no lead and no record', async () => {
    const { renderTrackRow } = await load()
    const html = renderTrackRow(tracks[2])
    expect(html).toContain('no lead named')
    expect(html).toContain('no record on disk yet')
    expect(html).not.toMatch(/\(null\)|undefined/)
  })

  it('escapes HTML, and shows a placeholder with no tracks', async () => {
    const { renderTrackRow, renderTracks } = await load()
    expect(renderTrackRow({ ...tracks[0], name: '<script>x</script>' })).not.toContain('<script>')
    const el = { innerHTML: '' }
    renderTracks(el, [])
    expect(el.innerHTML).toContain('No tracks')
  })
})

describe('boardroom client, trust column', () => {
  it('shows FILED with the date for a lane that filed its own TRUST.md, and NOT FILED for one that has not', async () => {
    const { renderLanes } = await load()
    const el = { innerHTML: '' }
    renderLanes(el, [lane({}), lane({ id: 'codex', name: 'Codex' })], [
      { lane: 'claude', status: 'FILED', at: '2026-09-30T08:15:00.000Z', lines: 42 },
      { lane: 'codex', status: 'NOT FILED' },
    ])
    expect(el.innerHTML).toContain('<span>Trust</span>')
    expect(el.innerHTML).toContain('>FILED 2026-09-30<')
    expect(el.innerHTML).toContain('42 line(s), file modified 2026-09-30T08:15:00.000Z')
    expect(el.innerHTML).toContain('>NOT FILED<')
  })

  it('carries the header note: each seat files its own TRUST.md, nobody files for another', async () => {
    const { renderLanes } = await load()
    const el = { innerHTML: '' }
    renderLanes(el, [lane({})], [])
    expect(el.innerHTML).toContain('Each seat files its own TRUST.md; nobody files for another.')
  })

  it('a lane the response has no attestation for says unknown, never a guessed filed', async () => {
    const { trustCell } = await load()
    expect(trustCell(undefined).text).toBe('unknown')
    expect(trustCell({ lane: 'x', status: 'NOT FILED', detail: 'TRUST.md is empty' })).toMatchObject({ text: 'NOT FILED', title: 'TRUST.md is empty' })
    expect(trustCell({ lane: 'x', status: 'FILED', at: '2026-09-30T00:00:00Z', lines: 3 }).cls).toBe('ok')
  })
})

describe('boardroom client, lanes', () => {
  it('maps status to a dot: green UP, red DOWN and failing states, neutral LINKED / NOT CONFIGURED', async () => {
    const { laneDotClass } = await load()
    expect(laneDotClass('UP')).toBe('ok')
    expect(laneDotClass('DOWN')).toBe('down')
    expect(laneDotClass('AUTH MISSING')).toBe('down')
    expect(laneDotClass('LINKED')).toBe('')
    expect(laneDotClass('NOT CONFIGURED')).toBe('')
  })

  it('renders a mission-row per lane with name, role, connects, node, status and detail, under a header row', async () => {
    const { renderLanes } = await load()
    const el = { innerHTML: '' }
    renderLanes(el, [lane({}), lane({ id: 'openclaw', name: 'OpenClaw', role: 'API lane on the Pi', connects: 'API', node: ['pi'], status: 'DOWN', detail: 'no OpenClaw marker in response' })])
    expect(el.innerHTML).toContain('mission-head')
    expect(el.innerHTML).toContain('data-lane-id="claude"')
    expect(el.innerHTML).toContain('Claude Code')
    expect(el.innerHTML).toContain('judge lane')
    expect(el.innerHTML).toContain('official CLI')
    expect(el.innerHTML).toContain('sabretooth + alienware + cloud')
    expect(el.innerHTML).toContain('<span class="dot ok"></span>')
    expect(el.innerHTML).toContain('<span class="dot down"></span>')
    expect(el.innerHTML).toContain('no OpenClaw marker in response')
    expect((el.innerHTML.match(/class="mission-row boardroom-lane"/g) || [])).toHaveLength(2)
  })

  it('a LINKED hosted lane gets a new-tab link and a neutral dot, never green', async () => {
    const { renderLaneRow } = await load()
    const html = renderLaneRow(lane({ id: 'emergent', name: 'Emergent wing', status: 'LINKED', detail: 'Emergent wing chat', bridge: { id: 'emergent', status: 'LINKED', identity: 'x', url: 'https://app.emergent.sh/wing?wm=x' } }))
    expect(html).toContain('href="https://app.emergent.sh/wing?wm=x"')
    expect(html).toContain('target="_blank" rel="noopener"')
    expect(html).toContain('<span class="dot "></span>')
    expect(html).not.toContain('dot ok')
  })

  it('never links a url that is not https', async () => {
    const { renderLaneRow } = await load()
    const html = renderLaneRow(lane({ bridge: { id: 'x', status: 'LINKED', identity: 'x', url: 'javascript:alert(1)' } }))
    expect(html).not.toContain('href=')
  })

  it('shows the fleet journal line and queue when a fleet row exists, the journal path when it does not, and says so when there is none', async () => {
    const { renderLaneRow } = await load()
    expect(renderLaneRow(lane({ fleet: { status: 'UP', currentTask: 'shipped the thing', queueDepth: 2 } }))).toContain('shipped the thing (queue 2)')
    expect(renderLaneRow(lane({ fleet: { status: 'UP', currentTask: null, queueDepth: 0 } }))).toContain('no did: line (queue 0)')
    expect(renderLaneRow(lane({}))).toContain('.agents/journals/claude-judge/STATE.md')
    expect(renderLaneRow(lane({ journal: undefined }))).toContain('no journal named')
  })

  it('escapes HTML from every field', async () => {
    const { renderLaneRow } = await load()
    const html = renderLaneRow(lane({ name: '<b>x</b>', detail: '<script>alert(1)</script>', note: '"quoted"' }))
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<b>x</b>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&quot;quoted&quot;')
  })

  it('shows a placeholder with no lanes', async () => {
    const { renderLanes } = await load()
    const el = { innerHTML: '' }
    renderLanes(el, [])
    expect(el.innerHTML).toContain('No lanes')
  })
})

describe('boardroom client, drift', () => {
  const repoEntry = (o) => ({
    repo: 'Trollz1004/ANTIGRAVITY', default: 'main', fetchedAt: '2026-09-29T12:00:00.000Z', skipped: [], truncated: false,
    branches: [
      { name: 'claude/merged', lane: 'claude', status: 'DEAD', aheadBy: 0, behindBy: 12, lastCommitAt: null, pr: null },
      { name: 'codex/open', lane: 'codex', status: 'LIVE', aheadBy: 2, behindBy: 1, lastCommitAt: daysAgo(3), pr: { number: 41, title: 'Open the thing', url: 'https://github.com/Trollz1004/ANTIGRAVITY/pull/41' } },
      { name: 'hermes/old', lane: 'hermes', status: 'STALE', aheadBy: 1, behindBy: 40, lastCommitAt: daysAgo(30), pr: null },
      { name: 'opencode/now', lane: 'opencode', status: 'WORKING', aheadBy: 3, behindBy: 0, lastCommitAt: daysAgo(1), pr: null },
    ],
    badges: { claude: { dead: 1, stale: 0, live: 0, working: 0 }, codex: { dead: 0, stale: 0, live: 1, working: 0 } },
    ...o,
  })

  it('ageDays counts whole days and is null without a readable date', async () => {
    const { ageDays } = await load()
    expect(ageDays(daysAgo(3), NOW)).toBe(3)
    expect(ageDays(new Date(NOW - 5 * 60 * 60 * 1000).toISOString(), NOW)).toBe(0)
    expect(ageDays(null, NOW)).toBeNull()
    expect(ageDays('not a date', NOW)).toBeNull()
  })

  it('renders one table per repo: branch, lane, coloured status badge, ahead/behind, age in days, pull request link', async () => {
    const { renderDrift } = await load()
    const el = { innerHTML: '' }
    renderDrift(el, [repoEntry()], NOW)
    const h = el.innerHTML
    expect(h).toContain('Trollz1004/ANTIGRAVITY')
    expect(h).toContain('<th>Branch</th>')
    expect(h).toContain('class="drift-badge drift-DEAD">DEAD')
    expect(h).toContain('class="drift-badge drift-LIVE">LIVE')
    expect(h).toContain('class="drift-badge drift-STALE">STALE')
    expect(h).toContain('class="drift-badge drift-WORKING">WORKING')
    expect(h).toContain('<td>2 / 1</td>')
    expect(h).toContain('<td>30</td>')
    expect(h).toContain('href="https://github.com/Trollz1004/ANTIGRAVITY/pull/41"')
    expect(h).toContain('#41 Open the thing')
    expect(h).toContain('rel="noopener"')
    expect(h).toContain('<td>none</td>')
  })

  it('a DEAD branch shows n/a for its age, and an unreadable date on any other branch shows unknown', async () => {
    const { renderBranchRow } = await load()
    expect(renderBranchRow({ name: 'a', lane: 'claude', status: 'DEAD', aheadBy: 0, behindBy: 1, lastCommitAt: null, pr: null }, NOW)).toContain('n/a')
    expect(renderBranchRow({ name: 'b', lane: 'claude', status: 'WORKING', aheadBy: 1, behindBy: 1, lastCommitAt: null, pr: null }, NOW)).toContain('unknown')
  })

  it('prints a one-line drift badges strip per repo, one entry per lane', async () => {
    const { renderDrift, driftBadgeLine } = await load()
    const el = { innerHTML: '' }
    renderDrift(el, [repoEntry()], NOW)
    expect(el.innerHTML).toContain('claude: 1 dead, 0 stale, 0 live, 0 working')
    expect(el.innerHTML).toContain('codex: 0 dead, 0 stale, 1 live, 0 working')
    expect(driftBadgeLine({})).toContain('No branches other than main')
  })

  it('with no GitHub token it shows that sentence and nothing else', async () => {
    const { renderDrift } = await load()
    const el = { innerHTML: '' }
    const detail = 'GITHUB_TOKEN not set; the drift board reads GitHub through the server and never from the page'
    renderDrift(el, { status: 'NOT CONFIGURED', detail }, NOW)
    expect(el.innerHTML).toBe(`<p class="placeholder">${detail}</p>`)
    expect(el.innerHTML).not.toContain('<table')
    expect(el.innerHTML).not.toContain('Drift badges')
  })

  it('a repo GitHub could not read shows DOWN with the reason and no rows', async () => {
    const { renderDrift } = await load()
    const el = { innerHTML: '' }
    renderDrift(el, [{ repo: 'Trollz1004/dream-online', status: 'DOWN', detail: 'GitHub HTTP 403 for /repos/Trollz1004/dream-online/branches: API rate limit exceeded' }, repoEntry()], NOW)
    expect(el.innerHTML).toContain('drift-badge drift-DOWN">DOWN')
    expect(el.innerHTML).toContain('API rate limit exceeded')
    expect((el.innerHTML.match(/<table/g) || [])).toHaveLength(1) // only the healthy repo has a table
  })

  it('names skipped branches and a truncated page, so nothing is silently missing', async () => {
    const { renderDrift } = await load()
    const el = { innerHTML: '' }
    renderDrift(el, [repoEntry({ skipped: [{ name: 'gh-pages', detail: 'GitHub HTTP 404' }], truncated: true })], NOW)
    expect(el.innerHTML).toContain('Not compared: gh-pages (GitHub HTTP 404)')
    expect(el.innerHTML).toContain('there may be more than are shown')
  })

  it('escapes branch names and pull request titles, and never links a non-https pull request', async () => {
    const { renderBranchRow } = await load()
    const html = renderBranchRow({ name: '<img src=x onerror=1>', lane: 'claude', status: 'LIVE', aheadBy: 1, behindBy: 0, lastCommitAt: daysAgo(1), pr: { number: 9, title: '<script>x</script>', url: 'http://evil.example/' } }, NOW)
    expect(html).not.toContain('<img')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('href=')
  })

  it('a status the page does not know cannot inject a class', async () => {
    const { renderBranchRow } = await load()
    expect(renderBranchRow({ name: 'a', lane: 'x', status: 'x" onmouseover="1', aheadBy: 1, behindBy: 0, lastCommitAt: null, pr: null }, NOW)).toContain('drift-UNKNOWN')
  })

  it('shows placeholders for an empty list and for a missing payload', async () => {
    const { renderDrift } = await load()
    const el = { innerHTML: '' }
    renderDrift(el, [])
    expect(el.innerHTML).toContain('No repositories')
    renderDrift(el, undefined)
    expect(el.innerHTML).toContain('No drift data')
  })
})

describe('boardroom client, affiliate and links', () => {
  const affiliate = { wing: 'https://app.emergent.sh/wing?wm=x', brief: 'ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md', briefExists: true, terms: 'Founding Member $14.99/mo, 3 months $39.99, 12 months $99.99; up to 50% of net, lifetime of the referred subscription' }

  it('renders the wing link (new tab, noopener), the brief path and the terms line', async () => {
    const { renderAffiliate } = await load()
    const el = { innerHTML: '' }
    renderAffiliate(el, affiliate)
    expect(el.innerHTML).toContain('href="https://app.emergent.sh/wing?wm=x" target="_blank" rel="noopener"')
    expect(el.innerHTML).toContain('ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md')
    expect(el.innerHTML).toContain('(on disk)')
    expect(el.innerHTML).toContain('up to 50% of net, lifetime of the referred subscription')
  })

  it('says so when the brief file is missing or the wing link is not configured', async () => {
    const { renderAffiliate } = await load()
    const el = { innerHTML: '' }
    renderAffiliate(el, { ...affiliate, briefExists: false, wing: '' })
    expect(el.innerHTML).toContain('(not found in this checkout)')
    expect(el.innerHTML).toContain('NOT CONFIGURED')
    expect(el.innerHTML).not.toContain('href="https://app.emergent')
    renderAffiliate(el, undefined)
    expect(el.innerHTML).toContain('No affiliate data')
  })

  it('renders the cloud dashboard link and the cockpit link, and no vote control', async () => {
    const { renderLinks } = await load()
    const el = { innerHTML: '' }
    renderLinks(el, { cloud: 'https://dashboard.aidoesitall.website/', founderBoard: { tab: 'board', note: "the founder's ClawX board is the Supreme Court; votes stay there, never here. This room is the House. Claude and Codex validate the code's security first, then the rabbit gets to debate (Joshua, 2026-09-29)" } })
    expect(el.innerHTML).toContain('href="https://dashboard.aidoesitall.website/" target="_blank" rel="noopener"')
    expect(el.innerHTML).toContain('href="/cockpit/"')
    expect(el.innerHTML).not.toMatch(/<button|data-goto-tab|vote/i)
  })

  it('a cloud address that is not https is not linked', async () => {
    const { renderLinks } = await load()
    const el = { innerHTML: '' }
    renderLinks(el, { cloud: 'http://dashboard.example/' })
    expect(el.innerHTML).toContain('NOT CONFIGURED')
    expect(el.innerHTML).not.toContain('http://dashboard.example/')
  })
})

describe('boardroom client, loading', () => {
  const payload = {
    tracks: [{ id: 'mission', name: '#UntilNoKidInNeed', kind: 'mission', lead: 'joshua', record: 'domains/untilnokidinneed.com/dao/index.html', recordExists: true, status: 'ON RECORD' }],
    lanes: [lane({})],
    attestations: [{ lane: 'claude', status: 'FILED', at: '2026-09-30T08:15:00.000Z', lines: 42 }],
    drift: { status: 'NOT CONFIGURED', detail: 'GITHUB_TOKEN not set; the drift board reads GitHub through the server and never from the page' },
    affiliate: { wing: 'https://app.emergent.sh/wing?wm=x', brief: 'ops/handoffs/x.md', briefExists: false, terms: 't' },
    founderBoard: { tab: 'board', note: "the founder's ClawX board is the Supreme Court; votes stay there, never here. This room is the House. Claude and Codex validate the code's security first, then the rabbit gets to debate (Joshua, 2026-09-29)" }, cloud: 'https://dashboard.aidoesitall.website/', at: '2026-09-29T12:00:00.000Z',
  }

  it('fetches the relative route and fills every card', async () => {
    const { loadBoardRoom } = await load()
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => payload }))
    expect(await loadBoardRoom(fetchImpl)).toBe(true)
    expect(fetchImpl.mock.calls[0][0]).toBe('/api/boardroom')
    expect(byId['boardroom-tracks'].innerHTML).toContain('#UntilNoKidInNeed')
    expect(byId['boardroom-lanes'].innerHTML).toContain('Claude Code')
    expect(byId['boardroom-lanes'].innerHTML).toContain('FILED 2026-09-30')
    expect(byId['boardroom-drift'].innerHTML).toContain('GITHUB_TOKEN not set')
    expect(byId['boardroom-affiliate'].innerHTML).toContain('Emergent wing chat')
    expect(byId['boardroom-links'].innerHTML).toContain('Cloud dashboard')
  })

  it('shows an honest error in every card when the fetch fails', async () => {
    const { loadBoardRoom } = await load()
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 502, json: async () => ({ error: 'boom' }) }))
    expect(await loadBoardRoom(fetchImpl)).toBe(false)
    for (const id of Object.keys(byId)) expect(byId[id].innerHTML).toContain('Board Room unavailable: boom')
  })

  it('loads lazily: only the first click of the Board Room tab fetches, other tabs never do', async () => {
    const { initBoardroom } = await load()
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => payload }))
    initBoardroom()
    tabHandlers.bridges()
    expect(global.fetch).not.toHaveBeenCalled()
    tabHandlers.boardroom()
    tabHandlers.boardroom()
    await new Promise((r) => setTimeout(r, 0))
    tabHandlers.boardroom()
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch.mock.calls[0][0]).toBe('/api/boardroom')
  })

  it('a failed first load can be retried by clicking the tab again', async () => {
    const { initBoardroom } = await load()
    global.fetch = vi.fn(async () => ({ ok: false, status: 500, json: async () => ({ error: 'down' }) }))
    initBoardroom()
    tabHandlers.boardroom()
    await new Promise((r) => setTimeout(r, 0))
    tabHandlers.boardroom()
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})

describe('boardroom client, source', () => {
  const src = fs.readFileSync(path.join(root, 'js', 'jarvis', 'boardroom.js'), 'utf8')
  it('holds no key and reads GitHub only through the server: one relative route, no api host, no token', () => {
    expect(src).not.toMatch(/GITHUB_TOKEN|Authorization|Bearer|api\.github\.com/)
    expect(src).toContain("'/api/boardroom'")
    expect(src).not.toMatch(/fetch\(\s*['"`]https?:/)
  })
  it('has no vote control and no tab-switch hook: the founder\'s ClawX board is the vote', () => {
    expect(src).not.toMatch(/data-goto-tab|gotoTab|Call the vote|<button/)
  })
  it('carries no em dash', () => {
    expect(src).not.toMatch(/\u2014/)
  })
})
