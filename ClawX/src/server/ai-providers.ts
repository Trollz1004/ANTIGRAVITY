import {
  AI_UTILITY_SLUGS,
  PROVIDER_CONFIGS,
  type AiProviderSlug,
  type AiSlug,
  type ChatMessage,
} from '../shared/ai-providers';

type Environment = Record<string, string | undefined>;
type UserApiKeys = Partial<Record<AiProviderSlug, string>>;

export type ProviderResponseStatus = 'ok' | 'unavailable' | 'invalid-model' | 'unauthorized' | 'failed';

export interface ProviderResponse {
  content: string;
  model: string;
  executionProvider: string;
  executionModel: string;
  inputTokens: number;
  outputTokens: number;
  responseTimeMs: number;
  status: ProviderResponseStatus;
  error?: string;
}

export interface ProviderCallOptions {
  env?: Environment;
  fetchImpl?: typeof fetch;
  now?: () => number;
  purpose?: 'operational' | 'governance';
}

export interface ProviderAvailability {
  available: boolean;
  route: 'omniroute' | 'direct' | 'unavailable';
}

const OMNIROUTE_PROVIDER = 'omniroute';
const GENERIC_ERRORS: Record<Exclude<ProviderResponseStatus, 'ok'>, string> = {
  unavailable: 'Provider unavailable. Configure a supported bridge credential.',
  'invalid-model': 'Requested model is not approved for this provider.',
  unauthorized: 'Provider authorization was rejected.',
  failed: 'Provider request failed. Try again later.',
};

function firstSet(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => Boolean(value?.trim()))?.trim();
}

function normalizedBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function hasGatewayCredentials(env: Environment): boolean {
  return Boolean(firstSet(env.OPENAI_COMPAT_BASE_URL) && firstSet(env.OPENAI_COMPAT_API_KEY, env.OMNIROUTE_API_KEY));
}

function hasManusGatewayCredentials(env: Environment): boolean {
  return Boolean(
    firstSet(env.OPENAI_COMPAT_BASE_URL) &&
      firstSet(env.OPENAI_COMPAT_API_KEY, env.OMNIROUTE_API_KEY, env.BUILT_IN_FORGE_API_KEY),
  );
}

function directKeyFor(slug: AiProviderSlug, userApiKeys: UserApiKeys, env: Environment): string | undefined {
  const userKey = userApiKeys[slug];
  if (userKey) return userKey;

  switch (slug) {
    case 'gemini':
      return env.GEMINI_API_KEY;
    case 'perplexity':
      return env.SONAR_API_KEY;
    case 'grok':
      return env.XAI_API_KEY;
    case 'codex':
      return env.OPENAI_API_KEY;
    default:
      return undefined;
  }
}

/**
 * Describes whether a board seat can make a request without revealing key
 * material. Claude intentionally has no direct SDK/API-key path: its seat is
 * routed through OmniRoute when that authenticated bridge is configured.
 */
export function getProviderAvailability(
  slug: AiProviderSlug,
  userApiKeys: UserApiKeys = {},
  env: Environment = process.env,
): ProviderAvailability {
  if (slug === 'manus') {
    return hasManusGatewayCredentials(env)
      ? { available: true, route: 'omniroute' }
      : { available: false, route: 'unavailable' };
  }

  if (hasGatewayCredentials(env)) return { available: true, route: 'omniroute' };
  if (slug === 'claude') return { available: false, route: 'unavailable' };

  return directKeyFor(slug, userApiKeys, env)
    ? { available: true, route: 'direct' }
    : { available: false, route: 'unavailable' };
}

