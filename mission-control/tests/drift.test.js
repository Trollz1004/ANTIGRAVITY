import { describe, it, expect, beforeEach } from 'vitest'
import { buildDriftBoard, clearDriftCache, classifyBranch, laneOfBranch, DRIFT_REPOS, DRIFT_CACHE_MS, NO_TOKEN_DETAIL } from '../lib/drift.mjs'

const NOW = Date.parse('2026-09-29T12:00:00Z')
const now = () => NOW
const daysAgo = (n) => new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString()
const commit = (date) => ({ commit: { committer: { date } } })

/**
 * A fake GitHub. `repos[name]` = { branches: [name...], pulls: [{ref, number, title, repo?}], compare: { branch: {ahead_by, behind_by, commits} }, errors: { path-regex source: status } }.
 * Records every call so tests can assert the URLs, headers and call counts.
 */
function fakeGithub(repos) {
  const calls = []
  const fetchImpl = async (url, opts = {}) => {
    calls.push({ url, headers: opts.headers || {} })
    const m = /^https:\/\/api\.github\.com\/repos\/([^/]+\/[^/]+)\/(branches|pulls|compare|commits)(?:\/([^?]*))?/.exec(url)
    if (!m) return { status: 404, json: async () => ({ message: 'Not Found' }) }
    const [, repo, kind, rest] = m
    const r = repos[repo]
    if (!r) return { status: 404, json: async () => ({ message: 'Not Found' }) }
    for (const [pattern, status] of Object.entries(r.errors || {})) {
      if (new RegExp(pattern).test(url)) return { status, json: async () => ({ message: status === 403 ? 'API rate limit exceeded' : 'Not Found' }) }
    }
    const q = new URL(url).searchParams
    const perPage = Number(q.get('per_page') || 30)
    const page = Number(q.get('page') || 1)
    const slice = (list) => list.slice((page - 1) * perPage, page * perPage)
    if (kind === 'branches') return { status: 200, json: async () => slice(['main', ...r.branches].map((name) => ({ name, commit: { sha: 'sha-' + name } }))) }
    if (kind === 'pulls') {
      return { status: 200, json: async () => slice((r.pulls || []).map((p) => ({ number: p.number, title: p.title, html_url: `https://github.com/${repo}/pull/${p.number}`, head: { ref: p.ref, repo: { full_name: p.repo || repo } } }))) }
    }
    if (kind === 'compare') {
      const branch = decodeURIComponent(rest.replace(/^main\.\.\./, ''))
      const c = (r.compare || {})[branch]
      if (!c) return { status: 404, json: async () => ({ message: 'Not Found' }) }
      return { status: 200, json: async () => c }
    }
    if (kind === 'commits') return { status: 200, json: async () => (r.commits || {})[rest] || { message: 'Not Found' } }
    return { status: 404, json: async () => ({}) }
  }
  return { fetchImpl, calls }
}

// one repo covering every status class
const SAMPLE = {
  branches: ['claude/merged-already', 'codex/open-pr', 'hermes/forgotten', 'opencode/in-flight', 'dependabot/npm_and_yarn/vite-9', 'judge/land-it', 'mystery-branch'],
  pulls: [{ ref: 'codex/open-pr', number: 41, title: 'Open the thing' }],
  compare: {
    'claude/merged-already': { ahead_by: 0, behind_by: 12, commits: [] },
    'codex/open-pr': { ahead_by: 2, behind_by: 1, commits: [commit(daysAgo(30)), commit(daysAgo(20))] },
    'hermes/forgotten': { ahead_by: 1, behind_by: 40, commits: [commit(daysAgo(30))] },
    'opencode/in-flight': { ahead_by: 3, behind_by: 0, commits: [commit(daysAgo(9)), commit(daysAgo(3)), commit(daysAgo(1))] },
    'dependabot/npm_and_yarn/vite-9': { ahead_by: 1, behind_by: 2, commits: [commit(daysAgo(2))] },
    'judge/land-it': { ahead_by: 4, behind_by: 0, commits: [commit(daysAgo(8)), commit(daysAgo(8)), commit(daysAgo(8)), commit(daysAgo(8))] },
    'mystery-branch': { ahead_by: 1, behind_by: 0, commits: [commit(daysAgo(0))] },
  },
}

beforeEach(() => clearDriftCache())

