import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { LANES, TRACKS, FOUNDER_BOARD, joinLaneStatus, resolveTracks, trustPathOf, readAttestations, filedDateOf, composeBoardRoom, AFFILIATE_BRIEF, AFFILIATE_TERMS } from '../lib/lanes.mjs'
import { clearDriftCache } from '../lib/drift.mjs'
import { BRIDGE_IDS } from '../lib/bridges.mjs'
import { HARNESSES } from '../lib/fleet.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CONNECTS = ['official CLI', 'gateway', 'ACP', 'API', 'browser', 'hosted link', 'relay']
const NODES = ['sabretooth', 'alienware', 'pi', 'cloud', 'browser']
const byId = (id) => LANES.find((l) => l.id === id)

describe('lib/lanes.mjs registry', () => {
  it('holds the nine ruled lanes, each with the required fields and a known connection and node', () => {
    expect(LANES.map((l) => l.id)).toEqual(['claude', 'codex', 'hermes', 'opencode', 'openclaw', 'gemini', 'emergent', 'genspark', 'buzz'])
    for (const l of LANES) {
      for (const k of ['id', 'name', 'role', 'connects', 'note']) expect(typeof l[k], `${l.id}.${k}`).toBe('string')
      expect(CONNECTS).toContain(l.connects)
      expect(Array.isArray(l.node) && l.node.length > 0).toBe(true)
      for (const n of l.node) expect(NODES).toContain(n)
    }
  })

  it('every bridgeId is a real bridge and every fleetId a real fleet lane (no orphan probe references)', () => {
    for (const l of LANES) {
      if (l.bridgeId) expect(BRIDGE_IDS).toContain(l.bridgeId)
      if (l.fleetId) expect(HARNESSES).toContain(l.fleetId)
    }
  })

  it('every named journal exists in this checkout', () => {
    for (const l of LANES) if (l.journal) expect(fs.existsSync(path.join(root, '..', l.journal)), l.journal).toBe(true)
  })

  it('encodes the 2026-09-29 rulings: the official CLIs, Hermes is JARVIS, Gemini browser-side, Emergent hosted, Buzz never executes', () => {
    expect(byId('claude')).toMatchObject({ connects: 'official CLI', bridgeId: 'claude', journal: '.agents/journals/claude-judge/STATE.md' })
    expect(byId('claude').node).toEqual(['sabretooth', 'alienware', 'cloud'])
    expect(byId('codex')).toMatchObject({ connects: 'official CLI', bridgeId: 'codex', node: ['sabretooth'] })
    expect(byId('hermes')).toMatchObject({ connects: 'gateway', bridgeId: 'hermes', fleetId: 'hermes' })
    expect(byId('hermes').role).toMatch(/is JARVIS/)
    expect(byId('opencode')).toMatchObject({ connects: 'ACP', fleetId: 'opencode', node: ['sabretooth'] })
    expect(byId('openclaw')).toMatchObject({ connects: 'API', node: ['pi'], bridgeId: 'openclaw', fleetId: 'openclaw' })
    // Gemini is browser-side; the Pi is a note, never a node the row claims (no Pi row exists yet).
    expect(byId('gemini')).toMatchObject({ connects: 'browser', node: ['browser'], role: 'browser lane', bridgeId: 'gemini' })
    expect(byId('gemini').note).toMatch(/Pi/)
    expect(byId('gemini').note).toMatch(/No API key is held on Sabretooth or Alienware/)
    expect(byId('emergent')).toMatchObject({ connects: 'hosted link', node: ['cloud'], bridgeId: 'emergent', fleetId: 'emergent' })
    expect(byId('genspark')).toMatchObject({ connects: 'hosted link', fleetId: 'genspark' })
    expect(byId('buzz')).toMatchObject({ connects: 'relay', bridgeId: 'buzz' })
    expect(byId('buzz').note).toMatch(/not a runtime by ruling 2026-09-29/)
    expect(byId('buzz').note).toMatch(/never executes/)
  })

  it('carries no em dash and no loopback host name anywhere in the data', () => {
    const text = JSON.stringify(LANES)
    expect(text).not.toMatch(/\u2014/)
    expect(text).not.toMatch(/local[h]ost/i)
  })
})

