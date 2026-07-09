import http from 'node:http';

const SERVICE = 'marketing-worker';
const VERSION = '0.1.0';
const PORT = Number.parseInt(process.env.PORT || '3120', 10);
const HOST = process.env.HOST || '0.0.0.0';
const NODE_NAME = process.env.NODE_NAME || '9020';
const AGENT_HUB_URL = (process.env.AGENT_HUB_URL || 'http://192.168.0.8:3130').replace(/\/$/, '');
const AGENT_HUB_API_KEY = process.env.AGENT_HUB_API_KEY || '';
const LOCAL_API_KEY = process.env.MARKETING_WORKER_API_KEY || process.env.NODE_WORKER_API_KEY || '';
const TARGET_PLATFORM = process.env.MARKETING_PLATFORM || 'hermes';
const MAX_BODY_BYTES = 24 * 1024;
const LANES = new Set(['date-app', 'ai-solutions', 'business-exchange', 'dream-online', 'general']);
const BANNED_PUBLIC_TERMS = [
  'charity', 'donation', 'donate', 'split', 'tax', 'write off', 'write-off',
  'reserve', 'accounting', 'investment', 'investor', 'ownership', 'voting',
  'dao', 'token', 'beneficiary', 'proceeds go to', 'kids get', 'automatic donation',
  'fundraising', 'charitable', 'giving back', 'disbursement', 'control',
  'mission claim', 'benefit claim', 'public benefit'
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

function cleanText(value, maxLength = 1400) {
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

async function fetchQueuePreview() {
  if (!AGENT_HUB_API_KEY) return { ok: false, status: 503, json: { error: 'agent_hub_api_key_missing' } };
  return fetchJson(`${AGENT_HUB_URL}/api/entities/AgentTask?platform=${encodeURIComponent(TARGET_PLATFORM)}&limit=10`, {
    headers: { 'x-api-key': AGENT_HUB_API_KEY }
  });
}

function buildDraftTask(input) {
  const lane = cleanText(input.lane || 'general', 60).toLowerCase();
  const channel = cleanText(input.channel || 'internal', 80);
  const audience = cleanText(input.audience || 'founder-review', 160);
  const brief = cleanText(input.brief || input.summary, 2000);
  const cta = cleanText(input.cta || 'prepare draft for founder review', 240);
  const offer = cleanText(input.offer || 'product value', 240);
  const priority = ['low', 'medium', 'high', 'critical'].includes(input.priority) ? input.priority : 'medium';
  const found = findBannedTerms([lane, channel, audience, brief, cta, offer]);
  if (!LANES.has(lane)) return { error: 'invalid_lane', allowed: Array.from(LANES) };
  if (!brief) return { error: 'brief is required' };
  if (found.length) return { error: 'blocked_public_claim_terms', terms: found };
  return {
    title: `[9020 draft] ${lane} / ${channel}`,
    description: [
      'Draft-only marketing/sales task from 9020 marketing-worker.',
      'no_send=true. No posting, sending, DM, paid spend, outreach, public copy, payment claim, or doctrine change is authorized.',
      'Joshua or approved CEO-lane review is required before external use.',
      `lane=${lane}`,
      `channel=${channel}`,
      `audience=${audience}`,
      `offer=${offer}`,
      `cta=${cta}`,
      `brief=${brief}`
    ].join('\n'),
    status: 'todo',
    priority,
    platform: cleanText(input.platform || TARGET_PLATFORM, 40),
    repo_path: 'C:\\antigravity',
    tags: ['9020', 'marketing-worker', 'draft-only', 'no-send', 'founder-review-required', lane, channel],
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
      mode: 'draft-only',
      command_center: false,
      local_backlog: false,
      posting_enabled: false,
      outreach_enabled: false,
      agent_hub: hub,
      local_auth_configured: Boolean(LOCAL_API_KEY),
      agent_hub_auth_configured: Boolean(AGENT_HUB_API_KEY)
    });
  }
  if (req.method === 'GET' && url.pathname === '/queue/status') {
    if (!hasLocalAuth(req)) return sendJson(res, 401, { error: 'unauthorized' });
    const result = await fetchQueuePreview();
    return sendJson(res, result.ok ? 200 : result.status, { service: SERVICE, route: 'agent-hub', local_backlog: false, posting_enabled: false, outreach_enabled: false, result: result.json });
  }
  if (req.method === 'POST' && url.pathname === '/draft-task') {
    if (!hasLocalAuth(req)) return sendJson(res, 401, { error: 'unauthorized' });
    try {
      const input = await readJson(req);
      const task = buildDraftTask(input);
      if (task.error) return sendJson(res, task.terms ? 422 : 400, task);
      const result = await createAgentTask(task);
      if (!result.ok) return sendJson(res, result.status || 503, { status: 'blocked', error: 'agent_hub_unavailable_or_rejected', local_backlog: false });
      return sendJson(res, 201, { status: 'queued', route: 'agent-hub', mode: 'draft-only', no_send: true, local_backlog: false, agentTaskId: result.json?.id || null, task: result.json });
    } catch (error) {
      return sendJson(res, error.statusCode || 500, { error: error.message || 'request_failed' });
    }
  }
  return sendJson(res, 404, { error: 'not_found' });
});

server.listen(PORT, HOST, () => {
  console.log(`[${SERVICE}] listening on ${HOST}:${PORT} node=${NODE_NAME}`);
});
