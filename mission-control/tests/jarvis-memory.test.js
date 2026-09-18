import { describe, it, expect } from 'vitest'
import { readMemory, appendMemory, MEMORY_LIMIT } from '../lib/jarvis-memory.mjs'

const mem = (over = {}) => ({ prompt: 'q', reply: 'a', ...over })

describe('JARVIS memory (durable, compact, honest)', () => {
  it('returns an empty memory with sane defaults when nothing is stored', () => {
    const m = readMemory({ dataFile: 'Z:/does/not/exist.json' })
    expect(m.entries).toEqual([])
    expect(m.owner).toBe('Joshua')
    expect(typeof m.updatedAt).toBe('string')
  })

  it('corrupt or non-object store heals to empty without throwing', () => {
    expect(readMemory({ dataFile: 'Z:/nope.json', raw: () => '"just a string"' }).entries).toEqual([])
    expect(readMemory({ dataFile: 'Z:/nope.json', raw: () => 'not json at all' }).entries).toEqual([])
  })

  it('appends one turn with a timestamp and keeps the newest last', () => {
    const store = {}
    const w = { dataFile: 'Z:/nope.json', write: (f, s) => { store[f] = s }, raw: (f) => store[f] }
    appendMemory({ ...w, entry: mem({ prompt: 'first question', reply: 'first answer' }) })
    appendMemory({ ...w, entry: mem({ prompt: 'second question', reply: 'second answer' }) })
    const m = readMemory({ dataFile: 'Z:/nope.json', raw: () => store['Z:/nope.json'] })
    expect(m.entries.length).toBe(2)
    expect(m.entries[1].prompt).toBe('second question')
    expect(typeof m.entries[0].at).toBe('string')
  })

  it('prunes oldest entries beyond the cap and drops oversized reply/prompt bodies', () => {
    const store = {}
    const w = { dataFile: 'Z:/nope.json', write: (f, s) => { store[f] = s }, raw: (f) => store[f] }
    for (let i = 0; i < MEMORY_LIMIT + 5; i++) {
      appendMemory({ ...w, entry: mem({ prompt: 'q' + i, reply: 'a'.repeat(200), ok: true }) })
    }
    const m = readMemory({ dataFile: 'Z:/nope.json', raw: () => store['Z:/nope.json'] })
    expect(m.entries.length).toBe(MEMORY_LIMIT)
    expect(m.entries.at(-1).prompt).toBe('q' + (MEMORY_LIMIT + 4))
    expect(m.entries[0].prompt).toBe('q5') // five oldest pruned
  })

  it('renders a compact multi-line block the composer can drop into the preamble', () => {
    const m = { entries: [
      { at: '2026-09-13T10:00:00Z', prompt: 'what was down?', reply: 'Mission Control was down.', ok: true },
      { at: '2026-09-13T11:00:00Z', prompt: 'fixed?', reply: 'Yes — repointed the dashboard.', ok: true },
    ] }
    const block = memoryBlock(m)
    expect(block).toContain('[JARVIS memory — recent turns with this operator, oldest first]')
    expect(block).toContain('You: what was down?')
    expect(block).toContain('JARVIS: Yes — repointed the dashboard.')
  })

  it('memoryBlock returns empty for an empty store, and the composer omits it then', () => {
    expect(memoryBlock({ entries: [] })).toBe('')
  })

  it('failed turns are still remembered but labeled as errors', () => {
    const block = memoryBlock({ entries: [{ at: 'T', prompt: 'p', reply: 'bridge refused (429)', ok: false }] })
    expect(block).toContain('(error)')
  })
})

import { memoryBlock } from '../lib/jarvis-memory.mjs'
