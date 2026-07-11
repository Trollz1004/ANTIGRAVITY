import type { CanonicalEventType, LiveNpcWebhookEnvelope } from "./events.js";

/**
 * Minimal agent-call stub for live-NPC webhooks (TRO-114).
 *
 * Aligns with dream-live-npc skill:
 *   POST /npc/{npc_id}/wake  body: agent_wake envelope
 *
 * Does not dispatch a provider or Paperclip run — returns a ready-to-wire call.
 */

export type AgentWakeStub = {
  wakePath: string;
  method: "POST";
  body: {
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
  };
  dispatch: "stub_only";
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

/**
 * Build a stub agent-wake envelope from a validated TRO-87 webhook event.
 * Stub only — no provider, Agent Hub, or Paperclip call.
 */
export function handleGameWebhookEvent(event: LiveNpcWebhookEnvelope): WebhookHandleResult {
  const npcId = resolveNpcId(event);
  const wakeId = `wake_${event.event_id}`;

  const agentCall: AgentWakeStub = {
    wakePath: `/npc/${encodeURIComponent(npcId)}/wake`,
    method: "POST",
    body: {
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
    },
    dispatch: "stub_only",
    note: "Stub only (TRO-114): validate envelope + build agent_wake. Wire dispatch to Agent Hub / provider in a follow-up.",
  };

  return {
    ok: true,
    accepted: true,
    eventType: event.event_type,
    eventId: event.event_id,
    npcId: event.actor.npc_id ?? (typeof event.payload.npc_id === "string" ? event.payload.npc_id : null),
    playerId: event.actor.player_id ?? null,
    agentCall,
    readyForAgentCall: true,
  };
}
