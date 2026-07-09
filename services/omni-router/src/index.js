'use strict';

const http = require('http');
const { URL } = require('url');

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 11436);
const proxyEnabled = process.env.OMNI_ROUTER_PROXY_ENABLED === '1';

function envFirst(names) {
  for (const name of names) {
    if (process.env[name]) return process.env[name];
  }
  return '';
}

const providers = {
  ollama: {
    id: 'ollama',
    label: 'Ollama local/OpenAI-compatible',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1/chat/completions',
    key: '',
    configured: process.env.OMNI_ROUTER_ENABLE_OLLAMA !== '0',
    costRank: 1,
    decisionRank: 6
  },
  fcc: {
    id: 'fcc',
    label: 'FCC/OpenCode bridge',
    baseUrl: process.env.FCC_CHAT_URL || 'http://127.0.0.1:8082/v1/chat/completions',
    key: '',
    configured: process.env.OMNI_ROUTER_ENABLE_FCC === '1',
    costRank: 2,
    decisionRank: 5
  },
  nvidia: {
    id: 'nvidia',
    label: 'NVIDIA endpoints',
    baseUrl: process.env.NVIDIA_CHAT_URL || 'https://integrate.api.nvidia.com/v1/chat/completions',
    key: envFirst(['NVIDIA_API_KEY', 'NVIDIA_INFERENCE_API_KEY']),
    configured: Boolean(envFirst(['NVIDIA_API_KEY', 'NVIDIA_INFERENCE_API_KEY'])),
    costRank: 3,
    decisionRank: 4
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: process.env.OPENROUTER_CHAT_URL || 'https://openrouter.ai/api/v1/chat/completions',
    key: envFirst(['OPENROUTER_API_KEY']),
    configured: Boolean(envFirst(['OPENROUTER_API_KEY'])),
    costRank: 4,
    decisionRank: 2
  },
  openai: {
    id: 'openai',
    label: 'OpenAI API',
    baseUrl: process.env.OPENAI_CHAT_URL || 'https://api.openai.com/v1/chat/completions',
    key: envFirst(['OPENAI_API_KEY']),
    configured: Boolean(envFirst(['OPENAI_API_KEY'])),
    costRank: 5,
    decisionRank: 1
  },
  xai: {
    id: 'xai',
    label: 'xAI Grok API',
    baseUrl: process.env.XAI_CHAT_URL || 'https://api.x.ai/v1/chat/completions',
    key: envFirst(['XAI_API_KEY', 'GROK_API_KEY']),
    configured: Boolean(envFirst(['XAI_API_KEY', 'GROK_API_KEY'])),
    costRank: 6,
    decisionRank: 3
  }
};