function failure(
  status: Exclude<ProviderResponseStatus, 'ok'>,
  model: string,
  executionProvider: string,
  responseTimeMs: number,
): ProviderResponse {
  return {
    content: '',
    model,
    executionProvider,
    executionModel: model,
    inputTokens: 0,
    outputTokens: 0,
    responseTimeMs,
    status,
    error: GENERIC_ERRORS[status],
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function textFromOpenAiResponse(body: unknown): string | undefined {
  const root = asRecord(body);
  const choices = Array.isArray(root?.choices) ? root.choices : [];
  const firstChoice = asRecord(choices[0]);
  const message = asRecord(firstChoice?.message);
  const content = message?.content;
  if (typeof content === 'string' && content.trim()) return content;

  if (Array.isArray(content)) {
    const text = content
      .map((part) => asRecord(part))
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim();
    return text || undefined;
  }
  return undefined;
}

function usageFromOpenAiResponse(body: unknown): { inputTokens: number; outputTokens: number } {
  const usage = asRecord(asRecord(body)?.usage);
  return {
    inputTokens: typeof usage?.prompt_tokens === 'number' ? usage.prompt_tokens : 0,
    outputTokens: typeof usage?.completion_tokens === 'number' ? usage.completion_tokens : 0,
  };
}

async function callOpenAiCompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  executionProvider: string,
  options: Required<Pick<ProviderCallOptions, 'fetchImpl' | 'now'>>,
): Promise<ProviderResponse> {
  const startedAt = options.now();
  try {
    const response = await options.fetchImpl(`${normalizedBaseUrl(baseUrl)}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, stream: false }),
    });
    const elapsed = options.now() - startedAt;

    if (response.status === 401 || response.status === 403) {
      return failure('unauthorized', model, executionProvider, elapsed);
    }
    if (!response.ok) return failure('failed', model, executionProvider, elapsed);

    const body = await response.json().catch(() => null);
    const content = textFromOpenAiResponse(body);
    if (!content) return failure('failed', model, executionProvider, elapsed);

    const usage = usageFromOpenAiResponse(body);
    const actualModel = typeof asRecord(body)?.model === 'string' ? String(asRecord(body)?.model) : model;
    return {
      content,
      model: actualModel,
      executionProvider,
      executionModel: actualModel,
      ...usage,
      responseTimeMs: elapsed,
      status: 'ok',
    };
  } catch {
    return failure('failed', model, executionProvider, options.now() - startedAt);
  }
}

export async function callGeminiDirect(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  options: Required<Pick<ProviderCallOptions, 'fetchImpl' | 'now'>>,
  generationConfig?: Record<string, unknown>,
): Promise<ProviderResponse> {
  const startedAt = options.now();
  try {
    const contents = messages
      .filter((message) => message.role !== 'system')
      .map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      }));
    const systemInstruction = messages.find((message) => message.role === 'system');
    const response = await options.fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction.content }] } } : {}),
          ...(generationConfig ? { generationConfig } : {}),
        }),
      },
    );
    const elapsed = options.now() - startedAt;
    if (response.status === 401 || response.status === 403) return failure('unauthorized', model, 'gemini', elapsed);
    if (!response.ok) return failure('failed', model, 'gemini', elapsed);

    const body = asRecord(await response.json().catch(() => null));
    const candidate = Array.isArray(body?.candidates) ? asRecord(body.candidates[0]) : null;
    const content = asRecord(candidate?.content);
    const parts = Array.isArray(content?.parts) ? content.parts : [];
    const text = parts
      .map((part) => asRecord(part))
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim();
    if (!text) return failure('failed', model, 'gemini', elapsed);

    const usage = asRecord(body?.usageMetadata);
    return {
      content: text,
      model,
      executionProvider: 'gemini',
      executionModel: model,
      inputTokens: typeof usage?.promptTokenCount === 'number' ? usage.promptTokenCount : 0,
      outputTokens: typeof usage?.candidatesTokenCount === 'number' ? usage.candidatesTokenCount : 0,
      responseTimeMs: elapsed,
      status: 'ok',
    };
  } catch {
    return failure('failed', model, 'gemini', options.now() - startedAt);
  }
}

function directOpenAiBaseUrl(slug: Exclude<AiProviderSlug, 'manus' | 'claude' | 'gemini'>): string {
  switch (slug) {
    case 'perplexity':
      return 'https://api.perplexity.ai';
    case 'grok':
      return 'https://api.x.ai/v1';
    case 'codex':
      return 'https://api.openai.com/v1';
  }
}

/**
 * Calls a named board seat with an approved model. OmniRoute is preferred
 * whenever its authenticated OpenAI-compatible bridge is configured. Direct
 * provider calls are limited to the explicitly supported non-Claude seats.
 */
export async function callProvider(
  slug: string,
  messages: ChatMessage[],
  userApiKeys: UserApiKeys,
  modelOverride?: string,
  callOptions: ProviderCallOptions = {},
): Promise<ProviderResponse> {
  if (!(slug in PROVIDER_CONFIGS)) {
    return failure('unavailable', modelOverride ?? 'unknown', 'unavailable', 0);
  }

  const providerSlug = slug as AiProviderSlug;
  const config = PROVIDER_CONFIGS[providerSlug];
  const model = modelOverride ?? config.defaultModel;
  if (!config.availableModels.includes(model)) {
    return failure('invalid-model', model, providerSlug, 0);
  }

  // Governance votes require their own official-platform bridge. This general
  // provider contract may support operational chat, but it must never execute
  // or substitute an official platform's governance vote through OmniRoute.
  if (callOptions.purpose === 'governance') {
    return {
      ...failure('unavailable', model, 'official-governance-bridge', 0),
      error: 'Official governance votes require their designated platform bridge.',
    };
  }

  const env = callOptions.env ?? process.env;
  const fetchImpl = callOptions.fetchImpl ?? fetch;
  const now = callOptions.now ?? Date.now;
  const options = { fetchImpl, now };

  const gatewayBaseUrl = env.OPENAI_COMPAT_BASE_URL;
  const gatewayKey =
    providerSlug === 'manus'
      ? firstSet(env.OPENAI_COMPAT_API_KEY, env.OMNIROUTE_API_KEY, env.BUILT_IN_FORGE_API_KEY)
      : firstSet(env.OPENAI_COMPAT_API_KEY, env.OMNIROUTE_API_KEY);
  if (gatewayBaseUrl && gatewayKey) {
    return callOpenAiCompatible(gatewayBaseUrl, gatewayKey, model, messages, OMNIROUTE_PROVIDER, options);
  }

  if (providerSlug === 'claude' || providerSlug === 'manus') {
    return failure('unavailable', model, providerSlug, 0);
  }

  const directKey = directKeyFor(providerSlug, userApiKeys, env);
  if (!directKey) return failure('unavailable', model, providerSlug, 0);
  if (providerSlug === 'gemini') return callGeminiDirect(directKey, model, messages, options);

  return callOpenAiCompatible(
    directOpenAiBaseUrl(providerSlug),
    directKey,
    model,
    messages,
    providerSlug,
    options,
  );
}

/**
 * Explicit local-only recovery path. It is intentionally not part of
 * `callProvider`, so normal board requests cannot silently fall back to it.
 */
export async function callOllamaFailsafe(
  messages: ChatMessage[],
  model: string,
  callOptions: ProviderCallOptions = {},
): Promise<ProviderResponse> {
  const env = callOptions.env ?? process.env;
  const now = callOptions.now ?? Date.now;
  const fetchImpl = callOptions.fetchImpl ?? fetch;
  if (env.OLLAMA_FAILSAFE_ENABLED !== 'true') return failure('unavailable', model, 'ollama-failsafe', 0);

  const startedAt = now();
  try {
    const response = await fetchImpl(`${normalizedBaseUrl(env.OLLAMA_FAILSAFE_BASE_URL ?? 'http://127.0.0.1:11434')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: false }),
    });
    const elapsed = now() - startedAt;
    if (!response.ok) return failure('failed', model, 'ollama-failsafe', elapsed);
    const body = asRecord(await response.json().catch(() => null));
    const message = asRecord(body?.message);
    const content = typeof message?.content === 'string' ? message.content : '';
    if (!content) return failure('failed', model, 'ollama-failsafe', elapsed);
    return {
      content,
      model,
      executionProvider: 'ollama-failsafe',
      executionModel: model,
      inputTokens: 0,
      outputTokens: 0,
      responseTimeMs: elapsed,
      status: 'ok',
    };
  } catch {
    return failure('failed', model, 'ollama-failsafe', now() - startedAt);
  }
}

export const FAILSAFE_UTILITY_SLUG = AI_UTILITY_SLUGS[0] as AiSlug;
