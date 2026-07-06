import pino from "pino";
import { config } from "./config.js";

/**
 * Structured logger. Every provider call should log: request id, provider,
 * latency, timeout flag, token usage (if present), and fallback reason.
 */
export const logger = pino({
  level: config.logLevel,
  base: { service: "dream-npc-router" },
});

export interface ProviderCallLog {
  reqId: string;
  provider: string;
  latencyMs: number;
  timedOut: boolean;
  tokenUsage?: { promptTokens?: number; completionTokens?: number };
  fallbackReason?: string;
}

export function logProviderCall(log: ProviderCallLog): void {
  logger.info(
    {
      reqId: log.reqId,
      provider: log.provider,
      latencyMs: log.latencyMs,
      timedOut: log.timedOut,
      tokenUsage: log.tokenUsage,
      fallbackReason: log.fallbackReason,
    },
    "provider_call",
  );
}