describe('joinLaneStatus', () => {
  const bridges = { bridges: [
    { id: 'claude', status: 'UP', identity: '2.1.275 (Claude Code)' },
    { id: 'hermes', status: 'UP', identity: 'gateway marker ok (hermes-agent)' },
    { id: 'openclaw', status: 'DOWN', identity: 'no OpenClaw marker in response' },
    { id: 'emergent', status: 'LINKED', identity: 'Emergent wing chat', url: 'https://app.emergent.sh/wing?wm=x' },
    { id: 'gemini', status: 'NOT CONFIGURED', identity: 'Gemini in Chrome: browser-side, nothing on this node to probe' },
    { id: 'buzz', status: 'UP', identity: '3 ledger line(s)' },
  ] }
  const fleet = { rows: [
    { lane: 'hermes', status: 'UP', currentTask: 'shipped the thing', queueDepth: 2, tokenSpendToday: null, source: 'unavailable' },
    { lane: 'openclaw', status: 'UP', currentTask: null, queueDepth: 0 },
    { lane: 'opencode', status: 'NOT CONFIGURED', currentTask: 'checked identity', queueDepth: 1 },
    { lane: 'emergent', status: 'NOT CONFIGURED', currentTask: null, queueDepth: 0 },
    { lane: 'genspark', status: 'NOT CONFIGURED', currentTask: null, queueDepth: 0 },
  ] }
  const joined = joinLaneStatus(LANES, { bridges, fleet })
  const row = (id) => joined.find((l) => l.id === id)

  it('returns one row per lane, in registry order, keeping every registry field', () => {
    expect(joined.map((l) => l.id)).toEqual(LANES.map((l) => l.id))
    expect(row('claude')).toMatchObject({ name: 'Claude Code', connects: 'official CLI', journal: '.agents/journals/claude-judge/STATE.md' })
  })

  it('takes the identity-checked bridge row first, and keeps both rows attached', () => {
    expect(row('claude')).toMatchObject({ status: 'UP', detail: '2.1.275 (Claude Code)', source: 'bridge', bridge: { id: 'claude', status: 'UP' }, fleet: null })
    expect(row('hermes')).toMatchObject({ status: 'UP', source: 'bridge', fleet: { status: 'UP', currentTask: 'shipped the thing', queueDepth: 2 } })
    // the bridge says DOWN while the fleet port answered: the identity check wins, the fleet row stays visible
    expect(row('openclaw')).toMatchObject({ status: 'DOWN', bridge: { status: 'DOWN' }, fleet: { status: 'UP' } })
  })

  it('a hosted link stays LINKED (never UP) and carries its url', () => {
    expect(row('emergent')).toMatchObject({ status: 'LINKED', source: 'bridge', bridge: { url: 'https://app.emergent.sh/wing?wm=x' } })
    expect(row('emergent').fleet).toMatchObject({ status: 'NOT CONFIGURED' })
  })

  it('a NOT CONFIGURED bridge row keeps its own reason', () => {
    expect(row('gemini')).toMatchObject({ status: 'NOT CONFIGURED', source: 'bridge' })
    expect(row('gemini').detail).toMatch(/browser-side/)
  })

  it('a lane with only a NOT CONFIGURED fleet row says so, and never invents a bridge', () => {
    expect(row('opencode')).toMatchObject({ status: 'NOT CONFIGURED', source: 'fleet', bridge: null, detail: 'no probe target configured for this lane' })
    expect(row('genspark')).toMatchObject({ status: 'NOT CONFIGURED', source: 'fleet' })
  })

  it('falls back to the fleet row when there is no bridge row for the lane', () => {
    const r = joinLaneStatus([{ id: 'x', name: 'X', fleetId: 'x' }], { fleet: { rows: [{ lane: 'x', status: 'DOWN', currentTask: null, queueDepth: 0 }] } })[0]
    expect(r).toMatchObject({ status: 'DOWN', source: 'fleet', detail: 'fleet probe did not answer', bridge: null })
  })

  it('with neither payload every lane is NOT CONFIGURED: no probe on this node', () => {
    for (const l of joinLaneStatus(LANES, {})) {
      expect(l).toMatchObject({ status: 'NOT CONFIGURED', detail: 'no probe on this node', source: null, bridge: null, fleet: null })
    }
    expect(joinLaneStatus(LANES)).toHaveLength(LANES.length)
  })

  it('a lane with no bridgeId and no fleetId is NOT CONFIGURED even when the payloads hold other lanes', () => {
    const r = joinLaneStatus([{ id: 'ghost', name: 'Ghost' }], { bridges, fleet })[0]
    expect(r).toMatchObject({ status: 'NOT CONFIGURED', detail: 'no probe on this node' })
  })

  it('accepts bare arrays, and never mutates the registry or the payloads', () => {
    const before = JSON.stringify(LANES)
    const beforeBridges = JSON.stringify(bridges)
    const arr = joinLaneStatus(LANES, { bridges: bridges.bridges, fleet: fleet.rows })
    expect(arr.find((l) => l.id === 'buzz').status).toBe('UP')
    expect(JSON.stringify(LANES)).toBe(before)
    expect(JSON.stringify(bridges)).toBe(beforeBridges)
    expect(LANES[0]).not.toHaveProperty('status')
  })

  it('does not copy secret-shaped or extra bridge fields onto the lane', () => {
    const r = joinLaneStatus([{ id: 'claude', bridgeId: 'claude' }], { bridges: { bridges: [{ id: 'claude', status: 'UP', identity: 'ok', canRun: true, lastChecked: 'x', key: 'k' }] } })[0]
    // lastChecked is kept on purpose: an UP or DOWN without a time is a claim with no evidence.
    expect(r.bridge).toEqual({ id: 'claude', status: 'UP', identity: 'ok', lastChecked: 'x' })
  })
})

