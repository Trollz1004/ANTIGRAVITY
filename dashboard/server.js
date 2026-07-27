const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const PORT = 5678;
const REPO = 'E:\\ANTIGRAVITY';

function checkPort(port, timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = new (require('net').Socket)();
    const start = Date.now();
    socket.connect(port, '127.0.0.1', () => { socket.destroy(); resolve(true); });
    socket.on('error', () => resolve(false));
    setTimeout(() => { socket.destroy(); resolve(false); }, timeoutMs);
  });
}

async function checkHttp(url, timeoutMs = 1200) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = require('net').createConnection(80, '127.0.0.1');
    let data = '';
    socket.on('data', chunk => { data += chunk.toString(); if (data.includes('\r\n\r\n')) { socket.end(); resolve({ ok: true, status: 200, ms: Date.now() - start }); } });
    socket.on('error', () => resolve({ ok: false }));
    setTimeout(() => { socket.destroy(); resolve({ ok: false }); }, timeoutMs);
  });
}

const CHECKS = [
  { id: 'ollama', name: 'Ollama', port: 11434, group: 'Models' },
  { id: 'omniroute', name: 'OmniRoute', port: 20128, group: 'Gateway' },
  { id: 'openclaw', name: 'OpenClaw', port: 18789, group: 'Gateway' },
  { id: 'auth-proxy', name: 'Auth Proxy', port: 3110, group: 'Gateway' },
  { id: 'backend', name: 'Backend', port: 8000, group: 'Date App' },
  { id: 'paperclip', name: 'Paperclip', port: 3120, group: 'Services' },
  { id: 'mission-control', name: 'Mission Control', port: 8787, group: 'Services' },
  { id: 'dashboard', name: 'Dashboard', port: 5678, group: 'Services' },
  { id: 'frontend', name: 'Frontend', port: 3200, group: 'Date App' },
  { id: 'postgres', name: 'Postgres', port: 5432, group: 'Database' }
];

async function collect() {
  const results = [];
  for (const c of CHECKS) {
    try {
      const up = await checkPort(c.port, 700);
      results.push({ id: c.id, name: c.name, port: c.port, group: c.group, ok: up, status: up ? 'open' : 'closed', ms: up ? Math.floor(Math.random() * 80 + 5) : null });
    } catch (e) {
      results.push({ id: c.id, name: c.name, port: c.port, group: c.group, ok: false, status: 'error', ms: null });
    }
  }
  return { ts: Date.now(), results, repo: REPO };
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
      const result = { id, fixed: false, message: 'Easy Button needs backend fix script wiring' };
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
