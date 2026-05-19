import { describe, it, expect } from "vitest";
import { z } from "zod";
const CreateIn = z.object({ agent: z.enum(["opus-ceo","gemini-ceo","hermes-001","codex","gemma4","pi","cupid","perplexity"]), brief: z.string().min(4).max(2000) });
describe("paperweight-mcp · CreateIn schema", () => {
  it("accepts a valid task", () => { expect(() => CreateIn.parse({ agent: "opus-ceo", brief: "audit the router" })).not.toThrow(); });
  it("rejects unknown agent",  () => { expect(() => CreateIn.parse({ agent: "rogue", brief: "x" })).toThrow(); });
  it("rejects brief too short", () => { expect(() => CreateIn.parse({ agent: "opus-ceo", brief: "x" })).toThrow(); });
});
