import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  approvalRequests,
  channelListings,
  inventoryMovements,
  inventoryRecords,
  productMedia,
} from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import * as dbModule from "./db";
import {
  createCatalogProduct,
  createListingPayloadPreview,
  decideApprovalRequest,
  getDb,
  moveInventory,
  requestListingApproval,
  setMarketplaceChannelEnabled,
  verifyCatalogProduct,
} from "./db";
import { EbayTokenError } from "./ebayOAuth";
import {
  publishListing,
  type EbayPublishClient,
  type PublishListingDeps,
} from "./listingPublish";
import { appRouter } from "./routers";

const STUB_TOKEN = "stub-access-token-0001";

function createTestContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "operator-user",
      email: "operator@example.com",
      name: "LLC Operator",
      loginMethod: "local",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "http", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

type Calls = { name: string; args: unknown[] }[];

function makeStubClient(overrides: Partial<EbayPublishClient> = {}) {
  const calls: Calls = [];
  const client: EbayPublishClient = {
    upsertEbayInventoryItem: async (...args) => {
      calls.push({ name: "upsert", args });
      return { ok: true };
    },
    createEbayOffer: async (...args) => {
      calls.push({ name: "createOffer", args });
      return { ok: true, offerId: "OFFER-1001" };
    },
    publishEbayOffer: async (...args) => {
      calls.push({ name: "publish", args });
      return { ok: true, listingId: "LISTING-2002" };
    },
    ...overrides,
  };
  const deps: PublishListingDeps = {
    client,
    getAccessToken: async () => ({
      accessToken: STUB_TOKEN,
      expiresIn: 7200,
      expiresAt: 0,
    }),
  };
  return { calls, client, deps };
}

let skuCounter = 0;

async function createApprovedListing(quantity = 2) {
  const db = await getDb();
  const product = await createCatalogProduct({
    sku: `SKU-E3-${++skuCounter}`,
    upc: "012345678905",
    title: "Verified Ready Listing Item",
    condition: "Used - Very Good",
    brandOrStudio: "Anchor Studio",
    format: "Blu-ray",
    description: "Complete disc and case verified in hand.",
    actorUserId: 1,
  });
  await verifyCatalogProduct(product.id, 1);
  await moveInventory({
    productId: product.id,
    movementType: "receive",
    quantity,
    actorUserId: 1,
  });
  await db!.insert(productMedia).values({
    productId: product.id,
    url: "/manus-storage/verified-photo.png",
    altText: "Front cover",
    mediaType: "image",
    isPrimary: true,
    verified: true,
  });
  await setMarketplaceChannelEnabled({
    channelCode: "ebay",
    enabled: true,
    actorUserId: 1,
  });
  const preview = await createListingPayloadPreview({
    productId: product.id,
    channelCode: "ebay",
    price: 29.99,
    actorUserId: 1,
  });
  await requestListingApproval(preview.listingId, 1);
  const [pending] = await db!
    .select()
    .from(approvalRequests)
    .where(eq(approvalRequests.subjectId, preview.listingId))
    .limit(1);
  await decideApprovalRequest({
    approvalId: pending!.id,
    decision: "approved",
    actorUserId: 1,
  });
  return { productId: product.id, listingId: preview.listingId };
}

async function readListing(listingId: number) {
  const db = await getDb();
  const [row] = await db!
    .select()
    .from(channelListings)
    .where(eq(channelListings.id, listingId))
    .limit(1);
  return row!;
}

async function readInventory(productId: number) {
  const db = await getDb();
  const [row] = await db!
    .select()
    .from(inventoryRecords)
    .where(eq(inventoryRecords.productId, productId))
    .limit(1);
  return row!;
}

async function readMovements(productId: number, movementType: string) {
  const db = await getDb();
  return db!
    .select()
    .from(inventoryMovements)
    .where(
      and(
        eq(inventoryMovements.productId, productId),
        eq(inventoryMovements.movementType, movementType as "reserve")
      )
    );
}

