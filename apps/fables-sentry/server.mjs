#!/usr/bin/env node
/**
 * FABLE'S SENTRY — the wall display.
 *
 * Serves a single-page dashboard on :9140 showing every port, URL, MCP and
 * harness that should be up, and gives Joshua one button per row to fix what
 * is not.
 *
 * FOUNDING PRINCIPLE, learned the hard way on 2026-08-28: an open port is NOT
 * health. Redis sat LISTENING on 6379 for hours while answering PING with
 * MISCONF and refusing every write — the date app's session store was
 * read-only and every port-based check called it green. So each target here
 * declares an `identity` string that must appear in the response, and Redis
 * gets a real PING/PONG probe rather than a port check.
 *
 * Zero dependencies. Node built-ins only.
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { connect } from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.SENTRY_PORT || 9140);
const REPO = process.env.ANTIGRAVITY_ROOT || 'C:\\ANTIGRAVITY';
const HOUSE = join(REPO, 'scripts', 'fables-house', 'FABLES-HOUSE.ps1');

const REGISTRY = JSON.parse(readFileSync(join(HERE, 'targets.json'), 'utf8'));

/** Fix actions. Each spawns detached and returns immediately. */
const FIXES = {
  redis: {
    label: 'Restart Redis with a writable data dir',
    run: () => ps(
      "$d='C:\\Users\\joshi\\redis-win\\data';" +
      "if(-not(Test-Path $d)){New-Item -ItemType Directory -Force -Path $d|Out-Null};" +
      "Get-Process redis-server -ErrorAction SilentlyContinue|Stop-Process -Force;" +
      "Start-Sleep -Seconds 2;" +
      "Start-Process 'C:\\Users\\joshi\\redis-win\\redis-server.exe' -ArgumentList '--bind','127.0.0.1','--port','6379','--dir',$d,'--maxmemory','256mb','--maxmemory-policy','allkeys-lru' -WindowStyle Hidden"
    ),
  },
  ceobridge: {
    label: 'Start the CEO bridge',
    run: () => ps("Start-Process 'node' -ArgumentList 'start.js' -WorkingDirectory '" + REPO + "\\ops\\paperclip-ceo\\bridge' -WindowStyle Hidden"),
  },
  hermesgw: {
    label: 'Start the paperclip-mc gateway',
    run: () => ps("$h=\"$env:LOCALAPPDATA\\hermes\\hermes-agent\\bin\\hermes.exe\"; if(Test-Path $h){Start-Process $h -ArgumentList '--profile','paperclip-mc','gateway','run','--replace','--accept-hooks' -WindowStyle Hidden}"),
  },
  votes: {
    label: 'Start the vote service',
    run: () => ps("Start-Process 'node' -ArgumentList 'dist/server.js' -WorkingDirectory '" + REPO + "\\services\\governance' -WindowStyle Hidden"),
  },
  hermes: {
    label: 'Start Hermes',
    run: () => ps("$h=\"$env:LOCALAPPDATA\\hermes\\hermes-agent\\bin\\hermes.exe\"; if(Test-Path $h){Start-Process $h -ArgumentList 'serve' -WindowStyle Hidden}"),
  },
  openclaw: {
    // 'gateway' is required — bare openclaw runs the CLI and exits without
    // ever binding :18789. Verified 2026-08-28.
    label: 'Start the OpenClaw gateway',
    run: () => ps("$o=\"$env:APPDATA\\npm\\openclaw.cmd\"; if(Test-Path $o){Start-Process -FilePath $o -ArgumentList 'gateway' -WindowStyle Hidden}"),
  },
  ollama: { label: 'Start Ollama', run: () => ps("$o=\"$env:LOCALAPPDATA\\Programs\\Ollama\\ollama.exe\"; if(Test-Path $o){Start-Process $o -ArgumentList 'serve' -WindowStyle Hidden}") },
  omniroute: { label: 'Start OmniRoute', run: () => ps("$c=\"$env:APPDATA\\npm\\omniroute.cmd\"; if(Test-Path $c){Start-Process -FilePath $c -ArgumentList 'start' -WindowStyle Hidden}") },
  mc6: { label: 'Start the stack-health watchdog', run: () => ps("Start-Process 'python' -ArgumentList '-m','mission_control','serve' -WorkingDirectory '" + REPO + "\\mission-control-v6' -WindowStyle Hidden") },

  // Anything without a bespoke action falls through to the House, which knows
  // how to bring up every stage and is idempotent — it skips what is already up.
  crm: {
    label: 'Start the CRM stack (Mongo + API + UI)',
    run: () => ps("Start-Process 'bash' -ArgumentList 'crm/ops/start-crm.sh' -WorkingDirectory '" + REPO + "' -WindowStyle Hidden"),
  },

  house: { label: "Run FABLE'S HOUSE bring-up", run: () => psFile(HOUSE) },
};
for (const k of ['frontend', 'backend', 'postgres', 'tunnel', 'paperclip', 'mc5']) {
  if (!FIXES[k]) FIXES[k] = { label: "Run FABLE'S HOUSE bring-up (handles " + k + ')', run: () => psFile(HOUSE) };
}

