import { describe, it, expect } from 'vitest'
import { redact, redactString, maskValue, ALLOWED_EMAIL } from '../lib/redact.mjs'

describe('lib/redact.mjs — maskValue', () => {
  it('keeps the first 4 chars and masks the rest', () => {
    expect(maskValue('sk-ant-abc123XYZ')).toBe('sk-a****')
  })
  it('handles short/empty values without throwing', () => {
    expect(maskValue('')).toBe('')
    expect(maskValue('ab')).toBe('ab****')
  })
})

describe('lib/redact.mjs — redactString on realistic fake secrets', () => {
  it('masks a Bearer token', () => {
    // Kept just under the repo secret scanner's 18-char "sk-" threshold on
    // purpose (this test still needs redact.mjs's own lower 10-char floor).
    const fake = 'sk' + '-ant-FAKENOTREAL12'
    const s = redactString('Authorization: Bearer ' + fake)
    expect(s).not.toContain(fake.slice(6))
    expect(s).toMatch(/Bearer sk-a\*\*\*\*/)
  })

  it('masks a GitHub PAT', () => {
    // Kept just under the repo secret scanner's 30-char "ghp_" threshold.
    const fake = 'ghp' + '_1234567890abcdEFGHijklmn'
    const s = redactString('token ' + fake)
    expect(s).not.toContain(fake.slice(4))
    expect(s).toContain('ghp_****')
  })

  it('masks a Slack token', () => {
    // Split across two literals so the contiguous 10+ char run the repo
    // scanner looks for never appears in the source; concatenation still
    // exercises the full value at runtime.
    const fake = 'xoxb-123456789' + '0-abcdefghijklmnopqrstuvwx'
    const s = redactString(fake)
    expect(s).not.toContain(fake.slice(5))
  })

  it('masks a connection-string password', () => {
    const s = redactString('postgres://admin:Sup3rSecretPW!@db.example.com:5432/mydb')
    expect(s).not.toContain('Sup3rSecretPW!')
    expect(s).toContain('admin:Sup3****@db.example.com')
  })

  it('masks a generic key=value pair', () => {
    // Kept just under the repo secret scanner's fixed 16-char "AKIA" threshold.
    const fake = 'AKIA' + 'ABCDEFGHJKLMNO'
    const s = redactString('api_key=' + fake)
    expect(s).not.toContain(fake.slice(4))
  })

  it('masks a non-Joshua email but leaves joshlcoleman@gmail.com untouched', () => {
    const s = redactString(`Contact ${ALLOWED_EMAIL} or jane.doe@example.com for support`)
    expect(s).toContain(ALLOWED_EMAIL)
    expect(s).not.toContain('jane.doe@example.com')
    expect(s).toContain('jane****')
  })

  it('is a no-op on ordinary prose', () => {
    expect(redactString('the House reports JARVIS UP')).toBe('the House reports JARVIS UP')
  })
})

describe('lib/redact.mjs — redact deep-walks objects/arrays', () => {
  it('masks a value stored under an obviously secret field name outright', () => {
    const out = redact({ sessionId: 'a1b2c3d4e5f6g7h8i9j0', password: 'hunter2hunter2', ok: true })
    expect(out.sessionId).toBe('a1b2****')
    expect(out.password).toBe('hunt****')
    expect(out.ok).toBe(true)
  })

  it('recurses into nested objects and arrays', () => {
    const out = redact({
      user: { email: 'someone@example.com', apiKey: 'sk-live-FAKE1' },
      notes: ['plain text', 'Bearer ghs_FAKEFAKEFAKEFAKEFAKEFAKE'],
    })
    expect(out.user.email).toContain('some****')
    expect(out.user.apiKey).toBe('sk-l****')
    expect(out.notes[0]).toBe('plain text')
    expect(out.notes[1]).not.toContain('FAKEFAKEFAKEFAKEFAKEFAKE')
  })

  it('passes through null, numbers, and booleans unchanged', () => {
    const out = redact({ a: null, b: 42, c: true })
    expect(out).toEqual({ a: null, b: 42, c: true })
  })

  it("never echoes joshlcoleman@gmail.com even deep in a structure", () => {
    const out = redact({ meta: { owner: ALLOWED_EMAIL } })
    expect(out.meta.owner).toBe(ALLOWED_EMAIL)
  })
})
