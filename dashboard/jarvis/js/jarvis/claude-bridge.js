function parseSseChunk(buffer) {
  const blocks = buffer.split(/\r?\n\r?\n/)
  const rest = blocks.pop() || ''
  const events = []
  for (const block of blocks) {
    let event = 'message'
    const dataLines = []
    for (const line of block.split(/\r?\n/)) {
      if (!line || line.startsWith(':')) continue
      if (line.startsWith('event:')) event = line.slice(6).trim()
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart())
    }
    if (!dataLines.length) continue
    const raw = dataLines.join('\n')
    let data = raw
    try { data = JSON.parse(raw) } catch {}
    events.push({ event, data })
  }
  return { events, rest }
}

async function readSse(response, onEvent = () => {}) {
  if (!response.body?.getReader) return
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parsed = parseSseChunk(buffer)
    buffer = parsed.rest
    for (const entry of parsed.events) onEvent(entry.event, entry.data)
  }
  buffer += decoder.decode()
  const parsed = parseSseChunk(`${buffer}\n\n`)
  for (const entry of parsed.events) onEvent(entry.event, entry.data)
}

function bridgeError(response, label) {
  const message = `${label} refused (${response.status})`
  return new Error(message)
}

async function streamClaude({ prompt, sessionId, persona = 'jarvis', token, fetchImpl = fetch, onEvent = () => {} }) {
  const body = { prompt, persona }
  if (sessionId) body.sessionId = sessionId
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['x-bridge-token'] = token
  const response = await fetchImpl('/api/claude/chat', { method: 'POST', headers, body: JSON.stringify(body) })
  if (!response.ok) {
    const error = bridgeError(response, 'Claude bridge')
    onEvent('error', { message: error.message })
    throw error
  }
  let currentSession = sessionId || ''
  let text = ''
  await readSse(response, (event, data) => {
    onEvent(event, data)
    if (event === 'init' && data?.sessionId) currentSession = data.sessionId
    if (event === 'result') {
      currentSession = data?.sessionId || currentSession
      text = data?.text || ''
    }
  })
  return { sessionId: currentSession, text }
}

async function streamOllama({ messages, model, fetchImpl = fetch, onEvent = () => {} }) {
  const body = { messages }
  if (model) body.model = model
  const response = await fetchImpl('/api/ollama/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!response.ok) {
    const error = bridgeError(response, 'Ollama bridge')
    onEvent('error', { message: error.message })
    throw error
  }
  let text = ''
  let resultModel = model
  await readSse(response, (event, data) => {
    onEvent(event, data)
    if (event === 'delta') text += data?.text || ''
    if (event === 'result') {
      text = data?.text || text
      resultModel = data?.model || resultModel
    }
  })
  return { text, model: resultModel }
}

async function streamHermes({ prompt, session, fetchImpl = fetch, onEvent = () => {} }) {
  const body = { prompt }
  if (session) body.session = session
  const response = await fetchImpl('/api/hermes/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!response.ok) {
    const error = bridgeError(response, 'Hermes bridge')
    onEvent('error', { message: error.message })
    throw error
  }
  let result = {}
  await readSse(response, (event, data) => {
    onEvent(event, data)
    if (event === 'result') result = data || {}
  })
  return { text: result.text || '', latencyMs: result.latencyMs }
}

async function getStatus(path, fetchImpl) {
  try {
    const response = await fetchImpl(path)
    if (!response.ok) return null
    return await response.json()
  } catch { return null }
}

async function getBridgeStatus(fetchImpl = fetch) {
  const [claude, ollama, hermes] = await Promise.all([
    getStatus('/api/claude/status', fetchImpl),
    getStatus('/api/ollama/tags', fetchImpl),
    getStatus('/api/hermes/status', fetchImpl),
  ])
  return { claude, ollama, hermes }
}

export { parseSseChunk, readSse, streamClaude, streamOllama, streamHermes, getBridgeStatus }
