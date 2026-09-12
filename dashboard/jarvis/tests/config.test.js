import { describe, it, expect } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

// Server configuration is pure: no listening, no process.env mutation.
const cfg = await import('../lib/config.mjs')

function tmpEnv(text) {
  const dir = mkdtempSync(join(tmpdir(), 'jarvis-env-'))
  const file = join(dir, '.env')
  writeFileSync(file, text)
  return file
}

describe('readEnvFile', () => {
  it('parses KEY=VALUE, strips quotes, skips comments and blanks', () => {
    const file = tmpEnv('# comment\n\nNODE_LAN_IP=192.168.0.40\nNAME="quoted value"\n  SPACED = x \nBAD LINE\n')
    const env = cfg.readEnvFile(file)
    expect(env.NODE_LAN_IP).toBe('192.168.0.40')
    expect(env.NAME).toBe('quoted value')
    expect(env.SPACED).toBe('x')
    expect(Object.keys(env)).toEqual(['NODE_LAN_IP', 'NAME', 'SPACED'])
  })
  it('returns an empty object for a missing file', () => {
    expect(cfg.readEnvFile(join(tmpdir(), 'does-not-exist-' + Date.now(), '.env'))).toEqual({})
  })
})

describe('resolveConfig', () => {
  const here = resolve('C:/some/repo/dashboard/jarvis')
  it('defaults the repo root to two levels above the server folder and the env file to <repo>/.env', () => {
    const c = cfg.resolveConfig({ here, env: {}, readEnv: () => ({}) })
    expect(c.repo).toBe(resolve('C:/some/repo'))
    expect(c.envFile).toBe(resolve('C:/some/repo/.env'))
    expect(c.port).toBe(9150)
  })
  it('process.env wins over .env, which wins over defaults', () => {
    const readEnv = () => ({ NODE_LAN_IP: '10.0.0.5', AIRI_DASHBOARD_PORT: '9151', ANTIGRAVITY_ROOT: 'C:/from-env' })
    const a = cfg.resolveConfig({ here, env: {}, readEnv })
    expect(a.lanIp).toBe('10.0.0.5')
    expect(a.port).toBe(9151)
    expect(a.repo).toBe(resolve('C:/from-env'))
    const b = cfg.resolveConfig({ here, env: { NODE_LAN_IP: '10.0.0.9', AIRI_DASHBOARD_PORT: '9152' }, readEnv })
    expect(b.lanIp).toBe('10.0.0.9')
    expect(b.port).toBe(9152)
  })
  it('falls back to a real interface address, never a hardcoded Sabertooth IP', () => {
    const c = cfg.resolveConfig({ here, env: {}, readEnv: () => ({}), interfaces: () => ({ eth: [{ family: 'IPv4', internal: false, address: '192.168.0.40' }], lo: [{ family: 'IPv4', internal: true, address: '127.0.0.1' }] }) })
    expect(c.lanIp).toBe('192.168.0.40')
    const d = cfg.resolveConfig({ here, env: {}, readEnv: () => ({}), interfaces: () => ({}) })
    expect(d.lanIp).toBe('127.0.0.1')
  })
  it('derives the OmniRoute URL from OPENAI_COMPAT_BASE_URL, else OMNIROUTE_LAN_BASE_URL, else the Sabertooth router', () => {
    expect(cfg.resolveConfig({ here, env: {}, readEnv: () => ({}) }).omni).toBe('http://192.168.0.8:20128/v1')
    expect(cfg.resolveConfig({ here, env: {}, readEnv: () => ({ OMNIROUTE_LAN_BASE_URL: 'http://192.168.0.8:20128/v1/' }) }).omni).toBe('http://192.168.0.8:20128/v1')
    expect(cfg.resolveConfig({ here, env: { OPENAI_COMPAT_BASE_URL: 'http://x:1/v1' }, readEnv: () => ({}) }).omni).toBe('http://x:1/v1')
  })
})
