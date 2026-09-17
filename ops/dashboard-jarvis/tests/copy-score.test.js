import { describe, it, expect } from 'vitest'
import { scoreCopy } from '../lib/copy-score.mjs'

describe('lib/copy-score.mjs — SlopMonster-derived rules (MIT, ItsssssJack/SlopMonster)', () => {
  it('scores plain business copy as clean (5/5, nothing tripped)', () => {
    const r = scoreCopy('DREAM Online shipped a new patch this week. It fixes three bugs and adds a settings screen.')
    expect(r.score).toBe(5)
    expect(r.tripped).toEqual([])
  })

  it('catches vocabulary tells, matched by root', () => {
    const r = scoreCopy('This update will streamline your workflow and unlock new possibilities.')
    expect(r.score).toBeLessThan(5)
    expect(r.tripped.some((h) => h.category === 'vocab')).toBe(true)
  })

  it('catches the "not just X but Y"-adjacent construction set (phrases)', () => {
    const r = scoreCopy('When it comes to productivity, at the end of the day this app delivers.')
    expect(r.tripped.some((h) => h.category === 'phrases')).toBe(true)
  })

  it('catches em-dash-heavy sentences', () => {
    const r = scoreCopy('This is fast — really fast — and also cheap — somehow.')
    expect(r.tripped.some((h) => h.category === 'punctuation')).toBe(true)
  })

  it('catches semicolon-heavy short copy', () => {
    const r = scoreCopy('Fast; reliable; simple; easy; done.')
    expect(r.tripped.some((h) => h.category === 'punctuation')).toBe(true)
  })

  it('catches invented social proof numbers', () => {
    const r = scoreCopy('Join 12,000 happy customers using our app today.')
    expect(r.tripped.some((h) => h.category === 'proof')).toBe(true)
  })

  it('catches a rule-of-three list', () => {
    const r = scoreCopy('Our service is fast, reliable, and affordable for everyone.')
    expect(r.tripped.some((h) => h.category === 'rhythm')).toBe(true)
  })

  it('never scores below 0 even with every category tripped', () => {
    const r = scoreCopy(
      'Delve into our seamless, robust platform — it will unlock — and leverage — your potential — today! ' +
      'When it comes to results, at the end of the day, join 5,000 happy customers who say fast, reliable, and cheap.'
    )
    expect(r.score).toBeGreaterThanOrEqual(0)
  })
})
