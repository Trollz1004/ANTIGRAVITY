/**
 * Fleet panel (Phase D, unit 2) — one honest row per harness lane (Hermes,
 * OpenClaw, OpenCode) for the Mission Control panel: status from an identity
 * probe, current task + queue depth from the tail of that lane's own
 * `.agents/journals/<harness>/STATE.md`, and token spend from OmniRoute
 * usage. Every value that cannot be read live is `null` with its own
 * `source` field — this module never fabricates a row.
 *
 * Pure-ish: fs/probe/fetch are all injected so tests never touch a real
 * checkout, a real socket, or a real gateway.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const HARNESSES = ['hermes', 'openclaw', 'opencode'];

/**
 * The last `## ` journal entry in a STATE.md text blob: its heading, the
 * text of a `did:` line if one exists (else null — never a guess), and a
 * queue depth counted as the number of `next:` lines in that entry.
 */
export function lastJournalEntry(text) {
  const parts = String(text || '').split(/\n(?=##\s)/).filter((p) => /^##\s/.test(p.trim()));
  if (!parts.length) return null;
  const part = parts[parts.length - 1];
  const headingLine = part.split(/\r?\n/)[0] || '';
  const heading = (/^##\s+(.*)$/.exec(headingLine) || [, headingLine])[1].trim();
  const didMatch = /^[-*]?\s*\*?\*?did\*?\*?:\s*(.+)$/im.exec(part);
  const nextLines = part.match(/^[-*]?\s*\*?\*?next\*?\*?:\s*(.+)$/gim) || [];
  return { heading, did: didMatch ? didMatch[1].trim() : null, queueDepth: nextLines.length };
}

/** Read one harness's STATE.md tail. Honest about a missing file — never a fixture row. */
export function readHarnessJournal(stateMdPath, { readFile = readFileSync, exists = existsSync } = {}) {
  if (!exists(stateMdPath)) return { ok: false, currentTask: null, queueDepth: 0, error: 'STATE.md not found: ' + stateMdPath };
  let text;
  try { text = readFile(stateMdPath, 'utf8'); }
  catch (e) { return { ok: false, currentTask: null, queueDepth: 0, error: String((e && e.message) || e) }; }
  const entry = lastJournalEntry(text);
  if (!entry) return { ok: true, currentTask: null, queueDepth: 0 };
  return { ok: true, currentTask: entry.did, queueDepth: entry.queueDepth };
}

/**
 * OpenCode has no dashboard/API port anywhere in this repo as of 2026-09-17
 * (checked: `ops/`, `.agents/harness-config/` — only `hermes.yaml` exists
 * there). Rather than guess a port, this returns one only when an env
 * override or a harness-config file actually names one; otherwise `null`,
 * which server.mjs reports honestly as NOT CONFIGURED.
 */
export function resolveOpenCodePort({ envValue = () => '', harnessConfigDir, exists = existsSync, readFile = readFileSync } = {}) {
  const fromEnv = envValue('OPENCODE_PORT') || envValue('OPENCODE_URL');
  if (fromEnv) return fromEnv;
  if (harnessConfigDir) {
    for (const name of ['opencode.yaml', 'opencode.yml']) {
      const p = join(harnessConfigDir, name);
      if (!exists(p)) continue;
      try {
        const m = /port\s*:\s*(\d+)/i.exec(readFile(p, 'utf8'));
        if (m) return m[1];
      } catch { /* fall through to null */ }
    }
  }
  return null;
}

// Candidates tried against the OmniRoute base in order. None of these
// answered on this gateway as of 2026-09-17 — confirmed live: /v1/usage,
// /api/v1/usage, /api/v1/usage/today, /api/v1/usage/summary, /api/v1/stats,
// /api/v1/cost(s), /api/v1/billing, /api/v1/metrics, and /api/usage all 404;
// the gateway's own /api/openapi/spec at this port documents a separate
// "Paperclip API" (companies/costs/by-agent), not a usage route for itself.
// tokenSpendToday stays null + source:'unavailable' rather than a guess.
export const OMNI_USAGE_CANDIDATES = ['/v1/usage', '/api/v1/usage', '/v1/usage/today', '/api/usage'];

export async function fetchOmniUsage({ omniBase, key, fetchImpl = fetch, timeoutMs = 5000, candidates = OMNI_USAGE_CANDIDATES } = {}) {
  if (!key) return { tokenSpendToday: null, source: 'unavailable', detail: 'AUTH MISSING: no OmniRoute key configured' };
  const base = String(omniBase || '').replace(/\/v1$/, '').replace(/\/$/, '');
  for (const path of candidates) {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), timeoutMs);
    try {
      const r = await fetchImpl(base + path, { signal: c.signal, headers: { authorization: 'Bearer ' + key, accept: 'application/json' } });
      clearTimeout(t);
      if (r.status === 200) {
        const j = await r.json().catch(() => null);
        if (j && typeof j === 'object') {
          const spend = j.tokenSpendToday ?? j.spendToday ?? j.spend ?? j.total ?? null;
          return { tokenSpendToday: typeof spend === 'number' ? spend : null, source: base + path };
        }
      }
    } catch { clearTimeout(t); }
  }
  return { tokenSpendToday: null, source: 'unavailable', detail: 'no usage endpoint answered on this gateway' };
}

/**
 * `harnesses`: [{ lane, stateMdPath, probe: null | { url, host, port } }].
 * `probe` runs `probeService` (lib/session-proxy.mjs's shape: {reachable,
 * kind}) when given; a harness with no probe target reports NOT CONFIGURED.
 */
export async function buildFleet({ harnesses, probeService, omni, journalOpts, usageOpts } = {}) {
  const usage = await fetchOmniUsage({ omniBase: omni && omni.base, key: omni && omni.key, ...(usageOpts || {}) });
  const rows = await Promise.all((harnesses || []).map(async (h) => {
    const journal = readHarnessJournal(h.stateMdPath, journalOpts);
    let status = 'NOT CONFIGURED';
    if (h.probe && probeService) {
      try {
        const p = await probeService(h.probe);
        status = p.reachable ? 'UP' : 'DOWN';
      } catch {
        status = 'DOWN';
      }
    }
    return {
      lane: h.lane, status, currentTask: journal.currentTask, queueDepth: journal.queueDepth,
      tokenSpendToday: usage.tokenSpendToday, source: usage.source,
    };
  }));
  return { rows, usageDetail: usage.detail || null, at: new Date().toISOString() };
}
