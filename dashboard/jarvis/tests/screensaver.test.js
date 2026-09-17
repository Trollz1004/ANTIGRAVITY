import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createScreensaver } from '../js/screensaver.js'

// Minimal DOM harness (same style as jarvis-dock.test.js)
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
    this.width = 0
    this.height = 0
    this.classList = {
      _set: new Set(),
      add(...c) { c.forEach((x) => this._set.add(x)) },
      remove(...c) { c.forEach((x) => this._set.delete(x)) },
      toggle(c, force) { if (force === undefined) { this._set.has(c) ? this._set.delete(c) : this._set.add(c) } else if (force) this._set.add(c); else this._set.delete(c) },
      contains(c) { return this._set.has(c) },
    }
  }
  appendChild(c) { this.children.push(c); return c }
  addEventListener(ev, fn) { (this._listeners[ev] ||= []).push(fn) }
  click() { for (const fn of this._listeners.click || []) fn({ preventDefault: () => {} }) }
  setAttribute(name, value) { this.attributes[name] = String(value) }
  get textContentFull() { return this.children.map((c) => c.textContentFull ?? c.textContent).join('') || this.textContent }
  getContext() { return null } // canvas guard: structure is tested, pixels are not
  querySelector(sel) { return this.children.find((c) => (c.className || '').split(/\s+/).includes(String(sel).slice(1))) || null }
}

const tab = (name) => { const el = new MockEl('li'); el.dataset = { tab: name }; return el }

function harness({ news, trends, tabs } = {}) {
  const made = []
  const jarvisTab = tab('jarvis')
  jarvisTab.addEventListener('click', () => { jarvisTab.clicked = true }) // the real tab's handler switches to the gods-eye
  const doc = {
    body: new MockEl('body'),
    createElement: (t) => { const e = new MockEl(t); made.push(e); return e },
    querySelector: (sel) => (sel === '.nav-tab[data-tab="jarvis"]' ? jarvisTab : null),
    addEventListener: () => {},
  }
  const fetchImpl = vi.fn(async (url) => {
    const json = (body, ok = true) => ({ ok, status: ok ? 200 : 503, json: async () => body })
    if (String(url).endsWith('/api/news')) return json(news || { ok: true, items: [{ title: 'AI does good', score: 99 }] })
    if (String(url).endsWith('/api/trends')) return json(trends || { ok: true, summary: { datasets: ['Bitcoin Search Trend.csv'], headings: ['Introduction'] } })
    return json({ error: 'no such route' }, false)
  })
  return { doc, made, jarvisTab, fetch: fetchImpl }
}

describe('screensaver — nano-bites orbit the AI marks, one click to the gods-eye', () => {
  let h
  beforeEach(() => { vi.restoreAllMocks() })

  it('show() builds the overlay: canvas, six platform marks, disclaimer, tickers — and stays hidden until shown', () => {
    h = harness()
    const ss = createScreensaver({ document: h.doc, fetch: h.fetch, idleMs: 60000 })
    ss.show() // the overlay is built lazily on first show
    const overlay = h.doc.body.children[0]
    expect(h.doc.body.children.length).toBe(1)
    expect(overlay.classList.contains('screensaver')).toBe(true)
    expect(overlay.classList.contains('visible')).toBe(true) // shown now; hidden again on click/hide
    const disclaimer = overlay.children.find((c) => c.className === 'ss-disclaimer')
    expect(disclaimer.textContent).toMatch(/Officially Unofficial/)
    expect(disclaimer.textContent).toMatch(/not affiliated/)
    const marks = overlay.children.find((c) => c.className === 'ss-marks')
    expect(marks.textContent).toBe('CL·CX·HE·OL·OR·FB') // Claude, Codex, Hermes, Ollama, OmniRoute, Freebuff
  })

  it('show() feeds the tickers from the live routes; DOWN sources say so honestly', async () => {
    h = harness({ news: { ok: false, error: 'HTTP 503' }, trends: { ok: false, error: 'not found' } })
    const ss = createScreensaver({ document: h.doc, fetch: h.fetch, idleMs: 60000 })
    ss.show()
    await ss.once()
    const news = h.doc.body.children[0].children.find((c) => c.className === 'ss-news')
    const trends = h.doc.body.children[0].children.find((c) => c.className === 'ss-trends')
    expect(news.textContent).toMatch(/Hacker News.*DOWN/)
    expect(trends.textContent).toMatch(/Trends.*DOWN/)
  })

  it('show() renders real headlines and trend datasets when the sources answer', async () => {
    h = harness()
    const ss = createScreensaver({ document: h.doc, fetch: h.fetch, idleMs: 60000 })
    ss.show()
    await ss.once()
    const news = h.doc.body.children[0].children.find((c) => c.className === 'ss-news')
    const trends = h.doc.body.children[0].children.find((c) => c.className === 'ss-trends')
    expect(news.textContent).toContain('AI does good')
    expect(trends.textContent).toContain('Bitcoin Search Trend.csv')
  })

  it('clicking anywhere exits the screensaver and lands on the gods-eye (JARVIS) tab', async () => {
    h = harness()
    const ss = createScreensaver({ document: h.doc, fetch: h.fetch, idleMs: 60000 })
    ss.show()
    await ss.once()
    const overlay = h.doc.body.children[0]
    overlay.click()
    expect(overlay.classList.contains('visible')).toBe(false)
    expect(h.jarvisTab.clicked).toBe(true) // the real tab's click handler switches to gods-eye
  })

  it('hide() stops the animation loop and refresh timer; restart is clean', async () => {
    h = harness()
    const ss = createScreensaver({ document: h.doc, fetch: h.fetch, idleMs: 60000 })
    ss.show()
    await ss.once()
    ss.hide()
    const overlay = h.doc.body.children[0]
    expect(overlay.classList.contains('visible')).toBe(false)
    expect(h.fetch).toHaveBeenCalledTimes(2) // one news + one trends fetch, no polling after hide
    ss.show()
    await ss.once()
    expect(h.fetch).toHaveBeenCalledTimes(4)
  })
})