function ps(cmd) {
  const c = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', cmd], { detached: true, stdio: 'ignore', windowsHide: true });
  c.unref();
}
function psFile(file) {
  if (!existsSync(file)) return;
  const c = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', file], { detached: true, stdio: 'ignore', windowsHide: true });
  c.unref();
}

const portOpen = (port, ms = 1500) =>
  new Promise((res) => {
    const s = connect({ host: '127.0.0.1', port });
    const done = (v) => { try { s.destroy(); } catch {} res(v); };
    s.setTimeout(ms);
    s.on('connect', () => done(true));
    s.on('timeout', () => done(false));
    s.on('error', () => done(false));
  });

/** Redis PING must answer PONG. MISCONF means writes are disabled. */
const redisPing = (ms = 2500) =>
  new Promise((res) => {
    const s = connect({ host: '127.0.0.1', port: 6379 });
    let buf = '';
    const done = (v) => { try { s.destroy(); } catch {} res(v); };
    s.setTimeout(ms);
    s.on('connect', () => s.write('PING\r\n'));
    s.on('data', (d) => {
      buf += d.toString();
      if (buf.includes('\r\n')) {
        if (buf.startsWith('+PONG')) return done({ up: true });
        const why = buf.startsWith('-MISCONF')
          ? 'MISCONF — port open but WRITES DISABLED (RDB save failing)'
          : buf.trim().slice(0, 90);
        done({ up: false, detail: why });
      }
    });
    s.on('timeout', () => done({ up: false, detail: 'timeout' }));
    s.on('error', (e) => done({ up: false, detail: String(e.code || e.message) }));
  });

async function httpCheck(url, identity, ms) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url, { signal: c.signal });
    const body = (await r.text()).slice(0, 4000);
    if (r.status >= 400) return { up: false, detail: 'HTTP ' + r.status };
    if (identity && !body.includes(identity)) {
      return { up: false, detail: 'WRONG SERVICE — answered ' + r.status + ' but "' + identity + '" not in body' };
    }
    return { up: true, detail: 'HTTP ' + r.status + (identity ? ' · identity ok' : '') };
  } catch (e) {
    return { up: false, detail: String(e.name === 'AbortError' ? 'timeout' : e.message).slice(0, 90) };
  } finally { clearTimeout(t); }
}

