import { z } from "zod";

/**
 * TRO-114 webhook surface for dream-npc-router.
 *
 * Canonical contract lives in TRO-87 / dream-live-npc skill:
 *   docs/dream/schemas/live-npc-webhook.schema.json
 *   .agents/skills/dream-live-npc/schemas/
 *
 * This module accepts:
 *  1) Canonical dotted event types (player.enter_zone, need.spend, npc.spoken_to, …)
 *  2) Snake aliases (player_enter_zone, need_spend, …)
 *  3) Issue-named short aliases from TRO-114: player_enter, need_change, interaction
 *
 * All normalize to the TRO-87 envelope before the handler stub runs.
 */

const ContextRefSchema = z
  .object({
    kind: z.enum([
      "zone",
      "player",
      "npc",
      "sku",
      "quest",
      "persona",
      "relationship",
      "episode_query",
      "trigger_event",
      "world_ledger",
    ]),
    id: z.string().min(1),
  })
  .strict();

const SourceSchema = z
  .object({
    server_id: z.string().min(1),
    region_id: z.string().min(1),
    shard: z.string().min(1),
    engine: z.enum(["unreal", "godot", "unity", "sim"]),
    build: z.string().optional(),
  })
  .strict();

const ActorSchema = z
  .object({
    player_id: z.string().nullable().optional(),
    npc_id: z.string().nullable().optional(),
    session_id: z.string().nullable().optional(),
  })
  .strict();

/** Canonical dotted types from TRO-87 vocabulary. */
export const CANONICAL_EVENT_TYPES = [
  "player.enter_zone",
  "player.leave_zone",
  "need.spend",
  "need.earn",
  "npc.approached",
  "npc.spoken_to",
  "npc.witnessed",
  "npc.affected",
  "npc.idle_heartbeat",
  "world.tick",
  "quest.updated",
  "combat.ended",
] as const;

export type CanonicalEventType = (typeof CANONICAL_EVENT_TYPES)[number];

/** The three sample families named by TRO-114. */
export const SAMPLE_EVENT_ALIASES = ["player_enter", "need_change", "interaction"] as const;
export type SampleEventAlias = (typeof SAMPLE_EVENT_ALIASES)[number];

/** Map any accepted inbound name → canonical event_type. */
export const EVENT_ALIAS_TO_CANONICAL: Record<string, CanonicalEventType> = {
  // TRO-114 short aliases
  player_enter: "player.enter_zone",
  need_change: "need.spend",
  interaction: "npc.spoken_to",
  // Snake aliases (game edge)
  player_enter_zone: "player.enter_zone",
  player_leave_zone: "player.leave_zone",
  need_spend: "need.spend",
  need_earn: "need.earn",
  npc_approached: "npc.approached",
  npc_spoken_to: "npc.spoken_to",
  npc_witnessed: "npc.witnessed",
  npc_affected: "npc.affected",
  npc_idle_heartbeat: "npc.idle_heartbeat",
  world_tick: "world.tick",
  quest_updated: "quest.updated",
  combat_ended: "combat.ended",
  // Canonical passthrough
  "player.enter_zone": "player.enter_zone",
  "player.leave_zone": "player.leave_zone",
  "need.spend": "need.spend",
  "need.earn": "need.earn",
  "npc.approached": "npc.approached",
  "npc.spoken_to": "npc.spoken_to",
  "npc.witnessed": "npc.witnessed",
  "npc.affected": "npc.affected",
  "npc.idle_heartbeat": "npc.idle_heartbeat",
  "world.tick": "world.tick",
  "quest.updated": "quest.updated",
  "combat.ended": "combat.ended",
};

/** Sample family → skill sample file (relative to skill schemas/samples). */
export const SAMPLE_ALIAS_TO_SKILL_SAMPLE: Record<SampleEventAlias, string> = {
  player_enter: "player_enter_zone.json",
  need_change: "need_spend.json",
  interaction: "npc_spoken_to.json",
};

/** Sample family → primary canonical type shown in docs. */
export const SAMPLE_ALIAS_TO_CANONICAL: Record<SampleEventAlias, CanonicalEventType> = {
  player_enter: "player.enter_zone",
  need_change: "need.spend",
  interaction: "npc.spoken_to",
};

const EnvelopeBaseSchema = z.object({
  schema_version: z.string().regex(/^\d+\.\d+\.\d+$/),
  event_id: z.string().min(8),
  event_type: z.string().min(1),
  occurred_at: z.string().datetime(),
  trace_id: z.string().optional(),
  source: SourceSchema,
  actor: ActorSchema,
  context_refs: z.array(ContextRefSchema).default([]),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export type LiveNpcWebhookEnvelope = z.infer<typeof EnvelopeBaseSchema> & {
  event_type: CanonicalEventType;
};

/**
 * Parse + normalize an inbound webhook body to the TRO-87 envelope with a
 * canonical dotted event_type. Accepts short/snake aliases from TRO-114.
 */
export function parseGameWebhookEvent(raw: unknown):
  | { success: true; data: LiveNpcWebhookEnvelope }
  | { success: false; error: z.ZodError | { message: string; received?: string } } {
  const base = EnvelopeBaseSchema.safeParse(raw);
  if (!base.success) {
    return { success: false, error: base.error };
  }

  const incoming = base.data.event_type;
  const canonical = EVENT_ALIAS_TO_CANONICAL[incoming];
  if (!canonical) {
    return {
      success: false,
      error: {
        message: "unknown_event_type",
        received: incoming,
      },
    };
  }

  // need_change may arrive as spend or earn; if payload has direction earn, flip.
  let eventType: CanonicalEventType = canonical;
  if (incoming === "need_change" && base.data.payload && typeof base.data.payload === "object") {
    const direction = (base.data.payload as Record<string, unknown>).direction;
    if (direction === "earn") eventType = "need.earn";
  }

  return {
    success: true,
    data: {
      ...base.data,
      event_type: eventType,
    },
  };
}

/** Paths relative to monorepo / skill (served by GET handlers). */
export const CANONICAL_SCHEMA_REL =
  ".agents/skills/dream-live-npc/schemas/live-npc-webhook.schema.json";
export const DOCS_SCHEMA_REL = "docs/dream/schemas/live-npc-webhook.schema.json";
export const SKILL_SAMPLES_DIR = ".agents/skills/dream-live-npc/schemas/samples";
