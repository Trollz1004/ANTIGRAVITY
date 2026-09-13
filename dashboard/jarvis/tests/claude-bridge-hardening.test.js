import { describe, it, expect, vi } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

// Hardening of the Claude CLI bridge: the remote-code path from a LAN page into a
// CLI that can touch files on this PC. Every guardrail is pinned here.
const b = await import('../lib/claude-bridge.mjs')

describe('childEnv strips secrets, not just the nested-launch guard', () => {
  it('drops ANTHROPIC_* and anything that looks like a credential, keeps the runtime basics, never mutates its input', () => {
    const input = { PATH: 'p', USERPROFILE: 'u', APPDATA: 'a', LOCALAPPDATA: 'l', TEMP: 't', SystemRoot: 's', CLAUDECODE: '1', CLAUDE_CODE_ENTRYPOINT: 'cli', ANTHROPIC_API_KEY: 'x', ANTHROPIC_AUTH_TOKEN: 'x', ANTHROPIC_BASE_URL: 'x', OMNI_ROUTE_API_KEY: 'x', GITHUB_TOKEN: 'x', DB_SECRET: 'x', SMTP_PASSWORD: 'x', NODE_LAN_IP: '192.168.0.40' }
    const snapshot = JSON.stringify(input)
    const env = b.childEnv(input)
    for (const k of ['PATH', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'TEMP', 'SystemRoot', 'NODE_LAN_IP']) expect(env[k]).toBe(input[k])
    for (const k of ['CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT', 'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_BASE_URL', 'OMNI_ROUTE_API_KEY', 'GITHUB_TOKEN', 'DB_SECRET', 'SMTP_PASSWORD']) expect(env[k], k).toBeUndefined()
    expect(JSON.stringify(input)).toBe(snapshot)
  })
})

describe('settings deny list', () => {
  it('buildClaudeArgs passes --settings JSON that denies reading .env files', () => {
    const args = b.buildClaudeArgs({})
    const json = args[args.indexOf('--settings') + 1]
    const settings = JSON.parse(json)
    expect(settings.permissions.deny).toEqual(expect.arrayContaining(['Read(./.env)', 'Read(./**/.env)', 'Read(./**/.env.*)']))
  })
})

describe('effectivePermissionMode', () => {
  it('a request can lower the mode but never raise it above what .env configured', () => {
    expect(b.effectivePermissionMode('plan', 'acceptEdits')).toBe('plan')
    expect(b.effectivePermissionMode('acceptEdits', 'plan')).toBe('plan')
    expect(b.effectivePermissionMode('default', 'acceptEdits')).toBe('default')
    expect(b.effectivePermissionMode('bogus', 'default')).toBe('default')
    expect(b.effectivePermissionMode('', '')).toBe('plan')
  })
})

describe('bridgeAccess: own LAN IP is local, tokens compare in constant time', () => {
  it('treats the server\'s own LAN address as local and still requires a token from other hosts', () => {
    const gate = b.bridgeAccess({ token: 'abcdefghijklmnopqrstuvwx', lanIp: '192.168.0.40' })
    expect(gate({ remoteAddress: '192.168.0.40', headers: {} })).toMatchObject({ ok: true, local: true })
    expect(gate({ remoteAddress: '::ffff:192.168.0.40', headers: {} })).toMatchObject({ ok: true, local: true })
    expect(gate({ remoteAddress: '192.168.0.8', headers: {} })).toMatchObject({ ok: false })
    expect(gate({ remoteAddress: '192.168.0.8', headers: { 'x-bridge-token': 'short' } })).toMatchObject({ ok: false })
    expect(gate({ remoteAddress: '192.168.0.8', headers: { 'x-bridge-token': 'abcdefghijklmnopqrstuvwx' } })).toMatchObject({ ok: true, local: false })
  })
})

describe('isSameOrigin', () => {
  it('accepts no Origin or an Origin that matches the Host, rejects foreign origins', () => {
    expect(b.isSameOrigin({ host: '127.0.0.1:9150' })).toBe(true)
    expect(b.isSameOrigin({ host: '127.0.0.1:9150', origin: 'http://127.0.0.1:9150' })).toBe(true)
    expect(b.isSameOrigin({ host: '192.168.0.40:9150', origin: 'http://192.168.0.40:9150' })).toBe(true)
    expect(b.isSameOrigin({ host: '127.0.0.1:9150', origin: 'http://evil.example' })).toBe(false)
    expect(b.isSameOrigin({ host: '127.0.0.1:9150', origin: 'null' })).toBe(false)
  })
})

describe('killTree', () => {
  it('kills the whole process tree on Windows with taskkill, otherwise SIGKILL', () => {
    const spawn = vi.fn(() => ({ unref() {}, on() {} }))
    const child = { pid: 4242, kill: vi.fn(), exitCode: null }
    b.killTree(child, { platform: 'win32', spawn })
    expect(spawn).toHaveBeenCalledWith('taskkill', ['/PID', '4242', '/T', '/F'], expect.objectContaining({ windowsHide: true }))
    b.killTree(child, { platform: 'linux', spawn })
    expect(child.kill).toHaveBeenCalledWith('SIGKILL')
    expect(() => b.killTree({ pid: 1, exitCode: 0, kill: vi.fn() }, { platform: 'win32', spawn })).not.toThrow()
  })
})

describe('the real stream-json fixture', () => {
  it('parses a full headless run: init is found by type (line 0 is a rate_limit_event), deltas join to the result', () => {
    const text = readFileSync(resolve(__dirname, 'fixtures', 'claude-stream.ndjson'), 'utf8')
    const p = b.createStreamParser()
    const events = p.push(text + '\n')
    const init = events.find((e) => e.type === 'init')
    expect(init).toBeTruthy()
    expect(init.sessionId).toMatch(/^[0-9a-f-]{36}$/)
    expect(p.sessionId).toBe(init.sessionId)
    const result = events.at(-1)
    expect(result.type).toBe('result')
    expect(result.ok).toBe(true)
    expect(events.filter((e) => e.type === 'delta').map((e) => e.text).join('')).toBe(result.text)
    expect(text).not.toMatch(/joshi/)
  })
})

describe('privacy: no personal names or paths in shipped sources', () => {
  it('lib/*.mjs, server.mjs and the fixtures never mention the local user', () => {
    const lib = resolve(__dirname, '..', 'lib')
    for (const f of readdirSync(lib)) expect(readFileSync(join(lib, f), 'utf8'), f).not.toMatch(/joshi/)
    expect(readFileSync(resolve(__dirname, '..', 'server.mjs'), 'utf8')).not.toMatch(/joshi|drift/)
  })
})
