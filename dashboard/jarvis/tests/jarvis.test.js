import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

// Minimal DOM for JARVIS modules
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
  }
  appendChild(c) { this.children.push(c); return c }
  addEventListener(ev, fn) { (this._listeners[ev] ||= []).push(fn) }
  setAttribute(name, value) { this.attributes[name] = String(value) }
  querySelector() { return new MockEl() }
  querySelectorAll() { return [] }
}

global.document = {
  createElement: (t) => new MockEl(t),
  createElementNS: () => new MockEl('svg'),
  getElementById: (id) => {
    if (!global.__els) global.__els = {}
    if (!global.__els[id]) global.__els[id] = new MockEl()
    return global.__els[id]
  },
  querySelector: () => new MockEl(),
  querySelectorAll: () => [],
  addEventListener: vi.fn(),
  body: new MockEl('body'),
}
global.window = {
  addEventListener: vi.fn(),
  SpeechRecognition: undefined,
  webkitSpeechRecognition: undefined,
  speechSynthesis: { getVoices: () => [], speak: vi.fn(), cancel: vi.fn() },
}
global.fetch = vi.fn()

let jarvisMod
let globeMod
let avatarMod

beforeAll(async () => {
  jarvisMod = await import('../js/jarvis/jarvis.js')
  try { globeMod = await import('../js/jarvis/globe.js') } catch { globeMod = null }
  try { avatarMod = await import('../js/jarvis/avatar.js') } catch { avatarMod = null }
})

describe('JARVIS core', () => {
  it('exports the four supported brains', () => {
    expect(jarvisMod.BRAINS).toEqual(['omni', 'claude', 'ollama', 'hermes'])
  })

  it('rejects unknown brains and persists valid choices', () => {
    const store = { setItem: vi.fn() }
    global.localStorage = store
    expect(jarvisMod.setBrain('bogus')).toBe(false)
    expect(jarvisMod.setBrain('claude')).toBe(true)
    expect(jarvisMod.jarvis.brain).toBe('claude')
    expect(store.setItem).toHaveBeenCalledWith('jarvis.brain', 'claude')
    delete global.localStorage
  })

  it('selects stored, Claude, Ollama, then Omni by availability', () => {
    const claude = { installed: true, access: { ok: true } }
    const ollama = { available: true, models: ['gemma'] }
    expect(jarvisMod.pickDefaultBrain({ claude, ollama }, 'claude')).toBe('claude')
    expect(jarvisMod.pickDefaultBrain({ claude, ollama }, 'ollama')).toBe('ollama')
    expect(jarvisMod.pickDefaultBrain({ claude, ollama }, 'bogus')).toBe('claude')
    expect(jarvisMod.pickDefaultBrain({ claude: null, ollama: null }, 'bogus')).toBe('omni')
  })

  it('renders one node row and service row for every /api/nodes entry', () => {
    global.__els ||= {}
    const list = global.__els['jarvis-nodes-list'] = new MockEl()
    jarvisMod.renderNodes({ nodes: [
      { name: 'Alienware', ip: '192.168.0.40', total: 2, services: [{ label: 'JARVIS', up: true }, { label: 'Ollama', up: false }] },
      { name: 'Sabertooth', ip: '192.168.0.8', total: 1, services: [{ label: 'OmniRoute', up: true }] },
    ] })
    expect(list.children).toHaveLength(2)
    expect(list.children[0].children).toHaveLength(3)
    expect(list.children[1].children).toHaveLength(2)
  })

  it('exports jarvis state object', () => {
    expect(jarvisMod.jarvis).toBeDefined()
    expect(jarvisMod.jarvis.state).toBeDefined()
  })

  it('exports askJarvis and setState', () => {
    expect(typeof jarvisMod.askJarvis).toBe('function')
    expect(typeof jarvisMod.setState).toBe('function')
  })

  it('setState updates jarvis.state', () => {
    jarvisMod.setState('thinking')
    expect(jarvisMod.jarvis.state).toBe('thinking')
    jarvisMod.setState('idle')
    expect(jarvisMod.jarvis.state).toBe('idle')
  })

  it('timestamps log and streamed reply rows for conversation filtering', () => {
    global.__els ||= {}
    const log = global.__els['jarvis-log'] = new MockEl()
    const now = vi.spyOn(Date, 'now').mockReturnValue(1234)
    jarvisMod.jarvisLog('JARVIS', 'Timestamped')
    jarvisMod.addStreamRow()
    now.mockRestore()
    expect(log.children[0].attributes['data-ts']).toBe('1234')
    expect(log.children[1].attributes['data-ts']).toBe('1234')
  })

  it('speak() resolves even when speech synthesis never fires onend (muted or voiceless browser)', async () => {
    global.window.speechSynthesis = { getVoices: () => [], speak: vi.fn(), cancel: vi.fn() }
    global.SpeechSynthesisUtterance = class { constructor(t) { this.text = t } }
    const t0 = Date.now()
    await jarvisMod.jarvisVoice.speak('PONG')
    expect(Date.now() - t0).toBeLessThan(4000)
    expect(jarvisMod.jarvis.state).toBe('idle')
  })
})

