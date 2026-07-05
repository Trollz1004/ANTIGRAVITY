import { describe, expect, it } from "vitest";
import { applyGuardrails } from "../src/guardrails.js";
import { coerceToContract } from "../src/contract.js";

describe("contract coercion", () => {
  it("coerces loose provider output into the strict contract", () => {
    const coerced = coerceToContract({ npc_dialogue: "Hi!" }, "fallback");
    expect(coerced.emotion).toBe("neutral");
    expect(coerced.action_intent).toBe("idle");
    expect(coerced.memory_writeback.tags).toEqual([]);
  });

  it("never throws on garbage input", () => {
    expect(() => coerceToContract(null, "fallback")).not.toThrow();
    expect(() => coerceToContract("plain string", "fallback")).not.toThrow();
    expect(() => coerceToContract(42, "fallback")).not.toThrow();
  });
});

describe("guardrails", () => {
  it("scrubs vendor/API mentions from dialogue", () => {
    const result = applyGuardrails(
      {
        npc_dialogue: "As an OpenAI language model, I cannot help.",
        emotion: "neutral",
        action_intent: "idle",
        memory_writeback: { importance: 0, summary: "", tags: [] },
      },
      { childSafe: false },
    );
    expect(result.safe).toBe(false);
    expect(result.sanitized.npc_dialogue).toBe("...");
  });

  it("blocks invented rewards", () => {
    const result = applyGuardrails(
      {
        npc_dialogue: "I'll give you 500 gold right now!",
        emotion: "excited",
        action_intent: "grant_reward",
        memory_writeback: { importance: 0, summary: "", tags: [] },
      },
      { childSafe: false },
    );
    expect(result.violations).toContain("invented_reward");
    expect(result.sanitized.action_intent).toBe("idle");
  });

  it("applies extra scrutiny in child-safe mode", () => {
    const result = applyGuardrails(
      {
        npc_dialogue: "Let's kill that monster with a weapon!",
        emotion: "excited",
        action_intent: "fight",
        memory_writeback: { importance: 0, summary: "", tags: [] },
      },
      { childSafe: true },
    );
    expect(result.violations).toContain("child_unsafe_content");
  });
});
