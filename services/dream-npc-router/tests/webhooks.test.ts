import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SAMPLE_ALIAS_TO_SKILL_SAMPLE,
  SAMPLE_EVENT_ALIASES,
  SKILL_SAMPLES_DIR,
  parseGameWebhookEvent,
} from "../src/webhooks/events.js";
import { handleGameWebhookEvent } from "../src/webhooks/handler.js";

const SERVICE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = path.resolve(SERVICE_ROOT, "../..");

function loadSkillSample(fileName: string) {
  const raw = readFileSync(path.join(REPO_ROOT, SKILL_SAMPLES_DIR, fileName), "utf8");
  return JSON.parse(raw) as unknown;
}

describe("live-NPC webhook events (TRO-114 on TRO-87 envelope)", () => {
  it("indexes the three TRO-114 sample aliases", () => {
    expect(SAMPLE_EVENT_ALIASES).toEqual(["player_enter", "need_change", "interaction"]);
    for (const alias of SAMPLE_EVENT_ALIASES) {
      const file = SAMPLE_ALIAS_TO_SKILL_SAMPLE[alias];
      expect(() =>
        readFileSync(path.join(REPO_ROOT, SKILL_SAMPLES_DIR, file), "utf8"),
      ).not.toThrow();
    }
  });

  it("validates skill samples for the three sample families", () => {
    for (const alias of SAMPLE_EVENT_ALIASES) {
      const sample = loadSkillSample(SAMPLE_ALIAS_TO_SKILL_SAMPLE[alias]);
      const parsed = parseGameWebhookEvent(sample);
      expect(parsed.success).toBe(true);
    }
  });

  it("maps TRO-114 short aliases to canonical dotted types", () => {
    const base = loadSkillSample("player_enter_zone.json") as Record<string, unknown>;

    const enter = parseGameWebhookEvent({ ...base, event_type: "player_enter" });
    expect(enter.success).toBe(true);
    if (enter.success) expect(enter.data.event_type).toBe("player.enter_zone");

    const spendBase = loadSkillSample("need_spend.json") as Record<string, unknown>;
    const need = parseGameWebhookEvent({ ...spendBase, event_type: "need_change" });
    expect(need.success).toBe(true);
    if (need.success) expect(need.data.event_type).toBe("need.spend");

    const spoken = loadSkillSample("npc_spoken_to.json") as Record<string, unknown>;
    const interaction = parseGameWebhookEvent({ ...spoken, event_type: "interaction" });
    expect(interaction.success).toBe(true);
    if (interaction.success) expect(interaction.data.event_type).toBe("npc.spoken_to");
  });

  it("rejects unknown event types", () => {
    const base = loadSkillSample("player_enter_zone.json") as Record<string, unknown>;
    const bad = parseGameWebhookEvent({ ...base, event_type: "npc.teleport" });
    expect(bad.success).toBe(false);
  });

  it("handler stub returns ready agent_wake envelope without dispatching", async () => {
    const sample = loadSkillSample("npc_spoken_to.json");
    const parsed = parseGameWebhookEvent(sample);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const result = await handleGameWebhookEvent(parsed.data);
    expect(result.ok).toBe(true);
    expect(result.readyForAgentCall).toBe(true);
    expect(result.agentCall.dispatch).toBe("stub_only");
    expect(result.agentCall.method).toBe("POST");
    expect(result.agentCall.wakePath).toBe("/npc/npc.vendor.harbor_quartermaster/wake");
    expect(result.agentCall.body.trigger.event_type).toBe("npc.spoken_to");
    expect(result.agentCall.body.budget.fallback).toBe("canned_line");
    expect(result.agentCall.body.context_refs.length).toBeGreaterThan(0);
    expect(result.roundtrip).toBeUndefined();
  });

  it("player_enter and need_change stubs resolve npc targets", async () => {
    const enter = parseGameWebhookEvent(loadSkillSample("player_enter_zone.json"));
    expect(enter.success).toBe(true);
    if (enter.success) {
      const result = await handleGameWebhookEvent(enter.data);
      // No npc on enter — ambient zone target.
      expect(result.agentCall.body.npc_id).toContain("zone-ambient:");
    }

    const need = parseGameWebhookEvent(loadSkillSample("need_spend.json"));
    expect(need.success).toBe(true);
    if (need.success) {
      const result = await handleGameWebhookEvent(need.data);
      expect(result.agentCall.body.npc_id).toBe("npc.vendor.harbor_quartermaster");
    }
  });
});
