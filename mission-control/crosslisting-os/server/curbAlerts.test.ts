import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { MOCK_CURB_ITEMS } from "./routers/curbAlerts";
import type { TrpcContext } from "./_core/context";

function createTestContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "sample-user",
      email: "sample@example.com",
      name: "Sample User",
      loginMethod: "local",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "http",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("curbAlerts sample data labeling", () => {
  it("returns all seven built-in items labeled as sample data when no live source is active", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.curbAlerts.search({});

    expect(MOCK_CURB_ITEMS).toHaveLength(7);
    expect(result.liveSourceActive).toBe(false);
    expect(result.isSampleData).toBe(true);
    expect(result.sampleCount).toBe(7);
    expect(result.totalFound).toBe(7);
    expect(result.items).toHaveLength(7);

    for (const item of result.items) {
      expect(item.isSampleData).toBe(true);
      expect(item.sampleLabel).toBe("Sample data");
    }
  });

  it("Curb Alerts screen labels the seven built-in items plainly as sample data until a live source is active", () => {
    const curbPagePath = path.resolve(
      import.meta.dirname,
      "../client/src/pages/CurbAlerts.tsx"
    );
    const curbPage = fs.readFileSync(curbPagePath, "utf-8");

    expect(curbPage).toContain('data-testid="curb-alerts-sample-banner"');
    expect(curbPage).toContain('data-testid="curb-alert-sample-badge"');
    expect(curbPage).toMatch(/Sample data/i);
    expect(curbPage).toMatch(/no live source/i);
    expect(curbPage).toMatch(/7 built-in sample/i);
  });
});
