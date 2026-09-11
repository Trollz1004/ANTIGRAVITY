import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "user"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    sku: varchar("sku", { length: 128 }).notNull(),
    upc: varchar("upc", { length: 32 }),
    title: varchar("title", { length: 255 }).notNull(),
    condition: varchar("condition", { length: 64 }).notNull(),
    conditionNotes: text("conditionNotes"),
    brandOrStudio: varchar("brandOrStudio", { length: 160 }),
    format: varchar("format", { length: 80 }),
    attributes: json("attributes"),
    description: text("description"),
    verificationStatus: mysqlEnum("verificationStatus", ["needs_review", "verified", "blocked"])
      .default("needs_review")
      .notNull(),
    verifiedAt: timestamp("verifiedAt"),
    verifiedByUserId: int("verifiedByUserId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("products_sku_unique").on(table.sku), index("products_upc_index").on(table.upc)]
);

export const productMedia = mysqlTable(
  "product_media",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("productId").notNull(),
    url: text("url").notNull(),
    altText: varchar("altText", { length: 255 }),
    mediaType: mysqlEnum("mediaType", ["image", "video", "document"]).default("image").notNull(),
    isPrimary: boolean("isPrimary").default(false).notNull(),
    verified: boolean("verified").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("product_media_product_index").on(table.productId)]
);

export const inventoryRecords = mysqlTable(
  "inventory_records",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("productId").notNull(),
    onHandQuantity: int("onHandQuantity").default(0).notNull(),
    reservedQuantity: int("reservedQuantity").default(0).notNull(),
    locationKey: varchar("locationKey", { length: 128 }).default("llc-primary").notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("inventory_records_product_unique").on(table.productId)]
);

