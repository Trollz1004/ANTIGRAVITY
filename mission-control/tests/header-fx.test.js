import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHeroFx } from '../js/header-fx.js'

// Minimal DOM harness (same style as screensaver.test.js)
class MockEl {
  constructor(tag = 'div') {
    this.tagName = tag
    this.children = []
    this.style = {}
    this.className = ''
    this.textContent = ''
    this.attributes = {}
    this._listeners = {}
    this.hidden = false
    this.classList = {
      _set: new Set(),
      add(...c) { c.forEach((x) => this._set.add(x)) },
      remove(...c) { c.forEach((x) => this._set.delete(x)) },
      contains(c) { return this._set.has(c) },
    }
  }
  appendChild(c) { this.children.push(c); return c }
  addEventListener(ev, fn) { (this._listeners[ev] ||= []).push(fn) }
  dispatch(ev) { for (const fn of this._listeners[ev] || []) fn({ preventDefault: () => {} }) }
  setAttribute(name, value) { this.attributes[name] = String(value) }
  get textContentFull() { return this.children.map((c) => c.textContentFull ?? c.textContent).join('') || this.textContent }
  querySelector(sel) {
    const cls = String(sel).slice(1)
    const find = (els) => {
      for (const c of els) {
        if ((c.className || '').split(/\s+/).includes(cls)) return c
        const hit = find(c.children)
        if (hit) return hit
      }
      return null
    }
    return find(this.children)
  }
}

function harness({ container } = {}) {
  const heroRoot = container === undefined ? new MockEl('section') : container
  const made = []
  const doc = {
    createElement: (t) => { const e = new MockEl(t); made.push(e); return e },
  }
  const captured = []
  class FakeFinisher {
    constructor(cfg) { captured.push(cfg); this.canvas = new MockEl('canvas') }
  }
  return { doc, heroRoot, made, captured, FakeFinisher }
}

describe('header-fx — the You&i hero: user-colored particles, galaxy link, 3D tilt', () => {
  let h
  beforeEach(() => { vi.restoreAllMocks() })

  it('mounts the hero: You&i title, "Watched over by AI" subtitle, and the galaxy link', () => {
    h = harness()
    const fx = createHeroFx({ document: h.doc, container: h.heroRoot, FinisherHeader: h.FakeFinisher })
    fx.init()
    const title = h.heroRoot.querySelector('.hero-title')
    const sub = h.heroRoot.querySelector('.hero-sub')
    const link = h.heroRoot.querySelector('.hero-link')
    expect(title.textContent).toContain('You&i')
    expect(sub.textContent).toBe('Watched over by AI')
    expect(link.attributes.href).toBe('https://youandinotai-galaxy.ai.studio/')
    expect(link.textContent).toContain('Galaxy')
  })

  it('initializes FinisherHeader with the founder\'s exact generator config — his colors, not the dashboard\'s', () => {
    h = harness()
    const fx = createHeroFx({ document: h.doc, container: h.heroRoot, FinisherHeader: h.FakeFinisher })
    fx.init()
    expect(h.captured.length).toBe(1)
    const cfg = h.captured[0]
    // The exact config from the founder's generator session (finisher.co)
    expect(cfg.count).toBe(38)
    expect(cfg.size).toEqual({ min: 2, max: 406, pulse: 0.7 })
    expect(cfg.speed).toEqual({ x: { min: 0, max: 1.9 }, y: { min: 0, max: 1.9 } })
    expect(cfg.colors.background).toBe('#011a18')
    expect(cfg.colors.particles).toEqual(['#fcebca', '#d7f3fe', '#f95d07'])
    expect(cfg.blending).toBe('overlay')
    expect(cfg.opacity).toEqual({ center: 1, edge: 0.3 })
    expect(cfg.skew).toBe(1.3)
    expect(cfg.shapes).toEqual(['c'])
    // His rule: "can't use same colors as all AI productions" — no dashboard cyan/pink/gold
    for (const c of cfg.colors.particles) expect(['#22d3ee', '#ec4899', '#e9b949']).not.toContain(c)
  })

  it('3D tilt: pointer move tilts the hero in perspective, leaving resets it', () => {
    h = harness()
    const fx = createHeroFx({ document: h.doc, container: h.heroRoot, FinisherHeader: h.FakeFinisher })
    fx.init()
    h.heroRoot.dispatch('pointermove')
    expect(h.heroRoot.style.transform).toMatch(/perspective/)
    expect(h.heroRoot.style.transform).toMatch(/rotateX/)
    h.heroRoot.dispatch('pointerleave')
    expect(h.heroRoot.style.transform).toBe('')
  })

  it('degrades honestly: missing container is a no-op, missing FinisherHeader still renders the hero', () => {
    h = harness({ container: null })
    const fx = createHeroFx({ document: h.doc, container: h.heroRoot, FinisherHeader: h.FakeFinisher })
    expect(fx.init()).toBe(null) // nothing to mount into
    const h2 = harness()
    const fx2 = createHeroFx({ document: h2.doc, container: h2.heroRoot, FinisherHeader: null })
    fx2.init() // no canvas lib available — hero content still there, no throw
    expect(h2.heroRoot.querySelector('.hero-title').textContent).toContain('You&i')
    expect(h2.captured.length).toBe(0)
  })

  it('index.html wiring: the hero root and the vendored finisher script are on the page', () => {
    const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8')
    expect(html).toContain('id="hero-youi"')
    expect(html).toMatch(/<script[^>]*src="js\/vendor\/finisher-header\.es5\.min\.js"/)
    // The link must be the real galaxy URL
    expect(html).not.toContain('youandinotai-galaxy') // link comes from the module, page stays lean
  })
})