describe('TRACKS registry', () => {
  it('is the ruled think tank list: the mission, marketing, and three collabs with no lead or record yet', () => {
    expect(TRACKS).toEqual([
      { id: 'mission', name: '#UntilNoKidInNeed', kind: 'mission', lead: 'joshua', record: 'domains/untilnokidinneed.com/dao/index.html' },
      { id: 'marketing', name: 'Marketing collab', kind: 'collab', lead: 'emergent', record: 'ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md' },
      { id: 'education', name: 'Education collab', kind: 'collab', lead: null, record: null },
      { id: 'pet-saving', name: 'Pet saving collab', kind: 'collab', lead: null, record: null },
      { id: 'joshua-learning', name: 'Joshua is learning collab', kind: 'collab', lead: null, record: null },
    ])
  })
  it('the two named records exist in this checkout', () => {
    for (const t of TRACKS) if (t.record) expect(fs.existsSync(path.join(root, '..', ...t.record.split('/'))), t.record).toBe(true)
  })
  it('carries no em dash', () => {
    expect(JSON.stringify(TRACKS)).not.toMatch(/\u2014/)
  })
})

describe('resolveTracks', () => {
  const only = (...present) => ({ repoRoot: '/repo', exists: (p) => present.map((r) => path.join('/repo', ...r.split('/'))).includes(p) })

  it('ON RECORD with recordExists true when the record file is on disk', () => {
    const r = resolveTracks(TRACKS, only('domains/untilnokidinneed.com/dao/index.html', 'ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md'))
    expect(r.find((t) => t.id === 'mission')).toMatchObject({ recordExists: true, status: 'ON RECORD', lead: 'joshua' })
    expect(r.find((t) => t.id === 'marketing')).toMatchObject({ recordExists: true, status: 'ON RECORD', lead: 'emergent' })
    expect(r.find((t) => t.id === 'mission')).not.toHaveProperty('detail')
  })

  it('NOT CONFIGURED with "no record on disk yet" when the named record is missing, or no record is named', () => {
    const r = resolveTracks(TRACKS, only())
    for (const t of r) expect(t).toMatchObject({ recordExists: false, status: 'NOT CONFIGURED', detail: 'no record on disk yet' })
    expect(r).toHaveLength(5)
  })

  it('never checks the disk for a track with no record', () => {
    const seen = []
    resolveTracks(TRACKS, { repoRoot: '/repo', exists: (p) => { seen.push(p); return false } })
    expect(seen).toHaveLength(2)
  })

  it('does not mutate the registry', () => {
    const before = JSON.stringify(TRACKS)
    resolveTracks(TRACKS, only())
    expect(JSON.stringify(TRACKS)).toBe(before)
    expect(TRACKS[0]).not.toHaveProperty('status')
  })
})

