import { describe, it, expect } from 'vitest'
import { join } from 'node:path'

// The Claude CLI bridge: pure pieces (binary lookup, argument building, access
// gate, stream-json parsing) are tested here without spawning anything.
const b = await import('../lib/claude-bridge.mjs')

describe('resolveClaudeBinary', () => {
  it('prefers CLAUDE_BIN, then ~/.local/bin/claude.exe, then PATH, and never hardcodes a user name', () => {
    const exists = (p) => p === join('C:/Users/x', '.local', 'bin', 'claude.exe')
    expect(b.resolveClaudeBinary({ env: { CLAUDE_BIN: 'D:/tools/claude.exe' }, exists: () => true })).toBe('D:/tools/claude.exe')
    expect(b.resolveClaudeBinary({ env: { USERPROFILE: 'C:/Users/x' }, exists })).toBe(join('C:/Users/x', '.local', 'bin', 'claude.exe'))
    expect(b.resolveClaudeBinary({ env: { USERPROFILE: 'C:/Users/none' }, exists: () => false })).toBe('claude')
  })
})

describe('buildClaudeArgs', () => {
  it('runs headless stream-json with safe defaults: plan permission mode, bounded turns, no bypass', () => {
    const args = b.buildClaudeArgs({})
    expect(args).toContain('-p')
    expect(args.slice(args.indexOf('--output-format') + 1)[0]).toBe('stream-json')
    expect(args).toContain('--verbose')
    expect(args).toContain('--include-partial-messages')
    expect(args.slice(args.indexOf('--permission-mode') + 1)[0]).toBe('plan')
    expect(Number(args.slice(args.indexOf('--max-turns') + 1)[0])).toBeGreaterThan(0)
    expect(args.join(' ')).not.toMatch(/dangerously|bypassPermissions/)
  })
  it('resumes a session, applies a persona, and refuses unknown permission modes', () => {
    const args = b.buildClaudeArgs({ sessionId: 'abc-123', persona: 'jarvis', permissionMode: 'default', maxTurns: 3, model: 'sonnet' })
    expect(args.slice(args.indexOf('--resume') + 1)[0]).toBe('abc-123')
    expect(args.slice(args.indexOf('--append-system-prompt') + 1)[0]).toMatch(/JARVIS/)
    expect(args.slice(args.indexOf('--permission-mode') + 1)[0]).toBe('default')
    expect(args.slice(args.indexOf('--max-turns') + 1)[0]).toBe('3')
    expect(args.slice(args.indexOf('--model') + 1)[0]).toBe('sonnet')
    expect(() => b.buildClaudeArgs({ permissionMode: 'bypassPermissions' })).toThrow(/permission/i)
    expect(() => b.buildClaudeArgs({ sessionId: 'not a uuid; rm -rf' })).toThrow(/session/i)
  })
  it('never puts the prompt on the command line (it goes through stdin)', () => {
    const args = b.buildClaudeArgs({ prompt: 'hello world' })
    expect(args.join(' ')).not.toContain('hello world')
  })
})

describe('childEnv', () => {
  it('strips the nested-session guard so the CLI will launch from the server', () => {
    const env = b.childEnv({ PATH: 'x', CLAUDECODE: '1', CLAUDE_CODE_ENTRYPOINT: 'cli', HOME: 'h' })
    expect(env.CLAUDECODE).toBeUndefined()
    expect(env.CLAUDE_CODE_ENTRYPOINT).toBeUndefined()
    expect(env.PATH).toBe('x')
  })
})

describe('bridgeAccess', () => {
  it('allows loopback callers, and LAN callers only with the bridge token', () => {
    const gate = b.bridgeAccess({ token: 'secret-token' })
    expect(gate({ remoteAddress: '127.0.0.1', headers: {} }).ok).toBe(true)
    expect(gate({ remoteAddress: '::1', headers: {} }).ok).toBe(true)
    expect(gate({ remoteAddress: '::ffff:127.0.0.1', headers: {} }).ok).toBe(true)
    expect(gate({ remoteAddress: '192.168.0.8', headers: {} }).ok).toBe(false)
    expect(gate({ remoteAddress: '192.168.0.8', headers: { 'x-bridge-token': 'secret-token' } }).ok).toBe(true)
    expect(gate({ remoteAddress: '192.168.0.8', headers: { 'x-bridge-token': 'wrong' } }).ok).toBe(false)
  })
  it('with no token configured the bridge is loopback-only', () => {
    const gate = b.bridgeAccess({ token: '' })
    expect(gate({ remoteAddress: '192.168.0.8', headers: { 'x-bridge-token': '' } }).ok).toBe(false)
    expect(gate({ remoteAddress: '192.168.0.8', headers: {} }).reason).toMatch(/loopback|token/i)
  })
})

describe('parseStreamJson', () => {
  it('turns NDJSON lines into typed events, extracting text deltas and the session id', () => {
    const lines = [
      JSON.stringify({ type: 'system', subtype: 'init', session_id: 'sess-1', model: 'claude-x' }),
      JSON.stringify({ type: 'stream_event', event: { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hel' } } }),
      JSON.stringify({ type: 'stream_event', event: { type: 'content_block_delta', delta: { type: 'text_delta', text: 'lo' } } }),
      'not json at all',
      JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'Hello' }] } }),
      JSON.stringify({ type: 'result', subtype: 'success', result: 'Hello', session_id: 'sess-1', total_cost_usd: 0.01, num_turns: 1 }),
    ]
    const p = b.createStreamParser()
    const events = lines.flatMap((l) => p.push(l + '\n'))
    expect(events[0]).toMatchObject({ type: 'init', sessionId: 'sess-1', model: 'claude-x' })
    expect(events.filter((e) => e.type === 'delta').map((e) => e.text).join('')).toBe('Hello')
    expect(events.find((e) => e.type === 'raw')).toMatchObject({ line: 'not json at all' })
    expect(events.at(-1)).toMatchObject({ type: 'result', text: 'Hello', sessionId: 'sess-1', turns: 1 })
    expect(p.sessionId).toBe('sess-1')
  })
  it('buffers partial lines across chunks', () => {
    const p = b.createStreamParser()
    const half = JSON.stringify({ type: 'result', subtype: 'success', result: 'ok', session_id: 's2' })
    expect(p.push(half.slice(0, 10))).toEqual([])
    const ev = p.push(half.slice(10) + '\n')
    expect(ev[0]).toMatchObject({ type: 'result', text: 'ok' })
  })
})

describe('sse', () => {
  it('formats an event for text/event-stream', () => {
    const payload = { text: 'a' + String.fromCharCode(10) + 'b' }
    const nl = String.fromCharCode(10)
    expect(b.sse('delta', payload)).toBe('event: delta' + nl + 'data: ' + JSON.stringify(payload) + nl + nl)
  })
})
