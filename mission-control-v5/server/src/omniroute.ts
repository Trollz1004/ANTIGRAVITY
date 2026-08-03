/**
 * OMNIROUTE — provider-agnostic model routing layer.
 *
 * Routes every swarm task to the first configured, healthy provider in
 * OMNI_PROVIDER_ORDER. Adapters: anthropic | openai_compat | ollama.
 *
 * Fail-closed by design:
 *  - No provider configured  -> OmniRouteError('NO_PROVIDER'), task goes BLOCKED.
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
  /** Named executor (ornith | fcc-opus | auto). Pins provider+model chains. */
  executor?: string;
  /** Explicit model override — set internally by the executor chain. */
  model?: string;
}

export interface RouteResult {
  provider: string;
  model: string;
  text: string;
  ms: number;
}

export class OmniRouteError extends Error {
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
    const model = req.model ?? this.modelFor(req.mode)!;
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
    const model = req.model ?? this.modelFor(req.mode);
    if (!model) {
      throw new Error(`OPENAI_COMPAT_MODEL_${req.mode === 'speed' ? 'SPEED' : 'REASONING'} not set.`);
    }
    let base = env('OPENAI_COMPAT_BASE_URL').replace(/\/+$/, '');
    if (!/\/v1$/.test(base)) base = `${base}/v1`;
    // The OmniRoute gateway now requires auth on /v1/* — fall back to the
    // OMNIROUTE_API_KEY already present in .env so requests stop 401ing.
    const key = env('OPENAI_COMPAT_API_KEY') || env('OMNIROUTE_API_KEY');
    const data = await postJson(
      `${base}/chat/completions`,
      key ? { authorization: `Bearer ${key}` } : {},
      {
        model,
        stream: false, // OmniRoute streams SSE by default; force a single JSON completion.
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
    const model = req.model ?? this.modelFor(req.mode);
    if (!model) {
      throw new Error(`OLLAMA_MODEL_${req.mode === 'speed' ? 'SPEED' : 'REASONING'} not set.`);
    }
    const base = env('OLLAMA_BASE_URL').replace(/\/+$/, '');
    // OLLAMA_FORCE_CPU=1 sends num_gpu:0, running local models on CPU only.
    //
    // Why this exists: on the T5500 every GPU-backed local model dies with
    //   "CUDA error: the provided PTX was compiled with an unsupported toolchain"
    // because Ollama 0.32.5's CUDA kernels are newer than driver 560.94 (CUDA
    // 12.6) can JIT for the GTX 1070. It kills ALL local models, not just
    // ornith:9b - verified against llama3.2 and qwen2.5 too.
    //
    // Every executor chain ends at a local model as its floor, so with GPU
    // broken there was NO floor: a cloud timeout errored instead of degrading.
    // CPU-only is slow on this no-AVX Xeon (~70s for a trivial reply, measured)
    // but it is a working floor instead of a guaranteed failure.
    //
    // REMOVE THIS once the NVIDIA driver is updated - it is a stopgap, not the
    // fix. The fix is aligning driver and Ollama CUDA versions.
    const forceCpu = env('OLLAMA_FORCE_CPU') === '1';
    const data = await postJson(`${base}/api/chat`, {}, {
      model,
      stream: false,
      ...(forceCpu ? { options: { num_gpu: 0 } } : {}),
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

// ── Named executors ───────────────────────────────────────────────────────────
// An executor pins a task to an ordered provider+model chain instead of the
// generic OMNI_PROVIDER_ORDER. Each link is tried in order; first success wins.
//  - ornith    : the local Ornith model, falling back to the smallest local
//                gemma4 (browser-capable) when Ornith is unavailable/OOM.
//  - fcc-opus  : Claude Opus via the OmniRoute gateway's FCC/Claude-Code
//                provider, falling back to the gateway's auto Opus route.
//  - auto      : the classic provider-order behavior (default).
interface ExecutorLink {
  provider: keyof typeof ADAPTERS;
  model: string;
}

export interface ExecutorInfo {
  id: string;
  label: string;
  description: string;
  chain: { provider: string; model: string }[];
}

function executorChains(): Record<string, ExecutorLink[]> {
  return {
    // Cloud first, local last — every chain ends at Ornith so the box keeps
    // working when the gateway or the internet is down. There is no "low
    // quality mode": the good models are the default, local is the safety net.
    auto: [
      { provider: 'openai_compat', model: env('EXEC_AUTO_MODEL') || 'auto/best-coding' },
      { provider: 'openai_compat', model: env('EXEC_AUTO_FALLBACK_MODEL') || 'auto/best-fast' },
      { provider: 'ollama', model: env('EXEC_LOCAL_FALLBACK_MODEL') || 'ornith:9b' },
    ],
    // Chain sized to the T5500's 8 GB GTX 1070 + no-AVX Xeon: ornith fits VRAM,
    // cloud gemma4 costs no local resource, gemma2 is the offline last resort.
    ornith: [
      { provider: 'ollama', model: env('EXEC_ORNITH_MODEL') || 'ornith:9b' },
      { provider: 'ollama', model: env('EXEC_ORNITH_FALLBACK_MODEL') || 'gemma4:31b-cloud' },
      { provider: 'ollama', model: env('EXEC_ORNITH_FALLBACK2_MODEL') || 'gemma2:latest' },
    ],
    'fcc-opus': [
      { provider: 'openai_compat', model: env('EXEC_FCC_OPUS_MODEL') || 'cc/claude-opus-4-8' },
      { provider: 'openai_compat', model: env('EXEC_FCC_OPUS_FALLBACK_MODEL') || 'auto/claude-opus' },
      { provider: 'ollama', model: env('EXEC_LOCAL_FALLBACK_MODEL') || 'ornith:9b' },
    ],
  };
}

const EXECUTOR_META: Record<string, { label: string; description: string }> = {
  auto: {
    label: 'AUTO',
    description: 'OmniRoute provider order — first configured, healthy provider wins.',
  },
  ornith: {
    label: 'ORNITH',
    description: 'Local Ornith (ollama), gemma4 smallest as browser-capable local fallback.',
  },
  'fcc-opus': {
    label: 'FCC OPUS',
    description: 'Claude Opus through the OmniRoute gateway (FCC / Claude Code provider).',
  },
};

export function describeExecutors(): ExecutorInfo[] {
  const chains = executorChains();
  return Object.keys(EXECUTOR_META).map((id) => ({
    id,
    label: EXECUTOR_META[id].label,
    description: EXECUTOR_META[id].description,
    chain: (chains[id] ?? []).map((l) => ({ provider: String(l.provider), model: l.model })),
  }));
}

export function isExecutor(id: string): boolean {
  return id === 'auto' || id in executorChains();
}

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
  // Named-executor path: walk the pinned provider+model chain, fail-closed.
  const chain = req.executor && req.executor !== 'auto' ? executorChains()[req.executor] : null;
  if (chain) {
    const failures: string[] = [];
    for (const link of chain) {
      const adapter = ADAPTERS[link.provider];
      if (!adapter?.configured()) {
        failures.push(`${link.provider}(${link.model}): not configured`);
        continue;
      }
      const started = Date.now();
      try {
        const text = await adapter.complete({ ...req, model: link.model });
        return { provider: adapter.id, model: link.model, text, ms: Date.now() - started };
      } catch (err) {
        failures.push(`${link.provider}(${link.model}): ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    throw new OmniRouteError(
      'EXECUTOR_FAILED',
      `Executor "${req.executor}" exhausted its chain — ${failures.join(' | ')}`,
    );
  }

  const candidates = providerOrder().filter((p) => p.configured());
  if (candidates.length === 0) {
    throw new OmniRouteError(
      'NO_PROVIDER',
      'OmniRoute has no configured provider. Set ANTHROPIC_API_KEY, OPENAI_COMPAT_BASE_URL, or OLLAMA_BASE_URL in server/.env. This system never fabricates output.',
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
  throw new OmniRouteError('ALL_PROVIDERS_FAILED', `All providers failed — ${failures.join(' | ')}`);
}
