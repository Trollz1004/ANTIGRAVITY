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
