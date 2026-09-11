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
    this._listeners = {}
  }
  appendChild(c) { this.children.push(c); return c }
  addEventListener(ev, fn) { (this._listeners[ev] ||= []).push(fn) }
  setAttribute() {}
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
})
