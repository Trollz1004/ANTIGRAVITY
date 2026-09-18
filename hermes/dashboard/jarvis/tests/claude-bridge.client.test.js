import { describe, expect, it, vi } from 'vitest'
import { parseSseChunk, streamClaude } from '../js/jarvis/claude-bridge.js'

function responseFromSse(text, ok = true, status = 200) {
  return {
    ok,
    status,
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(text))
        controller.close()
      },
    }),
    text: async () => 'bridge refused',
  }
}

describe('browser bridge SSE client', () => {
  it('splits complete events and keeps a partial trailing block', () => {
    const parsed = parseSseChunk('event: init\ndata: {"ok":true}\n\nevent: delta\ndata: {"text":"hi"}\n\nevent: result\ndata: {"text":"done"}')
    expect(parsed.events).toEqual([
      { event: 'init', data: { ok: true } },
      { event: 'delta', data: { text: 'hi' } },
    ])
    expect(parsed.rest).toBe('event: result\ndata: {"text":"done"}')
  })

  it('ignores SSE comment lines', () => {
    const parsed = parseSseChunk(': ping\n\nevent: delta\ndata: {"text":"ok"}\n\n')
    expect(parsed.events).toEqual([{ event: 'delta', data: { text: 'ok' } }])
  })

  it('posts Claude payload and resolves streamed init, delta and result data', async () => {
    const fetchImpl = vi.fn(async (_url, options) => {
      expect(JSON.parse(options.body)).toEqual({ prompt: 'hello', sessionId: 'old', persona: 'jarvis' })
      return responseFromSse([
        'event: init', 'data: {"sessionId":"new"}', '',
        'event: delta', 'data: {"text":"Hi"}', '',
        'event: result', 'data: {"ok":true,"text":"Hi there","sessionId":"new"}', '',
      ].join('\n'))
    })
    const events = []
    const result = await streamClaude({ prompt: 'hello', sessionId: 'old', fetchImpl, onEvent: (event, data) => events.push({ event, data }) })
    expect(result).toEqual({ sessionId: 'new', text: 'Hi there' })
    expect(events.map((entry) => entry.event)).toEqual(['init', 'delta', 'result'])
    expect(fetchImpl.mock.calls[0][1].headers['x-bridge-token']).toBeUndefined()
  })

  it('forwards model and permissionMode when given, and omits them when not', async () => {
    const fetchImpl = vi.fn(async (_url, options) => responseFromSse('event: result\ndata: {"text":"ok"}\n\n'))
    await streamClaude({ prompt: 'a', model: 'opusplan', permissionMode: 'acceptEdits', fetchImpl })
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body)
    expect(body.model).toBe('opusplan')
    expect(body.permissionMode).toBe('acceptEdits')
    await streamClaude({ prompt: 'b', fetchImpl })
    const bare = JSON.parse(fetchImpl.mock.calls[1][1].body)
    expect(bare.model).toBeUndefined()
    expect(bare.permissionMode).toBeUndefined()
  })

  it('sends the bridge token only when one is provided', async () => {
    const fetchImpl = vi.fn(async (_url, options) => responseFromSse('event: result\ndata: {"text":"ok"}\n\n'))
    await streamClaude({ prompt: 'hello', token: 'secret', fetchImpl })
    expect(fetchImpl.mock.calls[0][1].headers['x-bridge-token']).toBe('secret')
  })

  it('reports and rejects a refused Claude bridge response', async () => {
    const onEvent = vi.fn()
    await expect(streamClaude({ prompt: 'hello', fetchImpl: async () => responseFromSse('', false, 403), onEvent }))
      .rejects.toThrow('Claude bridge refused (403)')
    expect(onEvent).toHaveBeenCalledWith('error', { message: 'Claude bridge refused (403)' })
  })
})