describe('lib/drift.mjs, pure helpers', () => {
  it('DRIFT_REPOS names the two repositories', () => {
    expect(DRIFT_REPOS).toEqual(['Trollz1004/ANTIGRAVITY', 'Trollz1004/dream-online'])
  })

  it('maps a branch prefix to its lane', () => {
    const table = {
      'claude/fix-x': 'claude', 'judge/land-y': 'claude', 'codex/task': 'codex', 'dependabot/npm_and_yarn/x': 'dependabot',
      'hermes/cron': 'hermes', 'opencode/eb': 'opencode', 'openclaw/mkt': 'openclaw', 'emergent/wing': 'emergent',
      'feature/thing': 'unknown', 'main': 'unknown', 'claudes-notes': 'unknown', '': 'unknown',
    }
    for (const [name, lane] of Object.entries(table)) expect(laneOfBranch(name), name).toBe(lane)
    expect(laneOfBranch('Claude/Upper')).toBe('claude')
  })

  it('classifies DEAD, LIVE, STALE, WORKING in that order of precedence', () => {
    const c = (o) => classifyBranch({ now: NOW, staleDays: 7, ...o })
    expect(c({ aheadBy: 0, pr: null, lastCommitAt: null })).toBe('DEAD')
    expect(c({ aheadBy: 0, pr: { number: 1 }, lastCommitAt: daysAgo(30) })).toBe('DEAD')
    expect(c({ aheadBy: 2, pr: { number: 1 }, lastCommitAt: daysAgo(30) })).toBe('LIVE')
    expect(c({ aheadBy: 2, pr: null, lastCommitAt: daysAgo(8) })).toBe('STALE')
    expect(c({ aheadBy: 2, pr: null, lastCommitAt: daysAgo(6) })).toBe('WORKING')
    expect(c({ aheadBy: 2, pr: null, lastCommitAt: daysAgo(7) })).toBe('WORKING') // exactly seven days is not older than seven
  })

  it('an unreadable commit date is WORKING, never a guessed STALE', () => {
    expect(classifyBranch({ aheadBy: 2, pr: null, lastCommitAt: null, now: NOW, staleDays: 7 })).toBe('WORKING')
    expect(classifyBranch({ aheadBy: 2, pr: null, lastCommitAt: 'not a date', now: NOW, staleDays: 7 })).toBe('WORKING')
  })
})

describe('lib/drift.mjs, without a token', () => {
  it('is NOT CONFIGURED with no rows and makes no network call', async () => {
    const gh = fakeGithub({})
    for (const token of [undefined, '', '   ']) {
      const r = await buildDriftBoard({ token, fetchImpl: gh.fetchImpl, now })
      expect(r).toEqual({ status: 'NOT CONFIGURED', detail: 'GITHUB_TOKEN not set; the drift board reads GitHub through the server and never from the page' })
      expect(Array.isArray(r)).toBe(false)
    }
    expect(NO_TOKEN_DETAIL).toMatch(/never from the page/)
    expect(gh.calls).toHaveLength(0)
  })
})

