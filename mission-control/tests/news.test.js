import { describe, it, expect, vi } from 'vitest'
import { createNewsService, normalizeItem } from '../lib/news.mjs'

const item = (id, over = {}) => ({ id, title: 'Story ' + id, score: 10, by: 'u' + id, time: 1700000000, descendants: 5, url: 'https://x/' + id, ...over })

function hnFetch(stories, items = {}) {
  return vi.fn(async (url) => {
    if (String(url).endsWith('/topstories.json')) return { ok: true, status: 200, json: async () => stories }
    const m = /\/item\/(\d+)\.json$/.exec(String(url))
    if (m) return { ok: true, status: 200, json: async () => items[m[1]] ?? item(Number(m[1])) }
    return { ok: false, status: 404, json: async () => ({}) }
  })
}

describe('news lib — real Hacker News, honest failure', () => {
  it('normalizes an item to the ticker shape', () => {
    const n = normalizeItem(item(7, { score: 42, descendants: 9, url: '' }))
    expect(n).toMatchObject({ id: 7, title: 'Story 7', score: 42, comments: 9 })
    expect(n.url).toBe('https://news.ycombinator.com/item?id=7') // no url -> HN discussion link
  })

  it('fetches top stories, maps and sorts by score, respects the limit', async () => {
    const f = hnFetch([1, 2, 3, 4], { 1: item(1, { score: 5 }), 2: item(2, { score: 99 }), 3: item(3, { score: 50 }), 4: item(4, { score: 1 }) })
    const svc = createNewsService({ fetch: f, limit: 3 })
    const r = await svc.getTopStories()
    expect(r.ok).toBe(true)
    expect(r.items.map((x) => x.id)).toEqual([2, 3, 1])
    expect(r.items[0].title).toBe('Story 2')
  })

  it('caches within the TTL and refetches after it expires', async () => {
    let nowMs = 1000
    const f = hnFetch([1], {})
    const svc = createNewsService({ fetch: f, limit: 2, ttlMs: 60000, now: () => nowMs })
    await svc.getTopStories()
    await svc.getTopStories()
    expect(f).toHaveBeenCalledTimes(2) // topstories + one item, second call served from cache
    nowMs = 70000
    await svc.getTopStories()
    expect(f).toHaveBeenCalledTimes(4)
  })

  it('reports DOWN honestly when the source fails — never throws, never invents', async () => {
    const svc = createNewsService({ fetch: async () => { throw new Error('ECONNREFUSED') } })
    const r = await svc.getTopStories()
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/ECONNREFUSED/)
    expect(r.items).toEqual([])
  })

  it('times out a slow source', async () => {
    const svc = createNewsService({ fetch: (_u, opts) => new Promise((_res, rej) => opts.signal.addEventListener('abort', () => rej(new Error('aborted')))), timeoutMs: 10 })
    const r = await svc.getTopStories()
    expect(r.ok).toBe(false)
  })
})
