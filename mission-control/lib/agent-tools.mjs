/**
 * Agent tools (specs/009-jarvis-agentic-ask) — the OpenAI-compatible tool set
 * the Ask-JARVIS agentic loop (lib/ask-agent.mjs) hands to OmniRoute chat
 * completions. Every tool is read-only against this repo or an existing live
 * JARVIS data source; the only two that write anything at all
 * (`create_proposal`, `request_bridge_run`) write exclusively through the
 * existing Proposal store (lib/proposals.mjs / lib/bridges.mjs) — never a
 * direct file write, network call, or process spawn of their own — so a tool
 * call can propose a change but never execute one. Only Joshua's own founder
 * approve in the Inbox ever executes a proposal.
 *
 * Every string result is passed through lib/redact.mjs before it leaves this
 * module, on top of the specific secret-shaped-path refusals in read_file.
 * Pure-ish: every live data source is injected (`deps`), so tests never hit
 * the real filesystem outside a fixture dir or a real network socket.
 */
import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs';
import { resolve, sep, relative, join } from 'node:path';
import { execFile as nodeExecFile } from 'node:child_process';
import { redact } from './redact.mjs';

export const MAX_READ_BYTES = 200 * 1024;
export const MAX_SEARCH_HITS = 200;
export const MAX_LIST_ENTRIES = 500;

// Directories a repo-wide walk/search must never descend into: dependency
// trees, VCS internals, build output, and the gitignored data/vendor folders
// this same server already keeps out of static serving.
const SKIP_DIR_RE = /^(\.git|node_modules|vendor|dist|build|\.worktrees|\.venv|__pycache__|\.next|\.turbo)$/i;
// Same "this is a secret" shape read_file refuses, regardless of extension —
// matched against the full path so `ops/secrets/foo.txt` is refused too.
const DENY_PATH_RE = /(^|[\\/])\.env(\.[^\\/]*)?$|secret|credential/i;
const DENY_EXT_RE = /\.(pem|key)$/i;
const BINARY_EXT_RE = /\.(png|jpg|jpeg|gif|webp|ico|svg|woff2?|ttf|eot|mp3|mp4|wav|zip|7z|exe|dll|pdf|sqlite|db)$/i;

/** Resolve `relPath` inside `repo`, refusing anything that would escape it. */
function resolveInRepo(repo, relPath) {
  const repoResolved = resolve(repo);
  const full = resolve(repoResolved, relPath || '.');
  if (full !== repoResolved && !full.startsWith(repoResolved + sep)) return null;
  return full;
}

function looksLikeSecretPath(full) {
  const base = full.split(/[\\/]/).pop() || '';
  return DENY_PATH_RE.test(full) || DENY_PATH_RE.test(base) || DENY_EXT_RE.test(base);
}

/** read_file(path) — text files only, capped at MAX_READ_BYTES, redacted. */
export function toolReadFile({ repo, path: relPath }) {
  const rel = String(relPath || '');
  if (!rel) return { ok: false, error: 'path is required' };
  if (rel.includes('..')) return { ok: false, error: 'refused: ".." is not allowed — stay inside the repo' };
  const full = resolveInRepo(repo, rel);
  if (!full) return { ok: false, error: 'refused: path resolves outside the repo root' };
  if (looksLikeSecretPath(full)) return { ok: false, error: 'refused: looks like a secret/credential file' };
  if (!existsSync(full)) return { ok: false, error: 'not found: ' + rel };
  const st = statSync(full);
  if (!st.isFile()) return { ok: false, error: 'not a file: ' + rel };
  if (st.size > MAX_READ_BYTES) return { ok: false, error: `refused: ${st.size} bytes exceeds the ${MAX_READ_BYTES}-byte cap` };
  let text;
  try { text = readFileSync(full, 'utf8'); } catch (e) { return { ok: false, error: 'could not read as text: ' + String(e.message || e) }; }
  return { ok: true, path: rel, bytes: st.size, text: redact(text) };
}

/** list_dir(path) — one directory's immediate entries, no recursion. */
export function toolListDir({ repo, path: relPath }) {
  const rel = String(relPath || '.');
  if (rel.includes('..')) return { ok: false, error: 'refused: ".." is not allowed — stay inside the repo' };
  const full = resolveInRepo(repo, rel);
  if (!full) return { ok: false, error: 'refused: path resolves outside the repo root' };
  if (!existsSync(full)) return { ok: false, error: 'not found: ' + rel };
  if (!statSync(full).isDirectory()) return { ok: false, error: 'not a directory: ' + rel };
  const entries = readdirSync(full, { withFileTypes: true })
    .filter((e) => !SKIP_DIR_RE.test(e.name))
    .slice(0, MAX_LIST_ENTRIES)
    .map((e) => ({ name: e.name, type: e.isDirectory() ? 'dir' : 'file' }));
  return { ok: true, path: rel, entries, truncated: entries.length >= MAX_LIST_ENTRIES };
}

