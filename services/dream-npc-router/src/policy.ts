import { config } from "./config.js";
import { CircuitBreaker } from "./circuitBreaker.js";
import { BASE_SYSTEM_PROMPT, applyGuardrails } from "./guardrails.js";
import { logProviderCall, logger } from "./logger.js";
import { aiHubMixAdapter } from "./providers/aihubmix.js";
import { ollamaAdapter } from "./providers/ollama.js";
import { oneMinAdapter } from "./providers/onemin.js";
import { supaReservedStub } from "./providers/supa.js";
import { ProviderTimeoutError } from "./providers/types.js";
import type { ProviderChatInput, ProviderChatResult } from "./providers/types.js";
import type { NpcRequest } from "./contract.js";
import { retrieveMemory, writeMemory } from "./memory.js";
import type { NpcResponse } from "./contract.js";

const breakers = {
  ollama: new CircuitBreaker(config.router.circuitBreakerThreshold, config.router.circuitBreakerCooldownMs),
  onemin: new CircuitBreaker(config.router.circuitBreakerThreshold, config.router.circuitBreakerCooldownMs),
  aihubmix: new CircuitBreaker(config.router.circuitBreakerThreshold, config.router.circuitBreakerCooldownMs),
};

export function getCircuitBreakerStates(): Record<string, string> {
  return {
    ollama: breakers.ollama.getState(),
    onemin: breakers.onemin.getState(),
    aihubmix: breakers.aihubmix.getState(),
  };
}

export interface RouteResult {
  response: NpcResponse;
  providerUsed: string;
  fallbackReason?: string;
  reserved?: boolean;
}

function shortLocalFallback(_reason: string): NpcResponse {
  // Keep summary free of vendor/provider names — fallbackReason is logged
  // separately and must not poison memory_writeback (guardrails scrub leaks).
  return {
    npc_dialogue: "...",
    emotion: "neutral",
    action_intent: "idle",
    memory_writeback: { importance: 0, summary: "degraded response", tags: ["degraded"] },
  };
}

/** Minimum ms we still bother trying a rail with, to avoid firing calls with a near-zero budget. */
const MIN_RAIL_BUDGET_MS = 25;

function remainingBudgetMs(deadlineMs: number): number {
  return Math.max(0, deadlineMs - Date.now());
}

async function withBreaker(
  breaker: CircuitBreaker,
  name: string,
  deadlineMs: number,
  chat: (budget: number) => Promise<ProviderChatResult>,
): Promise<ProviderChatResult> {
  if (!breaker.canAttempt()) {
    throw new Error(`${name} circuit open`);
  }
  const budget = remainingBudgetMs(deadlineMs);
  if (budget < MIN_RAIL_BUDGET_MS) {
    breaker.recordFailure();
    throw new Error(`${name} deadline exceeded before attempt`);
  }
  try {
    const result = await chat(budget);
    breaker.recordSuccess();
    return result;
  } catch (err) {
    breaker.recordFailure();
    throw err;
  }
}

const callOllama = (input: ProviderChatInput, deadlineMs: number) =>
  withBreaker(breakers.ollama, "ollama", deadlineMs, (budget) => ollamaAdapter.chat(input, budget));

const callOneMin = (input: ProviderChatInput, deadlineMs: number) =>
  withBreaker(breakers.onemin, "onemin", deadlineMs, (budget) => oneMinAdapter.chat(input, budget));

const callAiHubMix = (input: ProviderChatInput, deadlineMs: number) =>
  withBreaker(breakers.aihubmix, "aihubmix", deadlineMs, (budget) => aiHubMixAdapter.chat(input, budget));

/**
 * Decides the provider chain for a request and executes it with fallback.
 *
 * Order:
 *  - under13 (child mode): ollama local ONLY, unless ENABLE_CHILD_MODE_CLOUD=true (default false).
 *  - npcId SUPA/Sup@: reserved stub, no provider call.
 *  - T0: ollama local.
 *  - T1: 1Min primary -> AIHubMix overflow -> ollama degrade.
 *  - T2: AIHubMix premium-policy placeholder -> ollama degrade.
 */
