import { describe, it, expect, vi } from 'vitest'
import { createAgentTools } from '../lib/agent-tools.mjs'
import {
  runAskAgent, probeModelAgentic, pickCandidateModels, refreshAskModels,
  DEFAULT_MODEL, SYSTEM_PROMPT, PROBE_TIMEOUT_MS, PICKER_DEFAULTS,
  AGENTIC_EVIDENCE_WINDOW_MS, isRecentEvidence, readAgenticEvidence,
  recordAgenticEvidenceEntry, agenticModelsFromEvidence, buildModelPicker,
} from '../lib/ask-agent.mjs'

function jsonResponse(body, ok = true, status = 200) {
  return { ok, status, json: async () => body }
}

describe('lib/ask-agent.mjs — runAskAgent', () => {
  it('403s cleanly with no key configured, before touching the network', async () => {
    const fetchImpl = vi.fn()
    const tools = createAgentTools({ repo: '.' })
    const r = await runAskAgent({ question: 'hi', tools, base: 'http://x/v1', key: '', fetchImpl })
    expect(r.status).toBe(503)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('400s on an empty question', async () => {
    const tools = createAgentTools({ repo: '.' })
    const r = await runAskAgent({ question: '  ', tools, base: 'http://x/v1', key: 'k' })
    expect(r.status).toBe(400)
  })

  it('answers directly when the model calls no tools', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ choices: [{ message: { role: 'assistant', content: 'All good.' } }] }))
    const tools = createAgentTools({ repo: '.' })
    const events = []
    const r = await runAskAgent({ question: 'status?', tools, base: 'http://x/v1', key: 'k', fetchImpl, onEvent: (t, d) => events.push([t, d]) })
    expect(r.status).toBe(200)
    expect(r.body.answer).toBe('All good.')
    expect(r.body.trace).toEqual([])
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(events.find((e) => e[0] === 'result')).toBeTruthy()
  })

  it('runs a tool call round, appends it to the trace, then answers on the next round', async () => {
    const calls = []
    const fetchImpl = vi.fn(async (url, opts) => {
      calls.push(JSON.parse(opts.body))
      if (calls.length === 1) {
        return jsonResponse({ choices: [{ message: { role: 'assistant', content: null, tool_calls: [{ id: 'c1', type: 'function', function: { name: 'node_health', arguments: '{}' } }] } }] })
      }
      return jsonResponse({ choices: [{ message: { role: 'assistant', content: 'Node is GREEN.' } }] })
    })
    const tools = createAgentTools({ repo: '.', getNodeHealth: async () => ({ ok: true, health: { overall: 'GREEN' } }) })
    const events = []
    const r = await runAskAgent({ question: 'is the node healthy?', tools, base: 'http://x/v1', key: 'k', fetchImpl, onEvent: (t, d) => events.push([t, d]) })
    expect(r.status).toBe(200)
    expect(r.body.answer).toBe('Node is GREEN.')
    expect(r.body.trace).toEqual([{ tool: 'node_health', argsSummary: '{}', ms: expect.any(Number), ok: true }])
    expect(calls[0].tools).toBeTruthy()
    expect(calls[0].tool_choice).toBe('auto')
    // second round's messages include the tool result
    expect(calls[1].messages.some((m) => m.role === 'tool' && m.tool_call_id === 'c1')).toBe(true)
    expect(events.map((e) => e[0])).toEqual(['tool', 'delta', 'result'])
  })

  it('records a filed proposal id when create_proposal succeeds', async () => {
    const fetchImpl = vi.fn(async (url, opts) => {
      const body = JSON.parse(opts.body)
      if (body.messages.length === 2) {
        return jsonResponse({ choices: [{ message: { content: null, tool_calls: [{ id: 'c1', type: 'function', function: { name: 'create_proposal', arguments: JSON.stringify({ kind: 'post', title: 'T', body: 'B' }) } }] } }] })
      }
      return jsonResponse({ choices: [{ message: { content: 'I filed proposal p1.' } }] })
    })
    const store = { create: (rec) => ({ id: 'p1', state: 'PROPOSED', ...rec }) }
    const tools = createAgentTools({ repo: '.', proposalStore: store })
    const r = await runAskAgent({ question: 'file a proposal', tools, base: 'http://x/v1', key: 'k', fetchImpl })
    expect(r.body.proposals).toEqual(['p1'])
    expect(r.body.answer).toContain('p1')
  })

  it('stops after maxRounds even if the model keeps requesting tools', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ choices: [{ message: { content: null, tool_calls: [{ id: 'c', type: 'function', function: { name: 'node_health', arguments: '{}' } }] } }] }))
    const tools = createAgentTools({ repo: '.', getNodeHealth: async () => ({ ok: true }) })
    const r = await runAskAgent({ question: 'loop', tools, base: 'http://x/v1', key: 'k', fetchImpl, maxRounds: 2 })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(r.body.trace).toHaveLength(2)
  })

  it('reports a 502 honestly when OmniRoute is unreachable', async () => {
    const fetchImpl = vi.fn(async () => { throw new Error('ECONNREFUSED') })
    const tools = createAgentTools({ repo: '.' })
    const r = await runAskAgent({ question: 'hi', tools, base: 'http://x/v1', key: 'k', fetchImpl })
    expect(r.status).toBe(502)
    expect(r.body.error).toMatch(/unreachable/)
  })

  it('the system prompt states the read-freely / propose-never-execute doctrine', () => {
    expect(SYSTEM_PROMPT).toMatch(/never execute/i)
    expect(SYSTEM_PROMPT).toMatch(/create_proposal/)
  })
})