/** ripgrep, if it resolves; null (never throws) when it does not. */
function runRipgrep({ repo, pattern, glob, exec }) {
  return new Promise((res) => {
    const args = ['-n', '--no-heading', '--color', 'never', '-m', String(MAX_SEARCH_HITS)];
    if (glob) args.push('--glob', glob);
    args.push('--', pattern, '.');
    exec('rg', args, { cwd: repo, timeout: 8000, maxBuffer: 4 * 1024 * 1024, windowsHide: true }, (err, stdout) => {
      if (err && err.code !== 1) return res(null); // 1 = "no matches", still a real ripgrep run
      res(String(stdout || ''));
    });
  });
}

function parseRipgrepOutput(text) {
  const hits = [];
  for (const line of String(text || '').split(/\r?\n/)) {
    if (!line) continue;
    const m = /^(.+?):(\d+):(.*)$/.exec(line);
    if (!m) continue;
    hits.push({ file: m[1].replace(/^\.[\\/]/, ''), line: Number(m[2]), text: m[3].slice(0, 300) });
    if (hits.length >= MAX_SEARCH_HITS) break;
  }
  return hits;
}

/** JS-walk fallback when ripgrep is not on PATH — same cap, same skip list. */
function walkSearch({ repo, pattern, glob }) {
  let re;
  try { re = new RegExp(pattern); } catch { re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); }
  const globRe = glob ? new RegExp('^' + glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$') : null;
  const hits = [];
  let filesScanned = 0;
  const MAX_FILES = 4000;
  function walk(dir) {
    if (hits.length >= MAX_SEARCH_HITS || filesScanned >= MAX_FILES) return;
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (hits.length >= MAX_SEARCH_HITS || filesScanned >= MAX_FILES) return;
      if (SKIP_DIR_RE.test(e.name) || e.name.startsWith('.')) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (BINARY_EXT_RE.test(e.name) || looksLikeSecretPath(full)) continue;
      const rel = relative(repo, full).split(sep).join('/');
      if (globRe && !globRe.test(rel) && !globRe.test(e.name)) continue;
      filesScanned++;
      let text;
      try { text = readFileSync(full, 'utf8'); } catch { continue; }
      const lines = text.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        if (re.test(lines[i])) {
          hits.push({ file: rel, line: i + 1, text: lines[i].slice(0, 300) });
          if (hits.length >= MAX_SEARCH_HITS) break;
        }
      }
    }
  }
  walk(repo);
  return hits;
}

/** search_repo(pattern, glob?) — ripgrep when available, a bounded JS walk otherwise. */
export async function toolSearchRepo({ repo, pattern, glob, exec = nodeExecFile }) {
  const p = String(pattern || '').trim();
  if (!p) return { ok: false, error: 'pattern is required' };
  const rg = await runRipgrep({ repo, pattern: p, glob, exec });
  const hits = rg !== null ? parseRipgrepOutput(rg) : walkSearch({ repo, pattern: p, glob });
  return { ok: true, engine: rg !== null ? 'ripgrep' : 'js-walk', pattern: p, glob: glob || null, hits, truncated: hits.length >= MAX_SEARCH_HITS };
}

/**
 * Build the full tool set bound to live JARVIS data sources. Every `deps.get*`
 * is an already-bound async (or sync) function — this module never resolves
 * a path, port, or store on its own beyond the filesystem sandboxing above.
 */
export function createAgentTools(deps = {}) {
  const {
    repo,
    exec = nodeExecFile,
    getNodeHealth = async () => ({ ok: false, error: 'node_health not configured' }),
    getGodsEye = async () => ({ ok: false, error: 'gods_eye not configured' }),
    getInbox = async () => ({ ok: false, error: 'inbox_list not configured' }),
    getSpecs = async () => ({ ok: false, error: 'specs_list not configured' }),
    listRunbooksFn = () => [],
    readRunbookFn = () => ({ ok: false, error: 'not found' }),
    proposalStore = null,
    getBridgeRow = async () => null,
    createBridgeRunProposalFn = null,
  } = deps;

  const handlers = {
    async read_file(args) { return toolReadFile({ repo, path: args && args.path }); },
    async list_dir(args) { return toolListDir({ repo, path: args && args.path }); },
    async search_repo(args) { return toolSearchRepo({ repo, pattern: args && args.pattern, glob: args && args.glob, exec }); },
    async node_health() { return redact(await getNodeHealth()); },
    async gods_eye() {
      const snap = await getGodsEye();
      const down = (snap && snap.targets ? snap.targets : []).filter((t) => !t.up).map((t) => ({ id: t.id, group: t.group, status: t.status, detail: t.detail }));
      return redact({ at: snap && snap.at, up: snap && snap.up, down: snap && snap.down, total: snap && snap.total, byGroup: snap && snap.byGroup, downTargets: down });
    },
    async inbox_list() { return redact(await getInbox()); },
    async specs_list() { return redact(await getSpecs()); },
    async runbook(args) {
      const name = args && args.name;
      if (!name) return redact({ ok: true, runbooks: listRunbooksFn() });
      return redact(readRunbookFn(name));
    },
    async create_proposal(args) {
      const { kind, title, body, platform, brand } = args || {};
      if (!proposalStore) return { ok: false, error: 'proposal store not configured' };
      if (!kind || !title || !body) return { ok: false, error: 'kind, title, and body are required' };
      const rec = proposalStore.create({ source: 'judge', kind, title: String(title), body: String(body), platform: platform || null, brand: brand || null });
      return { ok: true, filed: true, proposalId: rec.id, state: rec.state };
    },
    async request_bridge_run(args) {
      const { bridge, prompt } = args || {};
      if (!bridge || !prompt) return { ok: false, error: 'bridge and prompt are required' };
      if (!createBridgeRunProposalFn || !proposalStore) return { ok: false, error: 'bridge run proposals not configured' };
      const bridgeRow = await getBridgeRow(bridge);
      const r = createBridgeRunProposalFn({ store: proposalStore, id: bridge, prompt: String(prompt), bridgeRow });
      if (r.status !== 201) return { ok: false, error: (r.body && r.body.error) || `bridge run refused (${r.status})` };
      return { ok: true, filed: true, proposalId: r.body.proposal.id, state: r.body.proposal.state };
    },
  };

  return { schemas: TOOL_SCHEMAS, names: Object.keys(handlers), handlers };
}

