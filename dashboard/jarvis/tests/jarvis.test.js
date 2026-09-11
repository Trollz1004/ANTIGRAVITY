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
