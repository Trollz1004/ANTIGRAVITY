const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const PORT = 5678;
const REPO = 'E:\\ANTIGRAVITY';

function checkTcp(port, timeoutMs = 700) {
  return new Promise((resolve) => {
    try {
      const socket = new (require('net').Socket)();
      const start = Date.now();
      let tried = 0;
      const hosts = ['127.0.0.1', '192.168.0.15'];
      function attempt() {
        if (tried >= hosts.length) { socket.destroy(); resolve({ ok: false }); return; }
        socket.connect(port, hosts[tried++], () => { socket.destroy(); resolve({ ok: true, ms: Date.now() - start }); });
      }
      socket.on('error', attempt);
      socket.setTimeout(timeoutMs);
      socket.on('timeout', () => { socket.destroy(); resolve({ ok: false }); });
      attempt();
    } catch { resolve({ ok: false }); }
  });
}

function checkHttp(url, timeoutMs = 1200) {
  return new Promise((resolve) => {
    try {
      const client = new (require('http').ClientRequest) || null;
      if (!client) return resolve({ ok: false });
      const start = Date.now();
      const req = http.request(url, { method: 'GET', timeout: timeoutMs }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ ok: res.statusCode < 500, status: res.statusCode, ms: Date.now() - start }));
      });
      req.on('error', () => resolve({ ok: false }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false }); });
      req.end();
    } catch { resolve({ ok: false }); }
  });
}

const CHECKS = [
  { id: 'ollama', name: 'Ollama', port: 11434, group: 'Models', script: null },
  { id: 'omniroute', name: 'OmniRoute LB', port: 20128, group: 'Gateway', script: 'scripts/start-omniroute.ps1' },
  { id: 'openclaw', name: 'OpenClaw', port: 18789, group: 'Gateway', script: null },
  { id: 'auth-proxy', name: 'Auth Proxy', port: 3110, group: 'Gateway', script: 'ops/paperclip-runtime/run-paperclip-auth-proxy.ps1' },
  { id: 'backend', name: 'Backend', port: 8000, group: 'Date App', script: 'scripts/t5500/Start-YouAndINotAI-Tunnel.ps1' },
  { id: 'paperclip', name: 'Paperclip', port: 3120, group: 'Services', script: 'ops/paperclip-runtime/run-paperclip-loopback.ps1' },
  { id: 'mission-control', name: 'Mission Control', port: 8787, group: 'Services', script: 'scripts/start-mission-control.ps1' },
  { id: 'frontend', name: 'Frontend', port: 3200, group: 'Date App', script: 'scripts/start-dateapp-frontend-3200.ps1' },
  { id: 'postgres', name: 'Postgres', port: 5432, group: 'Database', script: null },
  { id: 'postgres-embedded', name: 'Embedded Postgres', port: 54329, group: 'Database', script: null },
  { id: 'cloudflare-hermes', name: 'Cloudflare Hermes Tunnel', group: 'Tunnel', url: 'https://paperclip-clean.youandinotai.com', script: 'scripts/start-t5500-dateapp-cloudflared.ps1' },
  { id: 'cloudflare-louise', name: 'Cloudflare Louise Tunnel', group: 'Tunnel', url: 'https://louise-pee-lucky-scenarios.trycloudflare.com', script: 'scripts/start-t5500-dateapp-cloudflared.ps1' },
  { id: 'dashboard', name: 'Dashboard', port: 5678, group: 'Services', script: 'scripts/start-dashboard.ps1' }
];

async function collect() {
  const results = [];
  for (const c of CHECKS) {
    let ok = false, status = 'closed', ms = null;
    try {
      if (c.port) {
        const r = await checkTcp(c.port);
        ok = r.ok; ms = r.ms; status = ok ? 'open' : 'closed';
      } else if (c.url) {
        const r = await checkHttp(c.url);
        ok = r.ok; status = ok ? 'up' : 'down'; ms = r.ms;
      }
    } catch {
      ok = false; status = 'error';
    }
    results.push({
      id: c.id,
      name: c.name,
      port: c.port || null,
      url: c.url || (c.port ? 'http://127.0.0.1:' + c.port : null),
      group: c.group,
      ok,
      status,
      ms,
      fixable: !!c.script,
      script: c.script || null
    });
  }
  return { ts: Date.now(), results, repo: REPO };
}

function fix(id) {
  return new Promise((resolve) => {
    const c = CHECKS.find(x => x.id === id);
    if (!c || !c.script) return resolve({ id, fixed: false, message: 'No auto-fix script for ' + id });
    const scriptPath = path.join(REPO, c.script);
    if (!fs.existsSync(scriptPath)) return resolve({ id, fixed: false, message: 'Script missing: ' + scriptPath });
    try {
      const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath], { cwd: REPO, windowsHide: true });
      let out = '';
      child.stdout.on('data', d => out += d.toString());
      child.stderr.on('data', d => out += d.toString());
      child.on('close', code => resolve({ id, fixed: code === 0, message: out || ('exit ' + code), pid: child.pid }));
    } catch (e) {
      resolve({ id, fixed: false, message: e.message });
    }
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/' || req.url === '/index.html') {
      const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      return;
    }
    if (req.url === '/api/status') {
      const data = await collect();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(data));
      return;
    }
    if (req.url.startsWith('/api/fix/')) {
      const id = decodeURIComponent(req.url.replace('/api/fix/', ''));
      const result = await fix(id);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }
    res.writeHead(404);
    res.end('not found');
  } catch (e) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('dashboard up on', PORT);
});