export async function routeNpcRequest(req: NpcRequest, reqId: string): Promise<RouteResult> {
  const npcIdNormalized = req.npcId.trim().toUpperCase();
  if (npcIdNormalized === "SUPA" || npcIdNormalized === "SUP@") {
    logger.info({ reqId, npcId: req.npcId }, "supa_reserved_path_hit");
    const marker = supaReservedStub();
    return {
      response: {
        npc_dialogue: "...",
        emotion: "neutral",
        action_intent: "idle",
        memory_writeback: { importance: 0, summary: marker.note, tags: ["reserved", "supa"] },
      },
      providerUsed: "supa-reserved-stub",
      reserved: true,
    };
  }

  const memoryEvents = await retrieveMemory(req.npcId, req.playerId, req.tags);
  const memoryContext = memoryEvents.map((e) => e.summary);

  const childSafe = req.playerMode === "under13";
  const input: ProviderChatInput = {
    systemPrompt: BASE_SYSTEM_PROMPT,
    userMessage: req.message,
    reqId,
    memoryContext,
  };

  // One shared deadline across the whole fallback chain — a degraded T1
  // request should never wait N-times the configured timeout just because
  // three rails each got the full budget.
  const deadlineMs = Date.now() + config.router.timeoutMs;

  let result: ProviderChatResult | undefined;
  let providerUsed = "";
  let fallbackReason: string | undefined;

  const runWithLogging = async (name: string, fn: () => Promise<ProviderChatResult>): Promise<ProviderChatResult> => {
    const started = Date.now();
    try {
      const r = await fn();
      logProviderCall({ reqId, provider: name, latencyMs: r.latencyMs, timedOut: false, tokenUsage: r.tokenUsage });
      return r;
    } catch (err) {
      const timedOut = err instanceof ProviderTimeoutError;
      logProviderCall({
        reqId,
        provider: name,
        latencyMs: Date.now() - started,
        timedOut,
        fallbackReason: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  };

  if (childSafe && !config.childMode.enableCloud) {
    try {
      result = await runWithLogging("ollama", () => callOllama(input, deadlineMs));
      providerUsed = "ollama";
    } catch (err) {
      fallbackReason = `child_mode_ollama_failed: ${err instanceof Error ? err.message : String(err)}`;
    }
  } else if (req.npcTier === "T0") {
    try {
      result = await runWithLogging("ollama", () => callOllama(input, deadlineMs));
      providerUsed = "ollama";
    } catch (err) {
      fallbackReason = `t0_ollama_failed: ${err instanceof Error ? err.message : String(err)}`;
    }
  } else if (req.npcTier === "T1") {
    try {
      result = await runWithLogging("onemin", () => callOneMin(input, deadlineMs));
      providerUsed = "onemin";
    } catch (oneMinErr) {
      const reason = oneMinErr instanceof Error ? oneMinErr.message : String(oneMinErr);
      logger.warn({ reqId, reason }, "onemin_failed_overflowing_to_aihubmix");
      try {
        result = await runWithLogging("aihubmix", () => callAiHubMix(input, deadlineMs));
        providerUsed = "aihubmix";
        fallbackReason = `onemin_failed: ${reason}`;
      } catch (aihubErr) {
        const aihubReason = aihubErr instanceof Error ? aihubErr.message : String(aihubErr);
        logger.warn({ reqId, reason: aihubReason }, "aihubmix_failed_degrading_to_ollama");
        try {
          result = await runWithLogging("ollama", () => callOllama(input, deadlineMs));
          providerUsed = "ollama";
          fallbackReason = `onemin_failed: ${reason}; aihubmix_failed: ${aihubReason}`;
        } catch (ollamaErr) {
          fallbackReason = `all_providers_failed: onemin=${reason}; aihubmix=${aihubReason}; ollama=${
            ollamaErr instanceof Error ? ollamaErr.message : String(ollamaErr)
          }`;
        }
      }
    }
  } else {
    // T2: premium-policy PLACEHOLDER — routes through AIHubMix with a
    // documented budget-ceiling stub, degrading to local on failure.
    // TODO(dream): replace with real premium-tier policy + budget ceiling once defined.
    try {
      result = await runWithLogging("aihubmix", () => callAiHubMix(input, deadlineMs));
      providerUsed = "aihubmix";
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      logger.warn({ reqId, reason }, "t2_aihubmix_failed_degrading_to_ollama");
      try {
        result = await runWithLogging("ollama", () => callOllama(input, deadlineMs));
        providerUsed = "ollama";
        fallbackReason = `t2_aihubmix_failed: ${reason}`;
      } catch (ollamaErr) {
        fallbackReason = `t2_all_failed: aihubmix=${reason}; ollama=${
          ollamaErr instanceof Error ? ollamaErr.message : String(ollamaErr)
        }`;
      }
    }
  }

  const finalResponse = result?.response ?? shortLocalFallback(fallbackReason ?? "unknown");
  if (!result) providerUsed = "local-degraded-stub";

  const guardrailResult = applyGuardrails(finalResponse, { childSafe });
  if (!guardrailResult.safe) {
    logger.warn({ reqId, violations: guardrailResult.violations }, "guardrail_violation");
  }

  // Memory writeback is a side effect and must not fail a guardrail-passed
  // response the caller should have received. Log-and-continue on failure.
  // TRO-121: attach event_id/wake_id when present for idempotent storage paths.
  try {
    const ctx = req.context ?? {};
    const eventId = typeof ctx.event_id === "string" ? ctx.event_id : undefined;
    const wakeId = typeof ctx.wake_id === "string" ? ctx.wake_id : undefined;
    await writeMemory({
      npcId: req.npcId,
      playerId: req.playerId,
      importance: guardrailResult.sanitized.memory_writeback.importance,
      summary: guardrailResult.sanitized.memory_writeback.summary,
      tags: guardrailResult.sanitized.memory_writeback.tags,
      createdAt: new Date().toISOString(),
      eventId,
      wakeId,
    });
  } catch (err) {
    logger.warn(
      { reqId, err: err instanceof Error ? err.message : String(err) },
      "memory_writeback_failed",
    );
  }

  return { response: guardrailResult.sanitized, providerUsed, fallbackReason };
}

// Exported for rate-limit/timeout/overflow tests that need to reset breaker state between cases.
export const __internal = { breakers };
