import { request } from "undici";
import { config } from "../config.js";
import { coerceToContract } from "../contract.js";
import type { ProviderAdapter, ProviderChatInput, ProviderChatResult } from "./types.js";
import { ProviderError, ProviderRateLimitError, withTimeout } from "./types.js";

/**
 * AIHubMix adapter — OpenAI-compatible (chat completions style) endpoint.
 * This is the OVERFLOW/failover rail for T1 when 1Min is unavailable, and
 * the placeholder premium-policy rail for T2.
 */
export class AiHubMixAdapter implements ProviderAdapter {
  readonly name = "aihubmix";

  async chat(input: ProviderChatInput, timeoutMs: number): Promise<ProviderChatResult> {
    if (!config.aihubmix.apiKey) {
      throw new ProviderError(this.name, "AIHUBMIX_API_KEY not configured");
    }

    const started = Date.now();
    const url = `${config.aihubmix.baseUrl.replace(/\/$/, "")}/chat/completions`;

    const memoryNote =
      input.memoryContext && input.memoryContext.length > 0 ? `\nKnown context: ${input.memoryContext.join("; ")}` : "";

    const body = {
      model: config.aihubmix.modelOverflow,
      messages: [
        { role: "system", content: `${input.systemPrompt}${memoryNote}` },
        { role: "user", content: input.userMessage },
      ],
      response_format: { type: "json_object" },
    };

    try {
      // AbortSignal.timeout for real socket cancellation; withTimeout as
      // an outer race for callers where the underlying transport ignores
      // the signal (e.g. mocked undici in unit tests).
      const signal = AbortSignal.timeout(timeoutMs);
      const res = await withTimeout(
        request(url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${config.aihubmix.apiKey}`,
          },
          body: JSON.stringify(body),
          signal,
        }),
        timeoutMs,
        this.name,
      );
      if (!res || typeof res.statusCode !== "number") {
        throw new ProviderError(this.name, "aihubmix empty/invalid response (no statusCode)");
      }

      if (res.statusCode === 429) {
        const text = await res.body.text();
        throw new ProviderRateLimitError(this.name, `aihubmix rate-limited: ${text.slice(0, 200)}`);
      }
      if (res.statusCode >= 400) {
        const text = await res.body.text();
        throw new ProviderError(this.name, `aihubmix http ${res.statusCode}: ${text.slice(0, 300)}`);
      }

      const json = (await res.body.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };

      const content = json.choices?.[0]?.message?.content ?? "";
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        parsed = { npc_dialogue: content };
      }

      return {
        response: coerceToContract(parsed, "overflow NPC response"),
        latencyMs: Date.now() - started,
        tokenUsage: {
          promptTokens: json.usage?.prompt_tokens,
          completionTokens: json.usage?.completion_tokens,
        },
      };
    } catch (err) {
      if (err instanceof ProviderError || err instanceof ProviderRateLimitError) throw err;
      throw new ProviderError(this.name, err instanceof Error ? err.message : String(err));
    }
  }
}

export const aiHubMixAdapter = new AiHubMixAdapter();
