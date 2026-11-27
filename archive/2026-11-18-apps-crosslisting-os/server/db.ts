import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  activityLogs,
  automationProfiles,
  approvalRequests,
  channelListings,
  channelSaleEvents,
  credentialConnections,
  exceptionQueue,
  InsertUser,
  inventoryRecords,
  inventoryMovements,
  marketplaceChannels,
  productMedia,
  products,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { buildChannelPayload, channelBlueprint, ChannelCode, decideChannelSaleReconciliation, synchronizePayloadQuantity, validateListingPreflight } from "./operations";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getOperationsOverview() {
  const db = await getDb();
  if (!db) {
    return {
      catalogCount: 0,
      verifiedCatalogCount: 0,
      openApprovals: 0,
      openExceptions: 0,
      recentActivity: [],
    };
  }

  const [[catalog], [verified], [approvals], [exceptions], recentActivity] = await Promise.all([
    db.select({ total: count() }).from(products),
    db.select({ total: count() }).from(products).where(eq(products.verificationStatus, "verified")),
    db.select({ total: count() }).from(approvalRequests).where(eq(approvalRequests.status, "pending")),
    db.select({ total: count() }).from(exceptionQueue).where(eq(exceptionQueue.status, "open")),
    db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(8),
  ]);

  return {
    catalogCount: Number(catalog?.total ?? 0),
    verifiedCatalogCount: Number(verified?.total ?? 0),
    openApprovals: Number(approvals?.total ?? 0),
    openExceptions: Number(exceptions?.total ?? 0),
    recentActivity,
  };
}

export async function getUnifiedActivityLedger() {
  const db = await getDb();
  if (!db) return { events: [], openExceptions: [], pendingApprovals: [], approvalHistory: [], groups: [] };
  const [events, openExceptions, pendingApprovals, approvalHistory] = await Promise.all([
    db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(100),
    db.select().from(exceptionQueue).where(eq(exceptionQueue.status, "open")).orderBy(desc(exceptionQueue.createdAt)).limit(30),
    db.select().from(approvalRequests).where(eq(approvalRequests.status, "pending")).orderBy(desc(approvalRequests.createdAt)).limit(30),
    db.select().from(approvalRequests).orderBy(desc(approvalRequests.createdAt)).limit(100),
  ]);
  const correlationIds = new Set([...events.map(item => item.correlationId), ...openExceptions.map(item => item.correlationId), ...approvalHistory.map(item => item.correlationId)]);
  const groups = Array.from(correlationIds).filter(Boolean).map(correlationId => ({
    correlationId,
    events: events.filter(item => item.correlationId === correlationId),
    exceptions: openExceptions.filter(item => item.correlationId === correlationId),
    approvals: approvalHistory.filter(item => item.correlationId === correlationId),
  })).sort((a, b) => (b.events[0]?.createdAt?.getTime() ?? 0) - (a.events[0]?.createdAt?.getTime() ?? 0));
  return { events, openExceptions, pendingApprovals, approvalHistory, groups };
}

export async function listCatalogProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).orderBy(desc(products.updatedAt));
}