describe('readAttestations', () => {
  const MTIME = Date.parse('2026-09-30T08:15:00Z')
  const trust = (rel) => path.join('/repo', ...rel.split('/'))
  const fsWith = (files) => ({
    repoRoot: '/repo',
    exists: (p) => Object.hasOwn(files, p),
    readFile: (p) => { const v = files[p]; if (v instanceof Error) throw v; return v },
    stat: () => ({ mtimeMs: MTIME }),
  })

  it('looks for .agents/journals/<lane>/TRUST.md, with claude-judge for Claude Code', () => {
    expect(trustPathOf({ id: 'claude', journal: '.agents/journals/claude-judge/STATE.md' })).toBe('.agents/journals/claude-judge/TRUST.md')
    expect(trustPathOf({ id: 'hermes', journal: '.agents/journals/hermes/STATE.md' })).toBe('.agents/journals/hermes/TRUST.md')
    expect(trustPathOf({ id: 'codex' })).toBe('.agents/journals/codex/TRUST.md')
    expect(trustPathOf({ id: 'gemini' })).toBe('.agents/journals/gemini/TRUST.md')
  })

  it('FILED with the date from the file\'s own Filed line, the line count, and the checkout time kept apart as modifiedAt', () => {
    const r = readAttestations(LANES, fsWith({ [trust('.agents/journals/claude-judge/TRUST.md')]: '# Claude\n\nFiled 2026-09-29 by the Claude judge lane.\n', [trust('.agents/journals/codex/TRUST.md')]: 'a\r\nb' }))
    // Git keeps no file times: a clone on 09-30 must not turn a record filed on 09-29 into "FILED 2026-09-30".
    expect(r.find((a) => a.lane === 'claude')).toEqual({ lane: 'claude', status: 'FILED', lines: 3, filedAt: '2026-09-29', modifiedAt: '2026-09-30T08:15:00.000Z' })
    expect(r.find((a) => a.lane === 'codex')).toEqual({ lane: 'codex', status: 'FILED', lines: 2, modifiedAt: '2026-09-30T08:15:00.000Z' })
    expect(r.find((a) => a.lane === 'codex')).not.toHaveProperty('filedAt')
    expect(r.find((a) => a.lane === 'codex')).not.toHaveProperty('at')
  })

  it('filedDateOf reads "Filed <date>" at a line start, in a bullet, in any case, and nothing else', () => {
    expect(filedDateOf('Filed 2026-09-29')).toBe('2026-09-29')
    expect(filedDateOf('- filed 2026-01-02 by codex')).toBe('2026-01-02')
    expect(filedDateOf('* FILED 2025-12-31')).toBe('2025-12-31')
    expect(filedDateOf('This was filed 2026-09-29 later in a sentence')).toBeNull()
    expect(filedDateOf('Filed yesterday')).toBeNull()
    expect(filedDateOf('')).toBeNull()
  })

  it('NOT FILED for every lane with no TRUST.md, one entry per lane in registry order', () => {
    const r = readAttestations(LANES, fsWith({}))
    expect(r.map((a) => a.lane)).toEqual(LANES.map((l) => l.id))
    for (const a of r) expect(a).toEqual({ lane: a.lane, status: 'NOT FILED' })
  })

  it('an empty TRUST.md is not an attestation, and an unreadable one says why instead of passing as filed', () => {
    const r = readAttestations(LANES, fsWith({
      [trust('.agents/journals/hermes/TRUST.md')]: '  \n\n',
      [trust('.agents/journals/opencode/TRUST.md')]: Object.assign(new Error('denied'), { code: 'EACCES' }),
    }))
    expect(r.find((a) => a.lane === 'hermes')).toEqual({ lane: 'hermes', status: 'NOT FILED', detail: 'TRUST.md is empty' })
    expect(r.find((a) => a.lane === 'opencode')).toEqual({ lane: 'opencode', status: 'NOT FILED', detail: 'TRUST.md could not be read (EACCES)' })
  })

  it('reads nothing but TRUST.md and writes nothing', () => {
    const touched = []
    readAttestations(LANES, { repoRoot: '/repo', exists: (p) => { touched.push(p); return false } })
    for (const p of touched) expect(p.endsWith('TRUST.md')).toBe(true)
  })

  it('runs against the real checkout with the default fs, reporting only FILED or NOT FILED', () => {
    const r = readAttestations(LANES, { repoRoot: path.join(root, '..') })
    for (const a of r) expect(['FILED', 'NOT FILED']).toContain(a.status)
  })
})

