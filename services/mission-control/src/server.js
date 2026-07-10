'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { URL } = require('url');

const repoRoot = path.resolve(process.env.REPO_ROOT || path.join(__dirname, '..', '..', '..'));
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 3110);
const agentHubUrl = process.env.AGENT_HUB_URL || 'http://127.0.0.1:3130';
const boardPath = path.join(repoRoot, 'ops', 'mission-control', 'board.json');
const domainRoutesPath = path.join(repoRoot, 'ops', 'mission-control', 'domain-routes.json');
const nodePoolPath = path.join(repoRoot, 'ops', 'mission-control', 'node-pool.json');
const eventLogPath = path.join(repoRoot, 'logs', 'mission-control-events.jsonl');
const startedAt = new Date();

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  res.end(JSON.stringify(payload, null, 2));
}

function sendHtml(res, body) {
  res.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => {
      chunks.push(chunk);
      if (Buffer.concat(chunks).length > 65536) {
        reject(new Error('request_too_large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('invalid_json'));
      }
    });
    req.on('error', reject);
  });
}

function safeReadJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function readSmall(relativePath, maxBytes = 10000) {
  const target = path.resolve(repoRoot, relativePath);
  if (!target.toLowerCase().startsWith(repoRoot.toLowerCase())) return null;
  try {
    const stat = fs.statSync(target);
    if (!stat.isFile() || stat.size > maxBytes) return null;
    return fs.readFileSync(target, 'utf8');
  } catch {
    return null;
  }
}

function mtime(relativePath) {
  const target = path.resolve(repoRoot, relativePath);
  if (!target.toLowerCase().startsWith(repoRoot.toLowerCase())) return null;
  try {
    return fs.statSync(target).mtime.toISOString();
  } catch {
    return null;
  }
}

function heading(markdown) {
  if (!markdown) return null;
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function compact(markdown) {
  if (!markdown) return null;
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('---'))
    .slice(0, 1)[0] || null;
}

function listAgents() {
  const dir = path.join(repoRoot, 'paperclip-tro', 'agents');
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => {
      const root = `paperclip-tro/agents/${entry.name}`;
      const readme = readSmall(`${root}/README.md`);
      const state = readSmall(`${root}/STATE.md`);
      const heartbeat = readSmall(`${root}/HEARTBEAT.md`);
      const agent = readSmall(`${root}/AGENT.md`);
      return {
        id: entry.name,
        title: heading(readme) || heading(agent) || entry.name,
        summary: compact(state) || compact(readme) || 'No compact state written yet.',
        statePath: `${root}/STATE.md`,
        heartbeatPath: `${root}/HEARTBEAT.md`,
        stateUpdatedAt: mtime(`${root}/STATE.md`),
        heartbeatUpdatedAt: mtime(`${root}/HEARTBEAT.md`),
        visible: true,
        hasHeartbeat: Boolean(heartbeat)
      };
    });
}

function readEvents(limit = 40) {
  try {
    const lines = fs.readFileSync(eventLogPath, 'utf8').trim().split(/\r?\n/).filter(Boolean);
    return lines.slice(-limit).map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { type: 'raw', message: line };
      }
    }).reverse();
  } catch {
    return [];
  }
}

function appendEvent(event) {
  fs.mkdirSync(path.dirname(eventLogPath), { recursive: true });
  const payload = {
    timestamp: new Date().toISOString(),
    source: 'mission-control',
    ...event
  };
  fs.appendFileSync(eventLogPath, `${JSON.stringify(payload)}\n`, 'utf8');
  return payload;
}

function board() {
  return safeReadJson(boardPath, {
    lanes: [],
    routines: [],
    issues: [],
    tools: [],
    terminal: []
  });
}

function fetchHealth(url, timeoutMs = 1200) {
  return new Promise((resolve) => {
    const target = new URL(url);
    const req = http.request(
      {
        hostname: target.hostname,
        port: target.port,
        path: `${target.pathname}${target.search}`,
        method: 'GET',
        timeout: timeoutMs
      },
      (res) => {
        res.resume();
        res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode }));
      }
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', (error) => resolve({ ok: false, status: 0, error: error.message }));
    req.end();
  });
}

