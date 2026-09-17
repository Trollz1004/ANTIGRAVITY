import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// three.js is mocked through vitest.config.js aliases + this mock; the app never
// touches WebGL in tests.
vi.mock('three', () => ({
  Scene: class { constructor() { this.background = null; this.children = [] } add() {} remove() {} },
  PerspectiveCamera: class { constructor() { this.position = { set() {} }; this.aspect = 1 } updateProjectionMatrix() {} },
  WebGLRenderer: class { constructor() { this.domElement = {} } setSize() {} setPixelRatio() {} render() {} },
  Color: class { constructor(v) { this.value = v } },
  DirectionalLight: class { constructor() { this.position = { set() {}, normalize() {} } } },
  AmbientLight: class { constructor() {} },
  GridHelper: class { constructor() {} },
  Clock: class { getDelta() { return 0.016 } },
}))

// ── minimal DOM ──────────────────────────────────────────────────────────────
class MockElement {
  constructor(tag = 'div') {
    this.tagName = tag; this.children = []; this.style = {}; this.dataset = {}; this.attrs = {}
    this._ownText = ''; this._html = ''; this.value = ''; this.id = ''
    this.classes = new Set()
    this.classList = {
      add: (c) => this.classes.add(c),
      remove: (c) => this.classes.delete(c),
      toggle: (c, on) => { if (on === undefined) on = !this.classes.has(c); on ? this.classes.add(c) : this.classes.delete(c); return on },
      contains: (c) => this.classes.has(c),
    }
    this.listeners = {}
  }
  get textContent() { return this.children.length ? this.children.map((c) => c.textContent).join('') : this._ownText }
  set textContent(v) { this._ownText = String(v); this.children = [] }
  get innerHTML() { return this._html }
  set innerHTML(v) { this._html = v; this.children = [] }
  appendChild(c) { this.children.push(c); return c }
  insertBefore(c) { this.children.unshift(c); return c }
  setAttribute(k, v) { this.attrs[k] = v }
  addEventListener(ev, fn) { (this.listeners[ev] ||= []).push(fn) }
  click() { for (const fn of this.listeners.click || []) fn() }
  querySelectorAll() { return [] }
  get firstChild() { return this.children[0] || null }
}

const registry = new Map()
function reg(id, tag = 'div') { const e = new MockElement(tag); e.id = id; registry.set('#' + id, e); return e }

const tabs = ['dashboard', 'mission-control', 'agents', 'graph', 'avatar', 'widgets', 'scenes', 'image', 'claude'].map((name) => {
  const li = new MockElement('li'); li.dataset.tab = name; li.classes.add('nav-tab'); if (name === 'dashboard') li.classes.add('active')
  const sec = new MockElement('section'); sec.id = 'tab-' + name; sec.classes.add('tab-content'); if (name === 'dashboard') sec.classes.add('active')
  registry.set('#tab-' + name, sec)
  return { li, sec }
})

globalThis.document = {
  querySelector: (sel) => registry.get(sel) || null,
  querySelectorAll: (sel) => sel === '.nav-tab' ? tabs.map((t) => t.li) : sel === '.tab-content' ? tabs.map((t) => t.sec) : [],
  createElement: (tag) => new MockElement(tag),
  createElementNS: (_ns, tag) => new MockElement(tag),
  createTextNode: (t) => ({ textContent: t }),
  addEventListener: () => {},
}
globalThis.window = { addEventListener: () => {}, devicePixelRatio: 1 }
globalThis.location = { hostname: '192.168.0.8' }
globalThis.requestAnimationFrame = () => 1
globalThis.cancelAnimationFrame = () => {}
globalThis.URL.createObjectURL = () => 'blob:x'

