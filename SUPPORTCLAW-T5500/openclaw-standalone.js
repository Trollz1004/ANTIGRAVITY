// OpenClaw Standalone Gateway — laptop mode (no Docker)
// Lightweight HTTP server for SupportClaw on port 18895
// Routes: /health, /chat, /dashboard

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 18895;
const STATE_DIR = path.join(__dirname, 'state');
const CONFIG_PATH = path.join(STATE_DIR, 'openclaw.json');
const DASHBOARD_PATH = path.join(__dirname, 'dashboard.html');

// Load or create config
let config = { meta: { profile: 'openclaw-laptop' }, models: { primary: 'ollama-local/qwen2.5:7b' } };
try {
  if (fs.existsSync(CONFIG_PATH)) {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } else {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  }
} catch (e) {
  console.error('Config error:', e.message);
}

// Simple dashboard HTML
const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>OpenClaw Gateway — Laptop</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:-apple-system,system-ui,monospace; background:#0d1117; color:#c9d1d9; padding:2rem; }
  h1 { color:#58a6ff; margin-bottom:1rem; }
  .card { background:#161b22; border:1px solid #30363d; border-radius:8px; padding:1.5rem; margin-bottom:1rem; }
  .card h2 { color:#58a6ff; font-size:1.1rem; margin-bottom:0.5rem; }
  .status { display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.85rem; }
  .up { background:#238636; color:#fff; }
  .down { background:#da3633; color:#fff; }
  table { width:100%; border-collapse:collapse; }
  td, th { padding:8px; text-align:left; border-bottom:1px solid #21262d; }
  a { color:#58a6ff; text-decoration:none; }
  a:hover { text-decoration:underline; }
  .badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:0.75rem; margin-left:8px; }
  .free { background:#1f6feb; color:#fff; }
</style></head>
<body>
  <h1>OpenClaw Gateway</h1>
  <div class="card">
    <h2>System Status</h2>
    <table>
      <tr><td>Profile</td><td>${config.meta?.profile || 'openclaw-laptop'}</td></tr>
      <tr><td>Primary Model</td><td>${config.models?.primary || 'ollama-local/qwen2.5:7b'}</td></tr>
      <tr><td>Uptime</td><td id="uptime">calculating...</td></tr>
    </table>
  </div>
  <div class="card">
    <h2>Connected Services</h2>
    <table>
      <tr><th>Service</th><th>Port</th><th>Status</th><th>URL</th></tr>
      <tr><td>Paperclip</td><td>3101</td><td><span class="status" id="pc-status">checking...</span></td><td><a href="http://127.0.0.1:3101">http://127.0.0.1:3101</a></td></tr>
      <tr><td>Hermes Dashboard</td><td>9119</td><td><span class="status" id="hermes-status">checking...</span></td><td><a href="http://127.0.0.1:9119">http://127.0.0.1:9119</a></td></tr>
      <tr><td>Ollama</td><td>11434</td><td><span class="status" id="ollama-status">checking...</span></td><td><a href="http://127.0.0.1:11434">http://127.0.0.1:11434</a></td></tr>
      <tr><td>OpenClaw</td><td>18895</td><td><span class="status up">UP</span></td><td>this server</td></tr>
    </table>
  </div>
  <div class="card">
    <h2>Cloud Models <span class="badge free">FREE</span></h2>
    <table>
      <tr><th>Provider</th><th>Auth</th><th>Status</th></tr>
      <tr><td>OpenRouter Free</td><td>OPENROUTER_API_KEY</td><td><span class="status" id="or-status">checking...</span></td></tr>
      <tr><td>Ollama Cloud</td><td>OLLAMA_API_KEY</td><td><span class="status" id="oc-status">checking...</span></td></tr>
      <tr><td>OpenCode Zen</td><td>opencode /connect</td><td><span class="status" id="zen-status">checking...</span></td></tr>
    </tbody></table>
  </div>
  <div class="card">
    <h2>Marketing Affiliate Links</h2>
    <p><a href="https://youandinotai.com/?ref=paperclip-laptop">youandinotai.com/?ref=paperclip-laptop</a></p>
    <p><a href="https://app.youandinotai.com/?ref=paperclip-laptop&utm_source=paperclip&utm_medium=affiliate">app.youandinotai.com (with UTM)</a></p>
  </div>
  <div class="card">
    <h2>API Endpoints</h2>
    <table>
      <tr><td>GET /health</td><td>Health check</td></tr>
      <tr><td>POST /chat</td><td>Support chat <code>{"message":"..."}</code></td></tr>
      <tr><td>GET /dashboard</td><td>This page</td></tr>
      <tr><td>GET /status.json</td><td>JSON status</td></tr>
    </table>
  </div>
  <script>
    const start = Date.now();
    setInterval(() => document.getElementById('uptime').textContent = Math.floor((Date.now()-start)/1000)+'s', 1000);
    async function check(id, url) {
      try { const r = await fetch(url); document.getElementById(id).className = 'status ' + (r.ok ? 'up' : 'down'); document.getElementById(id).textContent = r.ok ? 'UP' : 'DOWN'; }
      catch(e) { document.getElementById(id).className = 'status down'; document.getElementById(id).textContent = 'DOWN'; }
    }
    check('pc-status', 'http://127.0.0.1:3101/api/health');
    check('hermes-status', 'http://127.0.0.1:9119/health');
    check('ollama-status', 'http://127.0.0.1:11434/api/tags');
    check('or-status', 'https://openrouter.ai/api/v1/models');
    check('oc-status', 'https://ollama.com/v1/models');
    check('zen-status', 'https://api.opencode.ai/v1/models');
    setInterval(() => { check('pc-status', 'http://127.0.0.1:3101/api/health'); check('hermes-status', 'http://127.0.0.1:9119/health'); }, 15000);
  </script>
</body></html>`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', profile: config.meta?.profile || 'openclaw-laptop', port: PORT }));
  }

  // JSON status
  if (url.pathname === '/status.json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      profile: config.meta?.profile || 'openclaw-laptop',
      primary_model: config.models?.primary || 'ollama-local/qwen2.5:7b',
      port: PORT,
      uptime_seconds: Math.floor(process.uptime()),
      services: { paperclip: 'http://127.0.0.1:3101', hermes: 'http://127.0.0.1:9119', ollama: 'http://127.0.0.1:11434' },
      cloud_models: ['openrouter_fire', 'ollama_cloud', 'opencode_zen']
    }));
  }

  // Dashboard UI
  if (url.pathname === '/dashboard' || url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(DASHBOARD_HTML);
  }

  // Chat endpoint
  if (url.pathname === '/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { message, sessionId } = JSON.parse(body);
        if (!message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'message required' }));
        }
        const isShouldEscalate = /escalate|problem|help/i.test(message);
        const category = /receipt/i.test(message) ? 'billing' : /verification/i.test(message) ? 'verification' : /app/i.test(message) ? 'technical' : 'general';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          sessionId: sessionId || `laptop-${Date.now()}`,
          reply: `Support received: ${message.substring(0, 100)}`,
          should_escalate: isShouldEscalate,
          category,
          subject: `Support ticket for: ${category}`,
          escalation_reason: isShouldEscalate ? 'Complex request requiring human review' : null,
          timestamp: new Date().toISOString()
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'invalid JSON' }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found', endpoints: ['/health', '/chat', '/dashboard', '/status.json'] }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`OpenClaw gateway running on http://127.0.0.1:${PORT}`);
  console.log(`Dashboard: http://127.0.0.1:${PORT}/dashboard`);
});