function providerStatus(provider) {
  return {
    id: provider.id,
    label: provider.label,
    configured: provider.configured,
    baseUrl: new URL(provider.baseUrl).origin,
    requiresKey: provider.id !== 'ollama' && provider.id !== 'fcc'
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  res.end(JSON.stringify(payload, null, 2));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => {
      chunks.push(chunk);
      if (Buffer.concat(chunks).length > 2_000_000) {
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

function splitModel(model) {
  const value = String(model || '').trim();
  const slash = value.indexOf('/');
  if (slash > 0) {
    const providerId = value.slice(0, slash).toLowerCase();
    const routedModel = value.slice(slash + 1);
    if (providers[providerId]) return { providerId, model: routedModel };
  }
  return { providerId: null, model: value };
}

function configuredProviders() {
  return Object.values(providers).filter((provider) => provider.configured);
}

function chooseProvider(body) {
  const parsed = splitModel(body.model);
  if (parsed.providerId) {
    const provider = providers[parsed.providerId];
    if (!provider.configured) {
      return { error: `provider_not_configured:${parsed.providerId}`, parsed };
    }
    return { provider, model: parsed.model || body.model, reason: 'explicit provider/model' };
  }

  const requestedPolicy = String(body.policy || body.metadata?.policy || '').toLowerCase();
  const decision = requestedPolicy === 'decision' || body.metadata?.decision === true;
  const costSaver = requestedPolicy === 'cost_saver' || requestedPolicy === 'cheap' || body.metadata?.cost_saver === true;
  const defaultProvider = process.env.OMNI_ROUTER_DEFAULT_PROVIDER;

  if (defaultProvider && providers[defaultProvider]?.configured) {
    return { provider: providers[defaultProvider], model: body.model, reason: 'OMNI_ROUTER_DEFAULT_PROVIDER' };
  }

  const available = configuredProviders();
  if (!available.length) return { error: 'no_configured_providers', parsed };

  const ordered = available.sort((a, b) => {
    if (decision) return a.decisionRank - b.decisionRank;
    if (costSaver) return a.costRank - b.costRank;
    return Math.min(a.costRank, a.decisionRank) - Math.min(b.costRank, b.decisionRank);
  });

  return {
    provider: ordered[0],
    model: body.model,
    reason: decision ? 'decision policy' : costSaver ? 'cost_saver policy' : 'default policy'
  };
}

async function forwardChat(res, body) {
  const selected = chooseProvider(body);
  if (selected.error) {
    return sendJson(res, 400, { ok: false, error: selected.error, providers: Object.values(providers).map(providerStatus) });
  }

  const provider = selected.provider;
  const outbound = { ...body, model: selected.model || body.model };
  delete outbound.policy;

  if (!proxyEnabled) {
    return sendJson(res, 501, {
      ok: false,
      error: 'proxy_disabled',
      route: { provider: provider.id, model: outbound.model, reason: selected.reason },
      hint: 'Set OMNI_ROUTER_PROXY_ENABLED=1 on the node after credentials are configured.'
    });
  }

  const headers = { 'content-type': 'application/json' };
  if (provider.key) headers.authorization = `Bearer ${provider.key}`;
  if (provider.id === 'openrouter' && process.env.OPENROUTER_SITE_URL) {
    headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL;
  }
  if (provider.id === 'openrouter' && process.env.OPENROUTER_APP_NAME) {
    headers['X-Title'] = process.env.OPENROUTER_APP_NAME;
  }

  const upstream = await fetch(provider.baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(outbound)
  });
  const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
  const text = await upstream.text();
  res.writeHead(upstream.status, {
    'content-type': contentType,
    'cache-control': 'no-store',
    'x-omni-provider': provider.id,
    'x-omni-reason': selected.reason
  });
  res.end(text);
}

const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host || `${host}:${port}`}`);
  try {
    if (req.method === 'GET' && (parsed.pathname === '/health' || parsed.pathname === '/api/health')) {
      return sendJson(res, 200, {
        ok: true,
        service: 'omni-router',
        proxyEnabled,
        providers: Object.values(providers).map(providerStatus)
      });
    }
    if (req.method === 'GET' && parsed.pathname === '/routes') {
      return sendJson(res, 200, {
        ok: true,
        providers: Object.values(providers).map(providerStatus),
        policies: ['cost_saver', 'default', 'decision']
      });
    }
    if (req.method === 'POST' && parsed.pathname === '/route') {
      const body = await readJson(req);
      const selected = chooseProvider(body);
      if (selected.error) return sendJson(res, 400, { ok: false, error: selected.error });
      return sendJson(res, 200, {
        ok: true,
        provider: selected.provider.id,
        model: selected.model || body.model,
        reason: selected.reason
      });
    }
    if (req.method === 'POST' && parsed.pathname === '/v1/chat/completions') {
      return forwardChat(res, await readJson(req));
    }
    return sendJson(res, 404, { ok: false, error: 'not_found' });
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error.message });
  }
});

server.listen(port, host, () => {
  console.log(`OmniRouter listening on http://${host}:${port}`);
});