/** Run one named tool call, always returning a plain object — never throws. */
export async function callTool(handlers, name, args) {
  const fn = handlers && handlers[name];
  if (!fn) return { ok: false, error: 'unknown tool: ' + name };
  try { return await fn(args || {}); }
  catch (e) { return { ok: false, error: String((e && e.message) || e) }; }
}

// OpenAI-compatible tool schemas (Chat Completions `tools` array shape).
export const TOOL_SCHEMAS = [
  { type: 'function', function: { name: 'read_file', description: 'Read one text file inside the C:\\ANTIGRAVITY repo (path relative to the repo root). Refuses .., anything outside the repo, .env* files, and anything named/shaped like a secret or credential (*secret*, *credential*, *.pem, *.key). Capped at 200 KB.', parameters: { type: 'object', properties: { path: { type: 'string', description: 'repo-relative path, e.g. "mission-control/README.md"' } }, required: ['path'] } } },
  { type: 'function', function: { name: 'list_dir', description: 'List the immediate entries (name + type) of one directory inside the repo, repo-relative path. No recursion.', parameters: { type: 'object', properties: { path: { type: 'string', description: 'repo-relative directory path; omit or "." for the repo root' } } } } },
  { type: 'function', function: { name: 'search_repo', description: 'Search the repo for a regular-expression pattern (ripgrep when available, a bounded JS scan otherwise). Returns at most 200 hits as {file, line, text}.', parameters: { type: 'object', properties: { pattern: { type: 'string', description: 'a regular expression' }, glob: { type: 'string', description: 'optional file glob to narrow the search, e.g. "*.mjs"' } }, required: ['pattern'] } } },
  { type: 'function', function: { name: 'node_health', description: 'This node\u2019s Sabretooth heartbeat JSON (30-minute health probe) and the last lines of its log.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'gods_eye', description: 'FABLE\u2019S SENTRY / God\u2019s Eye snapshot: how many targets are up/down across every probed group, and the list of targets currently reporting down.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'inbox_list', description: 'The live approval inbox: every open and past proposal/trigger JARVIS has queued for Joshua\u2019s approval.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'specs_list', description: 'Every feature under specs/, with spec/plan/tasks presence and live task-completion counts.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'runbook', description: 'List ops/runbook/*.md, or read one by name.', parameters: { type: 'object', properties: { name: { type: 'string', description: 'a runbook filename, e.g. "SABRETOOTH-NODE-RUNBOOK.md"; omit to list all' } } } } },
  { type: 'function', function: { name: 'create_proposal', description: 'File a PROPOSED item in the approval inbox for Joshua to review. This NEVER executes anything by itself \u2014 it only queues the proposed change for a founder approve.', parameters: { type: 'object', properties: { kind: { type: 'string', description: 'e.g. "post", "code.review", "bridge.run"' }, title: { type: 'string' }, body: { type: 'string' }, platform: { type: 'string', description: 'optional, for a social proposal' }, brand: { type: 'string', description: 'optional' } }, required: ['kind', 'title', 'body'] } } },
  { type: 'function', function: { name: 'request_bridge_run', description: 'File a bridge.run Proposal asking to hand `prompt` to another agent bridge (hermes, claude, codex, or ollama). This NEVER runs the bridge itself \u2014 it only queues the request for a founder approve.', parameters: { type: 'object', properties: { bridge: { type: 'string', enum: ['hermes', 'claude', 'codex', 'ollama'] }, prompt: { type: 'string' } }, required: ['bridge', 'prompt'] } } },
];
