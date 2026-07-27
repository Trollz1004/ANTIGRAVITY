const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const net = require('net');

const PORT = 5678;
const REPO = 'E:\\ANTIGRAVITY';

const CHECKS = [
  { id:'paperclip',       name:'Paperclip',          url:'http://127.0.0.1:3120/api/health',      kind:'url',  group:'Services' },
  { id:'proxy',           name:'Paperclip Auth Proxy',url:'http://127.0.0.1:3110/healthz',        kind:'url',  group:'Services' },
  { id:'ollama',          name:'Ollama',             url:'http://127.0.0.1:11434/api/tags',       kind:'url',  group:'Services' },
  { id:'omni',            name:'OmniRoute LB',       url:'http://127.0.0.1:20128/',              kind:'url',  group:'Services' },
  { id:'openclaw',        name:'OpenClaw / MCP',     url:'http://127.0.0.1:18789/',              kind:'port', group:'Services' },
  { id:'frontend',        name:'Date App Frontend',  url:'http://127.0.0.1:3200/',               kind:'url',  group:'Services' },
  { id:'backend',         name:'Date App Backend',   url:'http://127.0.0.1:8000/api/v1/health',   kind:'url',  group:'Services' },
  { id:'postgres',        name:'Embedded Postgres',  port:54329,                                   kind:'port', group:'Services' },
  { id:'mission',         name:'Mission Control',    url:'http://127.0.0.1:8787/health',          kind:'url',  group:'Services' },
  { id:'tunnel_public',   name:'Cloudflare Tunnel',  url:'https://paperclip.youandinotai.com/healthz', kind:'url', group:'Tunnels' },
  { id:'tunnel_local',    name:'Cloudflare Process', kind:'process',                              kind:'process', group:'Tunnels' }
];

const FIXES = {
  paperclip:      { label:'Restart Paperclip',      cmd:`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${REPO}\\ops\\paperclip-runtime\\start-paperclip.ps1"` },
  proxy:          { label:'Restart Auth Proxy',     cmd:`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${REPO}\\ops\\paperclip-runtime\\run-paperclip-auth-proxy.ps1"` },
  ollama:         { label:'Start Ollama',           cmd:`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${REPO}\\scripts\\ollama-start.ps1"` },
  omni:           { label:'Restart OmniRoute',      cmd:`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${REPO}\\scripts\\omniroute-start.ps1"` },
  openclaw:       { label:'Restart OpenClaw',       cmd:`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${REPO}\\scripts\\openclaw-gateway-start.ps1"` },
  frontend:       { label:'Restart Frontend',       cmd:`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${REPO}\\scripts\\start-dateapp-frontend-3200.ps1" -RepoRoot "${REPO}"` },
  backend:        { label:'Restart Backend',        cmd:`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${REPO}\\scripts\\t5500\\Start-YouAndINotAI-Tunnel.ps1"` },
  postgres:       { label:'No Auto-Fix',            cmd:null },
  mission:        { label:'Restart Mission Ctrl',   cmd:`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${REPO}\\scripts\\start-mission-control.ps1" -RepoRoot "${REPO}" -Port 8787` },
  tunnel_public:  { label:'Repair Tunnel',          cmd:`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${REPO}\\scripts\\start-t5500-dateapp-cloudflared.ps1"` },
  tunnel_local:   { label:'Repair Tunnel',          cmd:`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${REPO}\\scripts\\start-t5500-dateapp-cloudflared.ps1"` }
};

function httpGet(url, timeoutMs=4000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.request(url, { method:'GET', timeout: timeoutMs }, (res) => {
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve({ ok: res.statusCode>=200 && res.statusCode<500, status: res.statusCode, ms: Date.now()-start, body: d.slice(0,120) }));
    });
    req.on('error', () => resolve({ ok:false, status:0, ms: Date.now()-start, body:'' }));
    req.on('timeout', () => { req.destroy(); resolve({ ok:false, status:0, ms: Date.now()-start, body:'timeout' }); });
    req.end();
  });
}

function waitPort(port, timeoutMs=1000) {
  return new Promise((resolve) => {
    const s = net.createConnection(port, '127.0.0.1');
    const t = setTimeout(() => { s.destroy(); resolve(false); }, timeoutMs);
    s.once('connect', () => { clearTimeout(t); s.end(); resolve(true); });
    s.once('error', () => { clearTimeout(t); resolve(false); });
  });
}

function countProcess(name) {
  try {
    const out = execSync(`powershell.exe -NoProfile -Command "Get-CimInstance Win32_Process -Name '${name}' -ErrorAction SilentlyContinue | Measure-Object | Select-Object -Expand Count"`, { encoding:'utf8', timeout:4000 }).trim();
    return parseInt(out||'0',10);
  } catch { return 0; }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (url.pathname === '/') {
      const indexPath = path.join(__dirname, 'index.html');
      if (!fs.existsSync(indexPath)) {
        res.writeHead(404); res.end('missing index.html'); return;
      }
      const html = fs.readFileSync(indexPath, 'utf8');
      res.writeHead(200, { 'Content-Type':'text/html', 'Content-Length': Buffer.byteLength(html, 'utf8') });
      res.end(html);
      return;
    }
    if (url.pathname === '/api/status') {
      const results = [];
      for (const c of CHECKS) {
        let ok=false, status=0, ms=0, body='';
        if (c.kind === 'url') {
          const r = await httpGet(c.url);
          ok=r.ok; status=r.status; ms=r.ms; body=r.body;
        } else if (c.kind === 'port') {
          ok = await waitPort(c.port);
          status = ok ? 0 : 0; ms = 0;
        } else if (c.kind === 'process') {
          ok = countProcess('cloudflared') > 0;
        }
        results.push({ ...c, ok, status, ms, body });
      }
      const payload = JSON.stringify({ ts: Date.now(), results });
      res.writeHead(200, { 'Content-Type':'application/json', 'Content-Length': Buffer.byteLength(payload, 'utf8') });
      res.end(payload);
      return;
    }
    if (url.pathname.startsWith('/api/fix/')) {
      const id = url.pathname.split('/')[3];
      const fix = FIXES[id];
      if (!fix || !fix.cmd) {
        const payload = JSON.stringify({ ok:false, error:'no auto-fix' });
        res.writeHead(200, { 'Content-Type':'application/json', 'Content-Length': Buffer.byteLength(payload, 'utf8') });
        res.end(payload);
        return;
      }
      try {
        const out = execSync(fix.cmd, { encoding:'utf8', timeout:120000, stdio:['ignore','pipe','pipe'] });
        const payload = JSON.stringify({ ok:true, cmd: fix.label, out: String(out).slice(0,4000) });
        res.writeHead(200, { 'Content-Type':'application/json', 'Content-Length': Buffer.byteLength(payload, 'utf8') });
        res.end(payload);
      } catch (e) {
        const payload = JSON.stringify({ ok:false, cmd: fix.label, error: String(e.message||e).slice(0,2000) });
        res.writeHead(200, { 'Content-Type':'application/json', 'Content-Length': Buffer.byteLength(payload, 'utf8') });
        res.end(payload);
      }
      return;
    }
    res.writeHead(404); res.end('not found');
  } catch (e) {
    try { res.writeHead(500); res.end('server error'); } catch {}
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('ANTIGRAVITY dashboard on http://127.0.0.1:' + PORT);
});
