import http from 'node:http';

const SERVICE = 'hermes-support-gateway';
const VERSION = '0.1.0';
const PORT = Number.parseInt(process.env.PORT || '9110', 10);
const HOST = process.env.HOST || '0.0.0.0';
const NODE_NAME = process.env.NODE_NAME || 't5500';
const AGENT_HUB_URL = (process.env.AGENT_HUB_URL || 'http://192.168.0.8:3130').replace(/\/$/, '');
const AGENT_HUB_API_KEY = process.env.AGENT_HUB_API_KEY || '';
const LOCAL_API_KEY = process.env.SUPPORT_GATEWAY_API_KEY || process.env.NODE_WORKER_API_KEY || '';
const SUPPORT_PLATFORM = process.env.SUPPORT_PLATFORM || 'clawx';
const MAX_BODY_BYTES = 16 * 1024;
const BANNED_PUBLIC_TERMS = [
  'charity', 'donation', 'donate', 'split', 'tax', 'write off', 'write-off',
  'reserve', 'accounting', 'investment', 'investor', 'ownership', 'voting',
  'dao', 'token', 'beneficiary', 'proceeds go to', 'kids get'
];

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(payload, null, 2));
}

function hasLocalAuth(req) {
  if (!LOCAL_API_KEY) return false;
  const headerKey = req.headers['x-api-key'];
  const auth = req.headers.authorization || '';
  return headerKey === LOCAL_API_KEY || auth === `Bearer ${LOCAL_API_KEY}`;
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let data = '';
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('body_too_large'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      data += chunk;
    });
    req.on('end', () => {
      if (!data.trim()) return resolve({});
      try { resolve(JSON.parse(data)); } catch { reject(Object.assign(new Error('invalid_json'), { statusCode: 400 })); }
    });
    req.on('error', reject);
  });
}

function cleanText(value, maxLength = 1200) {
  return String(value || '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function findBannedTerms(values) {
  const joined = values.map((value) => String(value || '').toLowerCase()).join(' ');
  return BANNED_PUBLIC_TERMS.filter((term) => joined.includes(term));
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number.parseInt(process.env.UPSTREAM_TIMEOUT_MS || '3500', 10));
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let json = null;
    if (text) {
      try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 500) }; }
    }
    return { ok: response.ok, status: response.status, json };
  } finally {
    clearTimeout(timer);
  }
}

async function checkAgentHub() {
  try {
    const result = await fetchJson(`${AGENT_HUB_URL}/health`);
    return { status: result.ok ? 'up' : 'down', code: result.status };
  } catch {
    return { status: 'down' };
  }
}

async function createAgentTask(task) {
  if (!AGENT_HUB_API_KEY) return { ok: false, status: 503, json: { error: 'agent_hub_api_key_missing' } };
  return fetchJson(`${AGENT_HUB_URL}/api/entities/AgentTask`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': AGENT_HUB_API_KEY },
    body: JSON.stringify(task)
  });
}

async function adaptersHealth() {
  if (!AGENT_HUB_API_KEY) return { ok: false, status: 503, json: { error: 'agent_hub_api_key_missing' } };
  return fetchJson(`${AGENT_HUB_URL}/api/dispatch/health`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': AGENT_HUB_API_KEY },
    body: '{}'
  });
}

function buildSupportTask(input) {
  const source = cleanText(input.source || 'date-app-browser', 80);
  const topic = cleanText(input.topic || 'support', 80);
  const summary = cleanText(input.summary, 1500);
  const severity = cleanText(input.severity || 'normal', 40);
  const found = findBannedTerms([source, topic, summary, severity]);
  if (!summary) return { error: 'summary is required' };
  if (found.length) return { error: 'blocked_public_claim_terms', terms: found };
  return {
    title: `[T5500 support] ${topic}`,
    description: [
      'Support-only task from T5500 hermes-support-gateway.',
      'No public posting, outreach, payment change, doctrine change, or local backlog is authorized.',
      `source=${source}`,
      `severity=${severity}`,
      `summary=${summary}`
    ].join('\n'),
    status: 'todo',
    priority: severity === 'urgent' ? 'high' : 'medium',
    platform: cleanText(input.platform || SUPPORT_PLATFORM, 40),
    repo_path: 'C:\\antigravity',
    tags: ['t5500', 'support', 'support-only', 'no-send', 'agent-hub'],
    created_by_id: SERVICE
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET' && url.pathname === '/health') {
    const hub = await checkAgentHub();
    return sendJson(res, hub.status === 'up' ? 200 : 503, {
      status: hub.status === 'up' && LOCAL_API_KEY && AGENT_HUB_API_KEY ? 'ok' : 'blocked',
      service: SERVICE,
      version: VERSION,
      node: NODE_NAME,
      port: PORT,
      mode: 'support-only',
      command_center: false,
      local_backlog: false,
      agent_hub: hub,
      local_auth_configured: Boolean(LOCAL_API_KEY),
      agent_hub_auth_configured: Boolean(AGENT_HUB_API_KEY)
    });
  }
  if (url.pathname === '/adapters/health') {
    if (!hasLocalAuth(req)) return sendJson(res, 401, { error: 'unauthorized' });
    const result = await adaptersHealth();
    return sendJson(res, result.ok ? 200 : result.status, { service: SERVICE, source: 'agent-hub', local_backlog: false, result: result.json });
  }
  if (req.method === 'POST' && url.pathname === '/support/session') {
    if (!hasLocalAuth(req)) return sendJson(res, 401, { error: 'unauthorized' });
    try {
      const input = await readJson(req);
      const task = buildSupportTask(input);
      if (task.error) return sendJson(res, task.terms ? 422 : 400, task);
      const result = await createAgentTask(task);
      if (!result.ok) return sendJson(res, result.status || 503, { status: 'blocked', error: 'agent_hub_unavailable_or_rejected', local_backlog: false });
      return sendJson(res, 201, { status: 'queued', route: 'agent-hub', mode: 'support-only', local_backlog: false, agentTaskId: result.json?.id || null, task: result.json });
    } catch (error) {
      return sendJson(res, error.statusCode || 500, { error: error.message || 'request_failed' });
    }
  }
  return sendJson(res, 404, { error: 'not_found' });
});

server.listen(PORT, HOST, () => {
  console.log(`[${SERVICE}] listening on ${HOST}:${PORT} node=${NODE_NAME}`);
});
