import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  HOLD_MS,
  SILENCE_MS,
  IDLE_END_MS,
  REST_MS,
  createPushToTalk,
  naturalCase,
} from '../js/jarvis/voice.js'

function fakeSpeech() {
  return {
    start: vi.fn(),
    stop: vi.fn(),
    cancelSpeaking: vi.fn(),
    onresult: null,
    onend: null,
  }
}

function recognized(speech, text) {
  speech.onresult({
    resultIndex: 0,
    results: [Object.assign([{ transcript: text }], { isFinal: true })],
  })
}

function setup({ onTurn = vi.fn(() => Promise.resolve()) } = {}) {
  let time = 0
  const speech = fakeSpeech()
  const onInterim = vi.fn()
  const onStop = vi.fn()
  const controller = createPushToTalk({
    globeEl: null,
    onTurn,
    onInterim,
    onStop,
    speech,
    now: () => time,
  })
  return {
    speech,
    onTurn,
    onInterim,
    onStop,
    controller,
    advance(ms) { time += ms; vi.advanceTimersByTime(ms) },
  }
}

afterEach(() => vi.useRealTimers())

describe('JARVIS globe push-to-talk', () => {
  it('sends a recognised hold on release', async () => {
    vi.useFakeTimers()
    const { controller, speech, onTurn, advance } = setup()
    controller.press()
    recognized(speech, 'status report')
    advance(HOLD_MS)
    controller.release()
    await Promise.resolve()
    expect(onTurn).toHaveBeenCalledWith('status report')
  })

  it('turns a short press into a latched microphone', () => {
    vi.useFakeTimers()
    const { controller, speech, advance } = setup()
    controller.press()
    advance(HOLD_MS - 1)
    controller.release()
    expect(controller.state).toBe('latched')
    expect(controller.isLive()).toBe(true)
    expect(speech.stop).not.toHaveBeenCalled()
  })

  it('ignores release while a microphone is already latched', () => {
    vi.useFakeTimers()
    const { controller } = setup()
    controller.tap()
    controller.release()
    expect(controller.state).toBe('latched')
    expect(controller.isLive()).toBe(true)
  })

  it('sends after silence following recognised speech, but not before speech', async () => {
    vi.useFakeTimers()
    const beforeSpeech = setup()
    beforeSpeech.controller.tap()
    beforeSpeech.advance(SILENCE_MS + 160)
    await Promise.resolve()
    expect(beforeSpeech.onTurn).not.toHaveBeenCalled()

    const afterSpeech = setup()
    afterSpeech.controller.tap()
    recognized(afterSpeech.speech, 'hello Jarvis')
    afterSpeech.advance(SILENCE_MS + 160)
    await Promise.resolve()
    expect(afterSpeech.onTurn).toHaveBeenCalledWith('hello Jarvis')
  })

  it('ends an unheard conversation after the idle limit', () => {
    vi.useFakeTimers()
    const { controller, speech, onStop, advance } = setup()
    controller.tap()
    advance(IDLE_END_MS + 160)
    expect(controller.state).toBe('idle')
    expect(controller.isLive()).toBe(false)
    expect(speech.stop).toHaveBeenCalled()
    expect(onStop).toHaveBeenCalledWith('idle')
  })

  it('restarts recognition when the browser ends while a turn is live', () => {
    vi.useFakeTimers()
    const { controller, speech } = setup()
    controller.tap()
    speech.onend()
    expect(speech.start).toHaveBeenCalledTimes(2)
  })

  it('cancels a spoken reply before a tap begins listening', async () => {
    vi.useFakeTimers()
    let resolveReply
    const onTurn = vi.fn(() => new Promise((resolve) => { resolveReply = resolve }))
    const { controller, speech, advance } = setup({ onTurn })
    controller.tap()
    recognized(speech, 'interrupt me')
    advance(SILENCE_MS + 160)
    await Promise.resolve()
    controller.tap()
    expect(speech.cancelSpeaking).toHaveBeenCalledTimes(2)
    expect(speech.start).toHaveBeenCalledTimes(2)
    resolveReply()
  })

  it('uses natural case for spoken JARVIS and HUD names', () => {
    expect(naturalCase('JARVIS online, HUD ready')).toBe('Jarvis online, hud ready')
  })

  it('exports the specified timing constants', () => {
    expect(HOLD_MS).toBe(700)
    expect(SILENCE_MS).toBe(2200)
    expect(IDLE_END_MS).toBe(30000)
    expect(REST_MS).toBe(1100)
  })
})
