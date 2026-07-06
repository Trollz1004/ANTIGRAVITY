import { z } from "zod";

/**
 * Response contract every provider adapter must coerce/parse its raw output into.
 * This is the ONLY shape the router hands back to callers — provider-specific
 * fields, vendor names, and raw prompts must never leak through.
 */
export const NpcResponseSchema = z.object({
  npc_dialogue: z.string().min(1),
  emotion: z.string().min(1),
  action_intent: z.string().min(1),
  memory_writeback: z.object({
    importance: z.number().min(0).max(1),
    summary: z.string(),
    tags: z.array(z.string()),
  }),
});

export type NpcResponse = z.infer<typeof NpcResponseSchema>;

/** Request body for POST /npc/respond */
export const NpcRequestSchema = z.object({
  npcId: z.string().min(1),
  playerId: z.string().min(1),
  playerMode: z.enum(["under13", "teen", "adult"]).default("adult"),
  npcTier: z.enum(["T0", "T1", "T2"]).default("T0"),
  message: z.string().min(1),
  tags: z.array(z.string()).default([]),
  context: z.record(z.string(), z.unknown()).optional(),
});

export type NpcRequest = z.infer<typeof NpcRequestSchema>;

/**
 * Best-effort coercion of loosely-shaped provider output into the contract.
 * Providers are free-text/creative models; this keeps the router resilient
 * to minor schema drift instead of hard-failing the whole request.
 */
export function coerceToContract(raw: unknown, fallbackSummary: string): NpcResponse {
  const candidate = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};

  const npc_dialogue =
    typeof candidate.npc_dialogue === "string" && candidate.npc_dialogue.trim().length > 0
      ? candidate.npc_dialogue
      : typeof candidate.dialogue === "string"
        ? candidate.dialogue
        : typeof raw === "string"
          ? raw
          : "...";

  const emotion = typeof candidate.emotion === "string" && candidate.emotion.trim().length > 0 ? candidate.emotion : "neutral";

  const action_intent =
    typeof candidate.action_intent === "string" && candidate.action_intent.trim().length > 0
      ? candidate.action_intent
      : "idle";

  const memoryRaw =
    typeof candidate.memory_writeback === "object" && candidate.memory_writeback !== null
      ? (candidate.memory_writeback as Record<string, unknown>)
      : {};

  const importance = typeof memoryRaw.importance === "number" ? Math.max(0, Math.min(1, memoryRaw.importance)) : 0.1;
  const summary = typeof memoryRaw.summary === "string" ? memoryRaw.summary : fallbackSummary;
  const tags = Array.isArray(memoryRaw.tags) ? memoryRaw.tags.filter((t): t is string => typeof t === "string") : [];

  const parsed = NpcResponseSchema.safeParse({
    npc_dialogue,
    emotion,
    action_intent,
    memory_writeback: { importance, summary, tags },
  });

  if (parsed.success) return parsed.data;

  // Last-resort safe fallback — never throw out of the contract boundary.
  return {
    npc_dialogue,
    emotion: "neutral",
    action_intent: "idle",
    memory_writeback: { importance: 0.1, summary: fallbackSummary, tags: [] },
  };
}
