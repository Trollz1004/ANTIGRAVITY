import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

// Minimal DOM harness (same style as jarvis.test.js)
class MockEl {
  constructor(tag = 'div') {
    this.tagName = tag
    this.children = []
    this.style = {}
    this.className = ''
    this.textContent = ''
    this.value = ''
    this.attributes = {}
    this._listeners = {}
    this.hidden = false
  }
  appendChild(c) { this.children.push(c); return c }
  addEventListener(ev, fn) { (this._listeners[ev] ||= []).push(fn) }
  click() { for (const fn of this._listeners.click || []) fn({ preventDefault: () => {} }) }
  setAttribute(name, value) { this.attributes[name] = String(value) }
  get textContentFull() { return this.children.map((c) => c.textContentFull ?? c.textContent).join('') || this.textContent }
  querySelector() { return new MockEl() }
  querySelectorAll() { return [] }
  classList = {
    _set: new Set(),
    add(...c) { c.forEach((x) => this._set.add(x)) },
    remove(...c) { c.forEach((x) => this._set.delete(x)) },
    toggle(c, force) { if (force === undefined) { this._set.has(c) ? this._set.delete(c) : this._set.add(c) } else if (force) this._set.add(c); else this._set.delete(c) },
    contains(c) { return this._set.has(c) },
  }
}

const byId = {}
global.document = {
  createElement: (t) => new MockEl(t),
  createTextNode: (t) => ({ textContent: t, textContentFull: t }),
  getElementById: (id) => byId[id] || null,
  querySelector: (sel) => (sel === '#sidebar .nav-tabs' || sel === '.nav-tabs' ? navTabs : null),
  querySelectorAll: (sel) => (sel === '.dock-toggle' ? navTabs.children.filter((c) => String(c.className).includes('dock-toggle')) : []),
  body: new MockEl('body'),
  addEventListener: vi.fn(),
}
global.window = { addEventListener: vi.fn(), location: { pathname: '/' } }
global.fetch = vi.fn()

const navTabs = new MockEl('ul')

let dock
beforeAll(async () => { dock = await import('../js/jarvis/dock.js') })

beforeEach(() => {
  byId['dock-log'] = new MockEl()
  byId['dock-input'] = new MockEl()
  byId['dock-send'] = new MockEl()
  byId['dock-status'] = new MockEl()
  global.fetch = vi.fn()
})

describe('JARVIS dock (global agentic drawer)', () => {
  it('mounts one global dock button in the sidebar nav (present on every tab)', () => {
    navTabs.children.length = 0
    const t1 = new MockEl('li'); t1.dataset = {}; t1.textContent = '◈ Dashboard'
    const t2 = new MockEl('li'); t2.dataset = {}; t2.textContent = '⬢ JARVIS'
    navTabs.appendChild(t1); navTabs.appendChild(t2)
    dock.mountDock({ fetchImpl: global.fetch })
    expect(navTabs.children.length).toBe(3) // 2 tabs + 1 dock toggle
    expect(dock.dockButtons().length).toBe(1)
  })

  it('sends the typed prompt to the Claude bridge and parses the SSE stream shape', async () => {
    navTabs.children.length = 0
    const t = new MockEl('li'); t.dataset = {}; t.textContent = '◈ Dashboard'
    navTabs.appendChild(t)
    dock.mountDock({ fetchImpl: global.fetch })
    dock.openDock()
    byId['dock-input'].value = 'what is down right now?'
    const sse = [
      'event: init\ndata: {"type":"init","sessionId":"sess123"}\n\n',
      'event: delta\ndata: {"type":"delta","text":"Misso"}\n\n',
      'event: delta\ndata: {"type":"delta","text":"n Control is down."}\n\n',
      'event: result\ndata: {"type":"result","ok":true,"text":"Mission Control is down.","sessionId":"sess123"}\n\n',
      'event: exit\ndata: {"type":"exit","code":0}\n\n',
    ].join('')
    global.fetch.mockResolvedValue({ ok: true, body: { getReader: () => ({ read: async () => ({ done: true, value: undefined }) }) } })
    // Feed the SSE text through the parser directly (reader returns done immediately).
    const parsed = dock.parseSseChunk(sse)
    expect(parsed.events.map((e) => e.event)).toEqual(['init', 'delta', 'delta', 'result', 'exit'])
    expect(parsed.events[2].data.text).toBe('n Control is down.')
  })

  it('sendFromDock asks the server for HUD context and flags hud:true so the SERVER composes the preamble', async () => {
    navTabs.children.length = 0
    const t = new MockEl('li'); t.dataset = {}; t.textContent = '◈ Dashboard'
    navTabs.appendChild(t)
    dock.mountDock({ fetchImpl: global.fetch })
    let sentBody = null
    global.fetch = vi.fn(async (path, opts) => {
      if (path === '/api/claude/chat') { sentBody = JSON.parse(opts.body); return { ok: true, body: { getReader: () => ({ read: async () => ({ done: true, value: undefined }) }) } } }
      return { ok: false, status: 404 }
    })
    dock.openDock()
    byId['dock-input'].value = 'status?'
    await dock.sendFromDock()
    expect(sentBody).not.toBeNull()
    expect(sentBody.persona).toBe('jarvis')
    expect(sentBody.hud).toBe(true)
    expect(sentBody.hudContext).toBeUndefined() // the client never supplies the context text
    expect(sentBody.prompt).toBe('status?')
  })

  it('dock-ask buttons open the drawer and fire the pre-armed question pinned to their tab', async () => {
    navTabs.children.length = 0
    const t = new MockEl('li'); t.dataset = {}; t.textContent = '⬡ Knowledge Graph'
    navTabs.appendChild(t)
    const handlers = []
    global.document.addEventListener = (ev, fn) => { if (ev === 'click') handlers.push(fn) }
    dock.mountDock({ fetchImpl: global.fetch })
    let sentBody = null
    global.fetch = vi.fn(async (path, opts) => {
      if (path === '/api/claude/chat') { sentBody = JSON.parse(opts.body); return { ok: true, body: { getReader: () => ({ read: async () => ({ done: true, value: undefined }) }) } } }
      return { ok: false, status: 404 }
    })
    const btn = { dataset: { tab: 'graph', question: 'tour the graph' } }
    for (const h of handlers) h({ target: { closest: (sel) => (sel === '.dock-ask' ? btn : null) } })
    await new Promise((r) => setTimeout(r, 10))
    expect(dock.isDockOpen()).toBe(true)
    expect(sentBody.prompt).toBe('tour the graph')
    expect(sentBody.tab).toBe('graph')
    expect(sentBody.hud).toBe(true)
    expect(sentBody.persona).toBe('jarvis')
  })

  it('a refused bridge shows the honest error in the log and never fakes a reply', async () => {
    navTabs.children.length = 0
    const t = new MockEl('li'); t.dataset = {}; t.textContent = '◈ Dashboard'
    navTabs.appendChild(t)
    dock.mountDock({ fetchImpl: global.fetch })
    dock.openDock()
    global.fetch = vi.fn(async () => ({ ok: false, status: 429 }))
    byId['dock-input'].value = 'hi'
    await dock.sendFromDock()
    expect(String(byId['dock-log'].textContentFull)).toContain('429')
  })
})
