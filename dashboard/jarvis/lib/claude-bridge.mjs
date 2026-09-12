/**
 * Claude CLI bridge — the official `claude` CLI (account auth, never an API key)
 * run headless with --print/stream-json, streamed to the page as Server-Sent Events.
 *
 * Safety model:
 *  - loopback callers only, unless DASHBOARD_BRIDGE_TOKEN is set and presented (x-bridge-token)
 *  - permission mode defaults to `plan`; bypassPermissions is refused outright
 *  - bounded turns, one child per request, killed when the client disconnects
 *  - the prompt travels over stdin, never on the command line
 *  - the nested-session guard vars are stripped so the CLI launches from a server
 */
import { existsSync } from 'node:fs';
import { spawn as nodeSpawn } from 'node:child_process';
import { join } from 'node:path';

export const PERMISSION_MODES = ['plan', 'default', 'acceptEdits'];
export const PERSONAS = {
  jarvis: 'You are JARVIS, the AI assistant embedded in the operator\'s dashboard HUD on the Alienware node. Dry wit, loyal, precise. Keep replies short enough for a HUD panel (under 4 sentences) unless asked for detail. You are Claude Code running headless: you may inspect this repository when asked, but stay conversational and never claim to have done something you did not do.',
  claude: '',
};

export function resolveClaudeBinary({ env = process.env, exists = existsSync } = {}) {
  if (env.CLAUDE_BIN && exists(env.CLAUDE_BIN)) return env.CLAUDE_BIN;
  const home = env.USERPROFILE || env.HOME || '';
  const local = join(home, '.local', 'bin', process.platform === 'win32' || /^[A-Za-z]:/.test(home) ? 'claude.exe' : 'claude');
  if (home && exists(local)) return local;
  return 'claude'; // PATH lookup
}

export function buildClaudeArgs({ sessionId = '', persona = 'claude', permissionMode = 'plan', maxTurns = 6, model = '', lean } = {}) {
  if (!PERMISSION_MODES.includes(permissionMode)) throw new Error(`permission mode not allowed: ${permissionMode}`);
  if (sessionId && !/^[A-Za-z0-9_-]{6,80}$/.test(sessionId)) throw new Error('session id must be a plain id');
  const args = ['-p', '--output-format', 'stream-json', '--input-format', 'text', '--verbose', '--include-partial-messages',
    '--permission-mode', permissionMode, '--max-turns', String(Math.max(1, Math.min(50, Number(maxTurns) || 6)))];
  if (sessionId) args.push('--resume', sessionId);
  const system = PERSONAS[persona] ?? '';
  if (system) args.push('--append-system-prompt', system);
  if (model && /^[A-Za-z0-9._:-]{1,80}$/.test(model)) args.push('--model', model);
  // Lean = no MCP servers: chat personas do not need 600+ connector tools in every turn.
  if (lean ?? persona !== 'claude') args.push('--strict-mcp-config');
  return args;
}

export function childEnv(env = process.env) {
  const out = { ...env };
  delete out.CLAUDECODE;
  delete out.CLAUDE_CODE_ENTRYPOINT;
  return out;
}

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
export function bridgeAccess({ token = '' } = {}) {
  return (req) => {
    const ip = String(req.remoteAddress || (req.socket && req.socket.remoteAddress) || '');
    if (LOOPBACK.has(ip) || ip.startsWith('127.')) return { ok: true, reason: 'loopback' };
    const presented = String((req.headers && req.headers['x-bridge-token']) || '');
    if (token && presented && presented === token) return { ok: true, reason: 'token' };
    return { ok: false, reason: token ? 'LAN callers need the x-bridge-token header' : 'bridge is loopback-only (set DASHBOARD_BRIDGE_TOKEN in .env to allow the LAN)' };
  };
}

function toEvent(msg) {
  if (!msg || typeof msg !== 'object') return null;
  if (msg.type === 'system' && msg.subtype === 'init') return { type: 'init', sessionId: msg.session_id || '', model: msg.model || '', tools: Array.isArray(msg.tools) ? msg.tools.length : undefined };
  if (msg.type === 'stream_event') {
    const ev = msg.event || {};
    if (ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta') return { type: 'delta', text: ev.delta.text || '' };
    if (ev.type === 'content_block_start' && ev.content_block && ev.content_block.type === 'tool_use') return { type: 'tool', name: ev.content_block.name || '' };
    return null;
  }
  if (msg.type === 'assistant') {
    const parts = (msg.message && msg.message.content) || [];
    const text = parts.filter((p) => p.type === 'text').map((p) => p.text).join('');
    const tools = parts.filter((p) => p.type === 'tool_use').map((p) => p.name);
    return { type: 'assistant', text, tools };
  }
  if (msg.type === 'result') return { type: 'result', ok: msg.subtype === 'success', text: msg.result || '', sessionId: msg.session_id || '', turns: msg.num_turns, costUsd: msg.total_cost_usd, error: msg.is_error ? (msg.result || msg.subtype) : undefined };
  return null;
}

export function createStreamParser() {
  let buf = '';
  const parser = {
    sessionId: '',
    push(chunk) {
      buf += String(chunk);
      const events = [];
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).replace(/\r$/, '');
        buf = buf.slice(nl + 1);
        if (!line.trim()) continue;
        let msg = null;
        try { msg = JSON.parse(line); } catch { events.push({ type: 'raw', line }); continue; }
        const ev = toEvent(msg);
        if (!ev) continue;
        if (ev.sessionId) parser.sessionId = ev.sessionId;
        events.push(ev);
      }
      return events;
    },
  };
  return parser;
}

export function sse(event, data) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Spawn the CLI for one prompt. Returns the child so the caller can kill it on
 * disconnect. `onEvent` receives parsed events, then {type:'exit', code}.
 */
export function runClaude({ prompt, cwd, env = process.env, spawn = nodeSpawn, onEvent, ...opts }) {
  const bin = resolveClaudeBinary({ env });
  const args = buildClaudeArgs(opts);
  const child = spawn(bin, args, { cwd, env: childEnv(env), stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  const parser = createStreamParser();
  let stderr = '';
  child.stdout.on('data', (c) => { for (const ev of parser.push(c)) onEvent(ev); });
  child.stderr.on('data', (c) => { stderr += String(c); if (stderr.length > 8000) stderr = stderr.slice(-8000); });
  child.on('error', (e) => onEvent({ type: 'error', message: String(e.message || e), bin }));
  child.on('close', (code) => { for (const ev of parser.push('\n')) onEvent(ev); onEvent({ type: 'exit', code, sessionId: parser.sessionId, stderr: code ? stderr.trim().split('\n').slice(-5).join('\n') : '' }); });
  child.stdin.on('error', () => {});
  child.stdin.end(String(prompt || ''));
  return { child, parser, bin, args };
}
