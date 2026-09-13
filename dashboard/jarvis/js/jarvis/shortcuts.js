const BRAIN_KEYS = {
  1: 'omni',
  2: 'claude',
  3: 'ollama',
  4: 'hermes',
}

const GREETINGS = {
  omni: 'Jarvis here on OmniRoute. What do you need?',
  claude: 'Jarvis here, running on Claude. What are we building?',
  ollama: "Jarvis here on the local model. What's next?",
  hermes: 'Jarvis here with Hermes. What should we start?',
}

export function handleShortcut(key, { typing = false, state = {} } = {}) {
  if (typing || state?.ctrlKey || state?.metaKey) return null
  if (BRAIN_KEYS[key]) return { type: 'brain', brain: BRAIN_KEYS[key], greet: true }
  if (key === 'Escape') return { type: 'end' }
  if (key === '?') return { type: 'help' }
  return null
}

export function greetingFor(brain, ownerName = '') {
  const greeting = GREETINGS[brain] || GREETINGS.omni
  const name = String(ownerName || '').trim()
  return name ? `Hey ${name}, ${greeting}` : greeting
}

export function installShortcuts(document, handlers = {}) {
  const isTyping = (target) => ['input', 'textarea', 'select'].includes(String(target?.tagName || '').toLowerCase())
  const onKeydown = (event) => {
    if (event.repeat || event.ctrlKey || event.metaKey) return
    const state = typeof handlers.state === 'function' ? handlers.state() : handlers.state
    const action = handleShortcut(event.key, { typing: isTyping(event.target), state })
    if (!action) return
    event.preventDefault?.()
    if (action.type === 'brain') handlers.onBrain?.(action.brain)
    if (action.type === 'end') handlers.onEnd?.()
    if (action.type === 'help') handlers.onHelp?.()
  }
  document.addEventListener('keydown', onKeydown)
  return () => document.removeEventListener?.('keydown', onKeydown)
}
