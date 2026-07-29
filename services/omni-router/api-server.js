const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;

const SUBSCRIBERS = new Map();
const API_KEYS = new Map();

const TIERS = {
  free: { requests: 100, reset: 'daily', price: 0 },
  pro: { requests: 10000, reset: 'monthly', price: 19 },
  business: { requests: 100000, reset: 'monthly', price: 49 }
};

app.get('/', (req, res) => {
  res.json({
    name: 'OmniRouter API',
    description: 'Single gateway for AI model traffic',
    version: '1.0.0',
    endpoints: {
      '/v1/models': 'GET - list available models',
      '/v1/chat/completions': 'POST - chat completion (requires API key)',
      '/v1/verify': 'POST - verify API key',
      '/pricing': 'GET - pricing tiers',
      '/subscribe': 'GET - subscription links'
    },
    pricing: TIERS
  });
});

app.get('/pricing', (req, res) => {
  res.json({
    tiers: TIERS,
    subscribe_links: {
      free: 'https://square.link/u/Qc5mxUy7?ref=clean-repo',
      pro: 'https://square.link/u/cxwjcn0s?ref=clean-repo',
      business: 'https://square.link/u/oY7qEfRM?ref=clean-repo'
    }
  });
});

app.get('/subscribe', (req, res) => {
  res.json({
    plans: [
      { name: 'Free Tier', price: '$0', link: 'https://square.link/u/Qc5mxUy7?ref=clean-repo', desc: 'Ollama local + OpenRouter free' },
      { name: 'Pro', price: '$19/mo', link: 'https://square.link/u/cxwjcn0s?ref=clean-repo', desc: 'All providers + priority' },
      { name: 'Business', price: '$49/mo', link: 'https://square.link/u/oY7qEfRM?ref=clean-repo', desc: 'Team + custom combos' },
      { name: 'Founding Member', price: '$25', link: 'https://square.link/u/cxwjcn0s?ref=clean-repo', desc: 'Lifetime access' },
      { name: '12-Month', price: '$99', link: 'https://square.link/u/6GHpbvvl?ref=clean-repo', desc: 'Full year' }
    ]
  });
});

app.get('/v1/models', (req, res) => {
  res.json({
    object: 'list',
    data: [
      { id: 'ollama-local', object: 'model', owned_by: 'local' },
      { id: 'auto/best-fast', object: 'model', owned_by: 'omni' },
      { id: 'auto/best-reasoning', object: 'model', owned_by: 'omni' },
      { id: 'auto/pro-code', object: 'model', owned_by: 'omni' },
      { id: 'hermes', object: 'model', owned_by: 'omni' },
      { id: 'grok-3', object: 'model', owned_by: 'xai' },
      { id: 'gpt-4o', object: 'model', owned_by: 'openai' },
      { id: 'openrouter/free', object: 'model', owned_by: 'openrouter' }
    ]
  });
});

app.post('/v1/verify', (req, res) => {
  const { api_key } = req.body;
  if (!api_key) return res.status(400).json({ error: 'api_key required' });
  const sub = API_KEYS.get(api_key);
  if (!sub) return res.status(401).json({ error: 'invalid api_key' });
  res.json({ valid: true, tier: sub.tier, requests_remaining: sub.remaining });
});

app.post('/v1/chat/completions', async (req, res) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (!apiKey) return res.status(401).json({ error: 'API key required' });
  
  const sub = API_KEYS.get(apiKey);
  if (!sub) return res.status(401).json({ error: 'invalid API key' });
  if (sub.remaining <= 0) return res.status(429).json({ error: 'rate limit exceeded' });
  
  sub.remaining--;
  
  res.json({
    id: 'chatcmpl-' + crypto.randomBytes(8).toString('hex'),
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: req.body.model || 'ollama-local',
    choices: [{
      index: 0,
      message: { role: 'assistant', content: 'Hello from OmniRouter API. Upgrade to Pro for full access.' },
      finish_reason: 'stop'
    }],
    usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
  });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString(), subscribers: SUBSCRIBERS.size });
});

app.listen(PORT, () => {
  console.log(`[omni-router-api] Ready on port ${PORT}`);
  console.log(`[omni-router-api] Pricing: http://localhost:${PORT}/pricing`);
  console.log(`[omni-router-api] Subscribe: http://localhost:${PORT}/subscribe`);
});