export async function createCatalogProduct(input: {
  sku: string;
  upc?: string | null;
  title: string;
  condition: string;
  brandOrStudio?: string | null;
  format?: string | null;
  description?: string | null;
  actorUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");

  await db.insert(products).values({
    sku: input.sku,
    upc: input.upc || null,
    title: input.title,
    condition: input.condition,
    brandOrStudio: input.brandOrStudio || null,
    format: input.format || null,
    description: input.description || null,
  });
  const [created] = await db.select().from(products).where(eq(products.sku, input.sku)).limit(1);
  if (!created) throw new Error("Catalog record could not be loaded after creation.");

  await db.insert(inventoryRecords).values({ productId: created.id, onHandQuantity: 0, reservedQuantity: 0 });
  await db.insert(activityLogs).values({
    category: "catalog",
    action: "catalog_record_created",
    subjectType: "product",
    subjectId: created.id,
    actorUserId: input.actorUserId,
    correlationId: `catalog-${created.id}-${Date.now()}`,
    outcome: "succeeded",
    details: { sku: created.sku, verificationStatus: created.verificationStatus },
  });
  return created;
}

export async function verifyCatalogProduct(productId: number, actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db
    .update(products)
    .set({ verificationStatus: "verified", verifiedAt: new Date(), verifiedByUserId: actorUserId })
    .where(eq(products.id, productId));
  await db.insert(activityLogs).values({
    category: "catalog",
    action: "catalog_record_verified",
    subjectType: "product",
    subjectId: productId,
    actorUserId,
    correlationId: `verify-${productId}-${Date.now()}`,
    outcome: "approved",
    details: { verificationStatus: "verified" },
  });
}

export async function recordOperationsActivity(input: {
  category: "catalog" | "inventory" | "listing" | "approval" | "channel" | "profile" | "system";
  action: string;
  subjectType: string;
  actorUserId: number;
  correlationId: string;
  outcome: "requested" | "approved" | "rejected" | "succeeded" | "failed" | "blocked";
  details: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLogs).values(input);
}

export async function listAutomationProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(automationProfiles).orderBy(desc(automationProfiles.updatedAt));
}

export async function createAutomationProfile(input: {
  name: string;
  purpose: string;
  memorySummary?: string;
  skillKeys: string[];
  allowedActions: string[];
  channelScope: string[];
  actorUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.insert(automationProfiles).values({
    name: input.name,
    purpose: input.purpose,
    memorySummary: input.memorySummary || null,
    skillKeys: input.skillKeys,
    allowedActions: input.allowedActions,
    channelScope: input.channelScope,
    approvalRequired: true,
    enabled: false,
  });
  const [profile] = await db.select().from(automationProfiles).where(eq(automationProfiles.name, input.name)).limit(1);
  if (!profile) throw new Error("Automation profile could not be loaded after creation.");
  await db.insert(activityLogs).values({
    category: "profile",
    action: "automation_profile_created_disabled",
    subjectType: "profile",
    subjectId: profile.id,
    actorUserId: input.actorUserId,
    correlationId: `profile-${profile.id}-${Date.now()}`,
    outcome: "succeeded",
    details: { enabled: false, approvalRequired: true, allowedActionCount: input.allowedActions.length },
  });
  return profile;
}

export async function listInventoryRecords() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      productId: products.id,
      sku: products.sku,
      title: products.title,
      verificationStatus: products.verificationStatus,
      onHandQuantity: inventoryRecords.onHandQuantity,
      reservedQuantity: inventoryRecords.reservedQuantity,
      locationKey: inventoryRecords.locationKey,
      updatedAt: inventoryRecords.updatedAt,
    })
    .from(inventoryRecords)
    .innerJoin(products, eq(inventoryRecords.productId, products.id))
    .orderBy(desc(inventoryRecords.updatedAt));
}

function getAffectedRows(result: unknown) {
  if (Array.isArray(result)) {
    return Number((result[0] as { affectedRows?: number } | undefined)?.affectedRows ?? 0);
  }
  return Number((result as { rowsAffected?: number; affectedRows?: number } | undefined)?.rowsAffected ?? (result as { affectedRows?: number } | undefined)?.affectedRows ?? 0);
}