function openShell(shell) {
  const normalized = String(shell || '').toLowerCase();
  const specs = {
    powershell: {
      command: 'powershell.exe',
      args: ['-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', `Set-Location -LiteralPath '${repoRoot.replace(/'/g, "''")}'; Write-Host 'ANTIGRAVITY Mission Control PowerShell'`]
    },
    cmd: {
      command: 'cmd.exe',
      args: ['/K', `cd /d ${repoRoot}`]
    },
    wsl: {
      command: 'wsl.exe',
      args: []
    },
    bash: {
      command: 'bash.exe',
      args: ['-l']
    }
  };
  const spec = specs[normalized];
  if (!spec) {
    const allowed = Object.keys(specs).join(', ');
    const error = new Error(`Unsupported terminal. Allowed: ${allowed}`);
    error.code = 'unsupported_terminal';
    throw error;
  }
  const child = spawn(spec.command, spec.args, {
    cwd: repoRoot,
    detached: true,
    stdio: 'ignore',
    windowsHide: false
  });
  child.unref();
  return { shell: normalized, pid: child.pid };
}

async function statusPayload() {
  const currentBoard = board();
  const domainRoutes = safeReadJson(domainRoutesPath, { routes: [] });
  const nodePool = safeReadJson(nodePoolPath, { nodes: [], loadBalancer: {} });
  const hub = await fetchHealth(`${agentHubUrl.replace(/\/$/, '')}/health`);
  return {
    ok: true,
    service: 'antigravity-mission-control',
    version: '0.2.2',
    host: os.hostname(),
    bind: `${host}:${port}`,
    repoRoot,
    startedAt: startedAt.toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    agentHub: {
      url: agentHubUrl,
      reachable: hub.ok,
      status: hub.status,
      error: hub.error || null
    },
    agents: listAgents(),
    lanes: currentBoard.lanes || [],
    routines: currentBoard.routines || [],
    issues: currentBoard.issues || [],
    tools: currentBoard.tools || [],
    terminal: currentBoard.terminal || [],
    domains: domainRoutes.routes || [],
    nodePool: {
      nodes: nodePool.nodes || [],
      loadBalancer: nodePool.loadBalancer || {},
      doNotBalance: nodePool.doNotBalance || []
    },
    events: readEvents()
  };
}

