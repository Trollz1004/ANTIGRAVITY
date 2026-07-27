const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 11436;
const HOST = process.env.HOST || '127.0.0.1';
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1/chat/completions';
const OPENROUTER_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENAI_URL = process.env.OPENAI_URL || 'https://api.openai.com/v1/chat/completions';
const GROK_URL = process.env.GROK_URL || 'https://api.x.ai/v1/chat/completions';

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const GROK_KEY = process.env.GROK_API_KEY || '';
const MODEL_GATE = process.env.OMNI_MODEL_GATE || 'strict';

const MODELS = [
  { id: 'ollama-local', object: 'model', owned_by: 'local' },
  { id: 'auto/best-fast', object: 'model', owned_by: 'omni' },
  { id: 'auto/best-reasoning', object: 'model', owned_by: 'omni' },
  { id: 'auto/pro-code', object: 'model', owned_by: 'omni' },
  { id: 'hermes', object: 'model', owned_by: 'omni' },
  { id: 'hermes-local', object: 'model', owned_by: 'hermes' },
  { id: 'openrouter/free', object: 'model', owned_by: 'openrouter' },
  { id: 'openrouter/nvidia/nemotron-3-super-120b-a12b:free', object: 'model', owned_by: 'openrouter' },
  { id: 'openrouter/nvidia/nemotron-3-ultra-550b-a55b:free', object: 'model', owned_by: 'openrouter' },
  { id: 'openrouter/nvidia/nemotron-3-nano-30b-a3b:free', object: 'model', owned_by: 'openrouter' },
  { id: 'openrouter/nvidia/nemotron-nano-9b-v2:free', object: 'model', owned_by: 'openrouter' },
  { id: 'cfo', object: 'model', owned_by: 'omni' },
  { id: 'marketing', object: 'model', owned_by: 'omni' },
  { id: 'fcc', object: 'model', owned_by: 'omni' },
  { id: 'opencode', object: 'model', owned_by: 'omni' },
  { id: 'openclaw', object: 'model', owned_by: 'openclaw' },
  { id: 'grok', object: 'model', owned_by: 'xai' },
  { id: 'grok-2-1218', object: 'model', owned_by: 'xai' },
  { id: 'grok-3', object: 'model', owned_by: 'xai' },
  { id: 'grok-3-mini', object: 'model', owned_by: 'xai' },
  { id: 'grok-3-reasoning', object: 'model', owned_by: 'xai' },
  { id: 'gpt-4o', object: 'model', owned_by: 'openai' },
  { id: 'gpt-4o-mini', object: 'model', owned_by: 'openai' },
  { id: 'cursor-adapter', object: 'model', owned_by: 'custom' },
  { id: 'cursor/free-fallback', object: 'model', owned_by: 'custom' },
  { id: 'hermes-router/hermes', object: 'model', owned_by: 'hermes-router' },
];

function providerGateHtml() {
  return `
<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>OmniRouter Dashboard</title></head>
  <body style="font-family: ui-sans-serif, system-ui; background:#05070f; color:#e9f0ff; padding:24px;">
    <h1>OmniRouter Dashboard</h1>
    <p>Single enforced gateway for model/API traffic.</p>
    <ul>
      <li><a href="/dashboard/providers">providers</a></li>
      <li><a href="/dashboard/combos">combos</a></li>
      <li><a href="/dashboard/api-manager">api manager</a></li>
      <li><a href="/v1/models">models</a></li>
      <li><a href="/health">health</a></li>
    </ul>
    <pre id="models">${JSON.stringify(MODELS.map((m) => m.id), null, 2)}</pre>
  </body>
</html>
  `.trim();
}

app.get(['/', '/dashboard', '/dashboard/'], (req, res) => {
  res.type('html').send(providerGateHtml());
});

app.get('/dashboard/providers', (req, res) => {
  res.json({
    provider_order: ['ollama-local', 'fcc', 'hermes', 'openclaw', 'xai', 'openai'],
    providers: {
      ollama: OLLAMA_URL,
      fcc: FCC_URL,
      hermes: HERMES_ROUTER_URL,
      openclaw: OPENCLAW_URL,
      xai: GROK_URL,
      openai: OPENAI_URL,
    },
    policy: {
      one_gateway: true,
      allow_direct_provider: false,
      default_model: 'ollama-local',
    },
    model_gate: MODEL_GATE,
  });
});

