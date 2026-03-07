import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import { AI_PROVIDER_SLUGS, PROVIDER_CONFIGS } from "../shared/ai-providers";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "josh@forthekids.org",
    name: "Josh",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });
});

describe("providers.list", () => {
  it("returns all 6 AI providers with availability status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const providers = await caller.providers.list();

    expect(providers).toHaveLength(6);
    expect(providers.map((p) => p.slug)).toEqual(
      expect.arrayContaining(["manus", "claude", "gemini", "perplexity", "grok", "codex"])
    );

    // Manus should always be available (built-in)
    const manus = providers.find((p) => p.slug === "manus");
    expect(manus?.isAvailable).toBe(true);
    expect(manus?.status).toBe("ready");

    // Codex should be present as the 6th board member
    const codex = providers.find((p) => p.slug === "codex");
    expect(codex).toBeDefined();
    expect(codex?.name).toBe("Codex (OpenAI)");

    // Each provider should have required fields
    providers.forEach((p) => {
      expect(p).toHaveProperty("name");
      expect(p).toHaveProperty("type");
      expect(p).toHaveProperty("defaultModel");
      expect(p).toHaveProperty("isAvailable");
      expect(p).toHaveProperty("status");
    });
  });
});

describe("AI_PROVIDER_SLUGS", () => {
  it("contains exactly 6 providers", () => {
    expect(AI_PROVIDER_SLUGS).toHaveLength(6);
  });

  it("has matching configs for all slugs", () => {
    AI_PROVIDER_SLUGS.forEach((slug) => {
      const config = PROVIDER_CONFIGS[slug];
      expect(config).toBeDefined();
      expect(config.slug).toBe(slug);
      expect(config.name).toBeTruthy();
      expect(config.defaultModel).toBeTruthy();
      expect(typeof config.costPerInputToken).toBe("number");
      expect(typeof config.costPerOutputToken).toBe("number");
    });
  });

  it("manus has zero cost (built-in)", () => {
    expect(PROVIDER_CONFIGS.manus.costPerInputToken).toBe(0);
    expect(PROVIDER_CONFIGS.manus.costPerOutputToken).toBe(0);
  });

  it("cloud providers have non-zero cost", () => {
    const cloudSlugs = ["claude", "gemini", "perplexity", "grok", "codex"] as const;
    cloudSlugs.forEach((slug) => {
      expect(PROVIDER_CONFIGS[slug].costPerInputToken).toBeGreaterThan(0);
      expect(PROVIDER_CONFIGS[slug].costPerOutputToken).toBeGreaterThan(0);
    });
  });
});

describe("auth.me", () => {
  it("returns the authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeDefined();
    expect(user?.name).toBe("Josh");
    expect(user?.email).toBe("josh@forthekids.org");
    expect(user?.role).toBe("admin");
  });

  it("returns null for unauthenticated context", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();
    expect(user).toBeNull();
  });
});

import { VOTERS, TIER_CONFIG } from "./governance";

describe("JoshuaCLAW Governance - VOTERS", () => {
  it("has exactly 7 voters (odd number = no ties)", () => {
    expect(VOTERS).toHaveLength(7);
  });

  it("has exactly 1 human voter (Joshua) and 6 AI voters", () => {
    const humans = VOTERS.filter((v) => v.type === "human");
    const ais = VOTERS.filter((v) => v.type === "ai");
    expect(humans).toHaveLength(1);
    expect(ais).toHaveLength(6);
    expect(humans[0].slug).toBe("joshua");
  });

  it("Joshua holds position #7 (the odd tiebreaker)", () => {
    const joshua = VOTERS.find((v) => v.slug === "joshua");
    expect(joshua).toBeDefined();
    expect(joshua?.position).toBe(7);
    expect(joshua?.role).toBe("Founder & Tiebreaker");
  });

  it("all 6 AI platforms are represented", () => {
    const aiSlugs = VOTERS.filter((v) => v.type === "ai").map((v) => v.slug);
    expect(aiSlugs).toEqual(
      expect.arrayContaining(["manus", "claude", "gemini", "perplexity", "grok", "codex"])
    );
  });

  it("AI voters hold even positions (1-6)", () => {
    const ais = VOTERS.filter((v) => v.type === "ai");
    const positions = ais.map((v) => v.position).sort();
    expect(positions).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("each voter has a unique slug and position", () => {
    const slugs = VOTERS.map((v) => v.slug);
    const positions = VOTERS.map((v) => v.position);
    expect(new Set(slugs).size).toBe(7);
    expect(new Set(positions).size).toBe(7);
  });
});

describe("JoshuaCLAW Governance - TIER_CONFIG", () => {
  it("critical tier requires 4/7 majority", () => {
    expect(TIER_CONFIG.critical.requiredVotes).toBe(4);
  });

  it("operational tier requires 3/7 votes", () => {
    expect(TIER_CONFIG.operational.requiredVotes).toBe(3);
  });

  it("critical tier covers revenue, contracts, and Iron Wall", () => {
    expect(TIER_CONFIG.critical.categories).toEqual(
      expect.arrayContaining(["revenue-split", "contract-deploy", "iron-wall"])
    );
  });

  it("operational tier covers bug fixes, UI, and marketing", () => {
    expect(TIER_CONFIG.operational.categories).toEqual(
      expect.arrayContaining(["bug-fix", "ui-update", "marketing"])
    );
  });

  it("majority of 4/7 is mathematically sound (>50%)", () => {
    const totalVoters = VOTERS.length;
    const majority = TIER_CONFIG.critical.requiredVotes;
    expect(majority).toBeGreaterThan(totalVoters / 2);
  });
});

describe("JoshuaCLAW Governance - governance.voters endpoint", () => {
  it("returns all 7 voters via tRPC", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const voters = await caller.governance.voters();

    expect(voters).toHaveLength(7);
    expect(voters.find((v) => v.slug === "joshua")?.type).toBe("human");
    expect(voters.find((v) => v.slug === "manus")?.type).toBe("ai");
  });
});

describe("JoshuaCLAW Governance - governance.tiers endpoint", () => {
  it("returns tier configuration via tRPC", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const tiers = await caller.governance.tiers();

    expect(tiers.critical).toBeDefined();
    expect(tiers.operational).toBeDefined();
    expect(tiers.critical.requiredVotes).toBe(4);
    expect(tiers.operational.requiredVotes).toBe(3);
  });
});
