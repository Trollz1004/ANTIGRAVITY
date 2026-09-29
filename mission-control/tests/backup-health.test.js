import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readBackupHealth } from '../lib/backup-health.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const at = '2026-09-29T03:00:00.000Z'
const HOUR = 3600 * 1000

function fixture(body) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'backup-health-'))
  const file = path.join(dir, 'backup-node.json')
  if (body !== undefined) fs.writeFileSync(file, body)
  return file
}

describe('lib/backup-health.mjs', () => {
  const nc = { status: 'NOT CONFIGURED', detail: 'backup-node.json not written yet; run scripts/backup-node.mjs' }
  it('a missing file is NOT CONFIGURED', () => {
    expect(readBackupHealth({ file: fixture() })).toEqual(nc)
    expect(readBackupHealth()).toEqual(nc)
  })
  it('a file that exists but is corrupt or unreadable is RED, never a setup state', () => {
    expect(readBackupHealth({ file: fixture('{nope') })).toMatchObject({ status: 'RED' })
    expect(readBackupHealth({ file: fixture('{nope') }).detail).toContain('not valid JSON')
    expect(readBackupHealth({ file: fixture('null') })).toMatchObject({ status: 'RED', detail: 'backup-node.json holds no result object' })
    const dir = path.dirname(fixture('{}'))
    expect(readBackupHealth({ file: dir })).toMatchObject({ status: 'RED' })
    expect(readBackupHealth({ file: dir }).detail).toContain('unreadable')
  })
  it('fresh result returns the overall status and the fields', () => {
    const items = [{ id: 'vault', status: 'DONE', detail: 'ok' }]
    const file = fixture('﻿' + JSON.stringify({ at, overall: 'GREEN', set: '/s', items, removed: 2 }))
    expect(readBackupHealth({ file, now: () => Date.parse(at) + 25 * HOUR })).toEqual({ status: 'GREEN', at, items, set: '/s', removed: 2 })
  })
  it('older than 26 hours is STALE, and a bad timestamp is STALE', () => {
    const file = fixture(JSON.stringify({ at, overall: 'GREEN', set: '/s', items: [], removed: 0 }))
    const r = readBackupHealth({ file, now: () => Date.parse(at) + 27 * HOUR })
    expect(r).toMatchObject({ status: 'STALE', overall: 'GREEN', set: '/s' })
    expect(readBackupHealth({ file: fixture(JSON.stringify({ overall: 'RED' })), now: () => 1 }).status).toBe('STALE')
    expect(readBackupHealth({ file: fixture(JSON.stringify({ at, items: 'x' })), now: Date.parse(at) + 27 * HOUR }).items).toEqual([])
  })
})

describe('JARVIS wiring: /api/backup-health', () => {
  const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf8')
  it('imports the reader and serves the heartbeat file', () => {
    expect(server).toContain("from './lib/backup-health.mjs'")
    expect(server).toContain("p === '/api/backup-health'")
    expect(server).toContain("join(REPO, 'ops', 'heartbeat', 'backup-node.json')")
    expect(server).toContain('readBackupHealth({ file: BACKUP_HEALTH_JSON_PATH })')
  })
})
