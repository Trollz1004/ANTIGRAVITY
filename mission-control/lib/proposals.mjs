/**
 * Proposal store (Phase C, unit 2) — an append-only JSONL ledger of every
 * social/judge/health/sale proposal JARVIS has ever been asked to act on,
 * plus an in-memory index rebuilt from disk on start so the store survives
 * a server restart.
 *
 * One file per UTC day: ops/dashboard-jarvis/data/proposals/YYYY-MM-DD.jsonl
 * (data/ is gitignored at the repo root). Each line is either the original
 * proposal record or a `{id, patch, at}` state-change record; nothing is
 * ever rewritten in place, so the file itself is the audit trail and the
 * in-memory index is just a projection of it.
 *
 * Pure-ish: every path is injected so tests use a scratch directory instead
 * of the real repo.
 */
import { existsSync, mkdirSync, readFileSync, appendFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

export const STATES = ['PROPOSED', 'APPROVED', 'REJECTED', 'SNOOZED', 'EXECUTED', 'FAILED'];
export const SOURCES = ['social', 'trigger', 'health', 'judge'];

function dayFile(dir, date = new Date()) {
  const iso = date.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  return join(dir, `${iso}.jsonl`);
}

function newId() {
  return Date.now().toString(36) + '-' + randomBytes(4).toString('hex');
}

/** Read every JSONL line in `dir` (all days), skipping unparsable lines rather than throwing. */
function readAllLines(dir) {
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith('.jsonl')).sort();
  const lines = [];
  for (const f of files) {
    let text = '';
    try { text = readFileSync(join(dir, f), 'utf8'); } catch { continue; }
    for (const raw of text.split(/\r?\n/)) {
      if (!raw.trim()) continue;
      try { lines.push(JSON.parse(raw)); } catch { /* one bad line never sinks the store */ }
    }
  }
  return lines;
}

/** Rebuild the in-memory index (id -> proposal) by replaying every JSONL line in order. */
export function rebuildIndex(dir) {
  const index = new Map();
  for (const rec of readAllLines(dir)) {
    if (rec && rec.id && rec.state && !rec.patch) {
      // A fresh proposal record.
      index.set(rec.id, { ...rec, history: Array.isArray(rec.history) ? rec.history : [] });
    } else if (rec && rec.id && rec.patch) {
      // A state-change record layered onto an existing proposal.
      const cur = index.get(rec.id);
      if (!cur) continue; // orphaned patch (proposal predates this file range) — skip, never fabricate
      const next = { ...cur, ...rec.patch };
      next.history = [...(cur.history || []), { at: rec.at, ...rec.patch }];
      index.set(rec.id, next);
    }
  }
  return index;
}

/**
 * Create a proposal store bound to `dir`. The index is built once at
 * construction (mirrors "rebuilt on start") and kept in sync on every write.
 */
export function createProposalStore({ dir, now = () => new Date() } = {}) {
  if (!dir) throw new Error('createProposalStore requires { dir }');
  let index = rebuildIndex(dir);

  function persist(dayLine) {
    mkdirSync(dir, { recursive: true });
    appendFileSync(dayFile(dir, now()), JSON.stringify(dayLine) + '\n', 'utf8');
  }

  // `...extra` carries kind-specific fields (Judge Lanes' `repo`/`range`/
  // `diffStat`/`verdicts`) without every caller having to know about them.
  // It is spread before `state`/`history` so an extra field can never
  // clobber the ones this function itself controls.
  function create({ source, kind, brand, platform, title, body, scheduledFor, checks, ...extra }) {
    if (!SOURCES.includes(source)) throw new Error('invalid source: ' + source);
    const at = now().toISOString();
    const rec = {
      id: newId(), ts: at, source, kind: kind || 'post', brand, platform,
      title: title || '', body: body || '', scheduledFor: scheduledFor || null,
      checks: checks || {}, ...extra, state: 'PROPOSED', history: [{ at, state: 'PROPOSED' }],
    };
    persist(rec);
    index.set(rec.id, rec);
    return rec;
  }

  function get(id) {
    return index.get(id) || null;
  }

  function list() {
    return [...index.values()].sort((a, b) => (a.ts < b.ts ? 1 : -1));
  }

  /** Append-only state transition. Never mutates a past record; only ever adds to history. */
  function transition(id, patch) {
    const cur = index.get(id);
    if (!cur) return null;
    const at = now().toISOString();
    const rec = { id, at, patch };
    persist(rec);
    const next = { ...cur, ...patch, history: [...cur.history, { at, ...patch }] };
    index.set(id, next);
    return next;
  }

  function reload() {
    index = rebuildIndex(dir);
    return index;
  }

  return { create, get, list, transition, reload, dir };
}
