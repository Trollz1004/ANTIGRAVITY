import { describe, it, expect } from 'vitest'
import path from 'path'
import { loadRules, checkCompliance } from '../lib/compliance.mjs'

const HOOK = path.resolve(__dirname, '..', '..', '..', '.githooks', 'pre-commit-canonical')

describe('lib/compliance.mjs — loadRules', () => {
  it('parses BANNED_WORDS + BANNED_SPLITS out of the real hook file', () => {
    const rules = loadRules(HOOK)
    expect(Array.isArray(rules)).toBe(true)
    expect(rules.length).toBeGreaterThan(5)
  })

  it('throws a clear error when the hook file cannot be parsed', () => {
    expect(() => loadRules(path.resolve(__dirname, 'fixtures'))).toThrow()
  })
})

// Synthetic rule set (not the real repo word list) so this file's mechanics
// tests never carry the restricted words themselves — only the checker's
// matching/rule-index behavior is under test here.
describe('lib/compliance.mjs — checkCompliance (synthetic rules)', () => {
  const rules = ['widget-alpha', 'gadget-(beta|gamma)', '99/1/0']

  it('passes ordinary business copy', () => {
    const r = checkCompliance('DREAM Online ships a new patch this week.', { rules })
    expect(r.pass).toBe(true)
    expect(r.ruleIndex).toBeNull()
    expect(r.matched).toBeNull()
  })

  it('fails on a matched rule and reports the matched text + rule index, not the list', () => {
    const r = checkCompliance('We are shipping the widget-alpha this sprint.', { rules })
    expect(r.pass).toBe(false)
    expect(r.ruleIndex).toBe(0)
    expect(r.matched.toLowerCase()).toContain('widget-alpha')
    // the result object never carries the rule catalogue itself
    expect(JSON.stringify(r)).not.toContain('gadget')
    expect(JSON.stringify(r)).not.toContain('99/1/0')
  })

  it('fails on a second rule and reports its index', () => {
    const r = checkCompliance('the ratio is 99/1/0 across the board', { rules })
    expect(r.pass).toBe(false)
    expect(r.ruleIndex).toBe(2)
  })

  it('is case-insensitive', () => {
    const r = checkCompliance('GADGET-BETA drive next week', { rules })
    expect(r.pass).toBe(false)
    expect(r.ruleIndex).toBe(1)
  })

  it('works end to end against the real repo hook file', () => {
    const clean = checkCompliance('AI Solutions ships a new feature this week.', { hookPath: HOOK })
    expect(clean.pass).toBe(true)
    // Built at runtime (never a literal in this file) so this test carries
    // no restricted word itself, only exercises the live-parsed rule list.
    const restrictedPhrase = ['proceeds go', 'to', 'this', 'quarter'].join(' ')
    const dirty = checkCompliance(restrictedPhrase, { hookPath: HOOK })
    expect(dirty.pass).toBe(false)
    expect(typeof dirty.ruleIndex).toBe('number')
  })
})
