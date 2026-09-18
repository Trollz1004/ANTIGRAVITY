import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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

describe('resolveConfig — obsidian/crosslisting endpoints', () => {
  it('reads the Obsidian REST url from env/file; the default is the https port this node serves', () => {
    // Live-verified 2026-09-16: the vault plugin serves ONLY https://127.0.0.1:27124
    // (insecure server off, self-signed cert). The old default http://127.0.0.1:27123
    // is a dead port on this node and reported a healthy vault DOWN.
    const d = cfg.resolveConfig({ here: 'X:/r/mission-control', readEnv: () => ({}) })
    expect(d.obsidianRest).toBe('https://127.0.0.1:27124')
    const e = cfg.resolveConfig({ here: 'X:/r/mission-control', env: { OBSIDIAN_REST_URL: 'https://127.0.0.1:9999' }, readEnv: () => ({}) })
    expect(e.obsidianRest).toBe('https://127.0.0.1:9999')
    const f = cfg.resolveConfig({ here: 'X:/r/mission-control', readEnv: () => ({ OBSIDIAN_REST_URL: 'http://127.0.0.1:27123' }) })
    expect(f.obsidianRest).toBe('http://127.0.0.1:27123') // explicit file config wins over the default
  })
  it('carries the crosslisting base with a config override', () => {
    const d = cfg.resolveConfig({ here: 'X:/r/mission-control', readEnv: () => ({}) })
    expect(d.crosslisting).toBe('http://127.0.0.1:3000')
    const o = cfg.resolveConfig({ here: 'X:/r/mission-control', env: { CROSSLISTING_URL: 'http://127.0.0.1:3010' }, readEnv: () => ({}) })
    expect(o.crosslisting).toBe('http://127.0.0.1:3010')
  })
})

describe('resolveConfig — news + trends sources', () => {
  it('defaults trends to the real notebook file in C:\\DREAM and allows an override', () => {
    const d = cfg.resolveConfig({ here: 'X:/r/mission-control', readEnv: () => ({}) })
    expect(d.trendsPath).toBe('C:\\DREAM\\google trends .txt')
    const o = cfg.resolveConfig({ here: 'X:/r/mission-control', env: { TRENDS_FILE: 'D:/other.json' }, readEnv: () => ({}) })
    expect(o.trendsPath).toBe('D:/other.json')
  })
})

describe('resolveConfig (originals)', () => {
  const here = resolve('C:/some/repo/mission-control')
  it('defaults the repo root to one level above the server folder and the env file to <repo>/.env', () => {
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
  it('has no Sabertooth mission-control dependency, and no separate Sentry endpoint (folded into lib/sentry.mjs 2026-09-18)', () => {
    const d = cfg.resolveConfig({ here, env: {}, readEnv: () => ({}) })
    expect(d.missionControl).toBe('') // this dashboard IS mission control
    expect(d.sentry).toBeUndefined()
  })
})

describe('resolveVault', () => {
  const here = resolve(import.meta.dirname, '..')
  it('carries the stable Obsidian vault id when configured (env beats file)', () => {
    const r = cfg.resolveVault({ env: { OBSIDIAN_VAULT_ID: 'id-from-env' }, readEnv: () => ({ OBSIDIAN_VAULT_ID: 'id-from-file' }), envFile: 'Z:/x' })
    expect(r.id).toBe('id-from-env')
    const f = cfg.resolveVault({ env: {}, readEnv: () => ({ OBSIDIAN_VAULT_ID: '81a626afaf05ce81' }), envFile: 'Z:/x' })
    expect(f.id).toBe('81a626afaf05ce81')
    expect(cfg.resolveVault({ env: {}, readEnv: () => ({}), envFile: 'Z:/x' }).id).toBe('')
  })

  it('returns the configured vault when it exists, with its folder name', () => {
    const real = mkdtempSync(join(tmpdir(), 'vault-real-'))
    const v = cfg.resolveVault({ env: { OBSIDIAN_VAULT_ANTIGRAVITY: real }, readEnv: () => ({}) })
    expect(v.path).toBe(real)
    expect(v.name).toBe(real.split(/[\\/]/).pop())
    expect(v.source).toBe('configured')
  })

  it('ignores a configured path that does not exist and self-heals to an existing candidate', () => {
    const real = mkdtempSync(join(tmpdir(), 'AlienwareDream-'))
    const v = cfg.resolveVault({ env: { OBSIDIAN_VAULT_ANTIGRAVITY: 'C:/definitely/not/a/vault' }, readEnv: () => ({}), candidates: [real] })
    expect(v.path).toBe(real)
    expect(v.source).toBe('auto')
  })

  it('falls back to the repo default location when nothing exists', () => {
    // A synthetic, guaranteed-nonexistent `here` keeps this isolated from the real
    // checkout, where C:\ANTIGRAVITY\Antigravity is a real vault that does exist.
    const v = cfg.resolveVault({ env: {}, readEnv: () => ({}), candidates: ['C:/definitely/not/a/vault'], here: 'C:/definitely/not/a/repo/mission-control/lib' })
    expect(v.source).toBe('default')
    expect(v.exists).toBe(false)
    expect(v.name).toBe('Antigravity')
  })

  it('prefers OBSIDIAN_VAULT over the legacy ANTIGRAVITY name, env over the .env file', () => {
    const legacy = mkdtempSync(join(tmpdir(), 'vault-legacy-'))
    const modern = mkdtempSync(join(tmpdir(), 'vault-modern-'))
    const v = cfg.resolveVault({ env: { OBSIDIAN_VAULT: modern, OBSIDIAN_VAULT_ANTIGRAVITY: legacy }, readEnv: () => ({}) })
    expect(v.path).toBe(modern)
    const w = cfg.resolveVault({ env: { OBSIDIAN_VAULT_ANTIGRAVITY: legacy }, readEnv: () => ({}) })
    expect(w.path).toBe(legacy)
  })

  it('prefers env over the .env file and never errors when the file is missing', () => {
    const real = mkdtempSync(join(tmpdir(), 'vault-env-'))
    const v = cfg.resolveVault({ env: { OBSIDIAN_VAULT_ANTIGRAVITY: real }, readEnv: () => ({ OBSIDIAN_VAULT_ANTIGRAVITY: 'C:/definitely/not/a/vault' }) })
    expect(v.path).toBe(real)
  })
})