describe('lib/drift.mjs, classification through the API', () => {
  it('classifies every status class, maps every lane, and tallies the drift badges', async () => {
    const gh = fakeGithub({ 'Trollz1004/ANTIGRAVITY': SAMPLE })
    const [board] = await buildDriftBoard({ repos: ['Trollz1004/ANTIGRAVITY'], token: 'tok', fetchImpl: gh.fetchImpl, now })
    expect(board).toMatchObject({ repo: 'Trollz1004/ANTIGRAVITY', default: 'main', fetchedAt: new Date(NOW).toISOString(), skipped: [], truncated: false })
    const by = Object.fromEntries(board.branches.map((b) => [b.name, b]))
    expect(Object.keys(by)).not.toContain('main')
    expect(by['claude/merged-already']).toMatchObject({ lane: 'claude', status: 'DEAD', aheadBy: 0, behindBy: 12, lastCommitAt: null, pr: null })
    expect(by['codex/open-pr']).toMatchObject({ lane: 'codex', status: 'LIVE', aheadBy: 2, behindBy: 1, pr: { number: 41, title: 'Open the thing', url: 'https://github.com/Trollz1004/ANTIGRAVITY/pull/41' } })
    expect(by['codex/open-pr'].lastCommitAt).toBe(daysAgo(20)) // the head commit is the last one listed
    expect(by['hermes/forgotten']).toMatchObject({ lane: 'hermes', status: 'STALE', lastCommitAt: daysAgo(30), pr: null })
    expect(by['opencode/in-flight']).toMatchObject({ lane: 'opencode', status: 'WORKING', aheadBy: 3, lastCommitAt: daysAgo(1) })
    expect(by['dependabot/npm_and_yarn/vite-9']).toMatchObject({ lane: 'dependabot', status: 'WORKING' })
    expect(by['judge/land-it']).toMatchObject({ lane: 'claude', status: 'STALE' })
    expect(by['mystery-branch']).toMatchObject({ lane: 'unknown', status: 'WORKING' })
    expect(board.badges).toEqual({
      claude: { dead: 1, stale: 1, live: 0, working: 0 },
      codex: { dead: 0, stale: 0, live: 1, working: 0 },
      hermes: { dead: 0, stale: 1, live: 0, working: 0 },
      opencode: { dead: 0, stale: 0, live: 0, working: 1 },
      dependabot: { dead: 0, stale: 0, live: 0, working: 1 },
      unknown: { dead: 0, stale: 0, live: 0, working: 1 },
    })
  })

  it('honours staleDays', async () => {
    const gh = fakeGithub({ 'Trollz1004/ANTIGRAVITY': SAMPLE })
    const [board] = await buildDriftBoard({ repos: ['Trollz1004/ANTIGRAVITY'], token: 'tok', fetchImpl: gh.fetchImpl, now, staleDays: 2 })
    const by = Object.fromEntries(board.branches.map((b) => [b.name, b.status]))
    expect(by['opencode/in-flight']).toBe('WORKING') // last commit one day ago
    expect(by['dependabot/npm_and_yarn/vite-9']).toBe('WORKING') // exactly two days ago
    expect(by['judge/land-it']).toBe('STALE')
  })

  it('reads the documented endpoints with the bearer header and never puts the token in the result', async () => {
    const gh = fakeGithub({ 'Trollz1004/dream-online': { branches: ['claude/x'], compare: { 'claude/x': { ahead_by: 1, behind_by: 0, commits: [commit(daysAgo(1))] } } } })
    const out = await buildDriftBoard({ repos: ['Trollz1004/dream-online'], token: 'ghp_fakeTEST123', fetchImpl: gh.fetchImpl, now })
    const urls = gh.calls.map((c) => c.url)
    expect(urls).toContain('https://api.github.com/repos/Trollz1004/dream-online/branches?per_page=100&page=1')
    expect(urls).toContain('https://api.github.com/repos/Trollz1004/dream-online/pulls?state=open&per_page=100&page=1')
    expect(urls).toContain('https://api.github.com/repos/Trollz1004/dream-online/compare/main...claude/x')
    for (const c of gh.calls) {
      expect(c.headers).toMatchObject({ Authorization: 'Bearer ghp_fakeTEST123', Accept: 'application/vnd.github+json', 'User-Agent': 'jarvis-driftus' })
    }
    expect(JSON.stringify(out)).not.toContain('ghp_secret')
  })

  it('escapes odd characters in a branch name but keeps its slashes', async () => {
    const gh = fakeGithub({ 'Trollz1004/dream-online': { branches: ['claude/fix #12'], compare: { 'claude/fix #12': { ahead_by: 1, behind_by: 0, commits: [commit(daysAgo(1))] } } } })
    const [board] = await buildDriftBoard({ repos: ['Trollz1004/dream-online'], token: 't', fetchImpl: gh.fetchImpl, now })
    expect(gh.calls.map((c) => c.url)).toContain('https://api.github.com/repos/Trollz1004/dream-online/compare/main...claude/fix%20%2312')
    expect(board.branches[0].name).toBe('claude/fix #12')
  })

  it('a pull request from a fork with the same branch name does not make the branch LIVE', async () => {
    const gh = fakeGithub({
      'Trollz1004/dream-online': {
        branches: ['codex/x'], pulls: [{ ref: 'codex/x', number: 7, title: 'from a fork', repo: 'someone-else/dream-online' }],
        compare: { 'codex/x': { ahead_by: 1, behind_by: 0, commits: [commit(daysAgo(1))] } },
      },
    })
    const [board] = await buildDriftBoard({ repos: ['Trollz1004/dream-online'], token: 't', fetchImpl: gh.fetchImpl, now })
    expect(board.branches[0]).toMatchObject({ status: 'WORKING', pr: null })
  })

  it('a truncated compare page reads the head commit date from the commit itself', async () => {
    const page = Array.from({ length: 30 }, () => commit(daysAgo(60)))
    const gh = fakeGithub({
      'Trollz1004/dream-online': {
        branches: ['codex/big'],
        compare: { 'codex/big': { ahead_by: 45, behind_by: 0, commits: page } },
        commits: { 'sha-codex/big': commit(daysAgo(1)) },
      },
    })
    const [board] = await buildDriftBoard({ repos: ['Trollz1004/dream-online'], token: 't', fetchImpl: gh.fetchImpl, now })
    expect(board.branches[0]).toMatchObject({ aheadBy: 45, lastCommitAt: daysAgo(1), status: 'WORKING' })
  })

  it('a branch that cannot be compared is listed under skipped, never as a row', async () => {
    const gh = fakeGithub({
      'Trollz1004/dream-online': {
        branches: ['gh-pages', 'claude/ok'],
        compare: { 'claude/ok': { ahead_by: 0, behind_by: 3, commits: [] } }, // gh-pages has none: 404 from the fake
      },
    })
    const [board] = await buildDriftBoard({ repos: ['Trollz1004/dream-online'], token: 't', fetchImpl: gh.fetchImpl, now })
    expect(board.branches.map((b) => b.name)).toEqual(['claude/ok'])
    expect(board.skipped).toHaveLength(1)
    expect(board.skipped[0].name).toBe('gh-pages')
    expect(board.skipped[0].detail).toMatch(/HTTP 404/)
  })

  it('a full first branch page is followed to the next page, not flagged truncated', async () => {
    const names = Array.from({ length: 99 }, (_, i) => 'codex/b' + i) // plus main = 100, a full page
    const compare = Object.fromEntries(names.map((n) => [n, { ahead_by: 0, behind_by: 0, commits: [] }]))
    const gh = fakeGithub({ 'Trollz1004/dream-online': { branches: names, compare } })
    const [board] = await buildDriftBoard({ repos: ['Trollz1004/dream-online'], token: 't', fetchImpl: gh.fetchImpl, now })
    expect(board.truncated).toBe(false)
    expect(board.branches).toHaveLength(99)
    expect(gh.calls.filter((c) => c.url.includes('/branches?')).map((c) => c.url)).toEqual([
      'https://api.github.com/repos/Trollz1004/dream-online/branches?per_page=100&page=1',
      'https://api.github.com/repos/Trollz1004/dream-online/branches?per_page=100&page=2',
    ])
  })
})

