/**
 * Claude CLI bridge — the official `claude` CLI (account auth, never an API key)
 * run headless with --print/stream-json, streamed to the page as Server-Sent Events.
 *
 * Safety model (every rule is pinned by tests/claude-bridge*.test.js):
 *  - callers must be local (loopback or this node's own LAN address); other LAN hosts
 *    need DASHBOARD_BRIDGE_TOKEN from .env presented as x-bridge-token (constant-time compare)
 *  - the permission mode defaults to `plan`; a request can lower it, never raise it above
 *    CLAUDE_BRIDGE_PERMISSION_MODE from .env; bypassPermissions is refused outright
 *  - a settings deny list stops the CLI from reading .env files
 *  - bounded turns, a hard timeout, one child per request, the whole process tree killed
 *    when the client disconnects
 *  - the prompt travels over stdin, never on the command line
 *  - the child env is stripped of the nested-session guard and of every credential
 */
import { existsSync } from 'node:fs';
import { spawn as nodeSpawn } from 'node:child_process';
import { timingSafeEqual } from 'node:crypto';
import { join } from 'node:path';

export const PERMISSION_MODES = ['plan', 'default', 'acceptEdits']; // ordered least to most permissive
export const PERSONAS = {
  jarvis: 'You are JARVIS, the AI assistant embedded in the operator\'s dashboard HUD on the Alienware node. Dry wit, loyal, precise. Keep replies short enough for a HUD panel (under 4 sentences) unless asked for detail. You are Claude Code running headless: you may inspect this repository when asked, but stay conversational and never claim to have done something you did not do.',
  claude: '',
};
export const DENY_TOOLS = ['Read(./.env)', 'Read(./**/.env)', 'Read(./**/.env.*)', 'Read(../.env)', 'Read(../../.env)'];

export function resolveClaudeBinary({ env = process.env, exists = existsSync } = {}) {
  if (env.CLAUDE_BIN && exists(env.CLAUDE_BIN)) return env.CLAUDE_BIN;
  const home = env.USERPROFILE || env.HOME || '';
  const windowsy = process.platform === 'win32' || /^[A-Za-z]:/.test(home);
  const local = join(home, '.local', 'bin', windowsy ? 'claude.exe' : 'claude');
  if (home && exists(local)) return local;
  return 'claude'; // PATH lookup
}

export function bridgeSettingsJson() {
  return JSON.stringify({ permissions: { deny: DENY_TOOLS } });
}

export function effectivePermissionMode(requested, configured) {
  const conf = PERMISSION_MODES.includes(configured) ? configured : 'plan';
  const req = PERMISSION_MODES.includes(requested) ? requested : conf;
  return PERMISSION_MODES.indexOf(req) <= PERMISSION_MODES.indexOf(conf) ? req : conf;
}

export function buildClaudeArgs({ sessionId = '', persona = 'claude', permissionMode = 'plan', maxTurns = 6, model = '', lean } = {}) {
  if (!PERMISSION_MODES.includes(permissionMode)) throw new Error(`permission mode not allowed: ${permissionMode}`);
  if (sessionId && !/^[A-Za-z0-9_-]{6,80}$/.test(sessionId)) throw new Error('session id must be a plain id');
  const args = ['-p', '--output-format', 'stream-json', '--input-format', 'text', '--verbose', '--include-partial-messages',
    '--permission-mode', permissionMode, '--max-turns', String(Math.max(1, Math.min(50, Number(maxTurns) || 6))),
    '--settings', bridgeSettingsJson()];
  if (sessionId) args.push('--resume', sessionId);
  const system = PERSONAS[persona] ?? '';
  if (system) args.push('--append-system-prompt', system);
  if (model && /^[A-Za-z0-9._:-]{1,80}$/.test(model)) args.push('--model', model);
  // Lean = no MCP servers: chat personas do not need 600+ connector tools in every turn.
  if (lean ?? persona !== 'claude') args.push('--strict-mcp-config');
  return args;
}

const SECRET_NAME = /(_KEY|_TOKEN|_SECRET|PASSWORD)$/i;
export function childEnv(env = process.env) {
  const out = {};
  for (const [k, v] of Object.entries(env)) {
    if (k === 'CLAUDECODE' || k === 'CLAUDE_CODE_ENTRYPOINT') continue;
    if (k.startsWith('ANTHROPIC_')) continue;
    if (SECRET_NAME.test(k) || /PASSWORD/i.test(k)) continue;
    out[k] = v;
  }
  return out;
}

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
function sameToken(a, b) {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length > 0 && x.length === y.length && timingSafeEqual(x, y);
}
export function bridgeAccess({ token = '', lanIp = '' } = {}) {
  return (req) => {
    const ip = String(req.remoteAddress || (req.socket && req.socket.remoteAddress) || '');
    const bare = ip.replace(/^::ffff:/, '');
    if (LOOPBACK.has(ip) || bare.startsWith('127.') || (lanIp && bare === lanIp)) return { ok: true, local: true, reason: 'local' };
    const presented = String((req.headers && req.headers['x-bridge-token']) || '');
    if (token && presented && sameToken(presented, token)) return { ok: true, local: false, reason: 'token' };
    return { ok: false, local: false, reason: token ? 'LAN callers need the x-bridge-token header' : 'bridge is loopback-only (set DASHBOARD_BRIDGE_TOKEN in .env to allow the LAN)' };
  };
}

export function isSameOrigin(headers = {}) {
  const origin = String(headers.origin || '');
  if (!origin) return true;
  const host = String(headers.host || '');
  return origin === `http://${host}` || origin === `https://${host}`;
}

export function killTree(child, { platform = process.platform, spawn = nodeSpawn } = {}) {
  if (!child || child.exitCode !== null) return false;
  try {
    if (platform === 'win32') {
      const k = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
      if (k && typeof k.unref === 'function') k.unref();
    } else {
      child.kill('SIGKILL');
    }
    return true;
  } catch { return false; }
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
export function runClaude({ prompt, cwd, env = process.env, spawn = nodeSpawn, bin, onEvent, timeoutMs = 300000, ...opts }) {
  const binary = bin || resolveClaudeBinary({ env });
  const args = buildClaudeArgs(opts);
  const child = spawn(binary, args, { cwd, env: childEnv(env), stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  const parser = createStreamParser();
  let stderr = '';
  let done = false;
  const timer = setTimeout(() => {
    if (done) return;
    onEvent({ type: 'error', code: 'timeout', message: `no result after ${timeoutMs} ms; killed` });
    killTree(child, { spawn });
  }, timeoutMs);
  if (typeof timer.unref === 'function') timer.unref();
  child.stdout.on('data', (c) => { for (const ev of parser.push(c)) onEvent(ev); });
  child.stderr.on('data', (c) => { stderr += String(c); if (stderr.length > 8000) stderr = stderr.slice(-8000); });
  child.on('error', (e) => onEvent({ type: 'error', message: String(e.message || e) }));
  child.on('close', (code) => {
    done = true; clearTimeout(timer);
    for (const ev of parser.push('\n')) onEvent(ev);
    onEvent({ type: 'exit', code, sessionId: parser.sessionId, stderr: code ? stderr.trim().split('\n').slice(-5).join('\n') : '' });
  });
  child.stdin.on('error', () => {});
  child.stdin.end(String(prompt || ''));
  return { child, parser, bin: binary, args, kill: () => killTree(child, { spawn }) };
}
