import { request } from "undici";
import { config } from "../config.js";
import { coerceToContract } from "../contract.js";
import { logger } from "../logger.js";
import type { ProviderAdapter, ProviderChatInput, ProviderChatResult } from "./types.js";
import { ProviderError, ProviderRateLimitError, withTimeout } from "./types.js";

/**
 * 1Min.ai adapter — UNVERIFIED against the live API. Their public docs page
 * for the chat feature 404'd during integration, so this schema is a
 * best-effort reconstruction from the intro docs + scattered examples:
 *
 *   POST {ONEMIN_BASE_URL}/api/features
 *   { "type": "CHAT_WITH_AI", "model": <model>, "promptObject": { "prompt": <text> } }
 *
 * buildRequest()/parseResponse() are intentionally isolated below so the
 * ENTIRE fix, once a real key + a live call confirm the actual schema, is
 * contained to those two functions.
 *
 * AUTH is also unconfirmed: the docs intro says "Authorization: Bearer
 * <key>" but the chat-feature examples show a bare "API-KEY: <key>" header.
 * Both are supported via ONEMIN_AUTH_STYLE ("api-key" default | "bearer"),
 * and whichever is used is logged so live traffic can confirm which is
 * correct.
 *
 * Rate limit: capped at ~180 req/min via a simple token bucket.
 */

const FEATURE_TYPE = "CHAT_WITH_AI";

class TokenBucket {
  private tokens: number;
  private lastRefill = Date.now();

  constructor(
    private readonly capacityPerMin: number,
  ) {
    this.tokens = capacityPerMin;
  }

  private refill(): void {
    const now = Date.now();
    const elapsedMin = (now - this.lastRefill) / 60000;
    if (elapsedMin <= 0) return;
    this.tokens = Math.min(this.capacityPerMin, this.tokens + elapsedMin * this.capacityPerMin);
    this.lastRefill = now;
  }

  /** Resolves once a token is available, queueing callers FIFO if not. */
  async take(): Promise<void> {
    for (;;) {
      this.refill();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      const waitMs = Math.max(50, (1 / this.capacityPerMin) * 60000);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
}

function buildRequest(input: ProviderChatInput): { url: string; headers: Record<string, string>; body: unknown } {
  const url = `${config.onemin.baseUrl.replace(/\/$/, "")}/api/features`;

  const headers: Record<string, string> = { "content-type": "application/json" };
  if (config.onemin.authStyle === "bearer") {
    headers.authorization = `Bearer ${config.onemin.apiKey}`;
  } else {
    headers["API-KEY"] = config.onemin.apiKey;
  }

  const memoryNote =
    input.memoryContext && input.memoryContext.length > 0 ? `\nKnown context: ${input.memoryContext.join("; ")}` : "";

  const body = {
    type: FEATURE_TYPE,
    model: config.onemin.modelT1,
    promptObject: {
      prompt: `${input.systemPrompt}${memoryNote}\n\nPlayer: ${input.userMessage}`,
    },
  };

  return { url, headers, body };
}

function parseResponse(json: unknown): unknown {
  // Best-effort unwrap of plausible response shapes until confirmed live.
  const obj = typeof json === "object" && json !== null ? (json as Record<string, unknown>) : {};
  const candidates = [
    (obj as { result?: unknown }).result,
    (obj as { data?: { result?: unknown } }).data?.result,
    (obj as { aiRecord?: { aiRecordDetail?: { result?: unknown } } }).aiRecord?.aiRecordDetail?.result,
    obj,
  ];
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) continue;
    if (typeof candidate === "string") {
      try {
        return JSON.parse(candidate);
      } catch {
        return { npc_dialogue: candidate };
      }
    }
    return candidate;
  }
  return {};
}

export class OneMinAdapter implements ProviderAdapter {
  readonly name = "onemin";
  private readonly bucket = new TokenBucket(config.onemin.rateLimitPerMin);

  async chat(input: ProviderChatInput, timeoutMs: number): Promise<ProviderChatResult> {
    if (!config.onemin.apiKey) {
      throw new ProviderError(this.name, "ONEMIN_API_KEY not configured");
    }

    await this.bucket.take();

    const started = Date.now();
    const { url, headers, body } = buildRequest(input);

    logger.info({ reqId: input.reqId, provider: this.name, authStyle: config.onemin.authStyle }, "onemin_auth_style_used");

    try {
      // AbortSignal.timeout for real socket cancellation; withTimeout as
      // an outer race for callers where the underlying transport ignores
      // the signal (e.g. mocked undici in unit tests).
      const signal = AbortSignal.timeout(timeoutMs);
      const res = await withTimeout(
        request(url, { method: "POST", headers, body: JSON.stringify(body), signal }),
        timeoutMs,
        this.name,
      );

      if (res.statusCode === 429) {
        const text = await res.body.text();
        throw new ProviderRateLimitError(this.name, `onemin rate-limited: ${text.slice(0, 200)}`);
      }
      if (res.statusCode === 402 || res.statusCode === 403) {
        const text = await res.body.text();
        throw new ProviderRateLimitError(this.name, `onemin credit/auth issue (${res.statusCode}): ${text.slice(0, 200)}`);
      }
      if (res.statusCode >= 400) {
        const text = await res.body.text();
        throw new ProviderError(this.name, `onemin http ${res.statusCode}: ${text.slice(0, 300)}`);
      }

      const json = await res.body.json();
      const parsed = parseResponse(json);

      return {
        response: coerceToContract(parsed, "1Min NPC response (unverified schema)"),
        latencyMs: Date.now() - started,
      };
    } catch (err) {
      if (err instanceof ProviderError || err instanceof ProviderRateLimitError) throw err;
      throw new ProviderError(this.name, err instanceof Error ? err.message : String(err));
    }
  }
}

export const oneMinAdapter = new OneMinAdapter();

// Exported for targeted unit testing of the isolated schema boundary.
export const __internal = { buildRequest, parseResponse, FEATURE_TYPE };
