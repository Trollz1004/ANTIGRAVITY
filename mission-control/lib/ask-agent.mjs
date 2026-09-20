/**
 * Ask-JARVIS agentic loop (specs/009-jarvis-agentic-ask) — the engine behind
 * `POST /api/ask` when `bridge: "omniroute"`. Runs a tool-calling loop
 * against OmniRoute's OpenAI-compatible chat completions endpoint
 * (`tools` + `tool_choice: "auto"`), bounded to `maxRounds` tool rounds and
 * `budgetMs` wall-clock total, streaming the assistant's text and a compact
 * tool-call trace back through `onEvent` (the server maps this onto SSE).
 *
 * Doctrine (Joshua, 2026-09-19): a model in this dashboard's picker is
 * useless unless it can act. "Act" here means propose, never execute — every
 * tool that would change the world only ever files a Proposal
 * (lib/agent-tools.mjs's create_proposal / request_bridge_run); this loop
 * itself never writes, posts, or spawns anything on its own.
 */
import { redact } from './redact.mjs';
import { callTool } from './agent-tools.mjs';
import { appendAudit } from './inbox.mjs';

export const DEFAULT_MODEL = 'auto/best-fast';
export const MAX_ROUNDS = 8;
export const TOTAL_BUDGET_MS = 60000;
export const CANDIDATE_LIMIT = 12;
export const MODEL_CACHE_TTL_MS = 60 * 60 * 1000; // one hour

export const SYSTEM_PROMPT = [
  'You are JARVIS, Mission Control on the Sabretooth node (C:\\ANTIGRAVITY).',
  'You may read the repo and live house state freely through your tools — nothing about the repo, node health, God\u2019s Eye, or the inbox is off limits to READ.',
  'You never execute a change to the world yourself. Anything that would change something — a social post, a code change, a bridge run — must go through create_proposal or request_bridge_run, which only ever file a PROPOSED item for Joshua to review in the Inbox.',
  'When you file a proposal, say so plainly in your reply: "I filed proposal <id>."',
  'Be concise. If a tool errors or a source is down, say exactly that — never invent state.',
].join(' ');

function toolCallArgs(call) {
  try { return JSON.parse((call && call.function && call.function.arguments) || '{}'); }
  catch { return {}; }
}

/**
 * Run the loop for one question. `tools` is the `{ schemas, handlers }` pair
 * from `createAgentTools`. `onEvent(type, data)` fires for 'delta', 'tool',
 * 'error', and a final 'result' — the caller (server.mjs) turns these into
 * SSE frames; tests just collect them into an array.
 */
export async function runAskAgent({
  question, model, tools, fetchImpl = globalThis.fetch, base, key,
  maxRounds = MAX_ROUNDS, budgetMs = TOTAL_BUDGET_MS, onEvent = () => {},
  auditDir, now = () => new Date(),
} = {}) {
  if (!key) { const body = { error: 'AUTH MISSING: OMNI_ROUTE_API_KEY not configured' }; onEvent('error', { message: body.error }); return { status: 503, body }; }
  const q = String(question || '').trim();
  if (!q) { const body = { error: 'question is required' }; onEvent('error', { message: body.error }); return { status: 400, body }; }
  if (!tools || !tools.handlers || !tools.schemas) throw new Error('runAskAgent requires { tools } from createAgentTools');

  const usedModel = model || DEFAULT_MODEL;
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: q }];
  const trace = [];
  const filedProposals = [];
  const deadline = Date.now() + budgetMs;
  let finalText = '';

  for (let round = 0; round < maxRounds; round++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) { finalText = finalText || 'Ran out of time before finishing this — try a narrower question.'; break; }

    const c = new AbortController();
    const t = setTimeout(() => c.abort(), Math.max(1000, remaining));
    let resp;
    try {
      resp = await fetchImpl(String(base).replace(/\/$/, '') + '/chat/completions', {
        method: 'POST', signal: c.signal,
        headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
        body: JSON.stringify({ model: usedModel, messages, tools: tools.schemas, tool_choice: 'auto' }),
      });
    } catch (e) {
      clearTimeout(t);
      const message = 'OmniRoute unreachable: ' + String((e && e.message) || e);
      onEvent('error', { message });
      return { status: 502, body: { error: message } };
    }
    clearTimeout(t);

    const j = await resp.json().catch(() => null);
    if (!resp.ok || !j) {
      const message = 'OmniRoute did not answer (HTTP ' + resp.status + ')';
      onEvent('error', { message, status: resp.status });
      return { status: 502, body: { error: message, status: resp.status } };
    }
    const choice = j.choices && j.choices[0];
    const msg = choice && choice.message;
    if (!msg) {
      const message = 'OmniRoute returned no message';
      onEvent('error', { message });
      return { status: 502, body: { error: message } };
    }

    const toolCalls = Array.isArray(msg.tool_calls) ? msg.tool_calls : [];
    if (msg.content) { finalText = msg.content; onEvent('delta', { text: msg.content }); }
    messages.push({ role: 'assistant', content: msg.content || '', ...(toolCalls.length ? { tool_calls: toolCalls } : {}) });

    if (!toolCalls.length) break; // model is done — no more tools requested

    for (const call of toolCalls) {
      const name = (call.function && call.function.name) || '';
      const args = toolCallArgs(call);
      const t0 = Date.now();
      const result = await callTool(tools.handlers, name, args);
      const ms = Date.now() - t0;
      const ok = !(result && result.ok === false);
      const argsSummary = redact(JSON.stringify(args) || '{}').slice(0, 200);
      const entry = { tool: name, argsSummary, ms, ok };
      trace.push(entry);
      onEvent('tool', entry);
      if (ok && (name === 'create_proposal' || name === 'request_bridge_run') && result && result.proposalId) {
        filedProposals.push(result.proposalId);
      }
      if (auditDir) appendAudit({ dir: auditDir, record: { kind: 'ask-agent.tool', tool: name, argsSummary, ok, ms }, now });
      messages.push({
        role: 'tool',
        tool_call_id: call.id || name,
        content: JSON.stringify(redact(result)).slice(0, 4000),
      });
    }
  }

  const body = { bridge: 'omniroute', answer: finalText, model: usedModel, trace, proposals: filedProposals };
  onEvent('result', body);
  return { status: 200, body };
}

