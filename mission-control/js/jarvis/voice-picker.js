// Voice picker: lists speechSynthesis voices, persists the user's pick by
// name, supports an offline "local pack" override, and exposes a speak()
// helper that uses the pick. The existing selectFemaleVoice() regex in
// voice.js still owns the auto fallback when the user hasn't chosen.

const STORAGE_KEY = 'jarvis.voice.pick'
let localVoice = null // installed offline voice override (from setLocalVoice)

function storage() {
  return globalThis.localStorage
}

function readPick() {
  try {
    return storage()?.getItem(STORAGE_KEY) ?? null
  } catch {
    return null
  }
}

function writePick(name) {
  try {
    if (!name) storage()?.removeItem(STORAGE_KEY)
    else storage()?.setItem(STORAGE_KEY, String(name))
    return true
  } catch {
    return false
  }
}

function synth() {
  return globalThis.window?.speechSynthesis
}

function utteranceCtor() {
  return globalThis.window?.SpeechSynthesisUtterance
}

// Returns the current browser voice list, or [] when speechSynthesis
// isn't available (e.g. Node tests that haven't stubbed window yet).
export function listVoices() {
  const s = synth()
  if (!s || typeof s.getVoices !== 'function') return []
  try {
    return Array.from(s.getVoices() || [])
  } catch {
    return []
  }
}

// Stores a voice name. Passing null/empty clears the pick so the
// heuristic takes over again.
export function pickVoice(name) {
  if (!name) {
    writePick(null)
    return null
  }
  writePick(name)
  return name
}

export function getPickedVoiceName() {
  return readPick()
}

// Resolves which Voice object should drive the next utterance. Honors
// the stored pick; if localOnly is true and a local pack is installed,
// the local voice wins over the pick. Falls back to selectFemaleVoice's
// regex (imported lazily to keep this module self-contained when run
// without a DOM).
export function resolveSpeakVoice({ localOnly = false } = {}) {
  const voices = listVoices()
  if (!voices.length) return null

  if (localOnly && localVoice && voices.some((v) => v.name === localVoice.name)) {
    return voices.find((v) => v.name === localVoice.name)
  }

  const pick = readPick()
  if (pick) {
    const match = voices.find((v) => v.name === pick)
    if (match) return match
  }

  if (localOnly && localVoice) return localVoice

  // Reuse the existing female heuristic by name pattern (kept in sync with
  // voice.js' selectFemaleVoice regex so behavior is identical).
  const femalePattern = /\b(female|zira|aria|samantha|eva|jenny|aria-)\b/i
  const found = voices.find((v) => femalePattern.test(v.name))
  return found || voices[0]
}

// Registers an offline/local voice. After this, resolveSpeakVoice can
// return it when localOnly is true.
export function setLocalVoice(voice) {
  localVoice = voice || null
  return Boolean(localVoice)
}

export function isLocalPackAvailable() {
  return Boolean(localVoice)
}

// Speaks text using the resolved voice. Returns true when an utterance
// was dispatched, false otherwise (no voices, no SpeechSynthesis, etc.).
export function speak(text, opts = {}) {
  const s = synth()
  const Utter = utteranceCtor()
  if (!s || !Utter) return false
  const utt = new Utter(String(text ?? ''))
  const voice = resolveSpeakVoice(opts)
  if (voice) utt.voice = voice
  if (typeof s.speak === 'function') {
    s.speak(utt)
    return true
  }
  return false
}

// Exposed for hermes-voice.js so the existing speak() path keeps working
// with a stored pick applied to whichever voice SpeechSynthesis chose.
export function applyPickToUtterance(utt) {
  if (!utt) return null
  const voice = resolveSpeakVoice()
  if (voice) utt.voice = voice
  return utt.voice
}

// ── compatibility surface for hermes-voice.js (added 2026-09-29) ──────────
// hermes-voice.js imported four names this module never exported. In vitest
// that import silently yields undefined; in a browser it is a SyntaxError at
// module load, which took the whole dashboard bundle down with it (every tile
// on the Dashboard tab read "—" and no panel loaded). These are the real
// implementations over this module's own state.

let localPack = null // { voices: [names...] } as served by /api/voices/local-pack.json

export function getLocalPack() {
  return localPack
}

// Registers a downloaded local pack and, when the browser already lists one of
// its voices, makes that voice the local override for resolveSpeakVoice.
export function setLocalPack(pack) {
  localPack = pack && Array.isArray(pack.voices) ? pack : null
  if (!localPack) { setLocalVoice(null); return false }
  const names = new Set(localPack.voices.map((v) => (typeof v === 'string' ? v : v && v.name)).filter(Boolean))
  const match = listVoices().find((v) => names.has(v.name))
  setLocalVoice(match || null)
  return true
}

// The select stores voice names (populateVoiceSelect writes them as values),
// so the stored "URI" is the same name pickVoice persists.
export function setStoredVoiceURI(value) {
  return pickVoice(value || null)
}

// Fills a <select> with the browser's voices (filtered to the local pack when
// preferLocal is set and a pack is loaded), keeping the stored pick selected.
export function populateVoiceSelect(select, { preferLocal = false } = {}) {
  if (!select) return 0
  let voices = listVoices()
  if (preferLocal && localPack) {
    const names = new Set(localPack.voices.map((v) => (typeof v === 'string' ? v : v && v.name)).filter(Boolean))
    const local = voices.filter((v) => names.has(v.name))
    if (local.length) voices = local
  }
  const pick = readPick()
  select.innerHTML = ''
  const blank = document.createElement('option')
  blank.value = ''; blank.textContent = voices.length ? '(default voice)' : '(no voices available)'
  select.appendChild(blank)
  for (const v of voices) {
    const o = document.createElement('option')
    o.value = v.name; o.textContent = `${v.name}${v.lang ? ' · ' + v.lang : ''}${v.localService ? ' · local' : ''}`
    if (pick && v.name === pick) o.selected = true
    select.appendChild(o)
  }
  return voices.length
}
