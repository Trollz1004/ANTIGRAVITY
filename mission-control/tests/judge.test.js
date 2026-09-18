import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { createProposalStore } from '../lib/proposals.mjs'
import {
  normalizeRange, parseDiffStat, computeDiffStat, createReviewProposal,
  computeDisagreement, buildJudgeFeed, postVerdict, LANES, JUDGE_KINDS,
} from '../lib/judge.mjs'

let dir
beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jarvis-judge-')) })
afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

describe('lib/judge.mjs — normalizeRange', () => {
  it('keeps a real range as-is', () => {
    expect(normalizeRange('main..feature')).toBe('main..feature')
  })
  it('normalizes a bare branch to a three-dot merge-base range against main', () => {
    expect(normalizeRange('feature')).toBe('main...feature')
  })
  it('throws on an empty range', () => {
    expect(() => normalizeRange('')).toThrow()
  })
})

describe('lib/judge.mjs — parseDiffStat', () => {
  it('parses a real git diff --stat summary line', () => {
    const text = ' a.js | 2 +-\n b.js | 1 +\n 2 files changed, 2 insertions(+), 1 deletion(-)\n'
    expect(parseDiffStat(text)).toEqual({ files: 2, insertions: 2, deletions: 1 })
  })
  it('never throws on empty or unrecognised text', () => {
    expect(parseDiffStat('')).toEqual({ files: 0, insertions: 0, deletions: 0 })
    expect(parseDiffStat('garbage')).toEqual({ files: 0, insertions: 0, deletions: 0 })
  })
})

describe('lib/judge.mjs — computeDiffStat (injected exec, no real git)', () => {
  it('returns statText truncated to 200 lines and the parsed counts', () => {
    const exec = (cwd, args) => {
      expect(args).toEqual(['diff', '--stat', 'main...feature']);
      return ' a.js | 2 +-\n 1 file changed, 2 insertions(+)\n';
    };
    const r = computeDiffStat({ repoPath: '/repo', range: 'feature', exec });
    expect(r.ok).toBe(true);
    expect(r.range).toBe('main...feature');
    expect(r.files).toBe(1);
    expect(r.insertions).toBe(2);
    expect(r.statText).toContain('1 file changed');
  })
  it('reports ok:false when git throws (never a fabricated diff)', () => {
    const exec = () => { throw new Error('not a git repo'); };
    const r = computeDiffStat({ repoPath: '/repo', range: 'x', exec });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not a git repo/);
  })
})

describe('lib/judge.mjs — createReviewProposal', () => {
  const repos = [{ id: 'antigravity', path: '/repo' }];
  const exec = () => ' 3 files changed, 12 insertions(+), 4 deletions(-)\n';

  it('creates a judge/code.review proposal with the diff stat and pending verdicts', () => {
    const store = createProposalStore({ dir });
    const r = createReviewProposal({ store, repos, body: { repo: 'antigravity', range: 'feature', title: 'my PR' }, exec });
    expect(r.status).toBe(201);
    expect(r.body.proposal.source).toBe('judge');
    expect(r.body.proposal.kind).toBe('code.review');
    expect(r.body.proposal.diffStat).toEqual({ files: 3, insertions: 12, deletions: 4 });
    expect(r.body.proposal.verdicts.claude.state).toBe('pending');
    expect(r.body.proposal.verdicts.codex.state).toBe('pending');
    expect(r.body.proposal.state).toBe('PROPOSED');
  })

  it('400s on an unknown repo id, never falling back to another checkout', () => {
    const store = createProposalStore({ dir });
    const r = createReviewProposal({ store, repos, body: { repo: 'nope', range: 'feature' }, exec });
    expect(r.status).toBe(400);
  })

  it('400s when git diff fails', () => {
    const store = createProposalStore({ dir });
    const failingExec = () => { throw new Error('bad range'); };
    const r = createReviewProposal({ store, repos, body: { repo: 'antigravity', range: 'feature' }, exec: failingExec });
    expect(r.status).toBe(400);
  })
})

