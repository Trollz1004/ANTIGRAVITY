import { describe, expect, it } from "vitest";

/**
 * OPTIONAL live canary — talks to a real local Ollama instance if one is
 * reachable at OLLAMA_BASE_URL. Skipped entirely (not failed) when Ollama
 * is unreachable, so this never breaks CI.
 */
async function isOllamaReachable(baseUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1000);
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const reachable = await isOllamaReachable(baseUrl);

describe.skipIf(!reachable)("ollama live canary (skipped if :11434 unreachable)", () => {
  // This is a best-effort live probe, not a correctness gate: local model
  // load/inference time varies a lot by machine, so a slow-but-reachable
  // Ollama must not fail CI or local runs either. We assert the adapter
  // completed the round trip through the contract boundary without
  // throwing; if it can't finish in the (generous) budget, we skip rather
  // than fail, since reachability was already confirmed above.
  it("responds to a basic chat call", async () => {
    const { OllamaAdapter } = await import("../src/providers/ollama.js");
    const adapter = new OllamaAdapter();
    try {
      const result = await adapter.chat(
        {
          systemPrompt: "You are a test NPC. Reply with a short JSON object.",
          userMessage: "Say hello.",
          reqId: "canary-1",
        },
        90000,
      );
      expect(result.response.npc_dialogue).toBeTruthy();
    } catch (err) {
      // Skip on upstream Ollama issues the adapter already wrapped as a
      // ProviderError (HTTP 5xx, timeout, CUDA/model crash) — the adapter
      // itself completed correctly. Rethrow anything unwrapped (TypeError,
      // contract-coercion crash) since that IS an adapter bug and this
      // canary should still catch it.
      const { ProviderError } = await import("../src/providers/types.js");
      if (!(err instanceof ProviderError)) throw err;
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        `ollama canary: reachable but adapter reported upstream error — treating as skip: ${message}`,
      );
    }
  }, 95000);
});
