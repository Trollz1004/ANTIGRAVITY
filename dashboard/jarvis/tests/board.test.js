import { describe, it, expect } from 'vitest'

const board = await import('../lib/board.mjs')

describe('vote parsing — strict, no vibes', () => {
  it('extracts YES/NO from free-form model output', () => {
    expect(board.parseVote('I vote YES because the risk is low.').vote).toBe('YES')
    expect(board.parseVote('no — the data does not support it').vote).toBe('NO')
    expect(board.parseVote('**VOTE: NO**\nReason: scope creep.').vote).toBe('NO')
    expect(board.parseVote('After review... Final answer: yes').vote).toBe('YES')
  })
  it('rejects a vote when both words appear ambiguously or none', () => {
    expect(board.parseVote('yes and no at the same time').vote).toBe(null)
    expect(board.parseVote('the yes-men arrived').vote).toBe(null) // word-boundary, not substring
    expect(board.parseVote('I need more information before deciding.').vote).toBe(null)
  })
  it('carries a one-line reason, never the whole essay', () => {
    const r = board.parseVote('YES\n\nBecause the numbers hold up and risk is capped.')
    expect(r.reason).toMatch(/numbers hold up/)
    expect(r.reason.length).toBeLessThanOrEqual(160)
  })
})

describe('tally — 6 voters, founder tie-break as the 7th', () => {
  const seat = (name, vote) => ({ name, vote, reason: vote ? 'r' : null })

  it('passes with 4-2 or better, fails with 2-4, no founder vote', () => {
    const clear = board.tally([seat('a', 'YES'), seat('b', 'YES'), seat('c', 'YES'), seat('d', 'YES'), seat('e', 'NO'), seat('f', 'NO')])
    expect(clear).toMatchObject({ yes: 4, no: 2, outcome: 'PASSED', tieBreak: null })
    const against = board.tally([seat('a', 'NO'), seat('b', 'NO'), seat('c', 'NO'), seat('d', 'NO'), seat('e', 'YES'), seat('f', 'YES')])
    expect(against.outcome).toBe('FAILED')
    expect(against.tieBreak).toBe(null)
  })

  it('a 3-3 split goes to the founder tie-break, whose side wins', () => {
    const seats = [seat('a', 'YES'), seat('b', 'YES'), seat('c', 'YES'), seat('d', 'NO'), seat('e', 'NO'), seat('f', 'NO')]
    expect(board.tally(seats, { founderVote: 'NO' })).toMatchObject({ yes: 3, no: 3, tie: true, outcome: 'FAILED', tieBreak: 'NO' })
    expect(board.tally(seats, { founderVote: 'YES' })).toMatchObject({ tie: true, outcome: 'PASSED', tieBreak: 'YES' })
  })

  it('a tied and uncast founder vote reports FOUNDER DECIDES', () => {
    const seats = [seat('a', 'YES'), seat('b', 'YES'), seat('c', 'YES'), seat('d', 'NO'), seat('e', 'NO'), seat('f', 'NO')]
    expect(board.tally(seats)).toMatchObject({ tie: true, outcome: 'FOUNDER DECIDES', tieBreak: null })
  })

  it('abstentions reduce quorum; below 4 voting seats there is no verdict', () => {
    const two = board.tally([seat('a', 'YES'), seat('b', 'NO'), seat('c', null), seat('d', null), seat('e', null), seat('f', null)])
    expect(two).toMatchObject({ yes: 1, no: 1, outcome: 'NO QUORUM' })
    const none = board.tally([seat('a', null), seat('b', null), seat('c', null), seat('d', null), seat('e', null), seat('f', null)])
    expect(none).toMatchObject({ yes: 0, no: 0, outcome: 'NO QUORUM' })
  })

  it('counts every seat as an abstention, never fabricates a vote', () => {
    const t = board.tally([seat('a', 'YES'), seat('b', 'YES'), seat('c', 'YES'), seat('d', 'YES'), seat('e', null), seat('f', null)])
    expect(t).toMatchObject({ yes: 4, no: 0, abstain: 2, outcome: 'PASSED' })
  })
})