describe('lib/judge.mjs — computeDisagreement', () => {
  it('false until both lanes have voted', () => {
    expect(computeDisagreement({ claude: { state: 'pending' }, codex: { state: 'pending' } })).toBe(false);
    expect(computeDisagreement({ claude: { state: 'approve' }, codex: { state: 'pending' } })).toBe(false);
  })
  it('true when both voted and disagree; false when they agree', () => {
    expect(computeDisagreement({ claude: { state: 'approve' }, codex: { state: 'reject' } })).toBe(true);
    expect(computeDisagreement({ claude: { state: 'approve' }, codex: { state: 'approve' } })).toBe(false);
    expect(computeDisagreement({ claude: { state: 'reject' }, codex: { state: 'reject' } })).toBe(false);
  })
})

describe('lib/judge.mjs — buildJudgeFeed', () => {
  it('only returns judge-kind proposals, with a live disagreement flag', () => {
    const store = createProposalStore({ dir });
    store.create({ source: 'social', brand: 'DREAM Online', platform: 'reddit', title: 't', body: 'b' });
    const p = store.create({ source: 'judge', kind: 'code.review', title: 'r', body: 'stat', repo: 'antigravity', range: 'x', diffStat: {}, verdicts: { claude: { state: 'approve' }, codex: { state: 'reject' } } });
    const feed = buildJudgeFeed({ store });
    expect(feed.items.length).toBe(1);
    expect(feed.items[0].id).toBe(p.id);
    expect(feed.items[0].disagreement).toBe(true);
  })
})

