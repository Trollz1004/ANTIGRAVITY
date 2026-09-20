import { describe, it, expect, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import {
  autoReviewEnabled, nyDay, reviewedTodayCount, passesMechanicalChecks,
  buildReviewPrompt, parseVerdict, runClaudeReview, reviewAndMaybeExecute,
  REVIEW_ACTOR, DAILY_CAP_PER_BRAND,
} from '../lib/social-review.mjs'

function fakeChild({ stdout = '', stderr = '', exitCode = 0, spawnError = null, neverClose = false } = {}) {
  const child = new EventEmitter()
  child.stdout = new EventEmitter()
  child.stderr = new EventEmitter()
  child.stdin = { write: vi.fn(), end: vi.fn() }
  child.kill = vi.fn()
  process.nextTick(() => {
    if (spawnError) { child.emit('error', spawnError); return }
    if (neverClose) return // simulate a hang — the caller's own timer must fire
    if (stdout) child.stdout.emit('data', stdout)
    if (stderr) child.stderr.emit('data', stderr)
    child.emit('close', exitCode)
  })
  return child
}

describe('lib/social-review.mjs — autoReviewEnabled', () => {
  it('is only true for the exact value "fable"', () => {
    expect(autoReviewEnabled((n) => (n === 'JARVIS_AUTO_REVIEW_SOCIAL' ? 'fable' : ''))).toBe(true)
    expect(autoReviewEnabled((n) => (n === 'JARVIS_AUTO_REVIEW_SOCIAL' ? 'Fable' : ''))).toBe(true)
    expect(autoReviewEnabled((n) => '')).not.toBe(true)
  })
})

describe('lib/social-review.mjs — passesMechanicalChecks', () => {
  it('requires compliance to pass, and adultVenue/businessOnly when present', () => {
    expect(passesMechanicalChecks({ compliance: { pass: true } })).toBe(true)
    expect(passesMechanicalChecks({ compliance: { pass: false } })).toBe(false)
    expect(passesMechanicalChecks({ compliance: { pass: true }, adultVenue: { pass: false } })).toBe(false)
    expect(passesMechanicalChecks({ compliance: { pass: true }, adultVenue: { pass: true }, businessOnly: { pass: true } })).toBe(true)
  })
})

describe('lib/social-review.mjs — nyDay / reviewedTodayCount', () => {
  it('formats a stable YYYY-MM-DD for America/New_York', () => {
    expect(nyDay(new Date('2026-09-20T02:00:00Z'))).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('counts only fable-lane-reviewed, same-brand, same-NY-day APPROVED/EXECUTED proposals', () => {
    const now = () => new Date('2026-09-20T15:00:00Z')
    const proposals = [
      { source: 'social', brand: 'youandinotai', state: 'EXECUTED', reviewActor: REVIEW_ACTOR, reviewedAt: '2026-09-20T14:00:00Z' },
      { source: 'social', brand: 'youandinotai', state: 'APPROVED', reviewActor: REVIEW_ACTOR, reviewedAt: '2026-09-20T13:00:00Z' },
      { source: 'social', brand: 'youandinotai', state: 'APPROVED', reviewActor: 'someone else', reviewedAt: '2026-09-20T13:00:00Z' },
      { source: 'social', brand: 'DREAM Online', state: 'EXECUTED', reviewActor: REVIEW_ACTOR, reviewedAt: '2026-09-20T13:00:00Z' },
      { source: 'social', brand: 'youandinotai', state: 'REJECTED', reviewActor: REVIEW_ACTOR, reviewedAt: '2026-09-20T13:00:00Z' },
    ]
    expect(reviewedTodayCount(proposals, 'youandinotai', { now })).toBe(2)
  })
})

describe('lib/social-review.mjs — parseVerdict', () => {
  it('parses a clean JSON verdict', () => {
    expect(parseVerdict('{"approve": true, "reasons": ["fine"]}')).toEqual({ approve: true, reasons: ['fine'] })
  })
  it('tolerates surrounding prose/fencing', () => {
    expect(parseVerdict('```json\n{"approve": false, "reasons": ["no promises"]}\n```')).toEqual({ approve: false, reasons: ['no promises'] })
  })
  it('returns null for unparsable output', () => {
    expect(parseVerdict('not json at all')).toBe(null)
    expect(parseVerdict('')).toBe(null)
  })
})

describe('lib/social-review.mjs — buildReviewPrompt', () => {
  it('embeds the rubric and the proposal fields', () => {
    const p = buildReviewPrompt({ rubric: 'RUBRIC TEXT', proposal: { brand: 'youandinotai', platform: 'reddit', title: 't', body: 'b' } })
    expect(p).toContain('RUBRIC TEXT')
    expect(p).toContain('youandinotai')
    expect(p).toContain('reddit')
    expect(p).toMatch(/JSON object/i)
  })
})

describe('lib/social-review.mjs — runClaudeReview (mocked spawn)', () => {
  const proposal = { id: 'p1', brand: 'youandinotai', platform: 'x', title: 't', body: 'b' }
  const readFile = () => 'RUBRIC'

  it('spawns claude -p --model sonnet --max-turns 3 with shell:false and no permission flags', async () => {
    const spawnImpl = vi.fn(() => fakeChild({ stdout: '{"approve": true, "reasons": ["ok"]}' }))
    await runClaudeReview({ proposal, rubricPath: 'x', spawnImpl, readFile })
    expect(spawnImpl).toHaveBeenCalledWith('claude', ['-p', '--model', 'sonnet', '--max-turns', '3'], { shell: false })
    const args = spawnImpl.mock.calls[0][1]
    expect(args.some((a) => /^--/.test(a) && /permission/i.test(a))).toBe(false)
  })

  it('resolves approved on {"approve":true}', async () => {
    const spawnImpl = () => fakeChild({ stdout: '{"approve": true, "reasons": ["passes rubric"]}' })
    const r = await runClaudeReview({ proposal, rubricPath: 'x', spawnImpl, readFile })
    expect(r).toEqual({ status: 'approved', reasons: ['passes rubric'], raw: '{"approve": true, "reasons": ["passes rubric"]}' })
  })

  it('resolves rejected on {"approve":false}', async () => {
    const spawnImpl = () => fakeChild({ stdout: '{"approve": false, "reasons": ["mentions a competitor"]}' })
    const r = await runClaudeReview({ proposal, rubricPath: 'x', spawnImpl, readFile })
    expect(r.status).toBe('rejected')
    expect(r.reasons).toEqual(['mentions a competitor'])
  })

  it('resolves unavailable on a non-zero exit code', async () => {
    const spawnImpl = () => fakeChild({ exitCode: 1, stderr: 'boom' })
    const r = await runClaudeReview({ proposal, rubricPath: 'x', spawnImpl, readFile })
    expect(r.status).toBe('unavailable')
  })

  it('resolves unavailable when the CLI cannot be spawned at all', async () => {
    const spawnImpl = () => fakeChild({ spawnError: new Error('ENOENT') })
    const r = await runClaudeReview({ proposal, rubricPath: 'x', spawnImpl, readFile })
    expect(r.status).toBe('unavailable')
    expect(r.reasons[0]).toMatch(/ENOENT|unavailable/i)
  })

  it('resolves unavailable on unparsable stdout', async () => {
    const spawnImpl = () => fakeChild({ stdout: 'I cannot comply with JSON here' })
    const r = await runClaudeReview({ proposal, rubricPath: 'x', spawnImpl, readFile })
    expect(r.status).toBe('unavailable')
  })

  it('resolves unavailable after the 90s timeout when the CLI never closes', async () => {
    vi.useFakeTimers()
    const spawnImpl = () => fakeChild({ neverClose: true })
    const p = runClaudeReview({ proposal, rubricPath: 'x', spawnImpl, readFile, timeoutMs: 90000 })
    await vi.advanceTimersByTimeAsync(90001)
    const r = await p
    expect(r.status).toBe('unavailable')
    expect(r.reasons[0]).toMatch(/timed out/i)
    vi.useRealTimers()
  })

  it('resolves unavailable when the rubric cannot be read', async () => {
    const spawnImpl = vi.fn()
    const r = await runClaudeReview({ proposal, rubricPath: 'missing', spawnImpl, readFile: () => { throw new Error('ENOENT') } })
    expect(r.status).toBe('unavailable')
    expect(spawnImpl).not.toHaveBeenCalled()
  })
})

function fakeStore(initial = []) {
  const byId = new Map(initial.map((p) => [p.id, p]))
  return {
    list: () => [...byId.values()],
    get: (id) => byId.get(id) || null,
    transition(id, patch) {
      const cur = byId.get(id)
      const next = { ...cur, ...patch }
      byId.set(id, next)
      return next
    },
  }
}

describe('lib/social-review.mjs — reviewAndMaybeExecute', () => {
  const readFile = () => 'RUBRIC'
  const proposal = { id: 'p1', brand: 'youandinotai', platform: 'reddit', title: 't', body: 'b', state: 'PROPOSED' }

  it('approve -> executes via the adapter -> EXECUTED, actor recorded, audited', async () => {
    const store = fakeStore([proposal])
    const spawnImpl = () => fakeChild({ stdout: '{"approve": true, "reasons": ["fine"]}' })
    const execute = vi.fn(() => ({ ok: true, path: '/tmp/x.md' }))
    const auditFn = vi.fn()
    const r = await reviewAndMaybeExecute({ store, proposal, rubricPath: 'x', spawnImpl, readFile, execute, auditFn })
    expect(r.action).toBe('executed')
    expect(r.proposal.state).toBe('EXECUTED')
    expect(r.proposal.reviewActor).toBe(REVIEW_ACTOR)
    expect(execute).toHaveBeenCalled()
    expect(auditFn).toHaveBeenCalled()
  })

  it('approve but adapter fails -> FAILED, not EXECUTED', async () => {
    const store = fakeStore([proposal])
    const spawnImpl = () => fakeChild({ stdout: '{"approve": true, "reasons": ["fine"]}' })
    const execute = () => ({ ok: false, error: 'network down' })
    const r = await reviewAndMaybeExecute({ store, proposal, rubricPath: 'x', spawnImpl, readFile, execute, auditFn: () => {} })
    expect(r.action).toBe('failed')
    expect(r.proposal.state).toBe('FAILED')
  })

  it('reject -> REJECTED with reasons, adapter never called', async () => {
    const store = fakeStore([proposal])
    const spawnImpl = () => fakeChild({ stdout: '{"approve": false, "reasons": ["names a competitor"]}' })
    const execute = vi.fn()
    const r = await reviewAndMaybeExecute({ store, proposal, rubricPath: 'x', spawnImpl, readFile, execute, auditFn: () => {} })
    expect(r.action).toBe('rejected')
    expect(r.proposal.state).toBe('REJECTED')
    expect(r.reasons).toEqual(['names a competitor'])
    expect(execute).not.toHaveBeenCalled()
  })

  it('CLI unavailable -> left PROPOSED, no transition applied', async () => {
    const store = fakeStore([proposal])
    const spawnImpl = () => fakeChild({ exitCode: 1 })
    const execute = vi.fn()
    const r = await reviewAndMaybeExecute({ store, proposal, rubricPath: 'x', spawnImpl, readFile, execute, auditFn: () => {} })
    expect(r.action).toBe('left-proposed')
    expect(r.proposal.state).toBe('PROPOSED')
    expect(execute).not.toHaveBeenCalled()
  })

  it('enforces the cap of 2 per brand per NY day — a 3rd approval today is left PROPOSED', async () => {
    const now = () => new Date('2026-09-20T15:00:00Z')
    const already = [
      { id: 'a', source: 'social', brand: 'youandinotai', state: 'EXECUTED', reviewActor: REVIEW_ACTOR, reviewedAt: '2026-09-20T10:00:00Z' },
      { id: 'b', source: 'social', brand: 'youandinotai', state: 'APPROVED', reviewActor: REVIEW_ACTOR, reviewedAt: '2026-09-20T11:00:00Z' },
    ]
    const store = fakeStore([...already, proposal])
    const spawnImpl = () => fakeChild({ stdout: '{"approve": true, "reasons": ["fine"]}' })
    const execute = vi.fn()
    const r = await reviewAndMaybeExecute({ store, proposal, rubricPath: 'x', spawnImpl, readFile, execute, now, auditFn: () => {} })
    expect(r.action).toBe('left-proposed')
    expect(execute).not.toHaveBeenCalled()
    expect(DAILY_CAP_PER_BRAND).toBe(2)
  })
})
