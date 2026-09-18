// Voice out (Phase F, unit 2) — server-first speech: POST /api/tts renders a
// natural edge-tts neural voice; a 204 or any failure falls back to the
// browser's own speechSynthesis, labelled "browser voice (fallback)". Mute
// and the chosen voice are remembered in localStorage (a per-viewer
// convenience, never state JARVIS depends on).

const MUTE_KEY = 'jarvis.voice.muted'
const VOICE_KEY = 'jarvis.voice.edge'
export const DEFAULT_EDGE_VOICE = 'en-US-GuyNeural'

function store() {
  try { return globalThis.localStorage || null } catch { return null }
}

export function isMuted() {
  try { return store()?.getItem(MUTE_KEY) === '1' } catch { return false }
}

export function setMuted(v) {
  try { store()?.setItem(MUTE_KEY, v ? '1' : '0') } catch {}
}

export function getEdgeVoice() {
  try { return store()?.getItem(VOICE_KEY) || DEFAULT_EDGE_VOICE } catch { return DEFAULT_EDGE_VOICE }
}

export function setEdgeVoice(id) {
  try { store()?.setItem(VOICE_KEY, String(id || DEFAULT_EDGE_VOICE)) } catch {}
}

/**
 * Speak `text`. Tries the server's /api/tts first (edge-tts neural voice);
 * on a 204 (no engine available) or any network failure it calls
 * `fallbackSpeak(text)` — the caller wires that to voice-picker's speak(),
 * which is labelled "browser voice (fallback)" in the UI. Muted or empty
 * text is a silent no-op. Every dependency is injectable so this never
 * touches a real Audio element or network call under test.
 */
export async function speak(text, {
  fetchImpl = fetch,
  voice = getEdgeVoice(),
  fallbackSpeak = () => false,
  AudioCtor = (typeof Audio !== 'undefined' ? Audio : null),
  createObjectURL = (typeof URL !== 'undefined' && URL.createObjectURL) ? URL.createObjectURL.bind(URL) : null,
  muted = isMuted(),
} = {}) {
  const clean = String(text || '').trim()
  if (!clean || muted) return { via: muted ? 'muted' : 'empty' }
  try {
    const r = await fetchImpl('/api/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: clean, voice }),
    })
    if (r.status === 204) { fallbackSpeak(clean); return { via: 'browser-fallback', reason: r.headers?.get?.('x-tts-reason') || '' } }
    if (!r.ok) { fallbackSpeak(clean); return { via: 'browser-fallback', error: 'HTTP ' + r.status } }
    if (!AudioCtor || !createObjectURL) { fallbackSpeak(clean); return { via: 'browser-fallback', reason: 'no Audio element available' } }
    const blob = await r.blob()
    const url = createObjectURL(blob)
    const audio = new AudioCtor(url)
    await audio.play().catch(() => {})
    return { via: 'edge-tts' }
  } catch (e) {
    fallbackSpeak(clean)
    return { via: 'browser-fallback', error: String(e?.message || e) }
  }
}

export { store as _storeForTests }
