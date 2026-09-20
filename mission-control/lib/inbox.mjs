/**
 * Approval inbox (Phase C, unit 5) — merges the proposal store with
 * `ops/heartbeat/TRIGGERS.jsonl` lines, a synthetic RED item when the
 * Sabretooth heartbeat is unhealthy, and an honest "SOURCE: PENDING" row for
 * the sale inbox (the Gmail connector is not reachable from this server, so
 * this is never a fabricated row). Approve/reject/snooze are gated on
 * `x-founder-token` matching `JARVIS_FOUNDER_TOKEN`, and every action is
 * appended to an audit JSONL trail.
 */
import { existsSync, readFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { readHeartbeat } from './heartbeat.mjs';

export const ACTIONS = ['approve', 'reject', 'snooze'];

/** Parse ops/heartbeat/TRIGGERS.jsonl into inbox-shaped items. Never throws on a missing/corrupt file. */
export function readTriggers(triggersPath, { readFile = readFileSync, exists = existsSync } = {}) {
  if (!exists(triggersPath)) return [];
  let text = '';
  try { text = readFile(triggersPath, 'utf8'); } catch { return []; }
  const out = [];
  let i = 0;
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    i++;
    let rec;
    try { rec = JSON.parse(raw); } catch { continue; } // one bad line never sinks the inbox
    out.push({
      id: rec.id || `trigger-${i}`, source: 'trigger', kind: rec.type || rec.kind || 'trigger',
      brand: rec.brand || null, platform: null, title: rec.title || rec.message || 'trigger',
      body: raw, scheduledFor: null, checks: {}, state: 'PROPOSED', history: [],
      ts: rec.ts || rec.at || null,
    });
  }
  return out;
}

/** A synthetic item when the heartbeat's overall status is RED. null otherwise — never a fixture row. */
export function healthRedItem({ jsonPath, logPath, readFile = readFileSync, exists = existsSync } = {}) {
  const hb = readHeartbeat({ jsonPath, logPath, readFile, exists });
  if (!hb.ok || !hb.health || hb.health.overall !== 'RED') return null;
  return {
    id: 'health-red-' + (hb.health.ts || 'unknown'), source: 'health', kind: 'heartbeat-red',
    brand: null, platform: null, title: 'Sabretooth heartbeat is RED',
    body: JSON.stringify(hb.health), scheduledFor: null, checks: {}, state: 'PROPOSED', history: [],
    ts: hb.health.ts || null,
  };
}

/** Always present, never fabricated: the Gmail connector is not reachable from this server. */
export const SALE_INBOUND_ITEM = {
  id: 'sale-inbound-pending', source: 'sale', kind: 'inbound-email', brand: null, platform: null,
  title: 'Sale inbox — SOURCE: PENDING', body: 'The Gmail connector is not reachable from this server.',
  scheduledFor: null, checks: {}, state: 'PENDING', history: [],
};

/** GET /api/inbox payload. */
export function buildInbox({ store, triggersPath, heartbeat }) {
  const proposals = store.list();
  const triggers = readTriggers(triggersPath);
  const red = healthRedItem(heartbeat || {});
  const items = [...proposals, ...triggers, ...(red ? [red] : []), SALE_INBOUND_ITEM];
  const openStates = new Set(['PROPOSED', 'PENDING']);
  return {
    items, count: items.length,
    unread: items.filter((i) => openStates.has(i.state)).length,
    at: new Date().toISOString(),
  };
}

/** Append one action to data/audit/YYYY-MM-DD.jsonl. Never throws past the caller. */
export function appendAudit({ dir, record, now = () => new Date() }) {
  try {
    mkdirSync(dir, { recursive: true });
    const file = join(dir, now().toISOString().slice(0, 10) + '.jsonl');
    appendFileSync(file, JSON.stringify({ at: now().toISOString(), ...record }) + '\n', 'utf8');
  } catch { /* an audit-write failure must never block the action itself */ }
}

/**
 * Approve/reject/snooze one proposal. Gated on `x-founder-token`:
 *   - JARVIS_FOUNDER_TOKEN unset  -> 503, never says what to set it TO.
 *   - token missing/wrong         -> 401.
 *   - unknown id                  -> 404.
 * On approve of a `source: 'social'` proposal, `adapters.execute(proposal)`
 * runs and the result becomes EXECUTED (ok) or FAILED (not ok / threw). On
 * approve of a `kind: 'bridge.run'` proposal (Phase F, unit 1),
 * `bridgeAdapters.execute(proposal)` runs the same way — a bridge only ever
 * runs after this exact founder click, never on its own.
 */
