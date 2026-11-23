import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import {
  activityLogs,
  approvalRequests,
  automationProfiles,
  channelListings,
  channelSaleEvents,
  credentialConnections,
  exceptionQueue,
  InsertUser,
  inventoryMovements,
  inventoryRecords,
  marketplaceChannels,
  productMedia,
  products,
  users,
} from "../drizzle/schema";
import { DEFAULT_DATABASE_PATH, ENV } from "./_core/env";
import {
  buildChannelPayload,
  channelBlueprint,
  ChannelCode,
  decideChannelSaleReconciliation,
  synchronizePayloadQuantity,
  validateListingPreflight,
} from "./operations";

const CROSSLISTER_ROOT = path.resolve(import.meta.dirname, "..");
const REPO_ROOT = path.resolve(CROSSLISTER_ROOT, "..", "..");
const DEFAULT_SQLITE_FILE = path.resolve(
  CROSSLISTER_ROOT,
  "data",
  "crosslisting.sqlite3"
);

const SCHEMA_BOOTSTRAP_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    openId TEXT NOT NULL UNIQUE,
    name TEXT,
    email TEXT,
    loginMethod TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    lastSignedIn INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT NOT NULL,
    upc TEXT,
    title TEXT NOT NULL,
    condition TEXT NOT NULL,
    conditionNotes TEXT,
    brandOrStudio TEXT,
    format TEXT,
    attributes TEXT,
    description TEXT,
    verificationStatus TEXT NOT NULL DEFAULT 'needs_review',
    verifiedAt INTEGER,
    verifiedByUserId INTEGER,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique ON products (sku)`,
  `CREATE INDEX IF NOT EXISTS products_upc_index ON products (upc)`,
  `CREATE TABLE IF NOT EXISTS product_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER NOT NULL,
    url TEXT NOT NULL,
    altText TEXT,
    mediaType TEXT NOT NULL DEFAULT 'image',
    isPrimary INTEGER NOT NULL DEFAULT 0,
    verified INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS product_media_product_index ON product_media (productId)`,
  `CREATE TABLE IF NOT EXISTS inventory_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER NOT NULL,
    onHandQuantity INTEGER NOT NULL DEFAULT 0,
    reservedQuantity INTEGER NOT NULL DEFAULT 0,
    locationKey TEXT NOT NULL DEFAULT 'llc-primary',
    updatedAt INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS inventory_records_product_unique ON inventory_records (productId)`,
  `CREATE TABLE IF NOT EXISTS inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER NOT NULL,
    movementType TEXT NOT NULL,
    onHandDelta INTEGER NOT NULL DEFAULT 0,
    reservedDelta INTEGER NOT NULL DEFAULT 0,
    reason TEXT NOT NULL,
    correlationId TEXT NOT NULL,
    actorUserId INTEGER,
    createdAt INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS inventory_movements_product_index ON inventory_movements (productId)`,
  `CREATE INDEX IF NOT EXISTS inventory_movements_correlation_index ON inventory_movements (correlationId)`,
  `CREATE TABLE IF NOT EXISTS marketplace_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    displayName TEXT NOT NULL,
    capability TEXT NOT NULL DEFAULT 'prepared',
    operationMode TEXT NOT NULL DEFAULT 'disabled',
    enabled INTEGER NOT NULL DEFAULT 0,
    lastSyncAt INTEGER,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS marketplace_channels_code_unique ON marketplace_channels (code)`,
  `CREATE TABLE IF NOT EXISTS credential_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channelId INTEGER NOT NULL,
    secretKeyName TEXT NOT NULL,
    secretRef TEXT,
    configured INTEGER NOT NULL DEFAULT 0,
    lastVerifiedAt INTEGER,
    lastVerificationStatus TEXT NOT NULL DEFAULT 'not_checked',
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS credential_connections_channel_key_unique ON credential_connections (channelId, secretKeyName)`,
  `CREATE TABLE IF NOT EXISTS policy_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channelId INTEGER NOT NULL,
    policyType TEXT NOT NULL,
    policyKey TEXT NOT NULL,
    policyValue TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS policy_mappings_channel_index ON policy_mappings (channelId)`,
  `CREATE TABLE IF NOT EXISTS channel_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER NOT NULL,
    channelId INTEGER NOT NULL,
    externalListingId TEXT,
    state TEXT NOT NULL DEFAULT 'draft',
    payload TEXT,
    validationErrors TEXT,
    lastSubmittedAt INTEGER,
    lastSynchronizedAt INTEGER,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS channel_listings_product_channel_unique ON channel_listings (productId, channelId)`,
  `CREATE INDEX IF NOT EXISTS channel_listings_state_index ON channel_listings (state)`,
  `CREATE TABLE IF NOT EXISTS channel_sale_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channelId INTEGER NOT NULL,
    productId INTEGER NOT NULL,
    externalEventId TEXT NOT NULL,
    externalListingId TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'received',
    details TEXT,
    occurredAt INTEGER NOT NULL,
    reconciledAt INTEGER,
    createdAt INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS channel_sale_events_channel_external_unique ON channel_sale_events (channelId, externalEventId)`,
  `CREATE INDEX IF NOT EXISTS channel_sale_events_product_index ON channel_sale_events (productId)`,
  `CREATE TABLE IF NOT EXISTS approval_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subjectType TEXT NOT NULL,
    subjectId INTEGER NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    requestedByUserId INTEGER,
    decidedByUserId INTEGER,
    decisionNote TEXT,
    correlationId TEXT NOT NULL DEFAULT 'system',
    createdAt INTEGER NOT NULL,
    decidedAt INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS approval_requests_status_index ON approval_requests (status)`,
  `CREATE INDEX IF NOT EXISTS approval_requests_subject_index ON approval_requests (subjectType, subjectId)`,
  `CREATE INDEX IF NOT EXISTS approval_requests_correlation_index ON approval_requests (correlationId)`,
  `CREATE TABLE IF NOT EXISTS exception_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subjectType TEXT NOT NULL,
    subjectId INTEGER NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium',
    message TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    resolvedByUserId INTEGER,
    resolvedAt INTEGER,
    correlationId TEXT NOT NULL DEFAULT 'system',
    createdAt INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS exception_queue_status_index ON exception_queue (status)`,
  `CREATE INDEX IF NOT EXISTS exception_queue_severity_index ON exception_queue (severity)`,
  `CREATE INDEX IF NOT EXISTS exception_queue_correlation_index ON exception_queue (correlationId)`,
  `CREATE TABLE IF NOT EXISTS automation_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    purpose TEXT NOT NULL,
    memorySummary TEXT,
    skillKeys TEXT,
    allowedActions TEXT,
    channelScope TEXT,
    approvalRequired INTEGER NOT NULL DEFAULT 1,
    enabled INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS automation_profiles_name_unique ON automation_profiles (name)`,
  `CREATE TABLE IF NOT EXISTS external_components (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sourceUrl TEXT NOT NULL,
    sourceReference TEXT,
    license TEXT,
    attributionText TEXT,
    integrationBoundary TEXT NOT NULL,
    reviewStatus TEXT NOT NULL DEFAULT 'pending',
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS external_components_source_unique ON external_components (sourceUrl)`,
  `CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    action TEXT NOT NULL,
    subjectType TEXT NOT NULL,
    subjectId INTEGER,
    actorUserId INTEGER,
    profileId INTEGER,
    correlationId TEXT NOT NULL,
    outcome TEXT NOT NULL,
    details TEXT,
    createdAt INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS activity_logs_category_index ON activity_logs (category)`,
  `CREATE INDEX IF NOT EXISTS activity_logs_correlation_index ON activity_logs (correlationId)`,
  `CREATE INDEX IF NOT EXISTS activity_logs_created_index ON activity_logs (createdAt)`,
];

let _sqlite: Database.Database | null = null;
let _db: ReturnType<typeof drizzle> | null = null;
let _dbPath: string | null = null;

export function resolveDatabasePath(configuredUrl?: string): string {
  const raw = (
    configuredUrl ??
    process.env.DATABASE_URL ??
    ENV.databaseUrl ??
    DEFAULT_DATABASE_PATH
  ).trim();
  if (raw === ":memory:") {
    return ":memory:";
  }
  const stripped = raw.startsWith("file:") ? raw.slice("file:".length) : raw;
  const normalized = stripped.replace(/\\/g, "/").replace(/^\.\//, "");
  if (
    !normalized ||
    normalized === DEFAULT_DATABASE_PATH ||
    normalized === "mission-control/crosslisting-os/data/crosslisting.sqlite3"
  ) {
    return DEFAULT_SQLITE_FILE;
  }
  if (path.isAbsolute(stripped)) {
    return path.resolve(stripped);
  }
  if (normalized.startsWith("mission-control/crosslisting-os/")) {
    return path.resolve(REPO_ROOT, stripped);
  }
  return path.resolve(CROSSLISTER_ROOT, stripped);
}

function bootstrapSqliteSchema(sqlite: Database.Database): void {
  for (const statement of SCHEMA_BOOTSTRAP_STATEMENTS) {
    sqlite.prepare(statement).run();
  }
}

export function closeDb(): void {
  if (_sqlite) {
    try {
      _sqlite.close();
    } catch {
      // Ignore close errors on cleanup
    }
  }
  _sqlite = null;
  _db = null;
  _dbPath = null;
}

// Lazily create the better-sqlite3 drizzle instance at data/crosslisting.sqlite3.
export async function getDb() {
  const targetPath = resolveDatabasePath();
  if (!_db || _dbPath !== targetPath) {
    closeDb();
    try {
      if (targetPath !== ":memory:") {
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      }
      const sqlite = new Database(targetPath);
      sqlite.pragma("journal_mode = WAL");
      sqlite.pragma("foreign_keys = ON");
      sqlite.pragma("busy_timeout = 5000");
      bootstrapSqliteSchema(sqlite);
      _sqlite = sqlite;
      _db = drizzle(sqlite);
      _dbPath = targetPath;
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      closeDb();
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
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
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

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

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

  const [[catalog], [verified], [approvals], [exceptions], recentActivity] =
    await Promise.all([
      db.select({ total: count() }).from(products),
      db
        .select({ total: count() })
        .from(products)
        .where(eq(products.verificationStatus, "verified")),
      db
        .select({ total: count() })
        .from(approvalRequests)
        .where(eq(approvalRequests.status, "pending")),
      db
        .select({ total: count() })
        .from(exceptionQueue)
        .where(eq(exceptionQueue.status, "open")),
      db
        .select()
        .from(activityLogs)
        .orderBy(desc(activityLogs.createdAt))
        .limit(8),
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
  if (!db)
    return {
      events: [],
      openExceptions: [],
      pendingApprovals: [],
      approvalHistory: [],
      groups: [],
    };
  const [events, openExceptions, pendingApprovals, approvalHistory] =
    await Promise.all([
      db
        .select()
        .from(activityLogs)
        .orderBy(desc(activityLogs.createdAt))
        .limit(100),
      db
        .select()
        .from(exceptionQueue)
        .where(eq(exceptionQueue.status, "open"))
        .orderBy(desc(exceptionQueue.createdAt))
        .limit(30),
      db
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.status, "pending"))
        .orderBy(desc(approvalRequests.createdAt))
        .limit(30),
      db
        .select()
        .from(approvalRequests)
        .orderBy(desc(approvalRequests.createdAt))
        .limit(100),
    ]);
  const correlationIds = new Set([
    ...events.map(item => item.correlationId),
    ...openExceptions.map(item => item.correlationId),
    ...approvalHistory.map(item => item.correlationId),
  ]);
  const groups = Array.from(correlationIds)
    .filter(Boolean)
    .map(correlationId => ({
      correlationId,
      events: events.filter(item => item.correlationId === correlationId),
      exceptions: openExceptions.filter(
        item => item.correlationId === correlationId
      ),
      approvals: approvalHistory.filter(
        item => item.correlationId === correlationId
      ),
    }))
    .sort(
      (a, b) =>
        (b.events[0]?.createdAt?.getTime() ?? 0) -
        (a.events[0]?.createdAt?.getTime() ?? 0)
    );
  return { events, openExceptions, pendingApprovals, approvalHistory, groups };
}

export async function listCatalogProducts() {
  const db = await getDb();
  if (!db) return [];
  const [productRows, mediaRows] = await Promise.all([
    db.select().from(products).orderBy(desc(products.updatedAt)),
    db
      .select()
      .from(productMedia)
      .orderBy(desc(productMedia.isPrimary), productMedia.id),
  ]);
  const mediaByProductId = new Map<number, (typeof mediaRows)[number][]>();
  for (const item of mediaRows) {
    const bucket = mediaByProductId.get(item.productId) ?? [];
    bucket.push(item);
    mediaByProductId.set(item.productId, bucket);
  }
  return productRows.map(product => ({
    ...product,
    media: mediaByProductId.get(product.id) ?? [],
  }));
}

export async function createCatalogProduct(input: {
  sku: string;
  upc?: string | null;
  title: string;
  condition: string;
  conditionNotes?: string | null;
  brandOrStudio?: string | null;
  category?: string | null;
  format?: string | null;
  attributes?: Record<string, unknown> | null;
  description?: string | null;
  actorUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");

  const attributes =
    input.attributes ?? (input.category ? { category: input.category } : null);

  await db.insert(products).values({
    sku: input.sku,
    upc: input.upc || null,
    title: input.title,
    condition: input.condition,
    conditionNotes: input.conditionNotes || null,
    brandOrStudio: input.brandOrStudio || null,
    format: input.format || null,
    attributes,
    description: input.description || null,
  });
  const [created] = await db
    .select()
    .from(products)
    .where(eq(products.sku, input.sku))
    .limit(1);
  if (!created)
    throw new Error("Catalog record could not be loaded after creation.");

  await db
    .insert(inventoryRecords)
    .values({ productId: created.id, onHandQuantity: 0, reservedQuantity: 0 });
  await db.insert(activityLogs).values({
    category: "catalog",
    action: "catalog_record_created",
    subjectType: "product",
    subjectId: created.id,
    actorUserId: input.actorUserId,
    correlationId: `catalog-${created.id}-${Date.now()}`,
    outcome: "succeeded",
    details: {
      sku: created.sku,
      verificationStatus: created.verificationStatus,
    },
  });
  return created;
}

export async function updateCatalogProduct(input: {
  productId: number;
  sku?: string;
  upc?: string | null;
  title?: string;
  condition?: string;
  conditionNotes?: string | null;
  brandOrStudio?: string | null;
  format?: string | null;
  attributes?: Record<string, unknown> | null;
  description?: string | null;
  actorUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");

  const [existing] = await db
    .select()
    .from(products)
    .where(eq(products.id, input.productId))
    .limit(1);
  if (!existing) {
    throw new Error("The selected catalog record is unavailable.");
  }

  const updateSet: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  if (input.sku !== undefined) updateSet.sku = input.sku.trim();
  if (input.upc !== undefined) updateSet.upc = input.upc?.trim() || null;
  if (input.title !== undefined) updateSet.title = input.title.trim();
  if (input.condition !== undefined)
    updateSet.condition = input.condition.trim();
  if (input.conditionNotes !== undefined)
    updateSet.conditionNotes = input.conditionNotes?.trim() || null;
  if (input.brandOrStudio !== undefined)
    updateSet.brandOrStudio = input.brandOrStudio?.trim() || null;
  if (input.format !== undefined)
    updateSet.format = input.format?.trim() || null;
  if (input.attributes !== undefined)
    updateSet.attributes = input.attributes ?? null;
  if (input.description !== undefined)
    updateSet.description = input.description?.trim() || null;

  await db
    .update(products)
    .set(updateSet)
    .where(eq(products.id, input.productId));

  const [updated] = await db
    .select()
    .from(products)
    .where(eq(products.id, input.productId))
    .limit(1);
  if (!updated) {
    throw new Error("Catalog record could not be loaded after update.");
  }

  const updatedFields = Object.keys(updateSet).filter(
    key => key !== "updatedAt"
  );
  await db.insert(activityLogs).values({
    category: "catalog",
    action: "catalog_record_updated",
    subjectType: "product",
    subjectId: updated.id,
    actorUserId: input.actorUserId,
    correlationId: `catalog-update-${updated.id}-${Date.now()}`,
    outcome: "succeeded",
    details: {
      sku: updated.sku,
      updatedFields,
      verificationStatus: updated.verificationStatus,
    },
  });

  return updated;
}

export async function addProductMedia(input: {
  productId: number;
  url: string;
  altText?: string | null;
  mediaType?: "image" | "video" | "document";
  isPrimary?: boolean;
  actorUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, input.productId))
    .limit(1);
  if (!product) {
    throw new Error("The selected catalog record is unavailable.");
  }

  const normalizedUrl = input.url.trim();
  if (!normalizedUrl) {
    throw new Error("A valid media URL is required.");
  }

  if (input.isPrimary) {
    await db
      .update(productMedia)
      .set({ isPrimary: false })
      .where(eq(productMedia.productId, input.productId));
  }

  const insertResult = await db.insert(productMedia).values({
    productId: input.productId,
    url: normalizedUrl,
    altText: input.altText?.trim() || null,
    mediaType: input.mediaType ?? "image",
    isPrimary: Boolean(input.isPrimary),
    verified: false,
  });

  const insertedId = Number(
    (insertResult as { lastInsertRowid?: number | bigint } | undefined)
      ?.lastInsertRowid ?? 0
  );
  const [createdMedia] = insertedId
    ? await db
        .select()
        .from(productMedia)
        .where(eq(productMedia.id, insertedId))
        .limit(1)
    : await db
        .select()
        .from(productMedia)
        .where(
          and(
            eq(productMedia.productId, input.productId),
            eq(productMedia.url, normalizedUrl)
          )
        )
        .orderBy(desc(productMedia.id))
        .limit(1);

  if (!createdMedia) {
    throw new Error("Product media could not be loaded after attachment.");
  }

  await db.insert(activityLogs).values({
    category: "catalog",
    action: "product_media_attached",
    subjectType: "product_media",
    subjectId: createdMedia.id,
    actorUserId: input.actorUserId,
    correlationId: `media-add-${input.productId}-${createdMedia.id}-${Date.now()}`,
    outcome: "succeeded",
    details: {
      productId: input.productId,
      mediaId: createdMedia.id,
      url: createdMedia.url,
      mediaType: createdMedia.mediaType,
      isPrimary: createdMedia.isPrimary,
      verified: createdMedia.verified,
    },
  });

  return createdMedia;
}

export async function verifyProductMedia(
  mediaIdOrInput:
    number | { mediaId: number; productId?: number; actorUserId: number },
  actorUserIdArg?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");

  const mediaId =
    typeof mediaIdOrInput === "number"
      ? mediaIdOrInput
      : mediaIdOrInput.mediaId;
  const productId =
    typeof mediaIdOrInput === "number" ? undefined : mediaIdOrInput.productId;
  const actorUserId =
    typeof mediaIdOrInput === "number"
      ? (actorUserIdArg ?? 1)
      : mediaIdOrInput.actorUserId;

  const filter =
    productId !== undefined
      ? and(eq(productMedia.id, mediaId), eq(productMedia.productId, productId))
      : eq(productMedia.id, mediaId);

  const [existing] = await db
    .select()
    .from(productMedia)
    .where(filter)
    .limit(1);
  if (!existing) {
    throw new Error("The selected product media record is unavailable.");
  }

  await db
    .update(productMedia)
    .set({ verified: true })
    .where(eq(productMedia.id, mediaId));

  const [verifiedMedia] = await db
    .select()
    .from(productMedia)
    .where(eq(productMedia.id, mediaId))
    .limit(1);
  if (!verifiedMedia) {
    throw new Error(
      "Product media record could not be loaded after verification."
    );
  }

  await db.insert(activityLogs).values({
    category: "catalog",
    action: "product_media_verified",
    subjectType: "product_media",
    subjectId: verifiedMedia.id,
    actorUserId,
    correlationId: `media-verify-${verifiedMedia.productId}-${verifiedMedia.id}-${Date.now()}`,
    outcome: "approved",
    details: {
      productId: verifiedMedia.productId,
      mediaId: verifiedMedia.id,
      url: verifiedMedia.url,
      verified: true,
    },
  });

  return verifiedMedia;
}

export async function verifyCatalogProduct(
  productId: number,
  actorUserId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db
    .update(products)
    .set({
      verificationStatus: "verified",
      verifiedAt: new Date(),
      verifiedByUserId: actorUserId,
    })
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
  category:
    | "catalog"
    | "inventory"
    | "listing"
    | "approval"
    | "channel"
    | "profile"
    | "system";
  action: string;
  subjectType: string;
  actorUserId: number;
  correlationId: string;
  outcome:
    "requested" | "approved" | "rejected" | "succeeded" | "failed" | "blocked";
  details: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLogs).values(input);
}

export async function listAutomationProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(automationProfiles)
    .orderBy(desc(automationProfiles.updatedAt));
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
  const [profile] = await db
    .select()
    .from(automationProfiles)
    .where(eq(automationProfiles.name, input.name))
    .limit(1);
  if (!profile)
    throw new Error("Automation profile could not be loaded after creation.");
  await db.insert(activityLogs).values({
    category: "profile",
    action: "automation_profile_created_disabled",
    subjectType: "profile",
    subjectId: profile.id,
    actorUserId: input.actorUserId,
    correlationId: `profile-${profile.id}-${Date.now()}`,
    outcome: "succeeded",
    details: {
      enabled: false,
      approvalRequired: true,
      allowedActionCount: input.allowedActions.length,
    },
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

export function getAffectedRows(result: unknown) {
  if (Array.isArray(result)) {
    return Number(
      (result[0] as { changes?: number; affectedRows?: number } | undefined)
        ?.changes ??
        (result[0] as { affectedRows?: number } | undefined)?.affectedRows ??
        0
    );
  }
  return Number(
    (
      result as
        | { changes?: number; rowsAffected?: number; affectedRows?: number }
        | undefined
    )?.changes ??
      (result as { rowsAffected?: number } | undefined)?.rowsAffected ??
      (result as { affectedRows?: number } | undefined)?.affectedRows ??
      0
  );
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
    updateResult = await db
      .update(inventoryRecords)
      .set({
        onHandQuantity: sql`${inventoryRecords.onHandQuantity} + ${input.quantity}`,
      })
      .where(productFilter);
  } else if (input.movementType === "reserve") {
    updateResult = await db
      .update(inventoryRecords)
      .set({
        reservedQuantity: sql`${inventoryRecords.reservedQuantity} + ${input.quantity}`,
      })
      .where(
        and(
          productFilter,
          sql`${inventoryRecords.onHandQuantity} - ${inventoryRecords.reservedQuantity} >= ${input.quantity}`
        )
      );
  } else if (input.movementType === "release") {
    updateResult = await db
      .update(inventoryRecords)
      .set({
        reservedQuantity: sql`${inventoryRecords.reservedQuantity} - ${input.quantity}`,
      })
      .where(
        and(
          productFilter,
          gte(inventoryRecords.reservedQuantity, input.quantity)
        )
      );
  } else {
    updateResult = await db
      .update(inventoryRecords)
      .set({
        onHandQuantity: sql`${inventoryRecords.onHandQuantity} - ${input.quantity}`,
        reservedQuantity: sql`${inventoryRecords.reservedQuantity} - ${input.quantity}`,
      })
      .where(
        and(
          productFilter,
          gte(inventoryRecords.onHandQuantity, input.quantity),
          gte(inventoryRecords.reservedQuantity, input.quantity)
        )
      );
  }

  const affectedRows = getAffectedRows(updateResult);
  if (affectedRows !== 1) {
    await db.insert(exceptionQueue).values({
      subjectType: "inventory",
      subjectId: input.productId,
      category: "inventory",
      severity: "high",
      message: `Inventory ${input.movementType} action was blocked because the requested quantity was unavailable.`,
      details: {
        quantity: input.quantity,
        movementType: input.movementType,
        correlationId,
      },
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
    throw new Error(
      "Inventory action blocked: available quantity or active reservation is insufficient."
    );
  }

  const deltas =
    input.movementType === "receive"
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
    await db
      .insert(marketplaceChannels)
      .values({
        code: channel.code,
        displayName: channel.displayName,
        capability: channel.capability,
        operationMode: channel.initialMode,
        enabled: false,
      })
      .onConflictDoUpdate({
        target: marketplaceChannels.code,
        set: { displayName: channel.displayName },
      });
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
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, input.productId))
    .limit(1);
  const [inventory] = await db
    .select()
    .from(inventoryRecords)
    .where(eq(inventoryRecords.productId, input.productId))
    .limit(1);
  const [channel] = await db
    .select()
    .from(marketplaceChannels)
    .where(eq(marketplaceChannels.code, input.channelCode))
    .limit(1);
  const media = await db
    .select()
    .from(productMedia)
    .where(
      and(
        eq(productMedia.productId, input.productId),
        eq(productMedia.verified, true)
      )
    );
  if (!product || !inventory || !channel)
    throw new Error("The selected product or channel is unavailable.");

  const availableQuantity =
    inventory.onHandQuantity - inventory.reservedQuantity;
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
  await db
    .insert(channelListings)
    .values({
      productId: input.productId,
      channelId: channel.id,
      state,
      payload: persistedPayload,
      validationErrors: preflight.errors,
    })
    .onConflictDoUpdate({
      target: [channelListings.productId, channelListings.channelId],
      set: {
        state,
        payload: persistedPayload,
        validationErrors: preflight.errors,
      },
    });
  const [listing] = await db
    .select()
    .from(channelListings)
    .where(
      and(
        eq(channelListings.productId, input.productId),
        eq(channelListings.channelId, channel.id)
      )
    )
    .limit(1);
  if (!listing)
    throw new Error("Listing preview could not be loaded after creation.");
  await db.insert(activityLogs).values({
    category: "listing",
    action: "channel_payload_preview_created",
    subjectType: "listing",
    subjectId: input.productId,
    actorUserId: input.actorUserId,
    correlationId,
    outcome: preflight.ready ? "succeeded" : "blocked",
    details: {
      channel: input.channelCode,
      errorCount: preflight.errors.length,
    },
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
      details: {
        channel: input.channelCode,
        validationErrors: preflight.errors,
        correlationId,
      },
      correlationId,
    });
  }
  return {
    listingId: listing.id,
    payload: persistedPayload,
    preflight,
    state,
    channel: { code: channel.code, displayName: channel.displayName },
  };
}

export async function listOpenExceptions() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(exceptionQueue)
    .where(eq(exceptionQueue.status, "open"))
    .orderBy(desc(exceptionQueue.createdAt))
    .limit(50);
}

export async function persistEbayRefreshTokenReference(secretRef: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await ensureMarketplaceChannels();
  const [channel] = await db
    .select()
    .from(marketplaceChannels)
    .where(eq(marketplaceChannels.code, "ebay"))
    .limit(1);
  if (!channel) throw new Error("eBay channel is unavailable.");
  await db
    .insert(credentialConnections)
    .values({
      channelId: channel.id,
      secretKeyName: "EBAY_REFRESH_TOKEN",
      secretRef,
      configured: true,
      lastVerificationStatus: "unavailable",
    })
    .onConflictDoUpdate({
      target: [
        credentialConnections.channelId,
        credentialConnections.secretKeyName,
      ],
      set: {
        secretRef,
        configured: true,
        lastVerificationStatus: "unavailable",
        lastVerifiedAt: new Date(),
      },
    });
  await db.insert(activityLogs).values({
    category: "system",
    action: "ebay_refresh_token_stored_server_side",
    subjectType: "channel",
    subjectId: channel.id,
    correlationId: `ebay-oauth-${Date.now()}`,
    outcome: "succeeded",
    details: { storage: "encrypted_server_blob" },
  });
}

export async function requestListingApproval(
  listingId: number,
  actorUserId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  const [listing] = await db
    .select()
    .from(channelListings)
    .where(eq(channelListings.id, listingId))
    .limit(1);
  if (!listing) throw new Error("The selected listing preview is unavailable.");
  const storedCorrelationId = (
    listing.payload as { workflowCorrelationId?: string } | null
  )?.workflowCorrelationId;
  const correlationId =
    storedCorrelationId || `approval-listing-${listingId}-${Date.now()}`;
  await db.insert(approvalRequests).values({
    subjectType: "listing",
    subjectId: listingId,
    action: "submit_listing",
    status: "pending",
    requestedByUserId: actorUserId,
    correlationId,
  });
  await db.insert(activityLogs).values({
    category: "approval",
    action: "listing_approval_requested",
    subjectType: "listing",
    subjectId: listingId,
    actorUserId,
    correlationId,
    outcome: "requested",
    details: {},
  });
  return { correlationId };
}

export async function decideApprovalRequest(input: {
  approvalId: number;
  decision: "approved" | "rejected";
  note?: string;
  actorUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  const [approval] = await db
    .select()
    .from(approvalRequests)
    .where(eq(approvalRequests.id, input.approvalId))
    .limit(1);
  if (!approval || approval.status !== "pending")
    throw new Error("Only a pending approval can be decided.");
  await db
    .update(approvalRequests)
    .set({
      status: input.decision,
      decisionNote: input.note || null,
      decidedByUserId: input.actorUserId,
      decidedAt: new Date(),
    })
    .where(eq(approvalRequests.id, input.approvalId));
  await db.insert(activityLogs).values({
    category: "approval",
    action: `listing_approval_${input.decision}`,
    subjectType: approval.subjectType,
    subjectId: approval.subjectId,
    actorUserId: input.actorUserId,
    correlationId: approval.correlationId,
    outcome: input.decision,
    details: { approvalId: approval.id },
  });
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
  const [channel] = await db
    .select()
    .from(marketplaceChannels)
    .where(eq(marketplaceChannels.code, input.channelCode))
    .limit(1);
  if (!channel) throw new Error("The selected channel is unavailable.");
  const [existing] = await db
    .select()
    .from(channelSaleEvents)
    .where(
      and(
        eq(channelSaleEvents.channelId, channel.id),
        eq(channelSaleEvents.externalEventId, input.externalEventId)
      )
    )
    .limit(1);
  if (existing) {
    await db.insert(activityLogs).values({
      category: "channel",
      action: "channel_sale_event_duplicate_ignored",
      subjectType: "sale_event",
      subjectId: existing.id,
      actorUserId: input.actorUserId,
      correlationId: `sale-duplicate-${existing.id}-${Date.now()}`,
      outcome: "blocked",
      details: {
        channel: input.channelCode,
        externalEventId: input.externalEventId,
      },
    });
    return { status: "duplicate" as const, productId: existing.productId };
  }

  const [listing] = await db
    .select()
    .from(channelListings)
    .where(
      and(
        eq(channelListings.channelId, channel.id),
        eq(channelListings.externalListingId, input.externalListingId)
      )
    )
    .limit(1);
  if (!listing) {
    await db.insert(exceptionQueue).values({
      subjectType: "channel",
      subjectId: channel.id,
      category: "inventory",
      severity: "high",
      message: `Channel sale event could not be matched to a canonical listing for ${channel.displayName}.`,
      details: {
        externalEventId: input.externalEventId,
        externalListingId: input.externalListingId,
        quantity: input.quantity,
      },
      correlationId: `sale-${input.channelCode}-${input.externalEventId}`,
    });
    throw new Error(
      "Channel sale event blocked: no matching channel listing was found."
    );
  }
  const [inventory] = await db
    .select()
    .from(inventoryRecords)
    .where(eq(inventoryRecords.productId, listing.productId))
    .limit(1);
  if (!inventory)
    throw new Error(
      "Channel sale event blocked: no inventory record was found."
    );
  const decision = decideChannelSaleReconciliation({
    eventAlreadyRecorded: false,
    onHand: inventory.onHandQuantity,
    reserved: inventory.reservedQuantity,
    quantity: input.quantity,
  });
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
  const [saleEvent] = await db
    .select()
    .from(channelSaleEvents)
    .where(
      and(
        eq(channelSaleEvents.channelId, channel.id),
        eq(channelSaleEvents.externalEventId, input.externalEventId)
      )
    )
    .limit(1);
  if (!saleEvent)
    throw new Error("Channel sale event could not be loaded after receipt.");
  if (decision === "block") {
    await db
      .update(channelSaleEvents)
      .set({ status: "blocked", reconciledAt: new Date() })
      .where(eq(channelSaleEvents.id, saleEvent.id));
    await db.insert(exceptionQueue).values({
      subjectType: "inventory",
      subjectId: listing.productId,
      category: "inventory",
      severity: "critical",
      message: `Channel sale event was blocked because the canonical reservation could not be committed.`,
      details: {
        channel: input.channelCode,
        externalEventId: input.externalEventId,
        quantity: input.quantity,
        correlationId,
      },
      correlationId,
    });
    await db.insert(activityLogs).values({
      category: "inventory",
      action: "channel_sale_reconciliation_blocked",
      subjectType: "sale_event",
      subjectId: saleEvent.id,
      actorUserId: input.actorUserId,
      correlationId,
      outcome: "blocked",
      details: { channel: input.channelCode, quantity: input.quantity },
    });
    return { status: "blocked" as const, productId: listing.productId };
  }

  const updateResult = await db
    .update(inventoryRecords)
    .set({
      onHandQuantity: sql`${inventoryRecords.onHandQuantity} - ${input.quantity}`,
      reservedQuantity: sql`${inventoryRecords.reservedQuantity} - ${input.quantity}`,
    })
    .where(
      and(
        eq(inventoryRecords.productId, listing.productId),
        gte(inventoryRecords.onHandQuantity, input.quantity),
        gte(inventoryRecords.reservedQuantity, input.quantity)
      )
    );
  if (getAffectedRows(updateResult) !== 1) {
    await db
      .update(channelSaleEvents)
      .set({ status: "blocked", reconciledAt: new Date() })
      .where(eq(channelSaleEvents.id, saleEvent.id));
    throw new Error(
      "Channel sale event blocked: inventory changed during reconciliation."
    );
  }
  const now = new Date();
  await db
    .update(channelSaleEvents)
    .set({ status: "applied", reconciledAt: now })
    .where(eq(channelSaleEvents.id, saleEvent.id));
  await db
    .update(channelListings)
    .set({ state: "sold", lastSynchronizedAt: now })
    .where(eq(channelListings.id, listing.id));
  await db.insert(inventoryMovements).values({
    productId: listing.productId,
    movementType: "sale",
    onHandDelta: -input.quantity,
    reservedDelta: -input.quantity,
    reason: `Channel sale reconciled from ${channel.displayName}`,
    correlationId,
    actorUserId: input.actorUserId,
  });
  await db.insert(activityLogs).values({
    category: "channel",
    action: "channel_sale_reconciled",
    subjectType: "sale_event",
    subjectId: saleEvent.id,
    actorUserId: input.actorUserId,
    correlationId,
    outcome: "succeeded",
    details: {
      channel: input.channelCode,
      productId: listing.productId,
      quantity: input.quantity,
    },
  });
  const relatedListings = await db
    .select()
    .from(channelListings)
    .where(
      and(
        eq(channelListings.productId, listing.productId),
        sql`${channelListings.id} <> ${listing.id}`
      )
    );
  const remainingAvailable = Math.max(
    0,
    inventory.onHandQuantity - inventory.reservedQuantity - input.quantity
  );
  for (const relatedListing of relatedListings) {
    const nextPayload = synchronizePayloadQuantity(
      (relatedListing.payload as Record<string, unknown> | null) ?? null,
      remainingAvailable
    );
    const nextState =
      remainingAvailable === 0 && relatedListing.state === "active"
        ? "ended"
        : relatedListing.state;
    await db
      .update(channelListings)
      .set({
        payload: nextPayload,
        state: nextState,
        lastSynchronizedAt: now,
      })
      .where(eq(channelListings.id, relatedListing.id));
    await db.insert(activityLogs).values({
      category: "channel",
      action: "cross_channel_quantity_synchronized",
      subjectType: "listing",
      subjectId: relatedListing.id,
      actorUserId: input.actorUserId,
      correlationId,
      outcome: "succeeded",
      details: {
        soldOn: input.channelCode,
        remainingAvailable,
        listingState: nextState,
      },
    });
  }
  return { status: "applied" as const, productId: listing.productId };
}