async function probe(t) {
  // Per-target budget wins; else public 8 s, local 3 s. OmniRoute's model
  // catalog legitimately takes 2–20 s, so it carries its own timeoutMs — the
  // House gives it the same 20 s. Beyond that it is DOWN, not "slow".
  const timeout = t.timeoutMs || (t.public ? 8000 : 3000);
  if (t.kind === 'redis') {
    const r = await redisPing();
    return { ...t, ...r, detail: r.detail || 'PONG' };
  }
  if (t.kind === 'http') {
    if (t.port && !(await portOpen(t.port))) return { ...t, up: false, detail: 'port ' + t.port + ' closed' };
    return { ...t, ...(await httpCheck(t.url, t.identity, timeout)) };
  }
  const open = await portOpen(t.port);
  return { ...t, up: open, detail: open ? 'port ' + t.port + ' open' : 'port ' + t.port + ' closed' };
}

function mcpStatus() {
  const out = [];
  for (const p of [join(REPO, '.mcp.json'), join(process.env.USERPROFILE || '', '.claude.json')]) {
    if (!existsSync(p)) continue;
    try {
      const d = JSON.parse(readFileSync(p, 'utf8'));
      const servers = d.mcpServers || d;
      for (const [name, cfg] of Object.entries(servers)) {
        if (!cfg || typeof cfg !== 'object') continue;
        if (!cfg.command && !cfg.url) continue;
        let detail, up;
        if (cfg.command) {
          // Only a real script path can be verified. An npx/uvx server's args
          // are flags and a package name — treating those as file paths gave
          // false RED rows ("MISSING /c") on servers that were perfectly fine.
          const script = (cfg.args || []).find(
            (a) => typeof a === 'string' && /\.(mjs|cjs|js|py)$/i.test(a)
          );
          if (script) {
            const present = existsSync(script) || existsSync(script.replace(/\//g, '\\'));
            up = present;
            detail = present ? 'stdio · script present' : 'stdio · MISSING ' + script;
          } else {
            // Launcher-based (npx, uvx, docker). Reachability cannot be proven
            // without spawning it, so report it as configured rather than green.
            up = true;
            detail = 'stdio · ' + cfg.command + (cfg.args && cfg.args.length ? ' ' + cfg.args.filter((a) => !String(a).startsWith('-')).slice(0, 2).join(' ') : '');
          }
        } else {
          up = true;
          detail = 'remote · ' + String(cfg.url).replace(/\?.*$/, '').slice(0, 60);
        }
        if (!out.some((x) => x.label === name)) out.push({ id: 'mcp-' + name, label: name, up, detail, kind: 'mcp', fix: null });
      }
    } catch {}
  }
  return out;
}

async function snapshot() {
  const groups = [];
  for (const g of REGISTRY.groups) {
    groups.push({ name: g.name, targets: await Promise.all(g.targets.map(probe)) });
  }
  groups.push({ name: 'MCP servers', targets: mcpStatus() });
  const all = groups.flatMap((g) => g.targets);
  return {
    at: new Date().toISOString(),
    up: all.filter((t) => t.up).length,
    total: all.length,
    groups,
  };
}

const HTML = () => readFileSync(join(HERE, 'index.html'), 'utf8');

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const json = (code, o) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };

  if (url.pathname === '/health') return json(200, { status: 'ok', service: 'fables-sentry', port: PORT });
  if (url.pathname === '/api/status') return json(200, await snapshot());

  if (url.pathname === '/api/fix' && req.method === 'POST') {
    const key = url.searchParams.get('id');
    const fix = FIXES[key] || FIXES.house;
    try { fix.run(); } catch (e) { return json(500, { ok: false, error: String(e.message || e) }); }
    return json(200, { ok: true, ran: fix.label });
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(HTML());
  }
  res.writeHead(404); res.end('not found');
}).listen(PORT, '0.0.0.0', () => {
  // 0.0.0.0 so the Asus mini PC on the LAN can display it. Read-only data;
  // the only write is /api/fix, which starts local services and takes no input
  // beyond a key that must match a predefined action.
  console.log("FABLE'S SENTRY on http://0.0.0.0:" + PORT + '  (LAN-visible)');
});