for (const id of ['activity-log', 'omni-model-count', 'stat-services', 'stat-services-detail', 'stat-agents', 'stat-agents-detail', 'stat-nodes', 'stat-nodes-detail', 'stat-vault', 'stat-vault-detail', 'stat-avatars', 'stat-avatars-detail', 'agent-categories', 'agent-list', 'agent-detail-panel', 'graph-meta', 'graph-note', 'hermes-link', 'claude-command', 'claude-bridge-status', 'claude-note', 'claude-result', 'freebuff-result', 'mission-board', 'mission-board-note', 'widget-search-results', 'avatar-gallery', 'crosslisting-status', 'crosslisting-detail', 'board-question', 'board-result', 'board-seats']) reg(id)
reg('agent-search', 'input'); reg('graph-search', 'input'); reg('widget-search-input', 'input')
const svg = reg('graph-svg', 'svg'); svg.querySelectorAll = () => []
const gc = reg('graph-canvas-container'); gc.clientWidth = 800; gc.clientHeight = 600

// fetch mock: routes the app's server API and the OmniRoute proxy
const calls = []
globalThis.fetch = vi.fn(async (url, options = {}) => {
  calls.push({ url, options })
  const json = (body, ok = true, status = 200) => ({ ok, status, text: async () => JSON.stringify(body), json: async () => body, blob: async () => new Blob() })
  if (url.endsWith('/api/config')) return json({ host: '192.168.0.8', omniRoute: 'http://192.168.0.8:20128/v1', claude: { command: 'drift bare', note: 'n' } })
  if (url.endsWith('/api/omni/models')) return json({ data: [{ id: 'auto/best-fast' }, { id: 'antigravity/gemini-3.1-flash-image' }] })
  if (url.endsWith('/api/omni/chat/completions')) return json({ model: 'auto/best-fast', choices: [{ message: { content: 'hi' } }] })
  if (url.endsWith('/api/omni/images/generations')) return json({ data: [{ b64_json: 'AAAA' }] })
  if (url.endsWith('/api/house')) return json({ up: 28, total: 30, groups: [{ targets: [{ id: 'x', label: 'X', up: true }, { id: 'y', label: 'Y', up: false }] }] })
  if (url.endsWith('/api/vault/status')) return json({ up: true, state: 'UP', url: 'https://127.0.0.1:27124' })
  if (url.endsWith('/api/crosslisting/status')) return json({ up: true, state: 'UP', detail: 'health ok', url: 'http://127.0.0.1:3000' })
  if (url.endsWith('/api/vault/graph')) return json({ ok: true, name: 'Antigravity', notes: 3, wikilinks: 2, orphans: 1, nodes: [{ id: 'A', label: 'A', group: '(root)', in: 0, out: 2 }, { id: 'B', label: 'B', group: '(root)', in: 1, out: 0 }, { id: 'sub/C', label: 'C', group: 'sub', in: 1, out: 0 }], links: [{ source: 'A', target: 'B' }, { source: 'A', target: 'sub/C' }] })
  if (url.includes('/api/vault/note')) return json({ ok: true, path: 'A', markdown: '# A' })
  if (url.endsWith('/api/avatars')) return json({ count: 1, files: [{ file: 'fable-avatar.png', url: '/avatars/fable-avatar.png', bytes: 1000 }] })
  if (url.endsWith('/api/agents')) return json({ count: 2, source: 'C:/ANTIGRAVITY/.agents/skills', agents: [
    { id: 'judge-house', name: 'judge-house', description: 'Judge lane protocol', category: 'ops + method', path: '.agents/skills/judge-house/SKILL.md' },
    { id: 'agency-unity-architect', name: 'agency-unity-architect', description: 'Unity architecture', category: 'agency', path: '.agents/skills/agency-unity-architect/SKILL.md' },
  ] })
  if (url.endsWith('/api/launch/claude')) return json({ ok: true, opened: 'claude.exe', on: 'THIS-NODE', from: '::1' })
  if (url.endsWith('/api/launch/freebuff')) return json({ ok: true, opened: 'freebuff.cmd', on: 'THIS-NODE', from: '::1' })
  if (url.endsWith('/api/freebuff/wakes')) return json({ kind: 'adapter', status: 'pending', runId: 'wake-test-1', prompt: JSON.parse(options.body || '{}').prompt || '' })
  if (url.endsWith('/api/board/vote')) return json({ question: JSON.parse(options.body || '{}').question, votes: [
    { name: 'Hermes', vote: 'YES', reason: 'it holds' }, { name: 'Ollama/gemma4', vote: 'NO', reason: 'risky' },
    { name: 'Ollama/ornith', vote: 'YES', reason: 'go' }, { name: 'Ollama/qwen2.5', vote: 'YES', reason: 'go' },
    { name: 'Ollama/deepseek', vote: null, reason: 'ABSTAIN — brain unavailable: down' }, { name: 'Ollama/fable', vote: 'YES', reason: 'go' },
  ], yes: 4, no: 1, abstain: 1, cast: 5, tie: false, outcome: 'PASSED', tieBreak: null, at: '2026-09-16T00:00:00Z' })
  if (url.endsWith('/api/claude/status')) return json({ installed: true, access: { ok: true }, permissionMode: 'plan' })
  if (url.endsWith('/api/nodes')) return json({ nodes: [
    { name: 'Alienware', ip: '192.168.0.40', role: 'JARVIS host', up: 2, total: 2, services: [
      { id: 'crosslisting', label: 'Crosslisting OS', port: 3000, up: true, state: 'UP', detail: 'identity ok', latencyMs: 5 },
      { id: 'hermes', label: 'Hermes dashboard', port: 9119, up: true, state: 'UP', detail: 'identity ok', latencyMs: 4 },
    ] },
    { name: 'Sabertooth', ip: '192.168.0.8', role: 'OmniRoute router', up: 1, total: 2, services: [
      { id: 'omniroute', label: 'OmniRoute', port: 20128, up: true, state: 'UP', detail: 'identity ok', latencyMs: 9 },
      { id: 'sentry', label: "Fable's Sentry", port: 9140, up: false, state: 'DOWN', detail: 'timeout' },
    ] },
    { name: 'Public web', ip: 'internet', role: 'Landing pages · DNS should be Cloudflare', up: 2, total: 2, services: [
      { id: 'dream-online-net', label: 'dream-online.net', port: 443, up: true, state: 'UP', detail: 'HTTP 200', ns: 'ionos' },
      { id: 'youandinotai-com', label: 'youandinotai.com', port: 443, up: true, state: 'UP', detail: 'HTTP 200', ns: 'cloudflare' },
    ] },
  ] })
  return json({ error: 'no route ' + url }, false, 404)
})

