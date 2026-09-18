// SpeechRecognition captures microphone input while speechSynthesis plays replies.
// Keep them separate: no analyser or microphone AudioNode ever shares reply playback.
export const HOLD_MS = 700
export const SILENCE_MS = 2200
export const IDLE_END_MS = 30000
export const REST_MS = 1100

export function naturalCase(text) {
  return String(text || '')
    .replace(/\bJARVIS\b/g, 'Jarvis')
    .replace(/\bHUD\b/g, 'hud')
}

const FEMALE_VOICE_NAME = /aria|ava|emma|hazel|jenny|libby|michelle|natasha|olivia|sara|sonia|susan|zira/i

export function selectFemaleVoice(voices) {
  const list = Array.from(voices || [])
  return list.find((voice) => /en-US/i.test(voice.lang) && FEMALE_VOICE_NAME.test(voice.name))
    || list.find((voice) => FEMALE_VOICE_NAME.test(voice.name))
    || list.find((voice) => /en-US/i.test(voice.lang))
    || list[0]
    || null
}

function transcriptFrom(event) {
  if (typeof event === 'string') return event.trim()
  if (event?.transcript) return String(event.transcript).trim()
  if (!event?.results) return ''
  const start = Number.isInteger(event.resultIndex) ? event.resultIndex : 0
  return Array.from(event.results)
    .slice(start)
    .map((result) => result?.[0]?.transcript || '')
    .join('')
    .trim()
}

export function createPushToTalk({
  globeEl,
  onTurn = () => {},
  onInterim = () => {},
  onStop = () => {},
  onState = () => {},
  speech,
  now = () => Date.now(),
}) {
  let state = 'idle'
  let live = false
  let pressedAt = null
  let pressBeganLatched = false
  let heardDuringPress = false
  let heardAny = false
  let heardAt = 0
  let listeningAt = 0
  let transcript = ''
  let awaitingReply = false
  let paused = false
  let poller = null
  let turnNumber = 0

  const announce = () => onState(state, live, globeEl)

  function clearPoller() {
    if (poller) clearInterval(poller)
    poller = null
  }

  function stopRecognition() {
    try { speech?.stop?.() } catch {}
  }

  function startRecognition({ interrupt = false, resetIdle = false } = {}) {
    if (!live || awaitingReply || paused) return
    if (interrupt) speech?.cancelSpeaking?.()
    if (resetIdle) listeningAt = now()
    announce()
    try {
      const started = speech?.start?.()
      if (started === false) end('unavailable')
    } catch {
      end('unavailable')
    }
  }

  function begin(mode, { interrupt = true } = {}) {
    live = true
    paused = false
    state = mode
    heardAny = false
    heardDuringPress = false
    transcript = ''
    listeningAt = now()
    announce()
    ensurePoller()
    startRecognition({ interrupt })
  }

  function ensurePoller() {
    if (!poller) poller = setInterval(checkTimers, 160)
  }

  function finishTurn() {
    const text = transcript.trim()
    if (!text || awaitingReply || !live) return
    awaitingReply = true
    paused = true
    stopRecognition()
    onInterim('')
    const thisTurn = ++turnNumber
    Promise.resolve()
      .then(() => onTurn(text))
      .catch(() => {})
      .finally(() => {
        if (thisTurn !== turnNumber) return
        awaitingReply = false
        transcript = ''
        heardAny = false
        heardDuringPress = false
        if (!live) return
        paused = false
        listeningAt = now()
        startRecognition({ resetIdle: true })
      })
  }

  function checkTimers() {
    if (!live || awaitingReply || paused) return
    const elapsed = now() - (heardAny ? heardAt : listeningAt)
    if (heardAny && elapsed >= SILENCE_MS) {
      finishTurn()
    } else if (!heardAny && elapsed >= IDLE_END_MS) {
      end('idle')
    }
  }

  function press() {
    if (!live || awaitingReply) {
      if (awaitingReply) {
        turnNumber += 1
        awaitingReply = false
      }
      pressBeganLatched = false
      pressedAt = now()
      begin('listening')
      return
    }
    pressBeganLatched = state === 'latched'
    heardDuringPress = false
    pressedAt = now()
    if (paused) {
      paused = false
      startRecognition({ interrupt: true, resetIdle: true })
    }
  }

  function release() {
    if (pressedAt === null) return
    const heldFor = now() - pressedAt
    pressedAt = null
    if (heldFor >= HOLD_MS && heardDuringPress) {
      finishTurn()
      return
    }
    if (pressBeganLatched) {
      end('tap')
      return
    }
    state = 'latched'
    announce()
  }

  function tap() {
    if (live && state === 'latched' && !awaitingReply) {
      end('tap')
      return
    }
    if (!live || awaitingReply) {
      if (awaitingReply) {
        turnNumber += 1
        awaitingReply = false
      }
      begin('latched')
      return
    }
    state = 'latched'
    paused = false
    announce()
    startRecognition({ interrupt: true, resetIdle: true })
  }

  function pause() {
    if (!live || awaitingReply) return
    paused = true
    stopRecognition()
  }

  function resume() {
    if (!live || awaitingReply || !paused) return
    paused = false
    listeningAt = now()
    startRecognition({ resetIdle: true })
  }

  function end(reason = 'end') {
    if (!live && state === 'idle') return
    live = false
    paused = false
    awaitingReply = false
    turnNumber += 1
    state = 'idle'
    pressedAt = null
    transcript = ''
    clearPoller()
    stopRecognition()
    onInterim('')
    announce()
    onStop(reason)
  }

  speech.onresult = (event) => {
    if (!live || awaitingReply || paused) return
    const text = transcriptFrom(event)
    if (!text) return
    transcript = text
    heardAny = true
    heardDuringPress = true
    heardAt = now()
    onInterim(text)
  }

  speech.onend = () => {
    if (live && !awaitingReply && !paused) startRecognition()
  }

  return {
    press,
    release,
    tap,
    end,
    pause,
    resume,
    isLive: () => live,
    get state() { return state },
  }
}