describe('lib/drift.mjs, GitHub errors', () => {
  it('a 403 rate limit makes that repo DOWN with the reason and no rows, and the other repo still reads', async () => {
    const gh = fakeGithub({
      'Trollz1004/ANTIGRAVITY': { branches: [], errors: { 'branches': 403 } },
      'Trollz1004/dream-online': { branches: ['claude/x'], compare: { 'claude/x': { ahead_by: 0, behind_by: 0, commits: [] } } },
    })
    const out = await buildDriftBoard({ token: 't', fetchImpl: gh.fetchImpl, now })
    expect(out).toHaveLength(2)
    expect(out[0]).toEqual({ repo: 'Trollz1004/ANTIGRAVITY', status: 'DOWN', detail: 'GitHub HTTP 403 for /repos/Trollz1004/ANTIGRAVITY/branches: API rate limit exceeded' })
    expect(out[0]).not.toHaveProperty('branches')
    expect(out[1].branches).toHaveLength(1)
  })

  it('a 404 repo is DOWN', async () => {
    const gh = fakeGithub({})
    const out = await buildDriftBoard({ repos: ['Trollz1004/nope'], token: 't', fetchImpl: gh.fetchImpl, now })
    expect(out).toEqual([{ repo: 'Trollz1004/nope', status: 'DOWN', detail: 'GitHub HTTP 404 for /repos/Trollz1004/nope/branches: Not Found' }])
  })

  it('a rate limit halfway through the compares takes the whole repo DOWN rather than a partial board', async () => {
    const gh = fakeGithub({
      'Trollz1004/dream-online': {
        branches: ['claude/a', 'claude/b'],
        compare: { 'claude/a': { ahead_by: 0, behind_by: 0, commits: [] } },
        errors: { 'compare/main\\.\\.\\.claude/b': 403 },
      },
    })
    const [r] = await buildDriftBoard({ repos: ['Trollz1004/dream-online'], token: 't', fetchImpl: gh.fetchImpl, now })
    expect(r).toMatchObject({ repo: 'Trollz1004/dream-online', status: 'DOWN' })
    expect(r.detail).toMatch(/HTTP 403/)
    expect(r).not.toHaveProperty('branches')
  })

  it('a network failure is DOWN with the reason', async () => {
    const fetchImpl = async () => { throw new Error('ECONNRESET') }
    const [r] = await buildDriftBoard({ repos: ['Trollz1004/dream-online'], token: 't', fetchImpl, now })
    expect(r).toEqual({ repo: 'Trollz1004/dream-online', status: 'DOWN', detail: 'GitHub unreachable: ECONNRESET' })
  })
})

