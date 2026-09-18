import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')

describe('JARVIS wiring — server.mjs Voice/TTS route (Phase F, unit 2)', () => {
  const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf-8')

  it('imports lib/tts.mjs', () => {
    expect(server).toContain("from './lib/tts.mjs'")
  })

  it('wires POST /api/tts using synthesizeSpeech, with a 204 fallback path', () => {
    expect(server).toContain("p === '/api/tts' && req.method === 'POST'")
    expect(server).toContain('synthesizeSpeech(')
    expect(server).toMatch(/res\.writeHead\(204/)
  })

  it('wires GET /api/tts/voices listing the six edge-tts voices', () => {
    expect(server).toContain("p === '/api/tts/voices'")
  })

  it('the /api/voices/local-pack legacy route no longer references undefined globals', () => {
    expect(server).not.toMatch(/path\.join\(ROOT/)
    expect(server).not.toMatch(/await fs\.readdir/)
  })

  it('js/jarvis/tts-client.js exists and dock.js wires push-to-talk + mute + voice picker', () => {
    expect(fs.existsSync(path.join(root, 'js', 'jarvis', 'tts-client.js'))).toBe(true)
    const dock = fs.readFileSync(path.join(root, 'js', 'jarvis', 'dock.js'), 'utf-8')
    expect(dock).toContain("from './tts-client.js'")
    expect(dock).toContain('dock-mic')
    expect(dock).toContain('dock-mute')
    expect(dock).toContain('dock-voice-test')
  })
})