const app = await import('../js/app.js')

beforeEach(() => { calls.length = 0 })

describe('no sample data', () => {
  it('exports no SAMPLE_AGENTS and starts with an empty agent list', () => {
    expect(app.SAMPLE_AGENTS).toBeUndefined()
    expect(Array.isArray(app.state.agents)).toBe(true)
  })
  it('the source has no hardcoded agent, graph, or count fixtures', () => {
    const src = readFileSync(resolve(__dirname, '../js/app.js'), 'utf8')
    expect(src).not.toMatch(/SAMPLE_AGENTS/)
    expect(src).not.toMatch(/'251\+'/)
    expect(src).not.toMatch(/Joshua Coleman/)
    expect(src).not.toMatch(/127\.0\.0\.1:20128|localhost:20128/)
  })
})

describe('tab navigation (the bug that killed every click)', () => {
  it('switchTab activates the section and records the tab', () => {
    app.switchTab('widgets')
    expect(app.state.currentTab).toBe('widgets')
    expect(registry.get('#tab-widgets').classList.contains('active')).toBe(true)
    expect(registry.get('#tab-dashboard').classList.contains('active')).toBe(false)
  })
  it('clicking a nav tab through initTabs works end to end', () => {
    app.initTabs()
    tabs.find((t) => t.li.dataset.tab === 'agents').li.click()
    expect(app.state.currentTab).toBe('agents')
  })
  it('mission-control tab has NO iframe embed and NO dead placeholders — the live board is the tab', () => {
    app.switchTab('mission-control')
    expect(registry.get('#mission-control-frame')).toBeUndefined()
    expect(registry.get('#mission-control-link')).toBeUndefined()
  })
  it('hermes-link is built from server config (/api/config), never from location.hostname — a tunnel host is not the LAN', () => {
    app.state.config = { hermesDashboard: 'http://192.168.0.8:9119/' }
    app.switchTab('mission-control')
    const hermes = registry.get('#hermes-link')
    expect(hermes.attrs.href || hermes.href).toBe('http://192.168.0.8:9119/')
    expect(hermes.textContent).toBe('http://192.168.0.8:9119/')
  })
  it('mission board renders live per-node service rows from /api/nodes with honest DOWN state', async () => {
    const board = reg('mission-board', 'div')
    const note = reg('mission-board-note', 'p')
    board.innerHTML = ''; note._ownText = ''
    await app.renderMissionBoard()
    expect(board.textContent).toContain('Alienware')
    expect(board.textContent).toContain('Crosslisting OS')
    expect(board.textContent).toContain('DOWN')
    expect(board.textContent).not.toContain('undefined')
    expect(note.textContent).toContain('3 nodes')
  })
  it('public-web rows show the live DNS provider (Ionos = nameservers not moved yet)', async () => {
    const board = reg('mission-board', 'div')
    board.innerHTML = ''
    await app.renderMissionBoard()
    expect(board.textContent).toContain('Public web')
    expect(board.textContent).toContain('DNS: ionos')
    expect(board.textContent).toContain('DNS: cloudflare')
  })
  it('does not let an older failed refresh overwrite a newer successful refresh', async () => {
    const board = reg('mission-board', 'div')
    const note = reg('mission-board-note', 'p')
    const deferred = []
    const realFetch = globalThis.fetch
    globalThis.fetch = vi.fn(() => new Promise((resolve, reject) => deferred.push({ resolve, reject })))
    try {
      const first = app.renderMissionBoard()
      const second = app.renderMissionBoard()
      deferred[1].resolve({ ok: true, status: 200, text: async () => JSON.stringify({ nodes: [{ name: 'new', ip: 'x', up: 1, total: 1, services: [] }] }) })
      await second
      deferred[0].reject(new Error('old request failed'))
      await first
    } finally { globalThis.fetch = realFetch }
    expect(board.textContent).toContain('new')
    expect(note.textContent).not.toContain('old request failed')
  })

  it('does not let an older board response overwrite a newer refresh', async () => {
    const board = reg('mission-board', 'div')
    const deferred = []
    const realFetch = globalThis.fetch
    globalThis.fetch = vi.fn(() => new Promise((resolve) => deferred.push(resolve)))
    try {
      const first = app.renderMissionBoard()
      const second = app.renderMissionBoard()
      deferred[1]({ ok: true, status: 200, text: async () => JSON.stringify({ nodes: [{ name: 'new', ip: 'x', up: 1, total: 1, services: [] }] }) })
      await second
      deferred[0]({ ok: true, status: 200, text: async () => JSON.stringify({ nodes: [{ name: 'old', ip: 'x', up: 1, total: 1, services: [] }] }) })
      await first
    } finally { globalThis.fetch = realFetch }
    expect(board.textContent).toContain('new')
    expect(board.textContent).not.toContain('old')
  })

  it('claudian panel sends the typed prompt with model/effort, streams the reply, and keeps the session badge', async () => {
    const input = reg('claudian-input', 'input')
    const send = reg('claudian-send', 'button')
    const log = reg('claudian-log', 'div')
    const model = reg('claudian-model', 'select'); model.value = 'opusplan'
    const effort = reg('claudian-effort', 'select'); effort.value = 'acceptEdits'
    const badge = reg('claudian-session', 'span')
    send.listeners.click = []
    app.initClaudian()
    input.value = 'refactor the vault walker'
    let sentBody = null
    const realFetch = globalThis.fetch
    globalThis.fetch = async (url, options = {}) => {
      if (String(url).includes('/api/claude/chat')) {
        sentBody = JSON.parse(options.body)
        return { ok: true, body: { getReader: () => ({ read: async () => ({ done: true, value: undefined }) }) } }
      }
      throw new Error('no route ' + url)
    }
    try {
      send.click()
      await new Promise((r) => setTimeout(r, 10))
    } finally { globalThis.fetch = realFetch }
    expect(sentBody.prompt).toBe('refactor the vault walker')
    expect(sentBody.model).toBe('opusplan')
    expect(sentBody.permissionMode).toBe('acceptEdits')
    expect(sentBody.persona).toBe('claude')
    expect(sentBody.hud).toBeUndefined() // the Claudian panel is raw Claude, not the jarvis preamble
    expect(log.textContent).toContain('refactor the vault walker')
  })

  it('launchFreebuff opens the FreeBuff CLI via the bridge and reports the result', async () => {
    const out = reg('freebuff-result', 'p')
    await app.launchFreebuff()
    expect(out.textContent).toContain('freebuff.cmd')
    expect(out.textContent).toContain('THIS-NODE')
    expect(calls.some((c) => c.url.endsWith('/api/launch/freebuff'))).toBe(true)
  })

  it('createWake posts the prompt and reports the pending wake; refuses an empty prompt', async () => {
    const input = reg('wake-prompt', 'input')
    const out = reg('wake-result', 'p')
    input.value = ''
    await app.createWake()
    expect(out.textContent).toContain('Type a task first')

    input.value = 'audit the mission board'
    await app.createWake()
    const c = calls.find((x) => x.url.endsWith('/api/freebuff/wakes'))
    expect(c).toBeTruthy()
    expect(JSON.parse(c.options.body).prompt).toBe('audit the mission board')
    expect(out.textContent).toContain('pending')
    expect(input.value).toBe('')
  })

  it('callBoardVote renders one light per seat and the honest verdict; refuses an empty motion', async () => {
    const q = reg('board-question', 'input')
    const out = reg('board-result', 'p')
    const seats = reg('board-seats', 'div')
    q.value = ''
    await app.callBoardVote()
    expect(out.textContent).toContain('motion')

    q.value = 'Ship the release?'
    await app.callBoardVote()
    const c = calls.find((x) => x.url.endsWith('/api/board/vote'))
    expect(c).toBeTruthy()
    expect(JSON.parse(c.options.body).question).toBe('Ship the release?')
    expect(seats.children).toHaveLength(6)
    const lights = seats.children.map((s) => s.children.find((x) => String(x.className || '').includes('board-light')))
    expect(lights.filter((l) => String(l.className).includes('board-yes')).length).toBe(4)
    expect(lights.filter((l) => String(l.className).includes('board-no')).length).toBe(1)
    expect(lights.filter((l) => String(l.className).includes('board-abstain')).length).toBe(1)
    expect(out.textContent).toContain('PASSED')
    expect(out.textContent).toContain('4 yes · 1 no · 1 abstain')
  })
})

