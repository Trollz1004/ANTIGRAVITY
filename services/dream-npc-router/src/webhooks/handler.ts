import type { CanonicalEventType, LiveNpcWebhookEnvelope } from "./events.js";
import { processAgentWake, type WakeRoundtripResult } from "./wake.js";

/**
 * Live-NPC webhooks (TRO-114 envelope + TRO-48 dispatch).
 *
 * Aligns with dream-live-npc skill:
 *   POST /npc/{npc_id}/wake  body: agent_wake envelope
 *
 * Default buildAgentWake is stub-only (TRO-114). handleGameWebhookEvent can
 * execute the full agent → memory write-back roundtrip when dispatch=true (TRO-48).
 */

export type AgentWakeBody = {
  schema_version: string;
  wake_id: string;
  npc_id: string;
  tier: "T0" | "T1" | "T2" | "T3";
  trigger: {
    event_id: string;
    event_type: CanonicalEventType;
    occurred_at: string;
  };
  context_refs: LiveNpcWebhookEnvelope["context_refs"];
  budget: {
    max_latency_ms: number;
    fallback: "canned_line";
  };
  payload_ref?: string;
  message?: string;
  player_id?: string;
};

export type AgentWakeStub = {
  wakePath: string;
  method: "POST";
  body: AgentWakeBody;
  dispatch: "stub_only" | "executed";
  note: string;
};

export type WebhookHandleResult = {
  ok: true;
  accepted: true;
  eventType: CanonicalEventType;
  eventId: string;
  npcId: string | null;
  playerId: string | null;
  agentCall: AgentWakeStub;
  readyForAgentCall: true;
  /** Present when dispatch=true (TRO-48 full roundtrip). */
  roundtrip?: WakeRoundtripResult;
  latency_ms?: number;
};

function resolveNpcId(event: LiveNpcWebhookEnvelope): string {
  if (event.actor.npc_id) return event.actor.npc_id;
  const payload = event.payload as Record<string, unknown>;
  if (typeof payload.npc_id === "string" && payload.npc_id) return payload.npc_id;
  if (typeof payload.merchant_npc_id === "string" && payload.merchant_npc_id) {
    return payload.merchant_npc_id;
  }
  // Zone-level ambient wake target when no NPC is attached yet.
  return `zone-ambient:${event.source.region_id}`;
}

function defaultTier(eventType: CanonicalEventType): "T0" | "T1" | "T2" | "T3" {
  if (eventType.startsWith("npc.") || eventType.startsWith("need.")) return "T1";
  if (eventType === "world.tick") return "T3";
  return "T0";
}

function utteranceFromPayload(event: LiveNpcWebhookEnvelope): string | undefined {
  const payload = event.payload as Record<string, unknown>;
  if (typeof payload.utterance === "string" && payload.utterance.trim()) return payload.utterance;
  if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
  if (event.event_type === "need.spend" || event.event_type === "need.earn") {
    const amount = payload.amount;
    const sku = payload.sku;
    return `Player ${event.event_type} amount=${String(amount ?? "?")} sku=${String(sku ?? "?")}`;
  }
  if (event.event_type === "player.enter_zone") {
    const zone = payload.zone_id ?? event.source.region_id;
    return `Player entered zone ${String(zone)}`;
  }
  return undefined;
}

/** Build agent_wake body from a validated TRO-87 webhook event (no provider call). */
export function buildAgentWake(event: LiveNpcWebhookEnvelope): AgentWakeBody {
  const npcId = resolveNpcId(event);
  const wakeId = `wake_${event.event_id}`;
  const playerId =
    event.actor.player_id ??
    (typeof event.payload.player_id === "string" ? event.payload.player_id : undefined);

  return {
    schema_version: event.schema_version,
    wake_id: wakeId,
    npc_id: npcId,
    tier: defaultTier(event.event_type),
    trigger: {
      event_id: event.event_id,
      event_type: event.event_type,
      occurred_at: event.occurred_at,
    },
    context_refs: event.context_refs,
    budget: {
      max_latency_ms: 2000,
      fallback: "canned_line",
    },
    payload_ref: `event:${event.event_id}`,
    message: utteranceFromPayload(event),
    player_id: playerId ?? undefined,
  };
}

/**
 * Handle a game webhook event.
 * - dispatch=false (default): TRO-114 stub — validate + agent_wake envelope only.
 * - dispatch=true (TRO-48): execute wake → agent → memory write-back roundtrip.
 */
export async function handleGameWebhookEvent(
  event: LiveNpcWebhookEnvelope,
  opts: { dispatch?: boolean; reqId?: string } = {},
): Promise<WebhookHandleResult> {
  const started = Date.now();
  const wakeBody = buildAgentWake(event);
  const npcIdResolved =
    event.actor.npc_id ?? (typeof event.payload.npc_id === "string" ? event.payload.npc_id : null);
  const playerId =
    event.actor.player_id ?? (typeof event.payload.player_id === "string" ? event.payload.player_id : null);

  if (!opts.dispatch) {
    const agentCall: AgentWakeStub = {
      wakePath: `/npc/${encodeURIComponent(wakeBody.npc_id)}/wake`,
      method: "POST",
      body: wakeBody,
      dispatch: "stub_only",
      note: "Stub only (TRO-114): validate envelope + build agent_wake. Pass ?dispatch=1 for TRO-48 full roundtrip.",
    };
    return {
      ok: true,
      accepted: true,
      eventType: event.event_type,
      eventId: event.event_id,
      npcId: npcIdResolved,
      playerId,
      agentCall,
      readyForAgentCall: true,
      latency_ms: Date.now() - started,
    };
  }

  const roundtrip = await processAgentWake(wakeBody, opts.reqId);
  const agentCall: AgentWakeStub = {
    wakePath: `/npc/${encodeURIComponent(wakeBody.npc_id)}/wake`,
    method: "POST",
    body: wakeBody,
    dispatch: "executed",
    note: "TRO-48: agent wake executed with memory write-back.",
  };

  return {
    ok: true,
    accepted: true,
    eventType: event.event_type,
    eventId: event.event_id,
    npcId: npcIdResolved,
    playerId,
    agentCall,
    readyForAgentCall: true,
    roundtrip,
    latency_ms: Date.now() - started,
  };
}
