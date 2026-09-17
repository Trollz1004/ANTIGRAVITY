import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { createProposalStore, rebuildIndex, STATES, SOURCES } from '../lib/proposals.mjs'

let dir
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jarvis-proposals-'))
})
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('lib/proposals.mjs — create + list', () => {
  it('creates a PROPOSED record with the documented shape', () => {
    const store = createProposalStore({ dir })
    const p = store.create({
      source: 'social', kind: 'post', brand: 'DREAM Online', platform: 'devto',
      title: 'Patch notes', body: 'Body text', scheduledFor: null,
      checks: { compliance: { pass: true }, copyScore: { score: 5 } },
    })
    expect(p.id).toBeTruthy()
    expect(p.state).toBe('PROPOSED')
    expect(SOURCES).toContain(p.source)
    expect(STATES).toContain(p.state)
    expect(store.get(p.id)).toEqual(p)
    expect(store.list().map((x) => x.id)).toContain(p.id)
  })

  it('rejects an unrecognised source', () => {
    const store = createProposalStore({ dir })
    expect(() => store.create({ source: 'nope', brand: 'DREAM Online', platform: 'devto' })).toThrow()
  })

  it('writes one JSONL file per UTC day under the given dir', () => {
    const store = createProposalStore({ dir, now: () => new Date('2026-09-17T12:00:00Z') })
    store.create({ source: 'social', brand: 'DREAM Online', platform: 'devto', title: 't', body: 'b' })
    expect(fs.existsSync(path.join(dir, '2026-09-17.jsonl'))).toBe(true)
  })
})

describe('lib/proposals.mjs — append-only transitions', () => {
  it('transition() adds to history without rewriting the original record', () => {
    const store = createProposalStore({ dir })
    const p = store.create({ source: 'social', brand: 'AI Solutions', platform: 'hashnode', title: 't', body: 'b' })
    const approved = store.transition(p.id, { state: 'APPROVED' })
    expect(approved.state).toBe('APPROVED')
    expect(approved.history.length).toBe(2)
    expect(approved.history[0].state).toBe('PROPOSED')
    expect(approved.history[1].state).toBe('APPROVED')

    const raw = fs.readFileSync(fs.readdirSync(dir).map((f) => path.join(dir, f))[0], 'utf8')
    const lines = raw.trim().split('\n').map((l) => JSON.parse(l))
    expect(lines.length).toBe(2) // the create record + the transition record, both kept
    expect(lines[0].state).toBe('PROPOSED')
    expect(lines[1].patch.state).toBe('APPROVED')
  })

  it('transition() on an unknown id is a no-op that returns null', () => {
    const store = createProposalStore({ dir })
    expect(store.transition('does-not-exist', { state: 'APPROVED' })).toBeNull()
  })
})

describe('lib/proposals.mjs — durability across a restart', () => {
  it('a fresh store reading the same dir sees everything the old one wrote', () => {
    const store1 = createProposalStore({ dir })
    const p = store1.create({ source: 'judge', brand: 'DREAM Online', platform: 'wordpress', title: 't', body: 'b' })
    store1.transition(p.id, { state: 'SNOOZED' })

    // Simulate a server restart: a brand-new store instance, same dir, no shared memory.
    const store2 = createProposalStore({ dir })
    const restored = store2.get(p.id)
    expect(restored).not.toBeNull()
    expect(restored.state).toBe('SNOOZED')
    expect(restored.history.length).toBe(2)
  })

  it('rebuildIndex() ignores an orphaned patch and a corrupt line without throwing', () => {
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, '2026-01-01.jsonl'),
      '{not json}\n' + JSON.stringify({ id: 'ghost', patch: { state: 'APPROVED' }, at: 'x' }) + '\n')
    const index = rebuildIndex(dir)
    expect(index.size).toBe(0)
  })
})
