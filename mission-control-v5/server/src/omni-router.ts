/**
 * OMNI ROUTER — provider-agnostic model routing layer.
 *
 * Routes every swarm task to the first configured, healthy provider in
 * OMNI_PROVIDER_ORDER. Adapters: anthropic | openai_compat | ollama.
 *
 * Fail-closed by design:
 *  - No provider configured  -> OmniRouterError('NO_PROVIDER'), task goes BLOCKED.
 *  - All providers fail      -> honest aggregated error, task goes BLOCKED.
 *  - Zero fabricated output. Ever.
 *
 * Secrets come from env only. Nothing is logged beyond provider id + model.
 */
import type { Mode, ProviderInfo } from './types.js';

export interface RouteRequest {
  mode: Mode;
  system: string;
  prompt: string;
  maxTokens?: number;
}

export interface RouteResult {
  provider: string;
  model: string;
  text: string;
  ms: number;
}

export class OmniRouterError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const env = (key: string): string => (process.env[key] ?? '').trim();

interface ProviderAdapter {
  id: string;
  configured(): boolean;
  modelFor(mode: Mode): string | null;
  complete(req: RouteRequest): Promise<string>;
}

const REQUEST_TIMEOUT_MS = 120_000;

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 400)}`);
    }
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

// ── Adapter: Anthropic direct ─────────────────────────────────────────────────
const anthropic: ProviderAdapter = {
  id: 'anthropic',
  configured: () => env('ANTHROPIC_API_KEY').length > 0,
  modelFor: (mode) =>
    mode === 'speed'
      ? env('OMNI_MODEL_SPEED') || 'claude-3-5-haiku-20241022'
      : env('OMNI_MODEL_REASONING') || 'claude-3-5-sonnet-20241022',
  async complete(req) {
    const model = this.modelFor(req.mode)!;
    const data = await postJson(
      'https://api.anthropic.com/v1/messages',
      { 'x-api-key': env('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01' },
      {
        model,
        max_tokens: req.maxTokens ?? 4096,
        system: req.system,
        messages: [{ role: 'user', content: req.prompt }],
      },
    );
    const text = (data.content ?? [])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n');
    if (!text) throw new Error('Empty completion from Anthropic.');
    return text;
  },
};

// ── Adapter: any OpenAI-compatible endpoint ───────────────────────────────────
const openaiCompat: ProviderAdapter = {
  id: 'openai_compat',
  configured: () => env('OPENAI_COMPAT_BASE_URL').length > 0,
  modelFor: (mode) =>
    mode === 'speed'
      ? env('OPENAI_COMPAT_MODEL_SPEED') || null
      : env('OPENAI_COMPAT_MODEL_REASONING') || null,
  async complete(req) {
    const model = this.modelFor(req.mode);
    if (!model) {
      throw new Error(`OPENAI_COMPAT_MODEL_${req.mode === 'speed' ? 'SPEED' : 'REASONING'} not set.`);
    }
    let base = env('OPENAI_COMPAT_BASE_URL').replace(/\/+$/, '');
    if (!/\/v1$/.test(base)) base = `${base}/v1`;
    const key = env('OPENAI_COMPAT_API_KEY');
    const data = await postJson(
      `${base}/chat/completions`,
      key ? { authorization: `Bearer ${key}` } : {},
      {
        model,
        max_tokens: req.maxTokens ?? 4096,
        messages: [
          { role: 'system', content: req.system },
          { role: 'user', content: req.prompt },
        ],
      },
    );
    const text = data.choices?.[0]?.message?.content ?? '';
    if (!text) throw new Error('Empty completion from OpenAI-compatible endpoint.');
    return text;
  },
};

// ── Adapter: Ollama ───────────────────────────────────────────────────────────
const ollama: ProviderAdapter = {
  id: 'ollama',
  configured: () => env('OLLAMA_BASE_URL').length > 0,
  modelFor: (mode) =>
    mode === 'speed' ? env('OLLAMA_MODEL_SPEED') || null : env('OLLAMA_MODEL_REASONING') || null,
  async complete(req) {
    const model = this.modelFor(req.mode);
    if (!model) {
      throw new Error(`OLLAMA_MODEL_${req.mode === 'speed' ? 'SPEED' : 'REASONING'} not set.`);
    }
    const base = env('OLLAMA_BASE_URL').replace(/\/+$/, '');
    const data = await postJson(`${base}/api/chat`, {}, {
      model,
      stream: false,
      messages: [
        { role: 'system', content: req.system },
        { role: 'user', content: req.prompt },
      ],
    });
    const text = data.message?.content ?? '';
    if (!text) throw new Error('Empty completion from Ollama.');
    return text;
  },
};

const ADAPTERS: Record<string, ProviderAdapter> = {
  anthropic,
  openai_compat: openaiCompat,
  ollama,
};

function providerOrder(): ProviderAdapter[] {
  const order = (env('OMNI_PROVIDER_ORDER') || 'anthropic,openai_compat,ollama')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const list: ProviderAdapter[] = [];
  for (const id of order) {
    const adapter = ADAPTERS[id];
    if (adapter && !seen.has(id)) {
      seen.add(id);
      list.push(adapter);
    }
  }
  return list;
}

export function describeProviders(): ProviderInfo[] {
  return providerOrder().map((p) => ({
    id: p.id,
    configured: p.configured(),
    speedModel: p.configured() ? p.modelFor('speed') : null,
    reasoningModel: p.configured() ? p.modelFor('reasoning') : null,
  }));
}

export function routerLive(): boolean {
  return providerOrder().some((p) => p.configured());
}

export async function route(req: RouteRequest): Promise<RouteResult> {
  const candidates = providerOrder().filter((p) => p.configured());
  if (candidates.length === 0) {
    throw new OmniRouterError(
      'NO_PROVIDER',
      'Omni Router has no configured provider. Set ANTHROPIC_API_KEY, OPENAI_COMPAT_BASE_URL, or OLLAMA_BASE_URL in server/.env. This system never fabricates output.',
    );
  }
  const failures: string[] = [];
  for (const provider of candidates) {
    const started = Date.now();
    try {
      const text = await provider.complete(req);
      return {
        provider: provider.id,
        model: provider.modelFor(req.mode) ?? 'unknown',
        text,
        ms: Date.now() - started,
      };
    } catch (err) {
      failures.push(`${provider.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  throw new OmniRouterError('ALL_PROVIDERS_FAILED', `All providers failed — ${failures.join(' | ')}`);
}