describe('JARVIS globe (keyless OSM Cesium shell)', () => {
  it('module exists and exports createGlobe', () => {
    expect(globeMod).not.toBeNull()
    expect(typeof globeMod.createGlobe).toBe('function')
  })

  it('createGlobe returns a controller with destroy and flyTo', () => {
    const container = new MockEl()
    const ctrl = globeMod.createGlobe(container, { keyless: true })
    expect(ctrl).toBeDefined()
    expect(typeof ctrl.destroy).toBe('function')
    expect(typeof ctrl.flyTo).toBe('function')
    ctrl.destroy()
  })
})

describe('JARVIS avatar billboard', () => {
  it('module exists and exports loadAvatar', () => {
    expect(avatarMod).not.toBeNull()
    expect(typeof avatarMod.loadAvatar).toBe('function')
  })

  it('default avatar path points at avatar-model package', () => {
    expect(avatarMod.DEFAULT_AVATAR_URL).toMatch(/avatar\.(glb|vrm)/)
  })
})


describe('JARVIS wiring regressions (judge findings)', () => {
  let fs, path, html
  beforeAll(async () => {
    fs = (await import('fs')).default
    path = (await import('path')).default
    html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf-8')
  })

  it('every nav data-tab has a matching tab-<name> section', () => {
    const tabs = [...html.matchAll(/data-tab="([^"]+)"/g)].map(m => m[1])
    expect(tabs.length).toBeGreaterThan(0)
    for (const tab of tabs) {
      expect(html, 'missing section id="tab-' + tab + '"').toContain('id="tab-' + tab + '"')
    }
  })

  it('jarvis modules use the /api/omni proxy, never a direct OmniRoute URL', () => {
    const base = path.resolve(__dirname, '..', 'js')
    for (const f of ['jarvis/jarvis.js', 'hermes-voice.js']) {
      const src = fs.readFileSync(path.join(base, f), 'utf-8')
      expect(src, f + ' hardcodes OmniRoute').not.toMatch(/127[.]0[.]0[.]1:20128|localhost:20128|192[.]168[.]0[.]8:20128/)
      expect(src).toContain('/api/omni')
    }
  })

  it('avatar init does not depend on window.THREE global', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'jarvis', 'jarvis.js'), 'utf-8')
    expect(src).not.toMatch(/window[.]THREE/)
    expect(src).toMatch(/await import\('three'\)/)
  })

  it('no personal ssh usernames in the page or server', () => {
    expect(html).not.toMatch(/ssh\s+joshi@/)
    const server = fs.readFileSync(path.resolve(__dirname, '..', 'server.mjs'), 'utf-8')
    expect(server).not.toMatch(/joshi@/)
    expect(server).not.toMatch(/Users\\joshi|Users\/joshi/)
  })

  it('contains the brain, nodes and session controls without retired routing text', () => {
    expect(html).toContain('id="jarvis-brain"')
    expect(html).toContain('id="jarvis-nodes-list"')
    expect(html).toContain('id="jarvis-session"')
    expect(html).toContain('id="jarvis-session-new"')
    expect(html).toContain('id="jarvis-conv-stop"')
    expect(html).toContain('id="jarvis-shortcuts"')
    expect(html).toContain('id="claude-bridge-status"')
    expect(html).not.toMatch(/SABRETOOTH|drift bare|ssh <user>@/)
  })

  it('contains the live interim transcript and imports the globe voice controller', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'jarvis', 'jarvis.js'), 'utf-8')
    expect(html).toContain('id="jarvis-interim"')
    expect(src).toContain("from './voice.js'")
    expect(src).toContain("from './shortcuts.js'")
    expect(src).toMatch(/startListening\(\)\s*\{\s*return getPushToTalk\(\)\.tap\(\)/)
    expect(src).not.toMatch(/const SR = window\.SpeechRecognition/)
  })

  it('setState recolours only the state badge dot, never the node service dots', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'jarvis', 'jarvis.js'), 'utf-8')
    // A page-wide querySelectorAll('.jarvis-dot') turned every service dot orange when JARVIS was thinking.
    expect(src).not.toMatch(/querySelectorAll\(\s*['"]\.jarvis-dot['"]\s*\)/)
    expect(src).toMatch(/querySelectorAll\(\s*['"]\.jarvis-state-badge \.jarvis-dot['"]\s*\)/)
  })

  it('uses the local gods-eye nodes route instead of old direct service URLs', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'jarvis', 'jarvis.js'), 'utf-8')
    expect(src).toContain('/api/nodes')
    expect(src).not.toMatch(/localhost:3151|localhost:9140|127\.0\.0\.1:9140/)
  })
})
