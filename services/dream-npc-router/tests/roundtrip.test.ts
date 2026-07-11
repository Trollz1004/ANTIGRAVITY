import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SKILL_SAMPLES_DIR, parseGameWebhookEvent } from "../src/webhooks/events.js";

const SERVICE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = path.resolve(SERVICE_ROOT, "../..");

// Mock undici so cloud/local provider HTTP never leaves the process.
const requestMock = vi.fn();
vi.mock("undici", () => ({
  request: (...args: unknown[]) => requestMock(...args),
}));

function jsonBody(payload: unknown) {
  return {
    text: async () => JSON.stringify(payload),
    json: async () => payload,
  };
}

function loadSkillSample(fileName: string) {
  const raw = readFileSync(path.join(REPO_ROOT, SKILL_SAMPLES_DIR, fileName), "utf8");
  return JSON.parse(raw) as unknown;
}

describe("TRO-48 webhook → agent → memory write-back roundtrip", () => {
  beforeEach(async () => {
    vi.resetModules();
    requestMock.mockReset();
    process.env.ONEMIN_API_KEY = "test-onemin-key";
    process.env.ONEMIN_MODEL_T1 = "test-model";
    process.env.AIHUBMIX_API_KEY = "test-aihubmix-key";
    process.env.ENABLE_CHILD_MODE_CLOUD = "false";
    process.env.ROUTER_TIMEOUT_MS = "1500";

    const { __resetMemoryStoreForTests } = await import("../src/memory.js");
    __resetMemoryStoreForTests();
  });

  afterEach(() => {
    requestMock.mockReset();
  });

  it("dispatch=true runs agent and persists memory for npc.spoken_to", async () => {
    requestMock.mockResolvedValueOnce({
      statusCode: 200,
      body: jsonBody({
        result: {
          npc_dialogue: "Harbor blue suits you.",
          emotion: "friendly",
          action_intent: "offer_goods",
          memory_writeback: {
            importance: 0.4,
            summary: "player asked about stock",
            tags: ["stock", "harbor"],
          },
        },
      }),
    });

    const { handleGameWebhookEvent } = await import("../src/webhooks/handler.js");
    const { retrieveMemory } = await import("../src/memory.js");

    const sample = loadSkillSample("npc_spoken_to.json");
    const parsed = parseGameWebhookEvent(sample);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const started = Date.now();
    const result = await handleGameWebhookEvent(parsed.data, { dispatch: true, reqId: "rt-1" });
    const elapsed = Date.now() - started;

    expect(result.ok).toBe(true);
    expect(result.agentCall.dispatch).toBe("executed");
    expect(result.roundtrip).toBeDefined();
    expect(result.roundtrip!.agentResponse.ok).toBe(true);
    expect(result.roundtrip!.agentResponse.say).toBe("Harbor blue suits you.");
    expect(result.roundtrip!.agentResponse.remember.length).toBeGreaterThan(0);
    expect(result.roundtrip!.memoryCountAfter).toBeGreaterThanOrEqual(1);
    expect(result.roundtrip!.agentResponse.latency_ms).toBeLessThan(2000);
    expect(elapsed).toBeLessThan(2000);

    const mem = await retrieveMemory("npc.vendor.harbor_quartermaster", "ply_1001", []);
    expect(mem.length).toBeGreaterThanOrEqual(1);
    expect(mem[mem.length - 1]!.summary).toMatch(/stock|player/i);
    // TRO-121: logical storage path + event lineage on write-back rows
    expect(mem[mem.length - 1]!.storagePath).toMatch(
      /^npc\/npc\.vendor\.harbor_quartermaster\/episodic\//,
    );
    expect(mem[mem.length - 1]!.eventId).toBeTruthy();
    expect(requestMock).toHaveBeenCalled();
  });

  it("writeMemory is idempotent by (npcId, eventId)", async () => {
    const { writeMemory, retrieveMemory } = await import("../src/memory.js");
    const base = {
      npcId: "npc.vendor.harbor_quartermaster",
      playerId: "ply_idem",
      importance: 0.5,
      summary: "first write",
      tags: ["idem"],
      createdAt: new Date().toISOString(),
      eventId: "evt_idem_1",
      wakeId: "wk_idem_1",
    };
    const a = await writeMemory(base);
    const b = await writeMemory({ ...base, summary: "second write should no-op" });
    expect(a.memoryId).toBe(b.memoryId);
    expect(b.summary).toBe("first write");
    const mem = await retrieveMemory("npc.vendor.harbor_quartermaster", "ply_idem", []);
    expect(mem.length).toBe(1);
  });

  it("processAgentWake maps skill agent_response shape", async () => {
    requestMock.mockResolvedValueOnce({
      statusCode: 200,
      body: jsonBody({
        result: {
          npc_dialogue: "Coin counted.",
          emotion: "neutral",
          action_intent: "idle",
          memory_writeback: { importance: 0.3, summary: "need spend at harbor", tags: ["need"] },
        },
      }),
    });

    const { processAgentWake } = await import("../src/webhooks/wake.js");
    const out = await processAgentWake({
      schema_version: "1.0.0",
      wake_id: "wk_test_1",
      npc_id: "npc.vendor.harbor_quartermaster",
      tier: "T1",
      trigger: {
        event_id: "evt_test_1",
        event_type: "need.spend",
        occurred_at: "2026-07-11T14:03:00.000Z",
      },
      context_refs: [
        { kind: "npc", id: "npc.vendor.harbor_quartermaster" },
        { kind: "player", id: "ply_1001" },
      ],
      budget: { max_latency_ms: 2000, fallback: "canned_line" },
      message: "Bought rope",
      player_id: "ply_1001",
    });

    expect(out.ok).toBe(true);
    expect(out.agentResponse.wake_id).toBe("wk_test_1");
    expect(out.agentResponse.npc_id).toBe("npc.vendor.harbor_quartermaster");
    expect(out.agentResponse.say).toBeTruthy();
    expect(out.agentResponse.remember[0]?.kind).toBe("episodic");
    expect(out.memoryWritten).not.toBeNull();
    expect(out.agentResponse.latency_ms).toBeLessThan(2000);
  });

  it("budget miss still writes memory (fallback law)", async () => {
    // Provider hangs longer than wake budget.
    requestMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              statusCode: 200,
              body: jsonBody({
                result: {
                  npc_dialogue: "too late",
                  emotion: "neutral",
                  action_intent: "idle",
                  memory_writeback: { importance: 0.1, summary: "late", tags: [] },
                },
              }),
            });
          }, 500);
        }),
    );

    const { processAgentWake } = await import("../src/webhooks/wake.js");
    const { retrieveMemory } = await import("../src/memory.js");

    const out = await processAgentWake({
      schema_version: "1.0.0",
      wake_id: "wk_timeout",
      npc_id: "npc.vendor.harbor_quartermaster",
      tier: "T1",
      trigger: {
        event_id: "evt_timeout",
        event_type: "npc.spoken_to",
        occurred_at: "2026-07-11T14:03:00.000Z",
      },
      context_refs: [{ kind: "player", id: "ply_timeout" }],
      budget: { max_latency_ms: 40, fallback: "canned_line" },
      message: "hello?",
      player_id: "ply_timeout",
    });

    expect(out.agentResponse.fallback_used).toBe(true);
    expect(out.agentResponse.say).toBeTruthy();
    expect(out.agentResponse.latency_ms).toBeLessThan(500);
    const mem = await retrieveMemory("npc.vendor.harbor_quartermaster", "ply_timeout", []);
    expect(mem.length).toBeGreaterThanOrEqual(1);
  });
});