export const inventoryMovements = mysqlTable(
  "inventory_movements",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("productId").notNull(),
    movementType: mysqlEnum("movementType", ["receive", "reserve", "release", "sale", "adjustment"])
      .notNull(),
    onHandDelta: int("onHandDelta").default(0).notNull(),
    reservedDelta: int("reservedDelta").default(0).notNull(),
    reason: varchar("reason", { length: 255 }).notNull(),
    correlationId: varchar("correlationId", { length: 128 }).notNull(),
    actorUserId: int("actorUserId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("inventory_movements_product_index").on(table.productId), index("inventory_movements_correlation_index").on(table.correlationId)]
);

export const marketplaceChannels = mysqlTable(
  "marketplace_channels",
  {
    id: int("id").autoincrement().primaryKey(),
    code: mysqlEnum("code", ["ebay", "google_merchant", "facebook_marketplace", "mercari", "poshmark"])
      .notNull(),
    displayName: varchar("displayName", { length: 100 }).notNull(),
    capability: mysqlEnum("capability", ["api", "conditional", "prepared"])
      .default("prepared")
      .notNull(),
    operationMode: mysqlEnum("operationMode", ["disabled", "review", "enabled"])
      .default("disabled")
      .notNull(),
    enabled: boolean("enabled").default(false).notNull(),
    lastSyncAt: timestamp("lastSyncAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("marketplace_channels_code_unique").on(table.code)]
);

export const credentialConnections = mysqlTable(
  "credential_connections",
  {
    id: int("id").autoincrement().primaryKey(),
    channelId: int("channelId").notNull(),
    secretKeyName: varchar("secretKeyName", { length: 128 }).notNull(),
    secretRef: varchar("secretRef", { length: 512 }),
    configured: boolean("configured").default(false).notNull(),
    lastVerifiedAt: timestamp("lastVerifiedAt"),
    lastVerificationStatus: mysqlEnum("lastVerificationStatus", ["not_checked", "valid", "invalid", "unavailable"])
      .default("not_checked")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("credential_connections_channel_key_unique").on(table.channelId, table.secretKeyName)]
);

export const policyMappings = mysqlTable(
  "policy_mappings",
  {
    id: int("id").autoincrement().primaryKey(),
    channelId: int("channelId").notNull(),
    policyType: mysqlEnum("policyType", ["fulfillment", "return", "payment", "location", "category", "listing_rule"])
      .notNull(),
    policyKey: varchar("policyKey", { length: 128 }).notNull(),
    policyValue: text("policyValue").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("policy_mappings_channel_index").on(table.channelId)]
);

export const channelListings = mysqlTable(
  "channel_listings",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("productId").notNull(),
    channelId: int("channelId").notNull(),
    externalListingId: varchar("externalListingId", { length: 160 }),
    state: mysqlEnum("state", ["draft", "review", "approved", "submitted", "active", "sold", "ended", "error"])
      .default("draft")
      .notNull(),
    payload: json("payload"),
    validationErrors: json("validationErrors"),
    lastSubmittedAt: timestamp("lastSubmittedAt"),
    lastSynchronizedAt: timestamp("lastSynchronizedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("channel_listings_product_channel_unique").on(table.productId, table.channelId), index("channel_listings_state_index").on(table.state)]
);

export const channelSaleEvents = mysqlTable(
  "channel_sale_events",
  {
    id: int("id").autoincrement().primaryKey(),
    channelId: int("channelId").notNull(),
    productId: int("productId").notNull(),
    externalEventId: varchar("externalEventId", { length: 160 }).notNull(),
    externalListingId: varchar("externalListingId", { length: 160 }).notNull(),
    quantity: int("quantity").notNull(),
    status: mysqlEnum("status", ["received", "applied", "duplicate", "blocked"]).default("received").notNull(),
    details: json("details"),
    occurredAt: timestamp("occurredAt").notNull(),
    reconciledAt: timestamp("reconciledAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("channel_sale_events_channel_external_unique").on(table.channelId, table.externalEventId), index("channel_sale_events_product_index").on(table.productId)]
);

export const approvalRequests = mysqlTable(
  "approval_requests",
  {
    id: int("id").autoincrement().primaryKey(),
    subjectType: mysqlEnum("subjectType", ["listing", "inventory", "profile", "channel"])
      .notNull(),
    subjectId: int("subjectId").notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    status: mysqlEnum("status", ["pending", "approved", "rejected", "expired"])
      .default("pending")
      .notNull(),
    requestedByUserId: int("requestedByUserId"),
    decidedByUserId: int("decidedByUserId"),
    decisionNote: text("decisionNote"),
    correlationId: varchar("correlationId", { length: 128 }).default("system").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    decidedAt: timestamp("decidedAt"),
  },
  table => [index("approval_requests_status_index").on(table.status), index("approval_requests_subject_index").on(table.subjectType, table.subjectId), index("approval_requests_correlation_index").on(table.correlationId)]
);

export const exceptionQueue = mysqlTable(
  "exception_queue",
  {
    id: int("id").autoincrement().primaryKey(),
    subjectType: mysqlEnum("subjectType", ["product", "listing", "inventory", "channel", "profile"])
      .notNull(),
    subjectId: int("subjectId").notNull(),
    category: mysqlEnum("category", ["incomplete", "unsupported", "validation", "submission", "inventory", "security"])
      .notNull(),
    severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
    message: text("message").notNull(),
    details: json("details"),
    status: mysqlEnum("status", ["open", "resolved", "dismissed"]).default("open").notNull(),
    resolvedByUserId: int("resolvedByUserId"),
    resolvedAt: timestamp("resolvedAt"),
    correlationId: varchar("correlationId", { length: 128 }).default("system").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("exception_queue_status_index").on(table.status), index("exception_queue_severity_index").on(table.severity), index("exception_queue_correlation_index").on(table.correlationId)]
);

export const automationProfiles = mysqlTable(
  "automation_profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    purpose: text("purpose").notNull(),
    memorySummary: text("memorySummary"),
    skillKeys: json("skillKeys"),
    allowedActions: json("allowedActions"),
    channelScope: json("channelScope"),
    approvalRequired: boolean("approvalRequired").default(true).notNull(),
    enabled: boolean("enabled").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("automation_profiles_name_unique").on(table.name)]
);

export const externalComponents = mysqlTable(
  "external_components",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    sourceUrl: varchar("sourceUrl", { length: 512 }).notNull(),
    sourceReference: varchar("sourceReference", { length: 160 }),
    license: varchar("license", { length: 120 }),
    attributionText: text("attributionText"),
    integrationBoundary: text("integrationBoundary").notNull(),
    reviewStatus: mysqlEnum("reviewStatus", ["pending", "approved", "rejected"])
      .default("pending")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("external_components_source_unique").on(table.sourceUrl)]
);

export const activityLogs = mysqlTable(
  "activity_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    category: mysqlEnum("category", ["catalog", "inventory", "listing", "approval", "channel", "profile", "system"])
      .notNull(),
    action: varchar("action", { length: 160 }).notNull(),
    subjectType: varchar("subjectType", { length: 80 }).notNull(),
    subjectId: int("subjectId"),
    actorUserId: int("actorUserId"),
    profileId: int("profileId"),
    correlationId: varchar("correlationId", { length: 128 }).notNull(),
    outcome: mysqlEnum("outcome", ["requested", "approved", "rejected", "succeeded", "failed", "blocked"])
      .notNull(),
    details: json("details"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("activity_logs_category_index").on(table.category), index("activity_logs_correlation_index").on(table.correlationId), index("activity_logs_created_index").on(table.createdAt)]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InventoryRecord = typeof inventoryRecords.$inferSelect;
export type MarketplaceChannel = typeof marketplaceChannels.$inferSelect;
export type ChannelListing = typeof channelListings.$inferSelect;
export type ChannelSaleEvent = typeof channelSaleEvents.$inferSelect;
export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type ExceptionRecord = typeof exceptionQueue.$inferSelect;
export type AutomationProfile = typeof automationProfiles.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
