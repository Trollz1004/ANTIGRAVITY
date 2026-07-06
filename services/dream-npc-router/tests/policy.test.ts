import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock undici's `request` globally — no live HTTP calls, cloud or local, in these tests.
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

// Track any real timers a scenario opens so they can be cleared in teardown —
// otherwise scenario 4's mock delays outlive the test and Vitest warns about
// "did not exit cleanly."
const pendingTimers = new Set<ReturnType<typeof setTimeout>>();
function trackedSetTimeout(fn: () => void, ms: number): ReturnType<typeof setTimeout> {
  const handle = setTimeout(() => {
    pendingTimers.delete(handle);
    fn();
  }, ms);
  pendingTimers.add(handle);
  return handle;
}

describe("policy routing", () => {
  beforeEach(() => {
    vi.resetModules();
    requestMock.mockReset();
    process.env.ONEMIN_API_KEY = "test-onemin-key";
    process.env.ONEMIN_MODEL_T1 = "test-model";
    process.env.AIHUBMIX_API_KEY = "test-aihubmix-key";
    process.env.AIHUBMIX_MODEL_OVERFLOW = "auto";
    process.env.ENABLE_CHILD_MODE_CLOUD = "false";
    process.env.ROUTER_TIMEOUT_MS = "8000";
  });

  afterEach(() => {
    for (const handle of pendingTimers) clearTimeout(handle);
    pendingTimers.clear();
  });

  it("scenario 1: T1 primary routes to the 1Min adapter", async () => {
    requestMock.mockResolvedValueOnce({
      statusCode: 200,
      body: jsonBody({
        result: {
          npc_dialogue: "Welcome, traveler.",
          emotion: "friendly",
          action_intent: "greet",
          memory_writeback: { importance: 0.4, summary: "greeted player", tags: ["greeting"] },
        },
      }),
    });

    const { routeNpcRequest } = await import("../src/policy.js");
    const result = await routeNpcRequest(
      {
        npcId: "blacksmith.crossed",
        playerId: "player-1",
        playerMode: "adult",
        npcTier: "T1",
        message: "hello",
        tags: [],
      },
      "req-1",
    );

    expect(result.providerUsed).toBe("onemin");
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(String(requestMock.mock.calls[0][0])).toContain("/api/features");
    expect(result.response.npc_dialogue).toBe("Welcome, traveler.");
  });

  it("scenario 2: 1Min failure overflows to AIHubMix", async () => {
    // 1Min call throws / returns 429.
    requestMock
      .mockResolvedValueOnce({
        statusCode: 429,
        body: jsonBody({ error: "rate limited" }),
      })
      // AIHubMix call succeeds.
      .mockResolvedValueOnce({
        statusCode: 200,
        body: {
          text: async () => "",
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    npc_dialogue: "Overflow response.",
                    emotion: "neutral",
                    action_intent: "idle",
                    memory_writeback: { importance: 0.2, summary: "overflow", tags: [] },
                  }),
                },
              },
            ],
            usage: { prompt_tokens: 10, completion_tokens: 5 },
          }),
        },
      });

    const { routeNpcRequest } = await import("../src/policy.js");
    const result = await routeNpcRequest(
      {
        npcId: "blacksmith.crossed",
        playerId: "player-2",
        playerMode: "adult",
        npcTier: "T1",
        message: "hello",
        tags: [],
      },
      "req-2",
    );

    expect(result.providerUsed).toBe("aihubmix");
    expect(requestMock).toHaveBeenCalledTimes(2);
    expect(String(requestMock.mock.calls[1][0])).toContain("/chat/completions");
    expect(result.response.npc_dialogue).toBe("Overflow response.");
    expect(result.fallbackReason).toContain("onemin_failed");
  });

  it("scenario 3: child mode (under13) uses ollama local ONLY — never a cloud adapter", async () => {
    requestMock.mockResolvedValueOnce({
      statusCode: 200,
      body: {
        text: async () => "",
        json: async () => ({
          message: {
            content: JSON.stringify({
              npc_dialogue: "Let's go on an adventure!",
              emotion: "cheerful",
              action_intent: "invite",
              memory_writeback: { importance: 0.1, summary: "child chat", tags: ["child"] },
            }),
          },
          prompt_eval_count: 12,
          eval_count: 8,
        }),
      },
    });

    const { routeNpcRequest } = await import("../src/policy.js");
    const result = await routeNpcRequest(
      {
        npcId: "blacksmith.crossed",
        playerId: "kid-1",
        playerMode: "under13",
        npcTier: "T1", // even if T1 requested, child mode must override to ollama-only
        message: "hi there",
        tags: [],
      },
      "req-3",
    );

    expect(result.providerUsed).toBe("ollama");
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(String(requestMock.mock.calls[0][0])).toContain("/api/chat");
    // Assert no cloud adapter endpoints were ever hit.
    for (const call of requestMock.mock.calls) {
      expect(String(call[0])).not.toContain("1min.ai");
      expect(String(call[0])).not.toContain("aihubmix.com");
    }
  });

  it("scenario 4: provider timeout falls back to a degraded local response", async () => {
    process.env.ROUTER_TIMEOUT_MS = "50";

    // 1Min: hang far longer than the timeout budget.
    requestMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          trackedSetTimeout(
            () =>
              resolve({
                statusCode: 200,
                body: jsonBody({ result: { npc_dialogue: "too late" } }),
              }),
            5000,
          );
        }),
    );
    // AIHubMix: also hang.
    requestMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          trackedSetTimeout(
            () =>
              resolve({
                statusCode: 200,
                body: jsonBody({ choices: [{ message: { content: "too late" } }] }),
              }),
            5000,
          );
        }),
    );
    // Ollama degrade path: also slow, but this test only asserts the final
    // response is the safe degraded stub reachable when every rail is unavailable in time.
    requestMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          trackedSetTimeout(
            () =>
              resolve({
                statusCode: 200,
                body: jsonBody({ message: { content: JSON.stringify({ npc_dialogue: "too late" } ) } }),
              }),
            5000,
          );
        }),
    );

    const { routeNpcRequest } = await import("../src/policy.js");
    const result = await routeNpcRequest(
      {
        npcId: "blacksmith.crossed",
        playerId: "player-4",
        playerMode: "adult",
        npcTier: "T1",
        message: "hello",
        tags: [],
      },
      "req-4",
    );

    // All three rails timed out inside the 50ms budget -> safe local-degraded stub.
    expect(result.providerUsed).toBe("local-degraded-stub");
    expect(result.response.npc_dialogue).toBe("...");
    expect(result.fallbackReason).toContain("all_providers_failed");
  }, 15000);
});
