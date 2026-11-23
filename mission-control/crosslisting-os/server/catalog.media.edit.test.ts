import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import * as dbModule from "./db";
import {
  addProductMedia,
  createCatalogProduct,
  createListingPayloadPreview,
  listCatalogProducts,
  moveInventory,
  updateCatalogProduct,
  verifyCatalogProduct,
  verifyProductMedia,
} from "./db";
import { validateListingPreflight } from "./operations";
import { appRouter } from "./routers";

function createTestContext(userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: "catalog-editor-user",
      email: "catalog@example.com",
      name: "Catalog Operator",
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

describe("catalog product fact editing, media attachment, and media verification", () => {
  let tempDir = "";
  let tempDbPath = "";
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "crosslister-catalog-media-test-")
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

  it("edits product facts, attaches and verifies an image URL via catalog.update, catalog.addMedia, and catalog.verifyMedia, and passes imageCount >= 1 in validateListingPreflight", async () => {
    const caller = appRouter.createCaller(createTestContext(7));

    const created = await caller.catalog.create({
      sku: "SKU-MEDIA-001",
      upc: "012345678912",
      title: "Initial Draft Title",
      condition: "Good",
      brandOrStudio: "Initial Studio",
      format: "DVD",
    });

    expect(created.id).toBeGreaterThan(0);
    expect(created.description).toBeNull();

    const updated = await caller.catalog.update({
      productId: created.id,
      title: "Verified Collector Edition DVD",
      condition: "Very Good",
      conditionNotes: "Disc surface clean; original insert included.",
      brandOrStudio: "Criterion Collection",
      format: "DVD",
      description:
        "Confirmed two-disc collector edition with booklet and intact case.",
      attributes: {
        edition: "Collector's Edition",
        discCount: 2,
        region: "Region 1",
      },
    });

    expect(updated.title).toBe("Verified Collector Edition DVD");
    expect(updated.condition).toBe("Very Good");
    expect(updated.conditionNotes).toBe(
      "Disc surface clean; original insert included."
    );
    expect(updated.brandOrStudio).toBe("Criterion Collection");
    expect(updated.description).toBe(
      "Confirmed two-disc collector edition with booklet and intact case."
    );
    expect(updated.attributes).toEqual({
      edition: "Collector's Edition",
      discCount: 2,
      region: "Region 1",
    });

    const attachedMedia = await caller.catalog.addMedia({
      productId: created.id,
      url: "https://images.example.com/catalog/sku-media-001-front.jpg",
      altText: "Front cover of Collector Edition DVD",
      mediaType: "image",
      isPrimary: true,
    });

    expect(attachedMedia.id).toBeGreaterThan(0);
    expect(attachedMedia.productId).toBe(created.id);
    expect(attachedMedia.url).toBe(
      "https://images.example.com/catalog/sku-media-001-front.jpg"
    );
    expect(attachedMedia.verified).toBe(false);

    await caller.catalog.verify({ productId: created.id });
    await moveInventory({
      productId: created.id,
      movementType: "receive",
      quantity: 2,
      actorUserId: 7,
    });

    // Before media verification, listing preflight fails the verified image requirement
    const previewBeforeMediaVerify = await createListingPayloadPreview({
      productId: created.id,
      channelCode: "ebay",
      price: 29.99,
      actorUserId: 7,
    });
    expect(previewBeforeMediaVerify.payload.imageUrls).toEqual([]);
    expect(previewBeforeMediaVerify.preflight.errors).toContain(
      "At least one verified image is required."
    );

    const verifiedMedia = await caller.catalog.verifyMedia({
      mediaId: attachedMedia.id,
      productId: created.id,
    });
    expect(verifiedMedia.id).toBe(attachedMedia.id);
    expect(verifiedMedia.verified).toBe(true);

    const listedProducts = await caller.catalog.list();
    const listedProduct = listedProducts.find(item => item.id === created.id);
    expect(listedProduct).toBeTruthy();
    expect(listedProduct?.media).toHaveLength(1);
    expect(listedProduct?.media[0]?.verified).toBe(true);

    const verifiedImages =
      listedProduct?.media.filter(
        item => item.mediaType === "image" && item.verified
      ) ?? [];
    expect(verifiedImages.length).toBeGreaterThanOrEqual(1);

    const preflight = validateListingPreflight({
      verificationStatus: listedProduct!.verificationStatus,
      title: listedProduct!.title,
      description: listedProduct!.description,
      price: 29.99,
      availableQuantity: 2,
      imageCount: verifiedImages.length,
      approvalStatus: "approved",
      capability: "api",
      channelEnabled: true,
    });
    expect(preflight.ready).toBe(true);
    expect(preflight.errors).toEqual([]);

    const previewAfterMediaVerify = await createListingPayloadPreview({
      productId: created.id,
      channelCode: "ebay",
      price: 29.99,
      actorUserId: 7,
    });
    expect(previewAfterMediaVerify.payload.imageUrls).toEqual([
      "https://images.example.com/catalog/sku-media-001-front.jpg",
    ]);
    expect(previewAfterMediaVerify.preflight.errors).not.toContain(
      "At least one verified image is required."
    );
  });

  it("exposes updateCatalogProduct, addProductMedia, and verifyProductMedia db helpers directly", async () => {
    expect(typeof updateCatalogProduct).toBe("function");
    expect(typeof addProductMedia).toBe("function");
    expect(typeof verifyProductMedia).toBe("function");

    const created = await createCatalogProduct({
      sku: "SKU-DB-HELPER-002",
      title: "Original Helper Title",
      condition: "Acceptable",
      actorUserId: 3,
    });

    const edited = await updateCatalogProduct({
      productId: created.id,
      title: "Edited Helper Title",
      condition: "Like New",
      conditionNotes: "Mint sleeve and insert",
      description: "Direct DB helper update description",
      attributes: { pressing: "First Pressing" },
      actorUserId: 3,
    });
    expect(edited.title).toBe("Edited Helper Title");
    expect(edited.condition).toBe("Like New");
    expect(edited.conditionNotes).toBe("Mint sleeve and insert");

    const media = await addProductMedia({
      productId: created.id,
      url: "https://images.example.com/catalog/sku-db-helper-002.jpg",
      altText: "Helper media image",
      isPrimary: true,
      actorUserId: 3,
    });
    expect(media.verified).toBe(false);

    const verified = await verifyProductMedia(media.id, 3);
    expect(verified.verified).toBe(true);

    await verifyCatalogProduct(created.id, 3);
    const allProducts = await listCatalogProducts();
    const target = allProducts.find(p => p.id === created.id);
    expect(target?.media).toHaveLength(1);
    expect(target?.media[0]?.verified).toBe(true);
  });

  it("renders Catalog UI controls to edit product facts and attach and verify image URLs", () => {
    const catalogPagePath = path.resolve(
      import.meta.dirname,
      "../client/src/pages/Catalog.tsx"
    );
    const source = fs.readFileSync(catalogPagePath, "utf-8");

    expect(source).toContain("trpc.catalog.update.useMutation");
    expect(source).toContain("trpc.catalog.addMedia.useMutation");
    expect(source).toContain("trpc.catalog.verifyMedia.useMutation");
  });
});