export function performAction({ store, id, action, token, founderToken, adapters, bridgeAdapters, auditDir, now = () => new Date() }) {
  if (!ACTIONS.includes(action)) return { status: 400, body: { error: 'unknown action: ' + action } };
  if (!founderToken) {
    return { status: 503, body: { error: 'founder token not configured — set JARVIS_FOUNDER_TOKEN in the repo .env (one line; the value is never shown here)' } };
  }
  if (!token || token !== founderToken) {
    return { status: 401, body: { error: 'unauthorized: missing or incorrect x-founder-token' } };
  }
  const proposal = store.get(id);
  if (!proposal) return { status: 404, body: { error: 'not found' } };

  const stateMap = { approve: 'APPROVED', reject: 'REJECTED', snooze: 'SNOOZED' };
  let updated;
  let evidence = null;

  // A judge proposal (Judge Lanes, Phase D unit 1) reaches `APPROVED` on its
  // own once both lanes' verdicts agree (see lib/judge.mjs) — this inbox
  // route is only ever hit for it as the founder's own EXECUTE click, so
  // "approve" here means EXECUTE, not a second approval bounce.
  if (action === 'approve' && proposal.source === 'judge' && proposal.state === 'APPROVED') {
    evidence = 'founder execute';
    updated = store.transition(id, { state: 'EXECUTED', evidence });
  } else {
    updated = store.transition(id, { state: stateMap[action] });
    if (action === 'approve' && proposal.source === 'social' && adapters) {
      let result;
      try { result = adapters.execute(proposal); }
      catch (e) { result = { ok: false, error: String((e && e.message) || e) }; }
      // Some social adapters (Reddit's official-API adapter) are async — an
      // adapter that returns a thenable is awaited here exactly like a
      // bridge.run result below, so this branch's return type still only
      // ever varies on that one condition, never silently.
      if (result && typeof result.then === 'function') {
        return result.then(
          (res) => finishSocialExecute(res),
          (e) => finishSocialExecute({ ok: false, error: String((e && e.message) || e) }),
        );
        function finishSocialExecute(res) {
          const ev = (res && res.ok) ? (res.note || res.url || res.path || null) : ((res && res.error) || 'adapter failed');
          updated = store.transition(id, { state: (res && res.ok) ? 'EXECUTED' : 'FAILED', evidence: ev });
          appendAudit({ dir: auditDir, record: { id, action, evidence: ev }, now });
          return { status: 200, body: { proposal: updated } };
        }
      }
      if (result && result.ok) {
        evidence = result.note || result.url || result.path || null;
        updated = store.transition(id, { state: 'EXECUTED', evidence });
      } else {
        evidence = (result && result.error) || 'adapter failed';
        updated = store.transition(id, { state: 'FAILED', evidence });
      }
    }
    if (action === 'approve' && proposal.kind === 'bridge.run' && bridgeAdapters) {
      // The only asynchronous branch here (a bridge run really shells out or
      // spawns a process): this function returns a Promise ONLY in this one
      // case, so every other call site — all synchronous — is unaffected.
      let runResult;
      try { runResult = bridgeAdapters.execute ? bridgeAdapters.execute(proposal) : bridgeAdapters(proposal); }
      catch (e) { runResult = { ok: false, error: String((e && e.message) || e) }; }
      return Promise.resolve(runResult).then(
        (result) => finishBridgeRun(result),
        (e) => finishBridgeRun({ ok: false, error: String((e && e.message) || e) }),
      );
      function finishBridgeRun(result) {
        const ev = (result && result.ok) ? (result.output || '') : ((result && result.error) || 'bridge run failed');
        updated = store.transition(id, { state: result && result.ok ? 'EXECUTED' : 'FAILED', evidence: ev });
        appendAudit({ dir: auditDir, record: { id, action, evidence: ev }, now });
        return { status: 200, body: { proposal: updated } };
      }
    }
  }

  appendAudit({ dir: auditDir, record: { id, action, evidence }, now });
  return { status: 200, body: { proposal: updated } };
}