describe('lib/drift.mjs, cache', () => {
  const repos = { 'Trollz1004/dream-online': { branches: ['claude/x'], compare: { 'claude/x': { ahead_by: 0, behind_by: 0, commits: [] } } } }
  const run = (gh, t = NOW, token = 'tok') => buildDriftBoard({ repos: ['Trollz1004/dream-online'], token, fetchImpl: gh.fetchImpl, now: () => t })

  it('serves a repeat call from memory inside five minutes, with the original fetchedAt', async () => {
    const gh = fakeGithub(repos)
    const first = await run(gh)
    const callsAfterFirst = gh.calls.length
    expect(callsAfterFirst).toBeGreaterThan(0)
    const second = await run(gh, NOW + DRIFT_CACHE_MS - 1)
    expect(gh.calls).toHaveLength(callsAfterFirst)
    expect(second[0].fetchedAt).toBe(first[0].fetchedAt)
  })

  it('reads again once five minutes have passed', async () => {
    const gh = fakeGithub(repos)
    await run(gh)
    const n = gh.calls.length
    const later = await run(gh, NOW + DRIFT_CACHE_MS)
    expect(gh.calls.length).toBeGreaterThan(n)
    expect(later[0].fetchedAt).toBe(new Date(NOW + DRIFT_CACHE_MS).toISOString())
  })

  it('clearDriftCache forces a fresh read', async () => {
    const gh = fakeGithub(repos)
    await run(gh)
    const n = gh.calls.length
    clearDriftCache()
    await run(gh)
    expect(gh.calls.length).toBeGreaterThan(n)
  })

  it('a different token or staleDays is a different cache entry', async () => {
    const gh = fakeGithub(repos)
    await run(gh)
    const n = gh.calls.length
    await run(gh, NOW, 'another-token')
    expect(gh.calls.length).toBeGreaterThan(n)
    const m = gh.calls.length
    await buildDriftBoard({ repos: ['Trollz1004/dream-online'], token: 'tok', fetchImpl: gh.fetchImpl, now, staleDays: 3 })
    expect(gh.calls.length).toBeGreaterThan(m)
  })

  it('never caches an error, so a fixed token or a passed rate limit shows at once', async () => {
    const down = fakeGithub({ 'Trollz1004/dream-online': { branches: [], errors: { 'branches': 403 } } })
    const [bad] = await run(down)
    expect(bad.status).toBe('DOWN')
    const good = fakeGithub(repos)
    const [ok] = await run(good)
    expect(ok.branches).toHaveLength(1)
  })

  it('NOT CONFIGURED is not cached and calls nothing', async () => {
    const gh = fakeGithub(repos)
    await run(gh, NOW, '')
    expect(gh.calls).toHaveLength(0)
  })
})

describe('pagination', () => {
  it('walks pull request pages so a branch whose pull request is on page 2 is LIVE, and a full fifth page marks truncated', async () => {
    const now = () => Date.parse('2026-09-29T00:00:00Z')
    const pulls = Array.from({ length: 101 }, (_, i) => ({ ref: `codex/pr-${i + 1}`, number: i + 1, title: `pr ${i + 1}` }))
    const gh = fakeGithub({
      'Trollz1004/dream-online': {
        branches: ['codex/pr-101'],
        pulls,
        compare: { 'codex/pr-101': { ahead_by: 1, behind_by: 0, commits: [{ commit: { committer: { date: '2026-09-28T00:00:00Z' } } }] } },
      },
    })
    const [board] = await buildDriftBoard({ repos: ['Trollz1004/dream-online'], token: 't', fetchImpl: gh.fetchImpl, now })
    expect(board.branches.find((b) => b.name === 'codex/pr-101').status).toBe('LIVE')
    const pullUrls = gh.calls.map((c) => c.url).filter((u) => u.includes('/pulls?'))
    expect(pullUrls).toEqual([
      'https://api.github.com/repos/Trollz1004/dream-online/pulls?state=open&per_page=100&page=1',
      'https://api.github.com/repos/Trollz1004/dream-online/pulls?state=open&per_page=100&page=2',
    ])
    expect(board.truncated).toBe(false)
    clearDriftCache()
    const many = fakeGithub({ 'Trollz1004/dream-online': { branches: Array.from({ length: 600 }, (_, i) => `hermes/b${i}`), pulls: [], compare: {} } })
    const [big] = await buildDriftBoard({ repos: ['Trollz1004/dream-online'], token: 't', fetchImpl: many.fetchImpl, now })
    expect(many.calls.filter((c) => c.url.includes('/branches?')).length).toBe(5)
    expect(big.truncated).toBe(true)
  })
})
