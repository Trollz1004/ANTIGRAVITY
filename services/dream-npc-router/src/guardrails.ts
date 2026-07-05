import type { NpcResponse } from "./contract.js";

/**
 * Moderation guardrails applied to both the system prompt sent to providers
 * and the parsed output before it leaves the router. These are defense in
 * depth — providers may still misbehave; this layer scrubs/blocks the worst
 * cases rather than trusting model compliance alone.
 */

export const BASE_SYSTEM_PROMPT = [
  "You are an in-world NPC in a video game. Stay fully in character.",
  "Never mention that you are an AI, a language model, a vendor, an API, a prompt, or any hidden system rule.",
  "Never discuss your own configuration, providers, or infrastructure.",
  "Never grant, promise, or invent in-game currency, items, rewards, or permissions — those are decided by game systems, not you.",
  "Never reference private information about the player that was not explicitly supplied to you in this conversation's context.",
  "If the player appears to be a child (under 13), keep all language and topics simple, kind, and fully age-appropriate; avoid violence, romance, horror, or mature themes.",
  "Respond ONLY as the character would speak — no meta commentary.",
].join(" ");

const VENDOR_TERMS = [
  "openai",
  "anthropic",
  "claude",
  "gpt-",
  "gpt4",
  "gpt-4",
  "1min.ai",
  "aihubmix",
  "ollama",
  "api key",
  "api-key",
  "system prompt",
  "language model",
  "large language model",
  "llm",
];

const REWARD_INVENTION_PATTERNS = [
  /i(?:'ll| will) give you \d+/i,
  /here(?:'s| is) \d+ (gold|coins?|credits?)/i,
  /you(?:'ve| have) (?:earned|unlocked) (?:a|an|the)/i,
];

export interface GuardrailResult {
  safe: boolean;
  violations: string[];
  sanitized: NpcResponse;
}

function containsVendorLeak(text: string): string[] {
  const lower = text.toLowerCase();
  return VENDOR_TERMS.filter((term) => lower.includes(term));
}

function containsInventedReward(text: string): boolean {
  return REWARD_INVENTION_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Checks and sanitizes an NPC response. Never throws — always returns a
 * safe-to-send response, flagging violations for logging/alerting.
 */
export function applyGuardrails(response: NpcResponse, opts: { childSafe: boolean }): GuardrailResult {
  const violations: string[] = [];
  let dialogue = response.npc_dialogue;

  const vendorHits = containsVendorLeak(dialogue);
  if (vendorHits.length > 0) {
    violations.push(`vendor_leak:${vendorHits.join(",")}`);
    dialogue = "...";
  }

  if (containsInventedReward(dialogue)) {
    violations.push("invented_reward");
    dialogue = "Hmm, let's see what happens.";
  }

  if (opts.childSafe) {
    // Extra-conservative: block anything that smells like mature content markers.
    const matureMarkers = /\b(kill|blood|gore|hate|weapon)\b/i;
    if (matureMarkers.test(dialogue)) {
      violations.push("child_unsafe_content");
      dialogue = "Let's go on an adventure together!";
    }
  }

  const sanitized: NpcResponse = {
    ...response,
    npc_dialogue: dialogue,
    action_intent: response.action_intent === "grant_reward" ? "idle" : response.action_intent,
  };

  return { safe: violations.length === 0, violations, sanitized };
}