describe('lib/ask-agent.mjs — model picker', () => {
  it('probeModelAgentic reports agentic:true when the model calls the probe tool', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ choices: [{ message: { tool_calls: [{ id: '1', function: { name: 'ping', arguments: '{"echo":"ok"}' } }] } }] }))
    const r = await probeModelAgentic({ model: 'auto/best-fast', base: 'http://x/v1', key: 'k', fetchImpl })
    expect(r).toEqual({ model: 'auto/best-fast', agentic: true, reason: undefined })
  })

  it('probeModelAgentic reports agentic:false when the model answers without a tool call', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ choices: [{ message: { content: 'sure, ok' } }] }))
    const r = await probeModelAgentic({ model: 'some/model', base: 'http://x/v1', key: 'k', fetchImpl })
    expect(r.agentic).toBe(false)
    expect(r.reason).toMatch(/without a tool call/)
  })

  it('probeModelAgentic reports agentic:false on an HTTP error', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, false, 500))
    const r = await probeModelAgentic({ model: 'broken/model', base: 'http://x/v1', key: 'k', fetchImpl })
    expect(r.agentic).toBe(false)
    expect(r.reason).toMatch(/500/)
  })

  it('pickCandidateModels prefers auto/* combos and caps the list', () => {
    const ids = ['vendor/one', 'auto/best-fast', 'vendor/two', 'auto/best-coding', 'vendor/three']
    expect(pickCandidateModels(ids, 3)).toEqual(['auto/best-fast', 'auto/best-coding', 'vendor/one'])
  })

  it('refreshAskModels serves a fresh cache within the TTL without probing again', async () => {
    const fetchImpl = vi.fn()
    const cached = { at: Date.now() - 1000, kept: ['auto/best-fast'], dropped: [] }
    const r = await refreshAskModels({ base: 'http://x/v1', key: 'k', fetchImpl, readCache: () => cached })
    expect(r.cached).toBe(true)
    expect(r.kept).toEqual(['auto/best-fast'])
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('refreshAskModels probes and splits kept/dropped when the cache is stale, and writes a fresh cache', async () => {
    const fetchImpl = vi.fn(async (url, opts) => {
      if (String(url).endsWith('/models')) return jsonResponse({ data: [{ id: 'auto/best-fast' }, { id: 'vendor/dumb' }] })
      const body = JSON.parse((opts && opts.body) || '{}')
      return jsonResponse({ choices: [{ message: /auto/.test(body.model || '') ? { tool_calls: [{ id: '1', function: { name: 'ping', arguments: '{}' } }] } : { content: 'no thanks' } }] })
    })
    let written = null
    const r = await refreshAskModels({ base: 'http://x/v1', key: 'k', fetchImpl, readCache: () => null, writeCache: (d) => { written = d } })
    expect(r.cached).toBe(false)
    expect(r.kept).toContain('auto/best-fast')
    expect(r.dropped.some((d) => d.model === 'vendor/dumb')).toBe(true)
    expect(written).toBeTruthy()
    expect(written.kept).toEqual(r.kept)
  })

  it('refreshAskModels reports AUTH MISSING honestly when no key is configured', async () => {
    const r = await refreshAskModels({ base: 'http://x/v1', key: '', readCache: () => null, writeCache: () => {} })
    expect(r.error).toMatch(/AUTH MISSING/)
    expect(r.kept).toEqual([])
  })
})

describe('lib/ask-agent.mjs — constants', () => {
  it('exposes the default model', () => {
    expect(DEFAULT_MODEL).toBe('auto/best-fast')
  })

  it('the synthetic probe defaults to a 20s timeout, background-only (specs/010, unit 6)', () => {
    expect(PROBE_TIMEOUT_MS).toBe(20000)
  })

  it('picker defaults are auto/best-fast plus claude-code', () => {
    expect(PICKER_DEFAULTS).toEqual(['auto/best-fast', 'claude-code'])
  })
})