export async function moveInventory(input: {
  productId: number;
  movementType: "receive" | "reserve" | "release" | "sale";
  quantity: number;
  actorUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  const correlationId = `inventory-${input.productId}-${Date.now()}`;
  let updateResult: unknown;
  const productFilter = eq(inventoryRecords.productId, input.productId);

  if (input.movementType === "receive") {
    updateResult = await db.update(inventoryRecords).set({ onHandQuantity: sql`${inventoryRecords.onHandQuantity} + ${input.quantity}` }).where(productFilter);
  } else if (input.movementType === "reserve") {
    updateResult = await db.update(inventoryRecords).set({ reservedQuantity: sql`${inventoryRecords.reservedQuantity} + ${input.quantity}` }).where(and(productFilter, sql`${inventoryRecords.onHandQuantity} - ${inventoryRecords.reservedQuantity} >= ${input.quantity}`));
  } else if (input.movementType === "release") {
    updateResult = await db.update(inventoryRecords).set({ reservedQuantity: sql`${inventoryRecords.reservedQuantity} - ${input.quantity}` }).where(and(productFilter, gte(inventoryRecords.reservedQuantity, input.quantity)));
  } else {
    updateResult = await db.update(inventoryRecords).set({ onHandQuantity: sql`${inventoryRecords.onHandQuantity} - ${input.quantity}`, reservedQuantity: sql`${inventoryRecords.reservedQuantity} - ${input.quantity}` }).where(and(productFilter, gte(inventoryRecords.onHandQuantity, input.quantity), gte(inventoryRecords.reservedQuantity, input.quantity)));
  }

  const affectedRows = getAffectedRows(updateResult);
  if (affectedRows !== 1) {
    await db.insert(exceptionQueue).values({
      subjectType: "inventory",
      subjectId: input.productId,
      category: "inventory",
      severity: "high",
      message: `Inventory ${input.movementType} action was blocked because the requested quantity was unavailable.`,
      details: { quantity: input.quantity, movementType: input.movementType, correlationId },
      correlationId,
    });
    await db.insert(activityLogs).values({
      category: "inventory",
      action: `inventory_${input.movementType}_blocked`,
      subjectType: "product",
      subjectId: input.productId,
      actorUserId: input.actorUserId,
      correlationId,
      outcome: "blocked",
      details: { quantity: input.quantity },
    });
    throw new Error("Inventory action blocked: available quantity or active reservation is insufficient.");
  }

  const deltas = input.movementType === "receive"
    ? { onHandDelta: input.quantity, reservedDelta: 0 }
    : input.movementType === "reserve"
      ? { onHandDelta: 0, reservedDelta: input.quantity }
      : input.movementType === "release"
        ? { onHandDelta: 0, reservedDelta: -input.quantity }
        : { onHandDelta: -input.quantity, reservedDelta: -input.quantity };
  await db.insert(inventoryMovements).values({
    productId: input.productId,
    movementType: input.movementType,
    ...deltas,
    reason: `LLC-controlled ${input.movementType} action`,
    correlationId,
    actorUserId: input.actorUserId,
  });
  await db.insert(activityLogs).values({
    category: "inventory",
    action: `inventory_${input.movementType}_applied`,
    subjectType: "product",
    subjectId: input.productId,
    actorUserId: input.actorUserId,
    correlationId,
    outcome: "succeeded",
    details: { quantity: input.quantity, ...deltas },
  });
}

async function ensureMarketplaceChannels() {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  for (const channel of channelBlueprint) {
    await db.insert(marketplaceChannels).values({
      code: channel.code,
      displayName: channel.displayName,
      capability: channel.capability,
      operationMode: channel.initialMode,
      enabled: false,
    }).onDuplicateKeyUpdate({ set: { displayName: channel.displayName } });
  }
}

export async function createListingPayloadPreview(input: {
  productId: number;
  channelCode: ChannelCode;
  price: number;
  actorUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await ensureMarketplaceChannels();
  const [product] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
  const [inventory] = await db.select().from(inventoryRecords).where(eq(inventoryRecords.productId, input.productId)).limit(1);
  const [channel] = await db.select().from(marketplaceChannels).where(eq(marketplaceChannels.code, input.channelCode)).limit(1);
  const media = await db.select().from(productMedia).where(and(eq(productMedia.productId, input.productId), eq(productMedia.verified, true)));
  if (!product || !inventory || !channel) throw new Error("The selected product or channel is unavailable.");

  const availableQuantity = inventory.onHandQuantity - inventory.reservedQuantity;
  const payload = buildChannelPayload({
    sku: product.sku,
    upc: product.upc,
    title: product.title,
    description: product.description,
    condition: product.condition,
    format: product.format,
    brandOrStudio: product.brandOrStudio,
    price: input.price,
    quantity: Math.max(availableQuantity, 0),
    imageUrls: media.map(item => item.url),
    channelCode: input.channelCode,
  });
  const preflight = validateListingPreflight({
    verificationStatus: product.verificationStatus,
    title: product.title,
    description: product.description,
    price: input.price,
    availableQuantity,
    imageCount: media.length,
    approvalStatus: "pending",
    capability: channel.capability,
    channelEnabled: channel.enabled,
  });
  const correlationId = `payload-${input.productId}-${input.channelCode}-${Date.now()}`;
  const state = preflight.ready ? "review" : "error";
  const persistedPayload = { ...payload, workflowCorrelationId: correlationId };
  await db.insert(channelListings).values({
    productId: input.productId,
    channelId: channel.id,
    state,
    payload: persistedPayload,
    validationErrors: preflight.errors,
  }).onDuplicateKeyUpdate({ set: { state, payload, validationErrors: preflight.errors } });
  const [listing] = await db.select().from(channelListings).where(and(eq(channelListings.productId, input.productId), eq(channelListings.channelId, channel.id))).limit(1);
  if (!listing) throw new Error("Listing preview could not be loaded after creation.");
  await db.insert(activityLogs).values({
    category: "listing",
    action: "channel_payload_preview_created",
    subjectType: "listing",
    subjectId: input.productId,
    actorUserId: input.actorUserId,
    correlationId,
    outcome: preflight.ready ? "succeeded" : "blocked",
    details: { channel: input.channelCode, errorCount: preflight.errors.length },
  });
  await db.insert(activityLogs).values({
    category: "system",
    action: "listing_preflight_evaluated",
    subjectType: "listing",
    subjectId: listing.id,
    actorUserId: input.actorUserId,
    correlationId,
    outcome: preflight.ready ? "succeeded" : "blocked",
    details: { ruleCount: 5, errorCount: preflight.errors.length },
  });
  if (!preflight.ready) {
    await db.insert(exceptionQueue).values({
      subjectType: "listing",
      subjectId: input.productId,
      category: "validation",
      severity: "medium",
      message: `Listing preview for ${channel.displayName} requires review before it can proceed.`,
      details: { channel: input.channelCode, validationErrors: preflight.errors, correlationId },
      correlationId,
    });
  }
  return { listingId: listing.id, payload: persistedPayload, preflight, state, channel: { code: channel.code, displayName: channel.displayName } };
}

export async function listOpenExceptions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(exceptionQueue).where(eq(exceptionQueue.status, "open")).orderBy(desc(exceptionQueue.createdAt)).limit(50);
}

export async function persistEbayRefreshTokenReference(secretRef: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await ensureMarketplaceChannels();
  const [channel] = await db.select().from(marketplaceChannels).where(eq(marketplaceChannels.code, "ebay")).limit(1);
  if (!channel) throw new Error("eBay channel is unavailable.");
  await db.insert(credentialConnections).values({ channelId: channel.id, secretKeyName: "EBAY_REFRESH_TOKEN", secretRef, configured: true, lastVerificationStatus: "unavailable" }).onDuplicateKeyUpdate({ set: { secretRef, configured: true, lastVerificationStatus: "unavailable", lastVerifiedAt: new Date() } });
  await db.insert(activityLogs).values({ category: "system", action: "ebay_refresh_token_stored_server_side", subjectType: "channel", subjectId: channel.id, correlationId: `ebay-oauth-${Date.now()}`, outcome: "succeeded", details: { storage: "encrypted_server_blob" } });
}

export async function requestListingApproval(listingId: number, actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  const [listing] = await db.select().from(channelListings).where(eq(channelListings.id, listingId)).limit(1);
  if (!listing) throw new Error("The selected listing preview is unavailable.");
  const storedCorrelationId = (listing.payload as { workflowCorrelationId?: string } | null)?.workflowCorrelationId;
  const correlationId = storedCorrelationId || `approval-listing-${listingId}-${Date.now()}`;
  await db.insert(approvalRequests).values({ subjectType: "listing", subjectId: listingId, action: "submit_listing", status: "pending", requestedByUserId: actorUserId, correlationId });
  await db.insert(activityLogs).values({ category: "approval", action: "listing_approval_requested", subjectType: "listing", subjectId: listingId, actorUserId, correlationId, outcome: "requested", details: {} });
  return { correlationId };
}

export async function decideApprovalRequest(input: { approvalId: number; decision: "approved" | "rejected"; note?: string; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  const [approval] = await db.select().from(approvalRequests).where(eq(approvalRequests.id, input.approvalId)).limit(1);
  if (!approval || approval.status !== "pending") throw new Error("Only a pending approval can be decided.");
  await db.update(approvalRequests).set({ status: input.decision, decisionNote: input.note || null, decidedByUserId: input.actorUserId, decidedAt: new Date() }).where(eq(approvalRequests.id, input.approvalId));
  await db.insert(activityLogs).values({ category: "approval", action: `listing_approval_${input.decision}`, subjectType: approval.subjectType, subjectId: approval.subjectId, actorUserId: input.actorUserId, correlationId: approval.correlationId, outcome: input.decision, details: { approvalId: approval.id } });
}

export async function ingestChannelSaleEvent(input: {
  channelCode: ChannelCode;
  externalEventId: string;
  externalListingId: string;
  quantity: number;
  occurredAt: Date;
  actorUserId: number;
  details?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await ensureMarketplaceChannels();
  const [channel] = await db.select().from(marketplaceChannels).where(eq(marketplaceChannels.code, input.channelCode)).limit(1);
  if (!channel) throw new Error("The selected channel is unavailable.");
  const [existing] = await db.select().from(channelSaleEvents).where(and(eq(channelSaleEvents.channelId, channel.id), eq(channelSaleEvents.externalEventId, input.externalEventId))).limit(1);
  if (existing) {
    await db.insert(activityLogs).values({
      category: "channel",
      action: "channel_sale_event_duplicate_ignored",
      subjectType: "sale_event",
      subjectId: existing.id,
      actorUserId: input.actorUserId,
      correlationId: `sale-duplicate-${existing.id}-${Date.now()}`,
      outcome: "blocked",
      details: { channel: input.channelCode, externalEventId: input.externalEventId },
    });
    return { status: "duplicate" as const, productId: existing.productId };
  }

  const [listing] = await db.select().from(channelListings).where(and(eq(channelListings.channelId, channel.id), eq(channelListings.externalListingId, input.externalListingId))).limit(1);
  if (!listing) {
    await db.insert(exceptionQueue).values({
      subjectType: "channel",
      subjectId: channel.id,
      category: "inventory",
      severity: "high",
      message: `Channel sale event could not be matched to a canonical listing for ${channel.displayName}.`,
      details: { externalEventId: input.externalEventId, externalListingId: input.externalListingId, quantity: input.quantity },
      correlationId: `sale-${input.channelCode}-${input.externalEventId}`,
    });
    throw new Error("Channel sale event blocked: no matching channel listing was found.");
  }
  const [inventory] = await db.select().from(inventoryRecords).where(eq(inventoryRecords.productId, listing.productId)).limit(1);
  if (!inventory) throw new Error("Channel sale event blocked: no inventory record was found.");
  const decision = decideChannelSaleReconciliation({ eventAlreadyRecorded: false, onHand: inventory.onHandQuantity, reserved: inventory.reservedQuantity, quantity: input.quantity });
  const correlationId = `sale-${input.channelCode}-${input.externalEventId}`;
  await db.insert(channelSaleEvents).values({
    channelId: channel.id,
    productId: listing.productId,
    externalEventId: input.externalEventId,
    externalListingId: input.externalListingId,
    quantity: input.quantity,
    status: "received",
    details: input.details ?? {},
    occurredAt: input.occurredAt,
  });
  const [saleEvent] = await db.select().from(channelSaleEvents).where(and(eq(channelSaleEvents.channelId, channel.id), eq(channelSaleEvents.externalEventId, input.externalEventId))).limit(1);
  if (!saleEvent) throw new Error("Channel sale event could not be loaded after receipt.");
  if (decision === "block") {
    await db.update(channelSaleEvents).set({ status: "blocked", reconciledAt: new Date() }).where(eq(channelSaleEvents.id, saleEvent.id));
    await db.insert(exceptionQueue).values({
      subjectType: "inventory",
      subjectId: listing.productId,
      category: "inventory",
      severity: "critical",
      message: `Channel sale event was blocked because the canonical reservation could not be committed.`,
      details: { channel: input.channelCode, externalEventId: input.externalEventId, quantity: input.quantity, correlationId },
      correlationId,
    });
    await db.insert(activityLogs).values({ category: "inventory", action: "channel_sale_reconciliation_blocked", subjectType: "sale_event", subjectId: saleEvent.id, actorUserId: input.actorUserId, correlationId, outcome: "blocked", details: { channel: input.channelCode, quantity: input.quantity } });
    return { status: "blocked" as const, productId: listing.productId };
  }

  const updateResult = await db.update(inventoryRecords).set({ onHandQuantity: sql`${inventoryRecords.onHandQuantity} - ${input.quantity}`, reservedQuantity: sql`${inventoryRecords.reservedQuantity} - ${input.quantity}` }).where(and(eq(inventoryRecords.productId, listing.productId), gte(inventoryRecords.onHandQuantity, input.quantity), gte(inventoryRecords.reservedQuantity, input.quantity)));
  if (getAffectedRows(updateResult) !== 1) {
    await db.update(channelSaleEvents).set({ status: "blocked", reconciledAt: new Date() }).where(eq(channelSaleEvents.id, saleEvent.id));
    throw new Error("Channel sale event blocked: inventory changed during reconciliation.");
  }
  const now = new Date();
  await db.update(channelSaleEvents).set({ status: "applied", reconciledAt: now }).where(eq(channelSaleEvents.id, saleEvent.id));
  await db.update(channelListings).set({ state: "sold", lastSynchronizedAt: now }).where(eq(channelListings.id, listing.id));
  await db.insert(inventoryMovements).values({ productId: listing.productId, movementType: "sale", onHandDelta: -input.quantity, reservedDelta: -input.quantity, reason: `Channel sale reconciled from ${channel.displayName}`, correlationId, actorUserId: input.actorUserId });
  await db.insert(activityLogs).values({ category: "channel", action: "channel_sale_reconciled", subjectType: "sale_event", subjectId: saleEvent.id, actorUserId: input.actorUserId, correlationId, outcome: "succeeded", details: { channel: input.channelCode, productId: listing.productId, quantity: input.quantity } });
  const relatedListings = await db.select().from(channelListings).where(and(eq(channelListings.productId, listing.productId), sql`${channelListings.id} <> ${listing.id}`));
  const remainingAvailable = Math.max(0, inventory.onHandQuantity - inventory.reservedQuantity - input.quantity);
  for (const relatedListing of relatedListings) {
    const nextPayload = synchronizePayloadQuantity((relatedListing.payload as Record<string, unknown> | null) ?? null, remainingAvailable);
    const nextState = remainingAvailable === 0 && relatedListing.state === "active" ? "ended" : relatedListing.state;
    await db.update(channelListings).set({ payload: nextPayload, state: nextState, lastSynchronizedAt: now }).where(eq(channelListings.id, relatedListing.id));
    await db.insert(activityLogs).values({ category: "channel", action: "cross_channel_quantity_synchronized", subjectType: "listing", subjectId: relatedListing.id, actorUserId: input.actorUserId, correlationId, outcome: "succeeded", details: { soldOn: input.channelCode, remainingAvailable, listingState: nextState } });
  }
  return { status: "applied" as const, productId: listing.productId };
}