// ── Model picker (GET /api/ask/models) ─────────────────────────────────────

/** A tiny, cheap tool-call capability test: does this model call a tool when told `tool_choice: "required"`? */
export async function probeModelAgentic({ model, base, key, fetchImpl = globalThis.fetch, timeoutMs = 15000 }) {
  const probeTool = { type: 'function', function: { name: 'ping', description: 'Call this to confirm you can use tools.', parameters: { type: 'object', properties: { echo: { type: 'string' } }, required: ['echo'] } } };
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeoutMs);
  try {
    const r = await fetchImpl(String(base).replace(/\/$/, '') + '/chat/completions', {
      method: 'POST', signal: c.signal,
      headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Call the ping tool with echo set to "ok".' }], tools: [probeTool], tool_choice: 'required' }),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j) return { model, agentic: false, reason: 'HTTP ' + r.status };
    const msg = j.choices && j.choices[0] && j.choices[0].message;
    const called = Boolean(msg && Array.isArray(msg.tool_calls) && msg.tool_calls.length);
    return { model, agentic: called, reason: called ? undefined : 'answered without a tool call' };
  } catch (e) {
    return { model, agentic: false, reason: e && e.name === 'AbortError' ? 'timeout' : String((e && e.message) || e) };
  } finally { clearTimeout(t); }
}

/** auto/* combos first (cheapest, router-picked), then whatever else the catalog listed, capped. */
export function pickCandidateModels(listedIds = [], limit = CANDIDATE_LIMIT) {
  const ids = [...new Set((listedIds || []).filter(Boolean))];
  const autos = ids.filter((m) => /^auto\//.test(m));
  const rest = ids.filter((m) => !/^auto\//.test(m));
  return [...autos, ...rest].slice(0, limit);
}

/** Bounded-concurrency map — keeps the once-an-hour probe from firing 12 requests at once. */
async function mapLimited(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/**
 * GET /api/ask/models — probe the OmniRoute catalog once, capability-test up
 * to CANDIDATE_LIMIT candidates, and split them into kept (agentic:true) vs
 * dropped. `readCache`/`writeCache` are injected so a test never touches
 * disk; production passes JSON-file-backed versions bound to data/ (gitignored).
 */
export async function refreshAskModels({
  base, key, fetchImpl = globalThis.fetch, now = () => Date.now(),
  readCache = () => null, writeCache = () => {}, force = false, concurrency = 4,
} = {}) {
  const cached = force ? null : readCache();
  if (cached && typeof cached.at === 'number' && now() - cached.at < MODEL_CACHE_TTL_MS) {
    return { ...cached, cached: true };
  }
  if (!key) {
    const result = { at: now(), error: 'AUTH MISSING: OMNI_ROUTE_API_KEY not configured', kept: [], dropped: [] };
    return { ...result, cached: false };
  }
  let listed = [];
  try {
    const r = await fetchImpl(String(base).replace(/\/$/, '') + '/models', { headers: { authorization: 'Bearer ' + key } });
    const j = await r.json().catch(() => null);
    listed = r.ok && j && Array.isArray(j.data) ? j.data.map((m) => m.id).filter(Boolean) : [];
  } catch { listed = []; }

  const candidates = pickCandidateModels(listed);
  const probes = await mapLimited(candidates, concurrency, (m) => probeModelAgentic({ model: m, base, key, fetchImpl }));
  const kept = probes.filter((p) => p.agentic).map((p) => p.model);
  const dropped = probes.filter((p) => !p.agentic).map((p) => ({ model: p.model, reason: p.reason }));
  const result = { at: now(), listedCount: listed.length, candidateCount: candidates.length, kept, dropped };
  writeCache(result);
  return { ...result, cached: false };
}