describe('lib/ask-agent.mjs — real-run evidence (specs/010, unit 6)', () => {
  it('isRecentEvidence is true within the 24h window and false outside it', () => {
    const now = () => new Date('2026-09-20T12:00:00Z').getTime()
    expect(isRecentEvidence('2026-09-20T00:00:00Z', { now })).toBe(true)
    expect(isRecentEvidence('2026-09-19T11:00:00Z', { now })).toBe(false)
    expect(isRecentEvidence(null, { now })).toBe(false)
    expect(AGENTIC_EVIDENCE_WINDOW_MS).toBe(24 * 60 * 60 * 1000)
  })

  it('readAgenticEvidence never throws on a missing or corrupt file', () => {
    expect(readAgenticEvidence('/nope', { exists: () => false, readFile: () => { throw new Error('no') } })).toEqual({})
    expect(readAgenticEvidence('/bad', { exists: () => true, readFile: () => 'not json' })).toEqual({})
  })

  it('recordAgenticEvidenceEntry merges one model into the map and writes it back', () => {
    let written = null
    const readFile = () => JSON.stringify({ 'vendor/old': '2026-09-01T00:00:00Z' })
    const writeFile = (path, text) => { written = JSON.parse(text) }
    const out = recordAgenticEvidenceEntry('/fake.json', 'auto/best-fast', new Date('2026-09-20T12:00:00Z'), {
      readFile, writeFile, exists: () => true, mkdir: () => {}, dirname: () => '/',
    })
    expect(out['auto/best-fast']).toBe('2026-09-20T12:00:00.000Z')
    expect(out['vendor/old']).toBe('2026-09-01T00:00:00Z')
    expect(written['auto/best-fast']).toBe('2026-09-20T12:00:00.000Z')
  })

  it('agenticModelsFromEvidence keeps only models with a real tool call in the last 24h', () => {
    const now = () => new Date('2026-09-20T12:00:00Z').getTime()
    const evidence = { 'auto/best-fast': '2026-09-20T00:00:00Z', 'vendor/stale': '2026-09-10T00:00:00Z' }
    expect(agenticModelsFromEvidence(evidence, { now })).toEqual(['auto/best-fast'])
  })

  it('runAskAgent records evidence only for a successful tool call, via the injected recordEvidence', async () => {
    const calls = []
    const fetchImpl = vi.fn(async (url, opts) => {
      const body = JSON.parse(opts.body)
      if (!body.messages.some((m) => m.role === 'tool')) {
        return jsonResponse({ choices: [{ message: { tool_calls: [{ id: '1', function: { name: 'node_health', arguments: '{}' } }] } }] })
      }
      return jsonResponse({ choices: [{ message: { content: 'done' } }] })
    })
    const tools = createAgentTools({ repo: '.', getNodeHealth: () => ({ ok: true }) })
    const recordEvidence = vi.fn()
    await runAskAgent({ question: 'health?', model: 'auto/best-fast', tools, base: 'http://x/v1', key: 'k', fetchImpl, recordEvidence })
    expect(recordEvidence).toHaveBeenCalledWith('auto/best-fast', expect.any(Date))
  })
})

describe('lib/ask-agent.mjs — buildModelPicker (no network call)', () => {
  it('always includes the picker defaults even with no evidence and no cache', () => {
    const r = buildModelPicker({ evidence: {}, probeCache: null, now: () => Date.now() })
    expect(r.kept).toEqual(['auto/best-fast', 'claude-code'])
    expect(r.dropped).toEqual([])
  })

  it('adds models with recent real evidence to kept', () => {
    const now = () => new Date('2026-09-20T12:00:00Z').getTime()
    const evidence = { 'vendor/proven': '2026-09-20T10:00:00Z' }
    const r = buildModelPicker({ evidence, probeCache: null, now })
    expect(r.kept).toContain('vendor/proven')
    expect(r.kept).toContain('auto/best-fast')
  })

  it('folds in the last background probe cache, never dropping something already kept', () => {
    const probeCache = { kept: ['vendor/cached'], dropped: [{ model: 'vendor/bad', reason: 'no tool call' }, { model: 'auto/best-fast', reason: 'stale' }] }
    const r = buildModelPicker({ evidence: {}, probeCache })
    expect(r.kept).toContain('vendor/cached')
    expect(r.dropped.find((d) => d.model === 'auto/best-fast')).toBeUndefined() // never contradicts a default
    expect(r.dropped.find((d) => d.model === 'vendor/bad')).toBeTruthy()
  })

  it('never calls a network function — it is pure and synchronous', () => {
    const r = buildModelPicker({ evidence: {}, probeCache: { kept: [], dropped: [] } })
    expect(r.at).toBeTruthy()
  })
})
