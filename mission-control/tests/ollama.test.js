import { describe, it, expect } from 'vitest'

// Local Ollama brain: NDJSON from /api/chat is converted to the same SSE
// delta/result contract the Claude bridge uses, so the page has one stream reader.
const o = await import('../lib/ollama.mjs')

describe('ollamaLineToEvent', () => {
  it('maps a streamed chunk to a delta and the final chunk to a result', () => {
    expect(o.ollamaLineToEvent(JSON.stringify({ model: 'gemma4:e4b', message: { role: 'assistant', content: 'Hel' }, done: false })))
      .toEqual({ type: 'delta', text: 'Hel' })
    expect(o.ollamaLineToEvent(JSON.stringify({ model: 'gemma4:e4b', message: { role: 'assistant', content: '' }, done: true, total_duration: 5, eval_count: 7 })))
      .toMatchObject({ type: 'result', ok: true, model: 'gemma4:e4b', tokens: 7 })
    expect(o.ollamaLineToEvent(JSON.stringify({ error: 'model not found' }))).toMatchObject({ type: 'error', message: 'model not found' })
    expect(o.ollamaLineToEvent('not json')).toBeNull()
    expect(o.ollamaLineToEvent('')).toBeNull()
  })
})

describe('pickOllamaModel', () => {
  it('prefers the requested model, then JARVIS_OLLAMA_MODEL, then the first local (non-cloud) tag, and rejects odd names', () => {
    const tags = ['gemma4:31b-cloud', 'deepseek-v4-flash:cloud', 'gemma4:e4b', 'x/Fable:latest']
    expect(o.pickOllamaModel({ requested: 'gemma4:e4b', configured: '', tags })).toBe('gemma4:e4b')
    expect(o.pickOllamaModel({ requested: '', configured: 'x/Fable:latest', tags })).toBe('x/Fable:latest')
    expect(o.pickOllamaModel({ requested: '', configured: '', tags })).toBe('gemma4:e4b')
    expect(o.pickOllamaModel({ requested: 'bad name; rm', configured: '', tags })).toBe('gemma4:e4b')
    expect(o.pickOllamaModel({ requested: '', configured: '', tags: [] })).toBe('')
  })
})

describe('resolveOllamaBase', () => {
  it('uses JARVIS_OLLAMA_URL, then OLLAMA_HOST, only when they are http(s) URLs; never mistakes a key for a base', () => {
    expect(o.resolveOllamaBase({ JARVIS_OLLAMA_URL: 'http://127.0.0.1:11434/' })).toBe('http://127.0.0.1:11434')
    expect(o.resolveOllamaBase({ OLLAMA_HOST: 'http://192.168.0.40:11434' })).toBe('http://192.168.0.40:11434')
    expect(o.resolveOllamaBase({ OLLAMA_HOST: '0.0.0.0:11434' })).toBe('http://0.0.0.0:11434')
    expect(o.resolveOllamaBase({ OLLAMA_API: 'b515eee860b345779ecd98b08e45de83.secretsecret' })).toBe('http://127.0.0.1:11434')
    expect(o.resolveOllamaBase({})).toBe('http://127.0.0.1:11434')
  })
})

describe('streamOllamaChat', () => {
  it('posts the chat with stream:true and emits delta events then a result', async () => {
    const body = [
      JSON.stringify({ message: { content: 'Hi' }, done: false }),
      JSON.stringify({ message: { content: ' there' }, done: false }),
      JSON.stringify({ message: { content: '' }, done: true, eval_count: 2 }),
    ].join('\n') + '\n'
    const calls = []
    const fetchImpl = async (url, opts) => {
      calls.push({ url, body: JSON.parse(opts.body) })
      return { ok: true, status: 200, body: new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(body)); c.close() } }) }
    }
    const events = []
    const out = await o.streamOllamaChat({ base: 'http://127.0.0.1:11434', model: 'gemma4:e4b', messages: [{ role: 'user', content: 'hi' }], fetch: fetchImpl, onEvent: (e) => events.push(e) })
    expect(calls[0].url).toBe('http://127.0.0.1:11434/api/chat')
    expect(calls[0].body).toMatchObject({ model: 'gemma4:e4b', stream: true })
    expect(events.filter((e) => e.type === 'delta').map((e) => e.text).join('')).toBe('Hi there')
    expect(events.at(-1)).toMatchObject({ type: 'result', text: 'Hi there' })
    expect(out.text).toBe('Hi there')
  })
})
