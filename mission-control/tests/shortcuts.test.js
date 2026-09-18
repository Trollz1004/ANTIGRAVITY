import { describe, it, expect } from 'vitest'
import { greetingFor, handleShortcut } from '../js/jarvis/shortcuts.js'

describe('JARVIS shortcuts', () => {
  it('maps number keys to brains and greeting actions', () => {
    expect(handleShortcut('1', { typing: false, state: {} })).toEqual({ type: 'brain', brain: 'omni', greet: true })
    expect(handleShortcut('2', { typing: false, state: {} })).toEqual({ type: 'brain', brain: 'claude', greet: true })
    expect(handleShortcut('3', { typing: false, state: {} })).toEqual({ type: 'brain', brain: 'ollama', greet: true })
    expect(handleShortcut('4', { typing: false, state: {} })).toEqual({ type: 'brain', brain: 'hermes', greet: true })
  })

  it('ignores shortcuts while typing', () => {
    expect(handleShortcut('1', { typing: true, state: {} })).toBeNull()
    expect(handleShortcut('Escape', { typing: true, state: {} })).toBeNull()
    expect(handleShortcut('?', { typing: true, state: {} })).toBeNull()
  })

  it('maps Escape to conversation end and question mark to help', () => {
    expect(handleShortcut('Escape', { typing: false, state: {} })).toEqual({ type: 'end' })
    expect(handleShortcut('?', { typing: false, state: {} })).toEqual({ type: 'help' })
  })

  it('does not claim ordinary letters', () => {
    expect(handleShortcut('x', { typing: false, state: {} })).toBeNull()
  })
})

describe('JARVIS greetings', () => {
  it('uses natural-case greetings with an owner name', () => {
    expect(greetingFor('omni', 'Avery')).toBe('Hey Avery, Jarvis here on OmniRoute. What do you need?')
    expect(greetingFor('claude', 'Avery')).toBe('Hey Avery, Jarvis here, running on Claude. What are we building?')
    expect(greetingFor('ollama', 'Avery')).toBe("Hey Avery, Jarvis here on the local model. What's next?")
    expect(greetingFor('hermes', 'Avery')).toBe('Hey Avery, Jarvis here with Hermes. What should we start?')
  })

  it('drops the owner clause cleanly when no name is available', () => {
    expect(greetingFor('omni', '')).toBe('Jarvis here on OmniRoute. What do you need?')
    expect(greetingFor('claude', '')).toBe('Jarvis here, running on Claude. What are we building?')
    expect(greetingFor('ollama', '')).toBe("Jarvis here on the local model. What's next?")
    expect(greetingFor('hermes', '')).toBe('Jarvis here with Hermes. What should we start?')
    expect(greetingFor('omni', '')).not.toMatch(/,\s*,|,\s*Jarvis/)
  })
})