app.get('/dashboard/api-manager', (req, res) => {
  res.json({
    routes: [
      { path: '/v1/models', methods: ['GET'], output: 'JSON model list' },
      { path: '/health', methods: ['GET'], output: 'health object' },
      { path: '/healthz', methods: ['GET'], output: 'health alias' },
      { path: '/v1/chat/completions', methods: ['POST'], output: 'proxied chat completion', headers: { 'Content-Type': 'application/json' } },
    ],
    requires_env: ['OPENAI_API_KEY (when using gpt-* models)', 'GROK_API_KEY (when using grok-* models)'],
    guard: 'All model/api calls must hit /v1/chat/completions and/or /v1/models on this service.'
  });
});

app.get('/dashboard/combos', (req, res) => {
  res.json({
    combos: {
      'coder-cascade': ['hermes', 'openai', 'xai', 'hermes-local', 'openclaw'],
      'ops-safe': ['ollama-local', 'hermes-router/hermes', 'hermes-local'],
      'market': ['cfo', 'marketing'],
      'ops-direct': ['fcc', 'opencode'],
    },
    active: 'coder-cascade',
  });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, port: PORT, default: 'ollama-local', gate: MODEL_GATE, one_gateway: true, timestamp: new Date().toISOString() });
});

app.get('/healthz', (req, res) => {
  res.status(200).send('ok');
});

app.get('/v1/models', (req, res) => {
  res.json({ object: 'list', data: MODELS, total: MODELS.length });
});

function ensureAllowedModel(model) {
  const known = MODELS.some((m) => m.id === model);
  if (known) return { ok: true };
  if (MODEL_GATE !== 'strict') return { ok: true, reason: `model_${model}_not_in_catalog_non_strict` };
  return { ok: false, reason: 'model_not_allowed' };
}

app.post('/v1/chat/completions', async (req, res) => {
  try {
    const model = req.body.model || 'ollama-local';
    const allowed = ensureAllowedModel(model);

    if (!allowed.ok) {
      res.status(400).json({ error: { message: `Model denied by gateway policy: ${model}`, code: 'model_not_allowed' } });
      return;
    }

    let targetUrl = OLLAMA_URL;
    let upstreamModel = req.body.model || 'joshlcoleman/dateapp';
    const headers = { 'Content-Type': 'application/json' };

    if (model.includes('cfo') || model.includes('finance')) {
      upstreamModel = 'joshlcoleman/CFO-Until-No-Kid-In-Need:latest';
    } else if (model.includes('marketing')) {
      upstreamModel = 'joshlcoleman/dateapp:latest';
    } else if (model.includes('hermes-router') || model.includes('hermes-local')) {
      targetUrl = HERMES_ROUTER_URL;
      upstreamModel = model.replace('hermes-router/', '');
    } else if (model.includes('fcc') || model.includes('opencode')) {
      targetUrl = FCC_URL;
    } else if (model.includes('openclaw')) {
      targetUrl = OPENCLAW_URL;
    } else if (model.includes('grok')) {
      targetUrl = GROK_URL;
      if (!GROK_KEY) {
        res.status(500).json({ error: { message: 'Grok API key missing for gateway route', code: 'missing_provider_key' } });
        return;
      }
      headers.Authorization = `Bearer ${GROK_KEY}`;
    } else if (model.includes('gpt-')) {
      targetUrl = OPENAI_URL;
      if (!OPENAI_KEY) {
        res.status(500).json({ error: { message: 'OpenAI API key missing for gateway route', code: 'missing_provider_key' } });
        return;
      }
      headers.Authorization = `Bearer ${OPENAI_KEY}`;
    }

    const payload = { ...req.body, model: upstreamModel };

    const response = await axios.post(targetUrl, payload, {
      headers,
      timeout: 180000,
    });

    let provider = 'ollama-local';
    if (targetUrl.includes('8082')) provider = 'fcc';
    else if (targetUrl.includes('11435')) provider = 'hermes-router';
    else if (targetUrl.includes('9119')) provider = 'openclaw';
    else if (targetUrl.includes('x.ai')) provider = 'xai';
    else if (targetUrl.includes('openai.com')) provider = 'openai';

    res.setHeader('X-Omni-Provider', provider);
    res.setHeader('X-Omni-Real-Model', upstreamModel);
    res.setHeader('X-Omni-One-Gateway', 'true');
    res.json(response.data);
  } catch (err) {
    console.error('[omni-router] error:', err.message);
    res.status(500).json({ error: { message: err.message, code: 'gateway_error' } });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`[omni-router] Ready on http://${HOST}:${PORT}`);
});