describe("listings.publish (stubbed eBay client)", () => {
  let tempDir = "";
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "crosslister-e3-test-"));
    process.env.DATABASE_URL = path.join(tempDir, "data", "crosslisting.sqlite3");
  });

  afterEach(() => {
    dbModule.closeDb();
    vi.restoreAllMocks();
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("reserves, runs upsert, offer, publish in order, records both ids and sets the listing active", async () => {
    const { productId, listingId } = await createApprovedListing(2);
    const { calls, deps } = makeStubClient();

    const result = await publishListing({ listingId, actorUserId: 1 }, deps);

    expect(result).toMatchObject({
      published: true,
      state: "active",
      listingId,
      externalOfferId: "OFFER-1001",
      externalListingId: "LISTING-2002",
    });
    expect(calls.map(call => call.name)).toEqual([
      "upsert",
      "createOffer",
      "publish",
    ]);
    const stored = await readListing(listingId);
    const payload = stored.payload as {
      ebayInventoryItem: unknown;
      ebayOffer: unknown;
    };
    expect(calls[0]!.args).toEqual([
      expect.stringMatching(/^SKU-E3-/),
      payload.ebayInventoryItem,
      STUB_TOKEN,
    ]);
    expect(calls[1]!.args).toEqual([payload.ebayOffer, STUB_TOKEN]);
    expect(calls[2]!.args).toEqual(["OFFER-1001", STUB_TOKEN]);

    expect(stored.state).toBe("active");
    expect(stored.externalOfferId).toBe("OFFER-1001");
    expect(stored.externalListingId).toBe("LISTING-2002");
    expect(stored.lastSubmittedAt).toBeTruthy();

    const inventory = await readInventory(productId);
    expect(inventory.reservedQuantity).toBe(2);
    expect(await readMovements(productId, "reserve")).toHaveLength(1);
    expect(await readMovements(productId, "release")).toHaveLength(0);
  });

  it("refuses a listing that is not approved and touches nothing", async () => {
    const db = await getDb();
    const { productId, listingId } = await createApprovedListing(1);
    await db!
      .update(channelListings)
      .set({ state: "review" })
      .where(eq(channelListings.id, listingId));
    const { calls, deps } = makeStubClient();

    await expect(
      publishListing({ listingId, actorUserId: 1 }, deps)
    ).rejects.toThrow(/approved/i);

    expect(calls).toHaveLength(0);
    expect((await readInventory(productId)).reservedQuantity).toBe(0);
    expect((await readListing(listingId)).state).toBe("review");
  });

  it("refuses a listing that already has an eBay listing id", async () => {
    const db = await getDb();
    const { productId, listingId } = await createApprovedListing(1);
    await db!
      .update(channelListings)
      .set({ externalListingId: "LISTING-OLD" })
      .where(eq(channelListings.id, listingId));
    const { calls, deps } = makeStubClient();

    await expect(
      publishListing({ listingId, actorUserId: 1 }, deps)
    ).rejects.toThrow(/already/i);

    expect(calls).toHaveLength(0);
    expect((await readInventory(productId)).reservedQuantity).toBe(0);
  });

  it("releases the reservation and keeps the listing approved with the error shown when the item upsert fails", async () => {
    const { productId, listingId } = await createApprovedListing(2);
    const { calls, deps } = makeStubClient({
      upsertEbayInventoryItem: async (...args) => {
        calls.push({ name: "upsert", args });
        return {
          ok: false,
          status: 400,
          message: "eBay rejected the item: a category is required.",
        };
      },
    });

    const result = await publishListing({ listingId, actorUserId: 1 }, deps);

    expect(result).toMatchObject({
      published: false,
      state: "approved",
      error: "eBay rejected the item: a category is required.",
    });
    expect(calls.map(call => call.name)).toEqual(["upsert"]);
    const stored = await readListing(listingId);
    expect(stored.state).toBe("approved");
    expect(stored.externalOfferId).toBeNull();
    expect(stored.externalListingId).toBeNull();
    expect(stored.validationErrors).toEqual([
      "eBay rejected the item: a category is required.",
    ]);
    expect((await readInventory(productId)).reservedQuantity).toBe(0);
    expect(await readMovements(productId, "reserve")).toHaveLength(1);
    expect(await readMovements(productId, "release")).toHaveLength(1);
  });

  it("releases the reservation when the offer is not created", async () => {
    const { productId, listingId } = await createApprovedListing(1);
    const { calls, deps } = makeStubClient({
      createEbayOffer: async (...args) => {
        calls.push({ name: "createOffer", args });
        return {
          ok: false,
          status: 429,
          message: "eBay asked us to slow down. Try again later.",
        };
      },
    });

    const result = await publishListing({ listingId, actorUserId: 1 }, deps);

    expect(result).toMatchObject({ published: false, state: "approved" });
    expect(calls.map(call => call.name)).toEqual(["upsert", "createOffer"]);
    expect((await readListing(listingId)).state).toBe("approved");
    expect((await readInventory(productId)).reservedQuantity).toBe(0);
  });

  it("keeps the offer id when publish fails, then reuses that offer on retry", async () => {
    const { productId, listingId } = await createApprovedListing(1);
    let failPublish = true;
    const { calls, deps } = makeStubClient({
      publishEbayOffer: async (...args) => {
        calls.push({ name: "publish", args });
        return failPublish
          ? { ok: false, status: 500, message: "eBay had a server error." }
          : { ok: true, listingId: "LISTING-2002" };
      },
    });

    const first = await publishListing({ listingId, actorUserId: 1 }, deps);
    expect(first).toMatchObject({
      published: false,
      state: "approved",
      externalOfferId: "OFFER-1001",
    });
    const afterFailure = await readListing(listingId);
    expect(afterFailure.state).toBe("approved");
    expect(afterFailure.externalOfferId).toBe("OFFER-1001");
    expect(afterFailure.externalListingId).toBeNull();
    expect((await readInventory(productId)).reservedQuantity).toBe(0);

    failPublish = false;
    calls.length = 0;
    const second = await publishListing({ listingId, actorUserId: 1 }, deps);
    expect(second).toMatchObject({
      published: true,
      externalOfferId: "OFFER-1001",
      externalListingId: "LISTING-2002",
    });
    expect(calls.map(call => call.name)).toEqual(["upsert", "publish"]);
    expect((await readListing(listingId)).state).toBe("active");
    expect((await readInventory(productId)).reservedQuantity).toBe(1);
  });

  it("stops before touching inventory when the token cannot be minted", async () => {
    const { productId, listingId } = await createApprovedListing(1);
    const { calls, deps } = makeStubClient();
    deps.getAccessToken = async () => {
      throw new EbayTokenError(
        "refresh_token_expired",
        "eBay no longer accepts the stored refresh token."
      );
    };

    const result = await publishListing({ listingId, actorUserId: 1 }, deps);

    expect(result).toMatchObject({
      published: false,
      state: "approved",
      error: "eBay no longer accepts the stored refresh token.",
    });
    expect(calls).toHaveLength(0);
    expect((await readInventory(productId)).reservedQuantity).toBe(0);
    expect((await readListing(listingId)).state).toBe("approved");
  });

  it("leaves the listing approved when there is not enough free stock to reserve", async () => {
    const { productId, listingId } = await createApprovedListing(1);
    await moveInventory({
      productId,
      movementType: "reserve",
      quantity: 1,
      actorUserId: 1,
    });
    const { calls, deps } = makeStubClient();

    const result = await publishListing({ listingId, actorUserId: 1 }, deps);

    expect(result).toMatchObject({ published: false, state: "approved" });
    expect((result as { error: string }).error).toMatch(/inventory/i);
    expect(calls).toHaveLength(0);
    expect((await readListing(listingId)).state).toBe("approved");
    expect((await readInventory(productId)).reservedQuantity).toBe(1);
  });

  it("lets only one of two simultaneous publishes through", async () => {
    const { listingId } = await createApprovedListing(1);
    const { calls, deps } = makeStubClient();

    const results = await Promise.allSettled([
      publishListing({ listingId, actorUserId: 1 }, deps),
      publishListing({ listingId, actorUserId: 1 }, deps),
    ]);

    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(r => r.status === "rejected")).toHaveLength(1);
    expect(calls.filter(call => call.name === "publish")).toHaveLength(1);
    expect((await readListing(listingId)).state).toBe("active");
  });

  it("never puts the access token in the stored error or the returned error", async () => {
    const { listingId } = await createApprovedListing(1);
    const { deps } = makeStubClient({
      upsertEbayInventoryItem: async () => ({
        ok: false,
        status: 401,
        message: "eBay did not accept the request.",
      }),
    });

    const result = await publishListing({ listingId, actorUserId: 1 }, deps);

    expect(JSON.stringify(result)).not.toContain(STUB_TOKEN);
    expect(
      JSON.stringify((await readListing(listingId)).validationErrors)
    ).not.toContain(STUB_TOKEN);
  });

  it("fails safe with no live call when no eBay client is wired in (router default)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { productId, listingId } = await createApprovedListing(1);
    const caller = appRouter.createCaller(createTestContext());

    const result = await caller.listings.publish({ listingId });

    expect(result).toMatchObject({ published: false, state: "approved" });
    expect((result as { error: string }).error).toMatch(/not connected/i);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect((await readListing(listingId)).state).toBe("approved");
    expect((await readInventory(productId)).reservedQuantity).toBe(0);
  });

  it("keeps an active listing active when its preview is run again", async () => {
    const { productId, listingId } = await createApprovedListing(2);
    const { deps } = makeStubClient();
    await publishListing({ listingId, actorUserId: 1 }, deps);

    await createListingPayloadPreview({
      productId,
      channelCode: "ebay",
      price: 29.99,
      actorUserId: 1,
    });

    const stored = await readListing(listingId);
    expect(stored.state).toBe("active");
    expect(stored.externalListingId).toBe("LISTING-2002");
  });

  it("puts a Publish to eBay button on the Listing Desk wired to listings.publish", () => {
    const source = fs.readFileSync(
      path.resolve(import.meta.dirname, "../client/src/pages/ListingDesk.tsx"),
      "utf-8"
    );
    expect(source).toContain("Publish to eBay");
    expect(source).toContain("trpc.listings.publish.useMutation");
    expect(source).toContain('data-testid="publish-to-ebay"');
  });
});