describe('lib/judge.mjs — postVerdict token gates', () => {
  const repos = [{ id: 'antigravity', path: '/repo' }];
  function makeProposal(store) {
    return createReviewProposal({ store, repos, body: { repo: 'antigravity', range: 'x' }, exec: () => '1 file changed' }).body.proposal;
  }

  it('503s when the lane token is unset, without saying what to set it to', () => {
    const store = createProposalStore({ dir });
    const p = makeProposal(store);
    const r = postVerdict({ store, id: p.id, lane: 'claude', verdict: 'approve', token: 'anything', tokens: {}, auditDir: path.join(dir, 'audit') });
    expect(r.status).toBe(503);
    expect(r.body.error).not.toMatch(/[A-Za-z0-9]{16,}/);
  })

  it('401s on a missing or wrong token for that lane', () => {
    const store = createProposalStore({ dir });
    const p = makeProposal(store);
    const tokens = { claude: 'realtoken', codex: 'othertoken' };
    expect(postVerdict({ store, id: p.id, lane: 'claude', verdict: 'approve', token: undefined, tokens, auditDir: dir }).status).toBe(401);
    expect(postVerdict({ store, id: p.id, lane: 'claude', verdict: 'approve', token: 'guess', tokens, auditDir: dir }).status).toBe(401);
    // codex's own token must never work for the claude lane
    expect(postVerdict({ store, id: p.id, lane: 'claude', verdict: 'approve', token: 'othertoken', tokens, auditDir: dir }).status).toBe(401);
  })

  it('404s on an unknown id; 400 on an unknown lane/verdict', () => {
    const store = createProposalStore({ dir });
    const tokens = { claude: 'x', codex: 'y' };
    expect(postVerdict({ store, id: 'nope', lane: 'claude', verdict: 'approve', token: 'x', tokens, auditDir: dir }).status).toBe(404);
    const p = makeProposal(store);
    expect(postVerdict({ store, id: p.id, lane: 'gemini', verdict: 'approve', token: 'x', tokens, auditDir: dir }).status).toBe(400);
    expect(postVerdict({ store, id: p.id, lane: 'claude', verdict: 'maybe', token: 'x', tokens, auditDir: dir }).status).toBe(400);
  })

  it('both approve -> APPROVED; disagreement -> JUDGED and flagged', () => {
    const store = createProposalStore({ dir });
    const tokens = { claude: 'ctok', codex: 'xtok' };

    const p1 = makeProposal(store);
    postVerdict({ store, id: p1.id, lane: 'claude', verdict: 'approve', token: 'ctok', tokens, auditDir: dir });
    let r = postVerdict({ store, id: p1.id, lane: 'codex', verdict: 'approve', token: 'xtok', tokens, auditDir: dir });
    expect(r.status).toBe(200);
    expect(r.body.proposal.state).toBe('APPROVED');
    expect(r.body.proposal.disagreement).toBe(false);

    const p2 = makeProposal(store);
    postVerdict({ store, id: p2.id, lane: 'claude', verdict: 'approve', token: 'ctok', tokens, auditDir: dir });
    r = postVerdict({ store, id: p2.id, lane: 'codex', verdict: 'reject', token: 'xtok', tokens, auditDir: dir });
    expect(r.status).toBe(200);
    expect(r.body.proposal.state).toBe('JUDGED');
    expect(r.body.proposal.disagreement).toBe(true);
  })

  it('audits every verdict to data/audit/YYYY-MM-DD.jsonl', () => {
    const store = createProposalStore({ dir });
    const tokens = { claude: 'ctok', codex: 'xtok' };
    const p = makeProposal(store);
    const auditDir = path.join(dir, 'audit');
    postVerdict({ store, id: p.id, lane: 'claude', verdict: 'approve', reasoning: 'looks fine', token: 'ctok', tokens, auditDir, now: () => new Date('2026-09-17T00:00:00Z') });
    const files = fs.readdirSync(auditDir);
    expect(files).toContain('2026-09-17.jsonl');
    const lines = fs.readFileSync(path.join(auditDir, files[0]), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    expect(lines[0].lane).toBe('claude');
    expect(lines[0].verdict).toBe('approve');
  })
})

describe('lib/proposals.mjs — extra fields (unit 1 prerequisite)', () => {
  it('create() persists judge-only extra fields without breaking core fields', () => {
    const store = createProposalStore({ dir });
    const p = store.create({ source: 'judge', kind: 'code.review', title: 't', body: 'b', repo: 'antigravity', range: 'x..y', diffStat: { files: 1 }, verdicts: { claude: { state: 'pending' } } });
    expect(p.repo).toBe('antigravity');
    expect(p.range).toBe('x..y');
    expect(p.diffStat).toEqual({ files: 1 });
    expect(p.state).toBe('PROPOSED'); // extra fields never clobber the store's own fields
    expect(store.get(p.id).verdicts.claude.state).toBe('pending');
  })
})

describe('lib/inbox.mjs — judge EXECUTE (unit 1 prerequisite)', () => {
  it('a founder approve on an APPROVED judge proposal moves it to EXECUTED, not back to APPROVED', async () => {
    const { performAction } = await import('../lib/inbox.mjs');
    const store = createProposalStore({ dir });
    const p = store.create({ source: 'judge', kind: 'code.review', title: 't', body: 'b', repo: 'antigravity', range: 'x', diffStat: {}, verdicts: { claude: { state: 'approve' }, codex: { state: 'approve' } } });
    store.transition(p.id, { state: 'APPROVED' });
    const r = performAction({ store, id: p.id, action: 'approve', token: 'tok', founderToken: 'tok', auditDir: path.join(dir, 'audit') });
    expect(r.status).toBe(200);
    expect(r.body.proposal.state).toBe('EXECUTED');
    expect(r.body.proposal.evidence).toBe('founder execute');
  })

  it('social proposals still run through the adapter exactly as before (regression guard)', async () => {
    const { performAction } = await import('../lib/inbox.mjs');
    const store = createProposalStore({ dir });
    const p = store.create({ source: 'social', brand: 'DREAM Online', platform: 'reddit', title: 't', body: 'b' });
    const adapters = { execute: () => ({ ok: true, path: '/fake.md' }) };
    const r = performAction({ store, id: p.id, action: 'approve', token: 'tok', founderToken: 'tok', adapters, auditDir: path.join(dir, 'audit') });
    expect(r.body.proposal.state).toBe('EXECUTED');
    expect(r.body.proposal.evidence).toBe('/fake.md');
  })
})

describe('lib/judge.mjs — constants', () => {
  it('exports the documented lanes and kinds', () => {
    expect(LANES).toEqual(['claude', 'codex']);
    expect(JUDGE_KINDS).toEqual(['code.review', 'bridge.run']);
  })
})