describe('composeBoardRoom', () => {
  const bridges = { bridges: [{ id: 'claude', status: 'UP', identity: '2.1.275 (Claude Code)' }, { id: 'emergent', status: 'LINKED', identity: 'Emergent wing chat', url: 'https://app.emergent.sh/wing?wm=x' }] }
  const fleet = { rows: [{ lane: 'hermes', status: 'UP', currentTask: 'shipped it', queueDepth: 1 }] }
  const NOW = Date.parse('2026-09-29T12:00:00Z')
  const onDisk = (...rels) => rels.map((r) => path.join('/repo', ...r.split('/')))
  const base = (present = []) => ({
    getBridges: async () => bridges, getFleet: async () => fleet,
    wingUrl: 'https://app.emergent.sh/wing?wm=x', cloudUrl: 'https://dashboard.aidoesitall.website/', now: () => NOW,
    repoRoot: '/repo',
    fs: { exists: (p) => present.includes(p), readFile: () => 'attested\nlines\n', stat: () => ({ mtimeMs: NOW }) },
  })
  beforeEach(() => clearDriftCache())

  it('returns lanes, attestations, tracks, drift, affiliate, founderBoard, cloud and at, and no vote', async () => {
    const r = await composeBoardRoom(base())
    expect(Object.keys(r)).toEqual(['lanes', 'attestations', 'tracks', 'drift', 'affiliate', 'founderBoard', 'cloud', 'at'])
    expect(r).not.toHaveProperty('vote')
    expect(r.lanes.map((l) => l.id)).toEqual(LANES.map((l) => l.id))
    expect(r.lanes.find((l) => l.id === 'claude')).toMatchObject({ status: 'UP', source: 'bridge' })
    expect(r.lanes.find((l) => l.id === 'emergent')).toMatchObject({ status: 'LINKED' })
    expect(r.lanes.find((l) => l.id === 'hermes').fleet).toMatchObject({ currentTask: 'shipped it', queueDepth: 1 })
    expect(r.cloud).toBe('https://dashboard.aidoesitall.website/')
    expect(r.at).toBe(new Date(NOW).toISOString())
  })

  it('points at the founder\'s ClawX board, which keeps the vote', async () => {
    const r = await composeBoardRoom(base())
    expect(r.founderBoard).toEqual({ tab: 'board', note: "the founder's ClawX board is the Supreme Court; votes stay there, never here. This room is the House. Claude and Codex validate the code's security first, then the rabbit gets to debate (Joshua, 2026-09-29)" })
    expect(FOUNDER_BOARD).toEqual(r.founderBoard)
    expect(JSON.stringify(r.founderBoard)).not.toMatch(/call the vote/i)
  })

  it('gives every track a recordExists and an honest status from the injected disk', async () => {
    const none = await composeBoardRoom(base())
    expect(none.tracks.map((t) => t.status)).toEqual(['NOT CONFIGURED', 'NOT CONFIGURED', 'NOT CONFIGURED', 'NOT CONFIGURED', 'NOT CONFIGURED'])
    const some = await composeBoardRoom(base(onDisk('domains/untilnokidinneed.com/dao/index.html', AFFILIATE_BRIEF)))
    expect(some.tracks.map((t) => [t.id, t.status, t.recordExists])).toEqual([
      ['mission', 'ON RECORD', true], ['marketing', 'ON RECORD', true], ['education', 'NOT CONFIGURED', false], ['pet-saving', 'NOT CONFIGURED', false], ['joshua-learning', 'NOT CONFIGURED', false],
    ])
    expect(some.tracks.find((t) => t.id === 'education').detail).toBe('no record on disk yet')
  })

  it('gives every lane an attestation: FILED where TRUST.md exists, NOT FILED elsewhere', async () => {
    const r = await composeBoardRoom(base(onDisk('.agents/journals/claude-judge/TRUST.md')))
    expect(r.attestations).toHaveLength(LANES.length)
    expect(r.attestations.find((a) => a.lane === 'claude')).toEqual({ lane: 'claude', status: 'FILED', modifiedAt: new Date(NOW).toISOString(), lines: 2 })
    expect(r.attestations.filter((a) => a.status === 'NOT FILED')).toHaveLength(LANES.length - 1)
  })

  it('carries the affiliate terms verbatim, the wing link, and whether the brief is on disk', async () => {
    const r = await composeBoardRoom(base(onDisk(AFFILIATE_BRIEF)))
    expect(r.affiliate).toEqual({
      wing: 'https://app.emergent.sh/wing?wm=x',
      brief: 'ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md',
      briefExists: true,
      terms: 'Founding Member $14.99/mo, 3 months $39.99, 12 months $99.99; up to 50% of net, lifetime of the referred subscription',
    })
    expect(AFFILIATE_BRIEF).toBe(r.affiliate.brief)
    expect(AFFILIATE_TERMS).toBe(r.affiliate.terms)
    const missing = await composeBoardRoom({ ...base(), wingUrl: '', cloudUrl: '' })
    expect(missing.affiliate).toMatchObject({ wing: null, briefExists: false })
    expect(missing.cloud).toBeNull()
  })

  it('reads each injected builder exactly once (the lane rows share the routes\' probes, no second set)', async () => {
    let b = 0, f = 0
    await composeBoardRoom({ ...base(), getBridges: async () => { b++; return bridges }, getFleet: async () => { f++; return fleet } })
    expect([b, f]).toEqual([1, 1])
  })

  it('without a GitHub token the drift entry is NOT CONFIGURED and GitHub is never called', async () => {
    let calls = 0
    const r = await composeBoardRoom({ ...base(), token: '', fetchImpl: async () => { calls++; return { status: 200, json: async () => [] } } })
    expect(r.drift).toEqual({ status: 'NOT CONFIGURED', detail: 'GITHUB_TOKEN not set; the drift board reads GitHub through the server and never from the page' })
    expect(calls).toBe(0)
  })

  it('with a token it reads GitHub through the injected fetch and never returns the token', async () => {
    const seen = []
    const fetchImpl = async (url, opts) => {
      seen.push(opts.headers.Authorization)
      if (/\/branches/.test(url)) return { status: 200, json: async () => [{ name: 'main' }, { name: 'claude/x', commit: { sha: 's' } }] }
      if (/\/pulls/.test(url)) return { status: 200, json: async () => [] }
      return { status: 200, json: async () => ({ ahead_by: 0, behind_by: 1, commits: [] }) }
    }
    const r = await composeBoardRoom({ ...base(), token: 'ghp_fakeTEST456', fetchImpl })
    expect(Array.isArray(r.drift)).toBe(true)
    expect(r.drift).toHaveLength(2)
    expect(r.drift[0].branches[0]).toMatchObject({ name: 'claude/x', lane: 'claude', status: 'DEAD' })
    expect(new Set(seen)).toEqual(new Set(['Bearer ghp_fakeTEST456']))
    expect(JSON.stringify(r)).not.toContain('ghp_fakeTEST456')
  })

  it('a reader that throws is not hidden as "no probe on this node"', async () => {
    await expect(composeBoardRoom({ ...base(), getBridges: async () => { throw new Error('probe crashed') } })).rejects.toThrow('probe crashed')
  })

  it('with no readers and an empty disk every lane is NOT CONFIGURED and every seat NOT FILED', async () => {
    const r = await composeBoardRoom({ now: () => NOW, repoRoot: '/repo', fs: { exists: () => false } })
    for (const l of r.lanes) expect(l).toMatchObject({ status: 'NOT CONFIGURED', detail: 'no probe on this node' })
    for (const a of r.attestations) expect(a.status).toBe('NOT FILED')
  })
})
