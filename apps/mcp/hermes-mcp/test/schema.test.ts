import { describe, it, expect } from "vitest";
import { z } from "zod";

const RouteIn = z.object({ model: z.string().min(1), prompt: z.string().min(1), ctx: z.string().optional() });

describe("hermes-mcp · RouteIn schema", () => {
  it("accepts a valid payload", () => {
    expect(() => RouteIn.parse({ model: "claude-haiku-4-5", prompt: "hi" })).not.toThrow();
  });
  it("rejects empty model", () => {
    expect(() => RouteIn.parse({ model: "", prompt: "hi" })).toThrow();
  });
  it("rejects empty prompt", () => {
    expect(() => RouteIn.parse({ model: "x", prompt: "" })).toThrow();
  });
});
