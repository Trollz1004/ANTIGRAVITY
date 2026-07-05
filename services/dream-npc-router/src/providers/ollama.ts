import { request } from "undici";
import { config } from "../config.js";
import { coerceToContract } from "../contract.js";
import type { ProviderAdapter, ProviderChatInput, ProviderChatResult } from "./types.js";
import { ProviderError, withTimeout } from "./types.js";

/**
 * Local Ollama adapter — the safe default fallback and the ONLY path used
 * for child-mode (under-13) traffic. Talks to Ollama's native /api/chat.
 *
 * Model is fixed to OLLAMA_MODEL_T0 (default the CFO-Until-No-Kid-In-Need
 * model, the only model actually pulled locally as of this writing — note
 * gemma is NOT pulled and must not be assumed available).
 */
export class OllamaAdapter implements ProviderAdapter {
  readonly name = "ollama";

  async chat(input: ProviderChatInput, timeoutMs: number): Promise<ProviderChatResult> {
    const started = Date.now();
    const url = `${config.ollama.baseUrl.replace(/\/$/, "")}/api/chat`;

    const body = {
      model: config.ollama.modelT0,
      stream: false,
      messages: [
        { role: "system", content: input.systemPrompt },
        ...(input.memoryContext && input.memoryContext.length > 0
          ? [{ role: "system", content: `Known context: ${input.memoryContext.join("; ")}` }]
          : []),
        { role: "user", content: input.userMessage },
      ],
      format: "json",
    };

    try {
      const res = await withTimeout(
        request(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }),
        timeoutMs,
        this.name,
      );

      if (res.statusCode >= 400) {
        const text = await res.body.text();
        throw new ProviderError(this.name, `ollama http ${res.statusCode}: ${text.slice(0, 300)}`);
      }

      const json = (await res.body.json()) as {
        message?: { content?: string };
        prompt_eval_count?: number;
        eval_count?: number;
      };

      const content = json.message?.content ?? "";
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        parsed = { npc_dialogue: content };
      }

      return {
        response: coerceToContract(parsed, "local NPC response"),
        latencyMs: Date.now() - started,
        tokenUsage: {
          promptTokens: json.prompt_eval_count,
          completionTokens: json.eval_count,
        },
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(this.name, err instanceof Error ? err.message : String(err));
    }
  }
}

export const ollamaAdapter = new OllamaAdapter();
