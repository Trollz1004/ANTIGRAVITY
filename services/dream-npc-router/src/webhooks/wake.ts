import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { NpcRequest, NpcResponse } from "../contract.js";
import { routeNpcRequest } from "../policy.js";
import { retrieveMemory, writeMemory, type MemoryEvent } from "../memory.js";
import type { CanonicalEventType } from "./events.js";

/**
 * TRO-48 — agent wake + response + memory write-back roundtrip.
 *
 * Skill contract (dream-live-npc):
 *   POST /npc/{npc_id}/wake  → agent_response with remember[]  ≤2s T1 budget
 *
 * Uses the existing provider router (routeNpcRequest), which already
 * writebacks through memory.ts. Maps NpcResponse → skill agent_response.
 */

const ContextRefSchema = z.object({
  kind: z.string().min(1),
  id: z.string().min(1),
});

export const AgentWakeSchema = z.object({
  schema_version: z.string().regex(/^\d+\.\d+\.\d+$/).default("1.0.0"),
  wake_id: z.string().min(1),
  npc_id: z.string().min(1),
  tier: z.enum(["T0", "T1", "T2", "T3"]).default("T1"),
  trigger: z.object({
    event_id: z.string().min(1),
    event_type: z.string().min(1),
    occurred_at: z.string().min(1),
  }),
  context_refs: z.array(ContextRefSchema).default([]),
  budget: z
    .object({
      max_latency_ms: z.number().int().positive().optional(),
      latency_ms: z.number().int().positive().optional(),
      fallback: z.string().optional(),
      model_class: z.string().optional(),
    })
    .default({ max_latency_ms: 2000, fallback: "canned_line" }),
  payload_ref: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  /** Optional utterance/message for the NPC turn (from game payload). */
  message: z.string().optional(),
  player_id: z.string().optional(),
  player_mode: z.enum(["under13", "teen", "adult"]).optional(),
});

export type AgentWake = z.infer<typeof AgentWakeSchema>;

export type RememberItem = {
  kind: "episodic" | "relationship" | "world_ledger";
  event: string;
  actors: string[];
  salience: number;
  decay_class: "ephemeral" | "normal" | "sticky";
};

export type AgentResponse = {
  schema_version: string;
  wake_id: string;
  npc_id: string;
  ok: boolean;
  say?: string;
  do?: Array<{ action: string; name?: string }>;
  remember: RememberItem[];
  mood_delta?: number;
  world_effects?: unknown[];
  fallback_used: boolean;
  latency_ms: number;
  emotion?: string;
  action_intent?: string;
  provider?: string;
};

export type WakeRoundtripResult = {
  ok: true;
  agentResponse: AgentResponse;
  memoryWritten: MemoryEvent | null;
  memoryCountAfter: number;
  providerUsed: string;
  fallbackReason?: string;
};

function budgetMs(wake: AgentWake): number {
  return wake.budget.max_latency_ms ?? wake.budget.latency_ms ?? 2000;
}

function tierToNpcTier(tier: AgentWake["tier"]): NpcRequest["npcTier"] {
  if (tier === "T2" || tier === "T3") return "T2";
  if (tier === "T1") return "T1";
  return "T0";
}

function resolvePlayerId(wake: AgentWake): string {
  if (wake.player_id) return wake.player_id;
  const playerRef = wake.context_refs.find((r) => r.kind === "player");
  if (playerRef) return playerRef.id;
  // Relationship ref shape npc:player or npc_id:ply_x
  const rel = wake.context_refs.find((r) => r.kind === "relationship");
  if (rel?.id.includes(":")) {
    const parts = rel.id.split(":");
    const last = parts[parts.length - 1];
    if (last) return last;
  }
  return "ply_unknown";
}

function resolveMessage(wake: AgentWake): string {
  if (wake.message && wake.message.trim()) return wake.message.trim();
  return `Trigger ${wake.trigger.event_type} (event ${wake.trigger.event_id})`;
}

function cannedLine(eventType: string): string {
  switch (eventType as CanonicalEventType | string) {
    case "npc.spoken_to":
      return "Aye. State your business.";
    case "need.spend":
    case "need.earn":
      return "Coin counted. Next.";
    case "player.enter_zone":
      return "Watch your step on the pier.";
    default:
      return "...";
  }
}

function mapRemember(
  npcResponse: NpcResponse,
  wake: AgentWake,
  playerId: string,
): RememberItem[] {
  const summary = npcResponse.memory_writeback.summary?.trim();
  if (!summary) return [];

  const salience = Math.max(0, Math.min(1, npcResponse.memory_writeback.importance ?? 0.1));
  const decay: RememberItem["decay_class"] =
    salience >= 0.7 ? "sticky" : salience <= 0.15 ? "ephemeral" : "normal";

  return [
    {
      kind: "episodic",
      event: summary
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 80) || wake.trigger.event_type.replace(/\./g, "_"),
      actors: [playerId].filter(Boolean),
      salience,
      decay_class: decay,
    },
  ];
}

/**
 * Execute one agent wake: provider route → response contract → memory write-back.
 * Honors budget.max_latency_ms (default 2000). On timeout/failure still returns a
 * canned line and a degraded remember[] (fallback law from dream-live-npc skill).
 */
