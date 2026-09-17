import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { createProposalStore } from '../lib/proposals.mjs'
import { readTriggers, healthRedItem, SALE_INBOUND_ITEM, buildInbox, performAction, appendAudit } from '../lib/inbox.mjs'

let dir
beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jarvis-inbox-')) })
afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

describe('lib/inbox.mjs — readTriggers', () => {
  it('returns [] when the file does not exist', () => {
    expect(readTriggers(path.join(dir, 'nope.jsonl'))).toEqual([])
  })

  it('parses valid lines and skips a corrupt one', () => {
    const p = path.join(dir, 'TRIGGERS.jsonl')
    fs.writeFileSync(p, '{not json}\n' + JSON.stringify({ id: 't1', type: 'quota', message: 'quota low' }) + '\n')
    const out = readTriggers(p)
    expect(out.length).toBe(1)
    expect(out[0].id).toBe('t1')
    expect(out[0].source).toBe('trigger')
    expect(out[0].title).toBe('quota low')
  })
})

describe('lib/inbox.mjs — healthRedItem', () => {
  const jsonPath = 'health.json'
  const logPath = 'health.log'
  it('returns null when health is not RED', () => {
    const readFile = () => JSON.stringify({ overall: 'GREEN', ts: 'x' })
    expect(healthRedItem({ jsonPath, logPath, readFile, exists: () => true })).toBeNull()
  })
  it('returns a synthetic item when health is RED', () => {
    const readFile = (p) => (p === jsonPath ? JSON.stringify({ overall: 'RED', ts: '2026-09-17T00:00:00Z' }) : '')
    const item = healthRedItem({ jsonPath, logPath, readFile, exists: () => true })
    expect(item).not.toBeNull()
    expect(item.source).toBe('health')
    expect(item.state).toBe('PROPOSED')
  })
  it('returns null (never a fixture row) when the heartbeat file is missing', () => {
    expect(healthRedItem({ jsonPath, logPath, readFile: () => '', exists: () => false })).toBeNull()
  })
})

describe('lib/inbox.mjs — buildInbox', () => {
  it('merges proposals + triggers + the always-present sale-pending row, counts unread', () => {
    const store = createProposalStore({ dir })
    store.create({ source: 'social', brand: 'DREAM Online', platform: 'reddit', title: 't', body: 'b' })
    const triggersPath = path.join(dir, 'TRIGGERS.jsonl')
    fs.writeFileSync(triggersPath, JSON.stringify({ id: 'tr1', message: 'trigger one' }) + '\n')
    const j = buildInbox({ store, triggersPath, heartbeat: { jsonPath: 'x', logPath: 'y', readFile: () => '', exists: () => false } })
    expect(j.items.some((i) => i.source === 'social')).toBe(true)
    expect(j.items.some((i) => i.id === 'tr1')).toBe(true)
    expect(j.items.some((i) => i.id === SALE_INBOUND_ITEM.id)).toBe(true)
    expect(j.unread).toBeGreaterThanOrEqual(3) // the social proposal, the trigger, and the sale-pending row
  })
})

