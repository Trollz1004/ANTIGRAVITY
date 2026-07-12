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

/** Stable 1Min-shaped success payload for happy-path T1 tests. */
function mockOneMinSuccess(result: {
  npc_dialogue: string;
  emotion?: string;
  action_intent?: string;
  memory_writeback?: { importance: number; summary: string; tags: string[] };
}) {
  // Persistent mock (not Once): T1 may overflow rails if the first response is
  // mis-shaped; never return undefined or fall through to real HTTP.
  requestMock.mockImplementation(async () => ({
    statusCode: 200,
    body: jsonBody({
      result: {
        emotion: "neutral",
        action_intent: "idle",
        memory_writeback: { importance: 0.2, summary: "ok", tags: [] },
        ...result,
      },
    }),
  }));
}

describe("TRO-48 webhook → agent → memory write-back roundtrip", () => {
  beforeEach(async () => {
    vi.resetModules();
    requestMock.mockReset();
    // Fail-fast default: never leave undici unmocked (undefined statusCode hang).
    requestMock.mockImplementation(async () => {
      throw new Error("undici_request_mock_not_configured_for_this_test");
    });
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
    mockOneMinSuccess({
      npc_dialogue: "Harbor blue suits you.",
      emotion: "friendly",
      action_intent: "offer_goods",
      memory_writeback: {
        importance: 0.4,
        summary: "player asked about stock",
        tags: ["stock", "harbor"],
      },
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
    mockOneMinSuccess({
      npc_dialogue: "Coin counted.",
      emotion: "neutral",
      action_intent: "idle",
      memory_writeback: { importance: 0.3, summary: "need spend at harbor", tags: ["need"] },
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

  it("TRO-93: T1 live NPC persona (Mira Dockwarden) roundtrip + memory writeback", async () => {
    mockOneMinSuccess({
      npc_dialogue: "Keep the pier clear and we won't have a problem.",
      emotion: "wary",
      action_intent: "observe",
      memory_writeback: { importance: 0.4, summary: "newcomer greeted on the pier", tags: ["first_contact", "harbor"] },
    });

    const { processAgentWake } = await import("../src/webhooks/wake.js");
    const { retrieveMemory } = await import("../src/memory.js");
    const started = Date.now();
    const out = await processAgentWake({
      schema_version: "1.0.0",
      wake_id: "wk_mira_1",
      npc_id: "npc.mira.dockwarden",
      tier: "T1",
      trigger: {
        event_id: "evt_mira_1",
        event_type: "npc.spoken_to",
        occurred_at: "2026-07-11T14:03:00.000Z",
      },
      context_refs: [
        { kind: "npc", id: "npc.mira.dockwarden" },
        { kind: "player", id: "ply_mira_1" },
      ],
      budget: { max_latency_ms: 2000, fallback: "canned_line" },
      message: "Hello there.",
      player_id: "ply_mira_1",
    });
    const wall = Date.now() - started;

    expect(out.ok).toBe(true);
    expect(out.agentResponse.npc_id).toBe("npc.mira.dockwarden");
    expect(out.agentResponse.say).toBeTruthy();
    expect(out.agentResponse.remember.length).toBeGreaterThan(0);
    expect(out.memoryWritten).not.toBeNull();
    expect(out.agentResponse.latency_ms).toBeLessThan(2000);
    expect(wall).toBeLessThan(2000);

    const mem = await retrieveMemory("npc.mira.dockwarden", "ply_mira_1", []);
    expect(mem.length).toBeGreaterThanOrEqual(1);
    expect(mem[mem.length - 1]!.summary).toMatch(/newcomer|pier/i);
    expect(mem[mem.length - 1]!.storagePath).toMatch(
      /^npc\/npc\.mira\.dockwarden\/episodic\//,
    );
    expect(mem[mem.length - 1]!.eventId).toBe("evt_mira_1");
    expect(requestMock).toHaveBeenCalled();
  });

  it("budget miss still writes memory (fallback law)", async () => {
    // Provider hangs longer than wake budget; after first hang, fail-fast.
    let calls = 0;
    requestMock.mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          calls += 1;
          if (calls === 1) {
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
            return;
          }
          reject(new Error("undici_overflow_not_needed"));
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
    // Must still finish under the published budget even after post-process reserve.
    expect(out.agentResponse.latency_ms).toBeLessThan(500);
    const mem = await retrieveMemory("npc.vendor.harbor_quartermaster", "ply_timeout", []);
    expect(mem.length).toBeGreaterThanOrEqual(1);
  });

  it("wake budget race reserves time so total latency stays under max_latency_ms", async () => {
    // Provider hangs longer than race window; fallback + memory write must still
    // return under the full 2000ms budget (TRO-66 live acceptance).
    requestMock.mockImplementation(
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
          }, 5000);
        }),
    );

    const { processAgentWake } = await import("../src/webhooks/wake.js");
    const started = Date.now();
    const out = await processAgentWake({
      schema_version: "1.0.0",
      wake_id: "wk_budget_2s",
      npc_id: "npc.vendor.harbor_quartermaster",
      tier: "T1",
      trigger: {
        event_id: "evt_budget_2s",
        event_type: "npc.spoken_to",
        occurred_at: "2026-07-11T14:03:00.000Z",
      },
      context_refs: [{ kind: "player", id: "ply_budget_2s" }],
      budget: { max_latency_ms: 2000, fallback: "canned_line" },
      message: "hello?",
      player_id: "ply_budget_2s",
    });
    const wall = Date.now() - started;

    expect(out.agentResponse.fallback_used).toBe(true);
    expect(out.agentResponse.latency_ms).toBeLessThan(2000);
    expect(wall).toBeLessThan(2000);
    expect(out.memoryWritten).not.toBeNull();
    expect(out.memoryCountAfter).toBeGreaterThanOrEqual(1);
  });
});
