import { describe, it, expect } from "vitest";
import { z } from "zod";
const WaterfallIn = z.object({ gross: z.number().nonnegative() });
describe("dao-mcp · WaterfallIn", () => {
  it("accepts zero", () => { expect(() => WaterfallIn.parse({ gross: 0 })).not.toThrow(); });
  it("rejects negative", () => { expect(() => WaterfallIn.parse({ gross: -1 })).toThrow(); });
  it("rejects non-number", () => { expect(() => WaterfallIn.parse({ gross: "ten" as unknown as number })).toThrow(); });
});
