import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  activityLogs,
  approvalRequests,
  automationProfiles,
  channelListings,
  channelSaleEvents,
  credentialConnections,
  exceptionQueue,
  externalComponents,
  inventoryMovements,
  inventoryRecords,
  marketplaceChannels,
  policyMappings,
  productMedia,
  products,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import * as dbModule from "./db";
import {
  createCatalogProduct,
  createListingPayloadPreview,
  getDb,
  getOperationsOverview,
  getUserByOpenId,
  ingestChannelSaleEvent,
  listInventoryRecords,
  moveInventory,
  persistEbayRefreshTokenReference,
  upsertUser,
  verifyCatalogProduct,
} from "./db";

describe("crosslisting-os better-sqlite3 and sqlite-core database layer", () => {
  let tempDir = "";
  let tempDbPath = "";
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "crosslister-sqlite-test-")
    );
    tempDbPath = path.join(tempDir, "data", "crosslisting.sqlite3");
    process.env.DATABASE_URL = tempDbPath;
  });

  afterEach(() => {
    const maybeClose = (dbModule as { closeDb?: () => void }).closeDb;
    if (typeof maybeClose === "function") {
      maybeClose();
    }
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("defaults ENV.databaseUrl and drizzle.config.ts to sqlite at data/crosslisting.sqlite3", async () => {
    delete process.env.DATABASE_URL;
    expect(ENV.databaseUrl.replace(/\\/g, "/")).toBe(
      "data/crosslisting.sqlite3"
    );
    expect(dbModule.resolveDatabasePath().replace(/\\/g, "/")).toMatch(
      /mission-control\/crosslisting-os\/data\/crosslisting\.sqlite3$/
    );

    const drizzleConfigMod = await import("../drizzle.config");
    const drizzleConfig = drizzleConfigMod.default as {
      dialect?: string;
      dbCredentials?: { url?: string };
    };
    expect(drizzleConfig.dialect).toBe("sqlite");
    expect(
      drizzleConfig.dbCredentials?.url?.replace(/\\/g, "/").replace(/^\.\//, "")
    ).toBe("data/crosslisting.sqlite3");
  });

  it("defines all 15 schema tables with drizzle-orm/sqlite-core", () => {
    const tables = [
      users,
      products,
      productMedia,
      inventoryRecords,
      inventoryMovements,
      marketplaceChannels,
      credentialConnections,
      policyMappings,
      channelListings,
      channelSaleEvents,
      approvalRequests,
      exceptionQueue,
      automationProfiles,
      externalComponents,
      activityLogs,
    ];

    for (const table of tables) {
      const config = getTableConfig(table as any);
      expect(config.name).toBeTruthy();
      expect(config.columns.length).toBeGreaterThan(0);
    }
  });

  it("reads result.changes in getAffectedRows for better-sqlite3 run results", () => {
    const getAffectedRows = (
      dbModule as { getAffectedRows?: (result: unknown) => number }
    ).getAffectedRows;
    expect(typeof getAffectedRows).toBe("function");
    expect(getAffectedRows!({ changes: 1, lastInsertRowid: 42 })).toBe(1);
    expect(getAffectedRows!({ changes: 0, lastInsertRowid: 0 })).toBe(0);
    expect(getAffectedRows!({ rowsAffected: 2 })).toBe(2);
    expect(getAffectedRows!([{ affectedRows: 3 }])).toBe(3);
  });

  it("upserts across all four onConflictDoUpdate helpers on better-sqlite3", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();
    expect(fs.existsSync(tempDbPath)).toBe(true);

    // 1. upsertUser (target: users.openId)
    await upsertUser({
      openId: "owner-openid-1",
      name: "Initial Name",
      email: "initial@example.com",
      loginMethod: "local",
    });
    const firstUser = await getUserByOpenId("owner-openid-1");
    expect(firstUser?.name).toBe("Initial Name");
    expect(firstUser?.email).toBe("initial@example.com");

    await upsertUser({
      openId: "owner-openid-1",
      name: "Updated Name",
      email: "updated@example.com",
      role: "admin",
    });
    const updatedUser = await getUserByOpenId("owner-openid-1");
    expect(updatedUser?.id).toBe(firstUser?.id);
    expect(updatedUser?.name).toBe("Updated Name");
    expect(updatedUser?.email).toBe("updated@example.com");
    expect(updatedUser?.role).toBe("admin");

    // 2. persistEbayRefreshTokenReference & ensureMarketplaceChannels
    // (targets: marketplaceChannels.code and [credentialConnections.channelId, credentialConnections.secretKeyName])
    await persistEbayRefreshTokenReference("credentials/ebay-token-v1.enc");
    await persistEbayRefreshTokenReference("credentials/ebay-token-v2.enc");

    const channels = await db!.select().from(marketplaceChannels);
    expect(channels).toHaveLength(5);
    const ebayChannel = channels.find(item => item.code === "ebay");
    expect(ebayChannel).toBeTruthy();

    const creds = await db!
      .select()
      .from(credentialConnections)
      .where(
        and(
          eq(credentialConnections.channelId, ebayChannel!.id),
          eq(credentialConnections.secretKeyName, "EBAY_REFRESH_TOKEN")
        )
      );
    expect(creds).toHaveLength(1);
    expect(creds[0]?.secretRef).toBe("credentials/ebay-token-v2.enc");
    expect(creds[0]?.configured).toBe(true);

    // 3. createListingPayloadPreview
    // (target: [channelListings.productId, channelListings.channelId])
    const product = await createCatalogProduct({
      sku: "SKU-SQLITE-001",
      upc: "012345678905",
      title: "Verified SQLite Item",
      condition: "Used - Very Good",
      brandOrStudio: "Anchor Media",
      format: "Blu-ray",
      description: "Clean disc and case verified in person.",
      actorUserId: updatedUser!.id,
    });

    const firstPreview = await createListingPayloadPreview({
      productId: product.id,
      channelCode: "ebay",
      price: 19.99,
      actorUserId: updatedUser!.id,
    });
    expect(firstPreview.state).toBe("error");

    const secondPreview = await createListingPayloadPreview({
      productId: product.id,
      channelCode: "ebay",
      price: 24.5,
      actorUserId: updatedUser!.id,
    });
    expect(secondPreview.listingId).toBe(firstPreview.listingId);
    expect((secondPreview.payload as { price?: number }).price).toBe(24.5);

    const listingsForProduct = await db!
      .select()
      .from(channelListings)
      .where(
        and(
          eq(channelListings.productId, product.id),
          eq(channelListings.channelId, ebayChannel!.id)
        )
      );
    expect(listingsForProduct).toHaveLength(1);
    expect(
      (listingsForProduct[0]?.payload as { workflowCorrelationId?: string })
        ?.workflowCorrelationId
    ).toBeTruthy();
  });

  it("applies inventory movements and sale reconciliation using result.changes on better-sqlite3", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();

    const product = await createCatalogProduct({
      sku: "SKU-SQLITE-INV-002",
      title: "Inventory Test Unit",
      condition: "Good",
      description: "Inventory movement and sale test unit",
      actorUserId: 1,
    });
    await verifyCatalogProduct(product.id, 1);

    await moveInventory({
      productId: product.id,
      movementType: "receive",
      quantity: 4,
      actorUserId: 1,
    });
    await moveInventory({
      productId: product.id,
      movementType: "reserve",
      quantity: 2,
      actorUserId: 1,
    });

    await expect(
      moveInventory({
        productId: product.id,
        movementType: "reserve",
        quantity: 3,
        actorUserId: 1,
      })
    ).rejects.toThrow(/insufficient/i);

    const preview = await createListingPayloadPreview({
      productId: product.id,
      channelCode: "ebay",
      price: 15,
      actorUserId: 1,
    });
    await db!
      .update(channelListings)
      .set({ externalListingId: "EBAY-EXT-100", state: "active" })
      .where(eq(channelListings.id, preview.listingId));

    const saleOutcome = await ingestChannelSaleEvent({
      channelCode: "ebay",
      externalEventId: "EVT-100",
      externalListingId: "EBAY-EXT-100",
      quantity: 1,
      occurredAt: new Date(),
      actorUserId: 1,
    });
    expect(saleOutcome).toEqual({ status: "applied", productId: product.id });

    const inventoryList = await listInventoryRecords();
    const record = inventoryList.find(item => item.productId === product.id);
    expect(record?.onHandQuantity).toBe(3);
    expect(record?.reservedQuantity).toBe(1);

    const overview = await getOperationsOverview();
    expect(overview.catalogCount).toBe(1);
    expect(overview.verifiedCatalogCount).toBe(1);
  });
});