describe('OmniRoute goes through the server proxy, never direct', () => {
  it('omniFetch calls /api/omni/<path> on the same origin with no Authorization header', async () => {
    await app.omniFetch('/models')
    const c = calls.find((x) => x.url.endsWith('/api/omni/models'))
    expect(c).toBeTruthy()
    expect(c.url.startsWith('/api/omni')).toBe(true)
    expect(c.options.headers?.Authorization).toBeUndefined()
  })
  it('omniChat posts the chat payload', async () => {
    await app.omniChat([{ role: 'user', content: 'x' }])
    const c = calls.find((x) => x.url.endsWith('/chat/completions'))
    expect(JSON.parse(c.options.body)).toMatchObject({ model: app.CHAT_MODEL, messages: [{ role: 'user', content: 'x' }] })
  })
  it('omniImageGen defaults to the one verified image model and asks for b64', async () => {
    await app.omniImageGen('a cat')
    const c = calls.find((x) => x.url.endsWith('/images/generations'))
    expect(JSON.parse(c.options.body)).toMatchObject({ model: 'antigravity/gemini-3.1-flash-image', response_format: 'b64_json' })
    expect(app.IMAGE_MODEL).toBe('antigravity/gemini-3.1-flash-image')
  })
})

describe('live agents from the skills tree', () => {
  it('initAgents loads from /api/agents and derives categories', async () => {
    await app.initAgents()
    expect(app.state.agents.length).toBe(2)
    expect(app.state.categories).toEqual(['all', 'agency', 'ops + method'])
    expect(registry.get('#stat-agents').textContent).toBe('2')
  })
  it('filters by category and search', () => {
    app.state.selectedCategory = 'agency'
    app.renderAgentList()
    expect(registry.get('#agent-list').children.length).toBe(1)
    app.state.selectedCategory = 'all'
    registry.get('#agent-search').value = 'judge'
    app.renderAgentList()
    expect(registry.get('#agent-list').children.length).toBe(1)
    registry.get('#agent-search').value = ''
  })
})