function page() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ANTIGRAVITY Mission Control</title>
  <style>
    :root {
      --bg: #07110e;
      --panel: rgba(12, 28, 24, 0.9);
      --panel2: rgba(16, 41, 34, 0.94);
      --line: rgba(128, 255, 198, 0.18);
      --text: #effff7;
      --muted: #9fc8b9;
      --green: #35f29b;
      --blue: #70d6ff;
      --gold: #ffe08a;
      --red: #ff6b6b;
      --shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--text);
      font-family: "Bahnschrift", "Aptos Display", "Segoe UI Variable Display", sans-serif;
      background:
        radial-gradient(circle at 12% 10%, rgba(53, 242, 155, 0.22), transparent 30rem),
        radial-gradient(circle at 88% 0%, rgba(112, 214, 255, 0.18), transparent 34rem),
        linear-gradient(135deg, #06100d 0%, #0b1916 48%, #081311 100%);
    }
    body:before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background-image:
        linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px);
      background-size: 42px 42px;
      mask-image: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent 85%);
    }
    main { width: min(1560px, calc(100vw - 28px)); margin: 0 auto; padding: 24px 0 46px; position: relative; }
    header { display: grid; grid-template-columns: 1.25fr 0.75fr; gap: 16px; margin-bottom: 16px; }
    .panel, .hero {
      border: 1px solid var(--line);
      border-radius: 26px;
      background: var(--panel);
      box-shadow: var(--shadow);
      backdrop-filter: blur(16px);
    }
    .hero { padding: 28px; position: relative; overflow: hidden; }
    .hero:after {
      content: "ONE CONTROL";
      position: absolute;
      right: 18px;
      bottom: -18px;
      font-size: clamp(42px, 10vw, 132px);
      letter-spacing: -0.08em;
      color: rgba(255,255,255,0.04);
      font-weight: 900;
    }
    h1 { margin: 0; font-size: clamp(38px, 6vw, 86px); letter-spacing: -0.07em; line-height: 0.88; }
    h2 { margin: 0 0 14px; font-size: 23px; letter-spacing: -0.03em; }
    h3 { margin: 0 0 8px; font-size: 16px; }
    p { color: var(--muted); line-height: 1.42; }
    .subtitle { max-width: 820px; margin: 16px 0 0; font-size: 18px; }
    .strip { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 22px; }
    .pill, button {
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 8px 12px;
      background: rgba(255,255,255,0.045);
      color: var(--text);
      font-size: 13px;
    }
    button { cursor: pointer; font-weight: 700; }
    button:hover { border-color: rgba(53, 242, 155, 0.55); background: rgba(53, 242, 155, 0.12); }
    .pill strong { color: var(--green); }
    .control { padding: 20px; display: grid; gap: 12px; }
    .signal { display: flex; justify-content: space-between; gap: 12px; align-items: center; border: 1px solid var(--line); border-radius: 18px; padding: 13px; background: rgba(0,0,0,0.16); }
    .dot { width: 12px; height: 12px; border-radius: 999px; background: var(--gold); box-shadow: 0 0 20px currentColor; display: inline-block; }
    .dot.green { background: var(--green); color: var(--green); }
    .dot.red { background: var(--red); color: var(--red); }
    .grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; }
    .panel { padding: 18px; min-width: 0; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; }
    .card { border: 1px solid var(--line); border-radius: 18px; padding: 14px; background: rgba(0,0,0,0.18); min-width: 0; }
    .card p { margin: 0; }
    .meta { margin-top: 11px; display: flex; gap: 8px; flex-wrap: wrap; color: var(--muted); font-size: 12px; }
    .lane-head { display: flex; justify-content: space-between; gap: 8px; align-items: center; margin-bottom: 10px; }
    .lanes { display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: 12px; }
    .column { border: 1px solid var(--line); border-radius: 20px; padding: 12px; background: rgba(0,0,0,0.14); }
    .task { border-left: 3px solid var(--green); border-radius: 12px; padding: 11px; margin: 10px 0 0; background: rgba(255,255,255,0.045); }
    .task.issue { border-left-color: var(--red); }
    .task.routine { border-left-color: var(--blue); }
    .tools { display: grid; gap: 10px; }
    .tool { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 12px; }
    a { color: var(--blue); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .terminal-actions { display: flex; flex-wrap: wrap; gap: 10px; }
    .event { font-family: "Cascadia Mono", Consolas, monospace; font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    @media (max-width: 980px) { header, .grid { grid-template-columns: 1fr; } main { width: min(100vw - 18px, 1560px); } }
  </style>
</head>
<body>
<main>
  <header>
    <section class="hero">
      <h1>Mission<br>Control</h1>
      <p class="subtitle">Joshua's local development and collaboration board for peer AI platforms, routines, issues, and evidence. No AI controls another; Joshua assigns the active lead.</p>
      <div class="strip" id="strip"><span class="pill">Loading...</span></div>
    </section>
    <section class="panel control">
      <h2>Live Signals</h2>
      <div class="signal"><span>Mission Control</span><span class="dot green"></span></div>
      <div class="signal"><span>Agent Hub</span><span id="hub-dot" class="dot"></span></div>
      <div class="signal"><span>Public copy</span><span class="pill"><strong>business-only</strong></span></div>
      <div class="signal"><span>Outbound</span><span class="pill"><strong>Joshua approval</strong></span></div>
    </section>
  </header>

  <section class="grid">
    <section class="panel">
      <h2>Kanban Tasks</h2>
      <div class="lanes" id="lanes"></div>
    </section>
    <aside class="panel">
      <h2>Tool Bench</h2>
      <div class="tools" id="tools"></div>
      <h2 style="margin-top:18px">Terminal</h2>
      <div class="terminal-actions" id="terminal"></div>
      <p id="terminal-result"></p>
    </aside>
  </section>

  <section class="grid" style="margin-top:16px">
    <section class="panel">
      <h2>Visible Agents</h2>
      <div class="cards" id="agents"></div>
    </section>
    <aside class="panel">
      <h2>Issues</h2>
      <div class="cards" id="issues"></div>
    </aside>
  </section>

  <section class="grid" style="margin-top:16px">
    <section class="panel">
      <h2>Routines</h2>
      <div class="cards" id="routines"></div>
    </section>
    <aside class="panel">
      <h2>Recent Events</h2>
      <div id="events"></div>
    </aside>
  </section>

  <section class="panel" style="margin-top:16px">
    <h2>Domain Routes</h2>
    <div class="cards" id="domains"></div>
  </section>

  <section class="panel" style="margin-top:16px">
    <h2>Node Pool</h2>
    <div class="cards" id="node-pool"></div>
  </section>
</main>

<script>
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time = (value) => value ? new Date(value).toLocaleString() : 'not written';

function card(title, body, meta = []) {
  return '<article class="card"><h3>' + esc(title) + '</h3><p>' + esc(body) + '</p><div class="meta">' + meta.map((x) => '<span>' + esc(x) + '</span>').join('') + '</div></article>';
}

async function openTerminal(shell) {
  const result = document.getElementById('terminal-result');
  result.textContent = 'Opening ' + shell + '...';
  const res = await fetch('/api/terminal/open', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ shell })
  });
  const data = await res.json();
  result.textContent = data.ok ? ('Opened ' + data.shell + ' pid ' + data.pid) : ('Blocked: ' + data.error);
  boot();
}