describe('lib/inbox.mjs — performAction founder-token gate', () => {
  it('503s when JARVIS_FOUNDER_TOKEN is unset, without saying what to set it to', () => {
    const store = createProposalStore({ dir })
    const p = store.create({ source: 'social', brand: 'DREAM Online', platform: 'reddit', title: 't', body: 'b' })
    const r = performAction({ store, id: p.id, action: 'approve', token: 'anything', founderToken: '', auditDir: path.join(dir, 'audit') })
    expect(r.status).toBe(503)
    expect(r.body.error).not.toMatch(/[A-Za-z0-9]{16,}/) // no token-shaped value ever echoed
  })

  it('401s when the token is missing or wrong (an agent with no token cannot approve)', () => {
    const store = createProposalStore({ dir })
    const p = store.create({ source: 'social', brand: 'DREAM Online', platform: 'reddit', title: 't', body: 'b' })
    const noToken = performAction({ store, id: p.id, action: 'approve', token: undefined, founderToken: 'realtoken123', auditDir: path.join(dir, 'audit') })
    expect(noToken.status).toBe(401)
    const wrongToken = performAction({ store, id: p.id, action: 'approve', token: 'guess', founderToken: 'realtoken123', auditDir: path.join(dir, 'audit') })
    expect(wrongToken.status).toBe(401)
    expect(store.get(p.id).state).toBe('PROPOSED') // never transitioned
  })

  it('404s on an unknown id even with the right token', () => {
    const store = createProposalStore({ dir })
    const r = performAction({ store, id: 'nope', action: 'approve', token: 'realtoken123', founderToken: 'realtoken123', auditDir: path.join(dir, 'audit') })
    expect(r.status).toBe(404)
  })

  it('400s on an unrecognised action', () => {
    const store = createProposalStore({ dir })
    const p = store.create({ source: 'social', brand: 'DREAM Online', platform: 'reddit', title: 't', body: 'b' })
    const r = performAction({ store, id: p.id, action: 'delete', token: 'x', founderToken: 'x', auditDir: path.join(dir, 'audit') })
    expect(r.status).toBe(400)
  })
})

describe('lib/inbox.mjs — performAction with the right token', () => {
  it('reject/snooze just transition state, no adapter call', () => {
    const store = createProposalStore({ dir })
    const p = store.create({ source: 'social', brand: 'DREAM Online', platform: 'reddit', title: 't', body: 'b' })
    const r = performAction({ store, id: p.id, action: 'reject', token: 'tok', founderToken: 'tok', auditDir: path.join(dir, 'audit') })
    expect(r.status).toBe(200)
    expect(r.body.proposal.state).toBe('REJECTED')
  })

  it('approve of a social proposal runs the adapter and marks EXECUTED on success, storing evidence', () => {
    const store = createProposalStore({ dir })
    const p = store.create({ source: 'social', brand: 'DREAM Online', platform: 'reddit', title: 't', body: 'b' })
    const adapters = { execute: () => ({ ok: true, path: '/fake/path.md' }) }
    const r = performAction({ store, id: p.id, action: 'approve', token: 'tok', founderToken: 'tok', adapters, auditDir: path.join(dir, 'audit') })
    expect(r.status).toBe(200)
    expect(r.body.proposal.state).toBe('EXECUTED')
    expect(r.body.proposal.evidence).toBe('/fake/path.md')
  })

  it('approve marks FAILED (never a silent success) when the adapter fails or throws', () => {
    const store = createProposalStore({ dir })
    const p = store.create({ source: 'social', brand: 'DREAM Online', platform: 'devto', title: 't', body: 'b' })
    const adapters = { execute: () => { throw new Error('boom') } }
    const r = performAction({ store, id: p.id, action: 'approve', token: 'tok', founderToken: 'tok', adapters, auditDir: path.join(dir, 'audit') })
    expect(r.body.proposal.state).toBe('FAILED')
    expect(r.body.proposal.evidence).toMatch(/boom/)
  })

  it('every action appends to data/audit/YYYY-MM-DD.jsonl', () => {
    const store = createProposalStore({ dir })
    const p = store.create({ source: 'social', brand: 'DREAM Online', platform: 'reddit', title: 't', body: 'b' })
    const auditDir = path.join(dir, 'audit')
    performAction({ store, id: p.id, action: 'snooze', token: 'tok', founderToken: 'tok', auditDir, now: () => new Date('2026-09-17T00:00:00Z') })
    const files = fs.readdirSync(auditDir)
    expect(files).toContain('2026-09-17.jsonl')
    const lines = fs.readFileSync(path.join(auditDir, files[0]), 'utf8').trim().split('\n').map((l) => JSON.parse(l))
    expect(lines[0].id).toBe(p.id)
    expect(lines[0].action).toBe('snooze')
  })
})

describe('lib/inbox.mjs — appendAudit', () => {
  it('never throws even if the dir cannot be created', () => {
    expect(() => appendAudit({ dir: '\0invalid', record: { a: 1 } })).not.toThrow()
  })
})