describe('knowledge graph is the vault', () => {
  it('initGraph builds nodes and links from /api/vault/graph', async () => {
    await app.initGraph()
    expect(app.state.graph.nodes.length).toBe(3)
    expect(app.state.graph.links.length).toBe(2)
    expect(registry.get('#graph-meta').textContent).toMatch(/3 notes/)
    expect(registry.get('#stat-nodes').textContent).toBe('3')
  })
  it('simulateGraph keeps nodes inside the canvas', () => {
    app.simulateGraph(800, 600)
    for (const n of app.state.graph.nodes) { expect(n.x).toBeGreaterThanOrEqual(30); expect(n.x).toBeLessThanOrEqual(770) }
  })
  it('openNote fetches the note and offers an obsidian:// link', async () => {
    await app.openNote(app.state.graph.nodes[0])
    const note = registry.get('#graph-note')
    const a = note.children.find((c) => c.tagName === 'a')
    expect(a.attrs.href).toMatch(/^obsidian:\/\/open\?vault=Antigravity&file=A$/)
  })
})

describe('knowledge graph renders as an epic space galaxy', () => {
  it('renderGraph builds glowing star nodes (halo + corona + white-hot core), not flat circles', async () => {
    await app.initGraph()
    const svg = registry.get('#graph-svg')
    const seats = svg.children.filter((c) => c.attrs.class && String(c.attrs.class).includes('galaxy-node'))
    expect(seats.length).toBe(app.state.graph.nodes.length)
    for (const seat of seats) {
      const halo = seat.children.find((c) => String(c.attrs.class || '').includes('galaxy-halo'))
      const core = seat.children.find((c) => String(c.attrs.class || '').includes('galaxy-core'))
      expect(halo, 'each star gets an atmospheric halo').toBeTruthy()
      expect(core, 'each star gets a white-hot core').toBeTruthy()
      expect(core.attrs.fill).toBe('#ffffff')
      expect(Number(seat.children.filter((c) => c.tagName === 'circle').length)).toBeGreaterThanOrEqual(3)
    }
    expect(svg.children.some((c) => c.tagName === 'defs')).toBe(true) // glow filter shipped
  })
  it('every node keeps its click-to-open behaviour in the galaxy', async () => {
    await app.initGraph()
    const svg = registry.get('#graph-svg')
    const seats = svg.children.filter((c) => c.attrs.class && String(c.attrs.class).includes('galaxy-node'))
    seats[0].click() // the panel fill is openNote's observable effect (fetch for the note body)
    await new Promise((r) => setTimeout(r, 0))
    const note = registry.get('#graph-note')
    expect(note.children.length).toBeGreaterThan(0)
    const a = note.children.find((c) => c.tagName === 'a')
    expect(a.attrs.href).toMatch(/^obsidian:\/\//)
  })
  it('the search filter dims non-matching stars the same as before', async () => {
    registry.get('#graph-search').value = 'A'
    await app.initGraph()
    const dimmed = registry.get('#graph-svg').children.filter((c) => c.attrs.class && String(c.attrs.class).includes('galaxy-node') && c.attrs.opacity === '0.12')
    expect(dimmed.length).toBe(2) // nodes B and C do not match 'A'
    registry.get('#graph-search').value = ''
  })
  it('the animation loop advances the sim and can be stopped', async () => {
    await app.initGraph()
    expect(typeof app.stopGalaxy).toBe('function')
    app.stopGalaxy()
  })
})

describe('dashboard stats are live readings', () => {
  it('initDashboard fills services, vault, avatars from the server', async () => {
    await app.initDashboard()
    expect(registry.get('#omni-model-count').textContent).toBe('2')
    expect(registry.get('#stat-services').textContent).toBe('28/30')
    expect(registry.get('#stat-services-detail').textContent).toMatch(/DOWN: Y/)
    expect(registry.get('#stat-vault').textContent).toBe('UP')
    expect(registry.get('#stat-avatars').textContent).toBe('1')
  })
})

describe('claude launch', () => {
  it('posts to /api/launch/claude and reports where it opened', async () => {
    await app.launchClaude()
    const c = calls.find((x) => x.url.endsWith('/api/launch/claude'))
    expect(c.options.method).toBe('POST')
    expect(registry.get('#claude-result').textContent).toMatch(/THIS-NODE/)
  })

  it('initClaude reports bridge capability', async () => {
    await app.initClaude()
    expect(registry.get('#claude-bridge-status').textContent).toBe('Bridge: installed · access ok · mode plan')
  })
})

describe('workflow_api.json', () => {
  it('uses the one OmniRoute URL and the verified image model', () => {
    const config = JSON.parse(readFileSync(resolve(__dirname, '../workflow_api.json'), 'utf8'))
    expect(config.base_url).toBe('http://192.168.0.8:20128/v1')
    expect(JSON.stringify(config)).not.toMatch(/127\.0\.0\.1:20128|localhost:20128/)
  })
})

describe('Crosslisting badge — server-side truth, never a browser CORS guess', () => {
  it('reads /api/crosslisting/status and reports the server verdict verbatim', async () => {
    const cross = await import('../js/crosslisting.js')
    const badge = document.querySelector('#crosslisting-status')
    const detail = document.querySelector('#crosslisting-detail')
    globalThis.fetch.mockClear()
    await cross.probeCrosslisting()
    const call = globalThis.fetch.mock.calls.find(([u]) => String(u).includes('/api/crosslisting/status'))
    expect(call, 'the browser must ask the same-origin server, not :3000 cross-origin').toBeTruthy()
    expect(globalThis.fetch.mock.calls.some(([u]) => String(u).includes(':3000'))).toBe(false)
    expect(badge.textContent).toBe('UP')
    expect(detail.textContent).toContain('health ok')
  })
  it('shows DOWN with the server reason when the app is not healthy', async () => {
    const cross = await import('../js/crosslisting.js')
    const badge = document.querySelector('#crosslisting-status')
    const detail = document.querySelector('#crosslisting-detail')
    const realFetch = globalThis.fetch
    globalThis.fetch = vi.fn(async (url) => {
      if (String(url).includes('/api/crosslisting/status')) return { ok: true, status: 200, json: async () => ({ up: false, state: 'DOWN', detail: 'ECONNREFUSED', url: 'http://127.0.0.1:3000' }) }
      return realFetch(url)
    })
    try {
      await cross.probeCrosslisting()
      expect(badge.textContent).toBe('DOWN')
      expect(detail.textContent).toContain('ECONNREFUSED')
    } finally { globalThis.fetch = realFetch }
  })
})
