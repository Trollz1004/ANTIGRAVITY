import type { NpcResponse } from "../contract.js";

export interface ProviderChatInput {
  systemPrompt: string;
  userMessage: string;
  reqId: string;
  /** Optional memory/context snippets to ground the response. */
  memoryContext?: string[];
}

export interface ProviderChatResult {
  response: NpcResponse;
  latencyMs: number;
  tokenUsage?: { promptTokens?: number; completionTokens?: number };
}

export interface ProviderAdapter {
  readonly name: string;
  chat(input: ProviderChatInput, timeoutMs: number): Promise<ProviderChatResult>;
}

/** Thrown by adapters on rate-limit/credit responses so the policy engine can overflow. */
export class ProviderRateLimitError extends Error {
  constructor(
    public readonly provider: string,
    message: string,
  ) {
    super(message);
    this.name = "ProviderRateLimitError";
  }
}

/** Thrown by adapters on generic upstream failure. */
export class ProviderError extends Error {
  constructor(
    public readonly provider: string,
    message: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

/** Thrown internally when a provider call exceeds its timeout budget. */
export class ProviderTimeoutError extends Error {
  constructor(public readonly provider: string) {
    super(`${provider} timed out`);
    this.name = "ProviderTimeoutError";
  }
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, provider: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ProviderTimeoutError(provider)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}
