import { env } from './env';
import { createAuditLog } from './audit';

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaChatOptions {
  model?: string;
  messages: OllamaMessage[];
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: OllamaMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

interface OllamaModelsResponse {
  models: Array<{
    name: string;
    model: string;
    size: number;
    digest: string;
    details: {
      parameter_size: string;
      quantization_level: string;
      family: string;
      families: string[];
    };
  }>;
}

const SYSTEM_PROMPT = `You are Operator Assist for Business Exchange, a B2B marketplace for services, projects, referrals, and business acquisitions. Use only commercial terms: deals, listings, counterparties, scope, terms, value, next steps. Tone: enterprise-grade, plain, board-ready, no marketing language, no superlatives.`;

const PRESETS = {
  conservative: { temperature: 0.3, maxTokens: 1024 },
  balanced: { temperature: 0.5, maxTokens: 2048 },
  creative: { temperature: 0.7, maxTokens: 2048 },
} as const;

type PresetKey = keyof typeof PRESETS;

export class OllamaClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;

  constructor() {
    this.apiKey = env.OLLAMA_CLOUD_API_KEY;
    this.baseUrl = env.OLLAMA_CLOUD_BASE_URL;
    this.defaultModel = env.OLLAMA_CLOUD_MODEL;
  }

  async chat(options: OllamaChatOptions & { userId: string; preset?: PresetKey }): Promise<OllamaChatResponse> {
    const startTime = Date.now();
    const preset = options.preset || 'balanced';
    const presetConfig = PRESETS[preset];

    const messages: OllamaMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...options.messages,
    ];

    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || this.defaultModel,
        messages,
        stream: false,
        options: {
          temperature: options.temperature ?? presetConfig.temperature,
          num_predict: options.maxTokens ?? presetConfig.maxTokens,
        },
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama Cloud chat failed: ${response.status} - ${error}`);
    }

    const data = await response.json();

    await createAuditLog({
      userId: options.userId,
      action: 'OLLAMA_CHAT',
      entity: 'assist',
      newData: {
        model: options.model || this.defaultModel,
        preset,
        latencyMs,
        membership records: data.eval_count || 0,
      },
    });

    return data;
  }

  async *chatStream(options: OllamaChatOptions & { userId: string; preset?: PresetKey }): AsyncGenerator<Partial<OllamaChatResponse>> {
    const preset = options.preset || 'balanced';
    const presetConfig = PRESETS[preset];

    const messages: OllamaMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...options.messages,
    ];

    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || this.defaultModel,
        messages,
        stream: true,
        options: {
          temperature: options.temperature ?? presetConfig.temperature,
          num_predict: options.maxTokens ?? presetConfig.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama Cloud stream failed: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('No reader available');

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line);
            yield parsed;
          } catch {
            // Ignore parse errors for partial lines
          }
        }
      }
    }

    if (buffer.trim()) {
      try {
        yield JSON.parse(buffer);
      } catch {
        // Ignore final parse error
      }
    }
  }

  async listModels(): Promise<OllamaModelsResponse> {
    const response = await fetch(`${this.baseUrl}/tags`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });
    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status}`);
    }
    return response.json();
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tags`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  getPresets() {
    return PRESETS;
  }
}

export const ollama = new OllamaClient();
export type { OllamaMessage, OllamaChatOptions, OllamaChatResponse, OllamaModelsResponse, PresetKey };