async function boot() {
  const res = await fetch('/api/status', { cache: 'no-store' });
  const data = await res.json();
  document.getElementById('hub-dot').className = 'dot ' + (data.agentHub.reachable ? 'green' : 'red');
  document.getElementById('strip').innerHTML = [
    ['Host', data.host],
    ['Uptime', data.uptimeSeconds + 's'],
    ['Agents', data.agents.length],
    ['Hub', data.agentHub.reachable ? 'up' : 'down']
  ].map(([k, v]) => '<span class="pill"><strong>' + esc(k) + '</strong> ' + esc(v) + '</span>').join('');

  document.getElementById('lanes').innerHTML = data.lanes.map((lane) => {
    const tasks = (lane.tasks || []).map((task) => '<div class="task"><strong>' + esc(task.title) + '</strong><p>' + esc(task.summary) + '</p><div class="meta"><span>' + esc(task.owner) + '</span><span>' + esc(task.status) + '</span></div></div>').join('');
    return '<section class="column"><div class="lane-head"><h3>' + esc(lane.name) + '</h3><span class="pill">' + esc((lane.tasks || []).length) + '</span></div>' + tasks + '</section>';
  }).join('');

  document.getElementById('tools').innerHTML = data.tools.map((tool) => '<article class="card tool"><div><h3>' + esc(tool.name) + '</h3><p>' + esc(tool.role) + '</p><div class="meta"><span>' + esc(tool.status) + '</span><span>' + esc(tool.boundary) + '</span></div></div>' + (tool.url ? '<a href="' + esc(tool.url) + '">open</a>' : '<span class="pill">local app</span>') + '</article>').join('');
  document.getElementById('terminal').innerHTML = data.terminal.map((item) => '<button onclick="openTerminal(\\'' + esc(item.id) + '\\')">' + esc(item.label) + '</button>').join('');
  document.getElementById('agents').innerHTML = data.agents.map((agent) => card(agent.title, agent.summary, ['id: ' + agent.id, 'state: ' + time(agent.stateUpdatedAt), 'heartbeat: ' + time(agent.heartbeatUpdatedAt), agent.statePath])).join('');
  document.getElementById('issues').innerHTML = data.issues.map((issue) => card(issue.title, issue.summary, ['severity: ' + issue.severity, 'owner: ' + issue.owner, 'status: ' + issue.status])).join('');
  document.getElementById('routines').innerHTML = data.routines.map((routine) => card(routine.name, routine.summary, ['cadence: ' + routine.cadence, 'owner: ' + routine.owner, 'mode: ' + routine.mode])).join('');
  document.getElementById('domains').innerHTML = data.domains.map((route) => card(route.domain, route.service, ['lane: ' + route.lane, 'node: ' + route.node, 'target: ' + route.localTarget, 'status: ' + route.status])).join('');
  document.getElementById('node-pool').innerHTML = data.nodePool.nodes.map((node) => card(node.id, node.role, ['host: ' + node.host, 'authority: ' + node.authority, 'autostart: ' + node.autostart])).join('');
  document.getElementById('events').innerHTML = data.events.map((event) => '<div class="event">' + esc(event.timestamp + ' ' + event.type + ' ' + (event.message || event.shell || '')) + '</div>').join('') || '<p>No events yet.</p>';
}
boot();
setInterval(boot, 30000);
</script>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host || `${host}:${port}`}`);
  try {
    if (req.method === 'GET' && (parsed.pathname === '/' || parsed.pathname === '/board')) {
      return sendHtml(res, page());
    }
    if (req.method === 'GET' && ['/api/health', '/health', '/healthz'].includes(parsed.pathname)) {
      return sendJson(res, 200, { ok: true, service: 'antigravity-mission-control', version: '0.2.2', startedAt: startedAt.toISOString() });
    }
    if (req.method === 'GET' && parsed.pathname === '/api/status') {
      return sendJson(res, 200, await statusPayload());
    }
    if (req.method === 'POST' && parsed.pathname === '/api/terminal/open') {
      const body = await readBody(req);
      const launched = openShell(body.shell);
      appendEvent({ type: 'terminal_opened', ...launched });
      return sendJson(res, 200, { ok: true, ...launched });
    }
    return sendJson(res, 404, { ok: false, error: 'not_found' });
  } catch (error) {
    return sendJson(res, error.code === 'unsupported_terminal' ? 400 : 500, { ok: false, error: error.message });
  }
});

server.listen(port, host, () => {
  console.log(`ANTIGRAVITY Mission Control listening on http://${host}:${port}`);
});