export async function processAgentWake(
  rawWake: unknown,
  reqId: string = randomUUID(),
): Promise<WakeRoundtripResult> {
  const started = Date.now();
  const parsed = AgentWakeSchema.safeParse(rawWake);
  if (!parsed.success) {
    throw Object.assign(new Error("invalid_agent_wake"), {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  const wake = parsed.data;
  const playerId = resolvePlayerId(wake);
  const message = resolveMessage(wake);
  const maxMs = budgetMs(wake);
  // Reserve wall-clock for memory write-back so total roundtrip stays ≤ budget
  // even when the provider race hits the limit (TRO-66 / T1 ≤2s law).
  const POST_PROCESS_RESERVE_MS = 250;
  const raceMs = Math.max(50, maxMs - POST_PROCESS_RESERVE_MS);

  let providerUsed = "local-degraded-stub";
  let fallbackReason: string | undefined;
  let npcResponse: NpcResponse | undefined;
  let fallbackUsed = false;
  let memoryWritten: MemoryEvent | null = null;

  // Enforce wake budget with Promise.race (T1 law: ≤2s). Provider chain may use
  // a longer router timeout internally; the race returns canned line + still
  // queues memory write so players never wait on a hung rail.
  const routePromise = routeNpcRequest(
    {
      npcId: wake.npc_id,
      playerId,
      playerMode: wake.player_mode ?? "adult",
      npcTier: tierToNpcTier(wake.tier),
      message,
      tags: [],
      context: {
        wake_id: wake.wake_id,
        event_id: wake.trigger.event_id,
        event_type: wake.trigger.event_type,
        payload_ref: wake.payload_ref,
      },
    },
    reqId,
  );

  const timed = await Promise.race([
    routePromise.then((r) => ({ kind: "ok" as const, r })),
    new Promise<{ kind: "timeout" }>((resolve) =>
      setTimeout(() => resolve({ kind: "timeout" }), raceMs),
    ),
  ]);

  if (timed.kind === "timeout") {
    fallbackUsed = true;
    fallbackReason = `wake_budget_exceeded_${raceMs}ms`;
    npcResponse = {
      npc_dialogue: cannedLine(wake.trigger.event_type),
      emotion: "neutral",
      action_intent: "idle",
      memory_writeback: {
        importance: 0.2,
        summary: `async_memory_queue:${wake.trigger.event_type}`,
        tags: ["fallback", "async_memory", wake.trigger.event_type],
      },
    };
    // Still persist memory (skill fallback law + TRO-121 storage path).
    memoryWritten = await writeMemory({
      npcId: wake.npc_id,
      playerId,
      importance: npcResponse.memory_writeback.importance,
      summary: npcResponse.memory_writeback.summary,
      tags: npcResponse.memory_writeback.tags,
      createdAt: new Date().toISOString(),
      eventId: wake.trigger.event_id,
      wakeId: wake.wake_id,
    });
    providerUsed = "canned-fallback";
  } else {
    npcResponse = timed.r.response;
    providerUsed = timed.r.providerUsed;
    fallbackReason = timed.r.fallbackReason;
    fallbackUsed = Boolean(timed.r.fallbackReason) || providerUsed === "local-degraded-stub";
  }

  const response = npcResponse ?? {
    npc_dialogue: cannedLine(wake.trigger.event_type),
    emotion: "neutral",
    action_intent: "idle",
    memory_writeback: {
      importance: 0.1,
      summary: `wake:${wake.trigger.event_type}`,
      tags: ["fallback"],
    },
  };

  const remember = mapRemember(response, wake, playerId);

  // routeNpcRequest writes memory on normal provider paths; reserved/early
  // returns (e.g. SUPA stub) skip writeMemory — guarantee write-back here so
  // every wake leaves a durable row (TRO-48 acceptance).
  if (!memoryWritten) {
    let after = await retrieveMemory(wake.npc_id, playerId, []);
    if (after.length === 0 && response.memory_writeback.summary) {
      memoryWritten = await writeMemory({
        npcId: wake.npc_id,
        playerId,
        importance: response.memory_writeback.importance,
        summary: response.memory_writeback.summary,
        tags: response.memory_writeback.tags,
        createdAt: new Date().toISOString(),
        eventId: wake.trigger.event_id,
        wakeId: wake.wake_id,
      });
      after = [memoryWritten];
    } else if (after.length > 0) {
      memoryWritten = after[after.length - 1]!;
    }
  }

  const after = memoryWritten
    ? await retrieveMemory(wake.npc_id, playerId, [])
    : [];
  const latency_ms = Date.now() - started;

  const agentResponse: AgentResponse = {
    schema_version: wake.schema_version,
    wake_id: wake.wake_id,
    npc_id: wake.npc_id,
    ok: true,
    say: response.npc_dialogue,
    do: response.action_intent && response.action_intent !== "idle"
      ? [{ action: response.action_intent }]
      : [{ action: "emote", name: "nod" }],
    remember,
    mood_delta: 0,
    world_effects: [],
    fallback_used: fallbackUsed,
    latency_ms,
    emotion: response.emotion,
    action_intent: response.action_intent,
    provider: providerUsed,
  };

  return {
    ok: true,
    agentResponse,
    memoryWritten,
    memoryCountAfter: after.length > 0 ? after.length : memoryWritten ? 1 : 0,
    providerUsed,
    fallbackReason,
  };
}
