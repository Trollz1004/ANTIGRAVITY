import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  approvalRequests,
  channelListings,
  exceptionQueue,
  marketplaceChannels,
  productMedia,
  products,
} from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import * as dbModule from "./db";
import {
  createCatalogProduct,
  createListingPayloadPreview,
  decideApprovalRequest,
  getDb,
  listOpenExceptions,
  moveInventory,
  requestListingApproval,
  verifyCatalogProduct,
} from "./db";
import { appRouter } from "./routers";

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
    req: {
      protocol: "http",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("channel enablement, exception resolution, approval preflight wiring, and apply draft to catalog", () => {
  let tempDir = "";
  let tempDbPath = "";
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "crosslister-b59-sqlite-test-")
    );
    tempDbPath = path.join(tempDir, "data", "crosslisting.sqlite3");
    process.env.DATABASE_URL = tempDbPath;
  });

  afterEach(() => {
    dbModule.closeDb();
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("enables and disables a marketplace channel via setMarketplaceChannelEnabled and reflects status in operations.channels", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const setMarketplaceChannelEnabled = (
      dbModule as unknown as {
        setMarketplaceChannelEnabled?: (input: {
          channelCode: "ebay";
          enabled: boolean;
          actorUserId: number;
        }) => Promise<{ enabled: boolean; operationMode: string }>;
      }
    ).setMarketplaceChannelEnabled;

    expect(typeof setMarketplaceChannelEnabled).toBe("function");

    const updated = await (
      caller.operations as unknown as {
        setMarketplaceChannelEnabled: (input: {
          channelCode: "ebay";
          enabled: boolean;
        }) => Promise<{ enabled: boolean; operationMode: string }>;
      }
    ).setMarketplaceChannelEnabled({
      channelCode: "ebay",
      enabled: true,
    });

    expect(updated.enabled).toBe(true);
    expect(updated.operationMode).toBe("enabled");

    const channels = await caller.operations.channels();
    const ebay = channels.find(item => item.code === "ebay");
    expect(ebay?.enabled).toBe(true);
    expect(ebay?.operationMode).toBe("enabled");

    const db = await getDb();
    const [dbChannel] = await db!
      .select()
      .from(marketplaceChannels)
      .where(eq(marketplaceChannels.code, "ebay"))
      .limit(1);
    expect(dbChannel?.enabled).toBe(true);
    expect(dbChannel?.operationMode).toBe("enabled");
  });

  it("resolves an open exception via resolveException and removes it from listOpenExceptions", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const product = await createCatalogProduct({
      sku: "SKU-B59-EXC-01",
      title: "Unverified Exception Test Product",
      condition: "Good",
      description: "Triggers preflight validation exception.",
      actorUserId: 1,
    });

    await createListingPayloadPreview({
      productId: product.id,
      channelCode: "ebay",
      price: 15,
      actorUserId: 1,
    });

    const openBefore = await listOpenExceptions();
    expect(openBefore.length).toBeGreaterThan(0);
    const targetException = openBefore[0]!;

    const resolved = await (
      caller.exceptions as unknown as {
        resolveException: (input: {
          exceptionId: number;
          status?: "resolved" | "dismissed";
          note?: string;
        }) => Promise<{
          id: number;
          status: string;
          resolvedByUserId: number | null;
        }>;
      }
    ).resolveException({
      exceptionId: targetException.id,
      status: "resolved",
      note: "Verified facts and enabled channel.",
    });

    expect(resolved.id).toBe(targetException.id);
    expect(resolved.status).toBe("resolved");
    expect(resolved.resolvedByUserId).toBe(1);

    const openAfter = await listOpenExceptions();
    expect(
      openAfter.find(item => item.id === targetException.id)
    ).toBeUndefined();

    const db = await getDb();
    const [stored] = await db!
      .select()
      .from(exceptionQueue)
      .where(eq(exceptionQueue.id, targetException.id))
      .limit(1);
    expect(stored?.status).toBe("resolved");
    expect(stored?.resolvedAt).toBeTruthy();
  });

  it("advances channel_listings.state to approved in decideApprovalRequest and propagates approval_requests status into createListingPayloadPreview with preflight.ready === true", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();

    const product = await createCatalogProduct({
      sku: "SKU-B59-READY-01",
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
      quantity: 2,
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

    const setMarketplaceChannelEnabled = (
      dbModule as unknown as {
        setMarketplaceChannelEnabled: (input: {
          channelCode: "ebay";
          enabled: boolean;
          actorUserId: number;
        }) => Promise<unknown>;
      }
    ).setMarketplaceChannelEnabled;
    await setMarketplaceChannelEnabled({
      channelCode: "ebay",
      enabled: true,
      actorUserId: 1,
    });

    const initialPreview = await createListingPayloadPreview({
      productId: product.id,
      channelCode: "ebay",
      price: 29.99,
      actorUserId: 1,
    });
    expect(initialPreview.preflight.ready).toBe(false);
    expect(initialPreview.preflight.errors).toEqual([
      "An approved request is required before submission.",
    ]);

    await requestListingApproval(initialPreview.listingId, 1);
    const [pendingApproval] = await db!
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.subjectId, initialPreview.listingId))
      .limit(1);
    expect(pendingApproval?.status).toBe("pending");

    await decideApprovalRequest({
      approvalId: pendingApproval!.id,
      decision: "approved",
      note: "Approved for eBay submission",
      actorUserId: 1,
    });

    const [listingAfterApproval] = await db!
      .select()
      .from(channelListings)
      .where(eq(channelListings.id, initialPreview.listingId))
      .limit(1);
    expect(listingAfterApproval?.state).toBe("approved");

    const approvedPreview = await createListingPayloadPreview({
      productId: product.id,
      channelCode: "ebay",
      price: 29.99,
      actorUserId: 1,
    });
    expect(approvedPreview.preflight.ready).toBe(true);
    expect(approvedPreview.preflight.errors).toEqual([]);
  });

  it("applies reviewed draft copy to the catalog record and wires ListingDesk preflight cards and apply button", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const product = await createCatalogProduct({
      sku: "SKU-B59-DRAFT-01",
      title: "Initial Placeholder Title",
      condition: "Very Good",
      description: "Initial short notes.",
      actorUserId: 1,
    });

    const updated = await (
      caller.operations as unknown as {
        applyDraftToCatalog: (input: {
          productId: number;
          title: string;
          description: string;
          categoryHint?: string;
          attributes?: Array<{ name: string; value: string }>;
        }) => Promise<{
          id: number;
          title: string;
          description: string | null;
          attributes: Record<string, unknown> | null;
        }>;
      }
    ).applyDraftToCatalog({
      productId: product.id,
      title: "Reviewed Catalog Title From Facts",
      description:
        "Reviewed factual description including disc condition and insert.",
      categoryHint: "DVDs & Blu-ray Discs",
      attributes: [
        { name: "Format", value: "Blu-ray" },
        { name: "Edition", value: "Collector's Edition" },
      ],
    });

    expect(updated.id).toBe(product.id);
    expect(updated.title).toBe("Reviewed Catalog Title From Facts");
    expect(updated.description).toBe(
      "Reviewed factual description including disc condition and insert."
    );
    expect(updated.attributes).toMatchObject({
      categoryHint: "DVDs & Blu-ray Discs",
      Format: "Blu-ray",
      Edition: "Collector's Edition",
    });

    const db = await getDb();
    const [stored] = await db!
      .select()
      .from(products)
      .where(eq(products.id, product.id))
      .limit(1);
    expect(stored?.title).toBe("Reviewed Catalog Title From Facts");
    expect(stored?.description).toBe(
      "Reviewed factual description including disc condition and insert."
    );

    const listingDeskSource = fs.readFileSync(
      path.resolve(import.meta.dirname, "../client/src/pages/ListingDesk.tsx"),
      "utf-8"
    );
    expect(listingDeskSource).toContain("preview.data?.preflight");
    expect(listingDeskSource).toContain("applyDraftToCatalog");
    expect(listingDeskSource).toContain("Apply draft to catalog");
  });
});
