import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  openId: text("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: text("email", { length: 320 }),
  loginMethod: text("loginMethod", { length: 64 }),
  role: text("role", { enum: ["admin", "user"] })
    .default("user")
    .notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())
    .notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const products = sqliteTable(
  "products",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    sku: text("sku", { length: 128 }).notNull(),
    upc: text("upc", { length: 32 }),
    title: text("title", { length: 255 }).notNull(),
    condition: text("condition", { length: 64 }).notNull(),
    conditionNotes: text("conditionNotes"),
    brandOrStudio: text("brandOrStudio", { length: 160 }),
    format: text("format", { length: 80 }),
    attributes: text("attributes", { mode: "json" }),
    description: text("description"),
    verificationStatus: text("verificationStatus", {
      enum: ["needs_review", "verified", "blocked"],
    })
      .default("needs_review")
      .notNull(),
    verifiedAt: integer("verifiedAt", { mode: "timestamp_ms" }),
    verifiedByUserId: integer("verifiedByUserId", { mode: "number" }),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  table => [
    uniqueIndex("products_sku_unique").on(table.sku),
    index("products_upc_index").on(table.upc),
  ]
);

export const productMedia = sqliteTable(
  "product_media",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    productId: integer("productId", { mode: "number" }).notNull(),
    url: text("url").notNull(),
    altText: text("altText", { length: 255 }),
    mediaType: text("mediaType", { enum: ["image", "video", "document"] })
      .default("image")
      .notNull(),
    isPrimary: integer("isPrimary", { mode: "boolean" })
      .default(false)
      .notNull(),
    verified: integer("verified", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  table => [index("product_media_product_index").on(table.productId)]
);

export const inventoryRecords = sqliteTable(
  "inventory_records",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    productId: integer("productId", { mode: "number" }).notNull(),
    onHandQuantity: integer("onHandQuantity", { mode: "number" })
      .default(0)
      .notNull(),
    reservedQuantity: integer("reservedQuantity", { mode: "number" })
      .default(0)
      .notNull(),
    locationKey: text("locationKey", { length: 128 })
      .default("llc-primary")
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  table => [uniqueIndex("inventory_records_product_unique").on(table.productId)]
);

export const inventoryMovements = sqliteTable(
  "inventory_movements",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    productId: integer("productId", { mode: "number" }).notNull(),
    movementType: text("movementType", {
      enum: ["receive", "reserve", "release", "sale", "adjustment"],
    }).notNull(),
    onHandDelta: integer("onHandDelta", { mode: "number" })
      .default(0)
      .notNull(),
    reservedDelta: integer("reservedDelta", { mode: "number" })
      .default(0)
      .notNull(),
    reason: text("reason", { length: 255 }).notNull(),
    correlationId: text("correlationId", { length: 128 }).notNull(),
    actorUserId: integer("actorUserId", { mode: "number" }),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  table => [
    index("inventory_movements_product_index").on(table.productId),
    index("inventory_movements_correlation_index").on(table.correlationId),
  ]
);

export const marketplaceChannels = sqliteTable(
  "marketplace_channels",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    code: text("code", {
      enum: [
        "ebay",
        "google_merchant",
        "facebook_marketplace",
        "mercari",
        "poshmark",
      ],
    }).notNull(),
    displayName: text("displayName", { length: 100 }).notNull(),
    capability: text("capability", {
      enum: ["api", "conditional", "prepared"],
    })
      .default("prepared")
      .notNull(),
    operationMode: text("operationMode", {
      enum: ["disabled", "review", "enabled"],
    })
      .default("disabled")
      .notNull(),
    enabled: integer("enabled", { mode: "boolean" }).default(false).notNull(),
    lastSyncAt: integer("lastSyncAt", { mode: "timestamp_ms" }),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  table => [uniqueIndex("marketplace_channels_code_unique").on(table.code)]
);

export const credentialConnections = sqliteTable(
  "credential_connections",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    channelId: integer("channelId", { mode: "number" }).notNull(),
    secretKeyName: text("secretKeyName", { length: 128 }).notNull(),
    secretRef: text("secretRef", { length: 512 }),
    configured: integer("configured", { mode: "boolean" })
      .default(false)
      .notNull(),
    lastVerifiedAt: integer("lastVerifiedAt", { mode: "timestamp_ms" }),
    lastVerificationStatus: text("lastVerificationStatus", {
      enum: ["not_checked", "valid", "invalid", "unavailable"],
    })
      .default("not_checked")
      .notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  table => [
    uniqueIndex("credential_connections_channel_key_unique").on(
      table.channelId,
      table.secretKeyName
    ),
  ]
);

export const policyMappings = sqliteTable(
  "policy_mappings",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    channelId: integer("channelId", { mode: "number" }).notNull(),
    policyType: text("policyType", {
      enum: [
        "fulfillment",
        "return",
        "payment",
        "location",
        "category",
        "listing_rule",
      ],
    }).notNull(),
    policyKey: text("policyKey", { length: 128 }).notNull(),
    policyValue: text("policyValue").notNull(),
    active: integer("active", { mode: "boolean" }).default(true).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  table => [index("policy_mappings_channel_index").on(table.channelId)]
);

export const channelListings = sqliteTable(
  "channel_listings",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    productId: integer("productId", { mode: "number" }).notNull(),
    channelId: integer("channelId", { mode: "number" }).notNull(),
    externalListingId: text("externalListingId", { length: 160 }),
    externalOfferId: text("externalOfferId", { length: 160 }),
    state: text("state", {
      enum: [
        "draft",
        "review",
        "approved",
        "submitted",
        "active",
        "sold",
        "ended",
        "error",
      ],
    })
      .default("draft")
      .notNull(),
    payload: text("payload", { mode: "json" }),
    validationErrors: text("validationErrors", { mode: "json" }),
    lastSubmittedAt: integer("lastSubmittedAt", { mode: "timestamp_ms" }),
    lastSynchronizedAt: integer("lastSynchronizedAt", {
      mode: "timestamp_ms",
    }),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  table => [
    uniqueIndex("channel_listings_product_channel_unique").on(
      table.productId,
      table.channelId
    ),
    index("channel_listings_state_index").on(table.state),
  ]
);

export const channelSaleEvents = sqliteTable(
  "channel_sale_events",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    channelId: integer("channelId", { mode: "number" }).notNull(),
    productId: integer("productId", { mode: "number" }).notNull(),
    externalEventId: text("externalEventId", { length: 160 }).notNull(),
    externalListingId: text("externalListingId", { length: 160 }).notNull(),
    quantity: integer("quantity", { mode: "number" }).notNull(),
    status: text("status", {
      enum: ["received", "applied", "duplicate", "blocked"],
    })
      .default("received")
      .notNull(),
    details: text("details", { mode: "json" }),
    occurredAt: integer("occurredAt", { mode: "timestamp_ms" }).notNull(),
    reconciledAt: integer("reconciledAt", { mode: "timestamp_ms" }),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  table => [
    uniqueIndex("channel_sale_events_channel_external_unique").on(
      table.channelId,
      table.externalEventId
    ),
    index("channel_sale_events_product_index").on(table.productId),
  ]
);

export const approvalRequests = sqliteTable(
  "approval_requests",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    subjectType: text("subjectType", {
      enum: ["listing", "inventory", "profile", "channel"],
    }).notNull(),
    subjectId: integer("subjectId", { mode: "number" }).notNull(),
    action: text("action", { length: 100 }).notNull(),
    status: text("status", {
      enum: ["pending", "approved", "rejected", "expired"],
    })
      .default("pending")
      .notNull(),
    requestedByUserId: integer("requestedByUserId", { mode: "number" }),
    decidedByUserId: integer("decidedByUserId", { mode: "number" }),
    decisionNote: text("decisionNote"),
    correlationId: text("correlationId", { length: 128 })
      .default("system")
      .notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
    decidedAt: integer("decidedAt", { mode: "timestamp_ms" }),
  },
  table => [
    index("approval_requests_status_index").on(table.status),
    index("approval_requests_subject_index").on(
      table.subjectType,
      table.subjectId
    ),
    index("approval_requests_correlation_index").on(table.correlationId),
  ]
);

export const exceptionQueue = sqliteTable(
  "exception_queue",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    subjectType: text("subjectType", {
      enum: ["product", "listing", "inventory", "channel", "profile"],
    }).notNull(),
    subjectId: integer("subjectId", { mode: "number" }).notNull(),
    category: text("category", {
      enum: [
        "incomplete",
        "unsupported",
        "validation",
        "submission",
        "inventory",
        "security",
      ],
    }).notNull(),
    severity: text("severity", {
      enum: ["low", "medium", "high", "critical"],
    })
      .default("medium")
      .notNull(),
    message: text("message").notNull(),
    details: text("details", { mode: "json" }),
    status: text("status", { enum: ["open", "resolved", "dismissed"] })
      .default("open")
      .notNull(),
    resolvedByUserId: integer("resolvedByUserId", { mode: "number" }),
    resolvedAt: integer("resolvedAt", { mode: "timestamp_ms" }),
    correlationId: text("correlationId", { length: 128 })
      .default("system")
      .notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  table => [
    index("exception_queue_status_index").on(table.status),
    index("exception_queue_severity_index").on(table.severity),
    index("exception_queue_correlation_index").on(table.correlationId),
  ]
);

export const automationProfiles = sqliteTable(
  "automation_profiles",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name", { length: 120 }).notNull(),
    purpose: text("purpose").notNull(),
    memorySummary: text("memorySummary"),
    skillKeys: text("skillKeys", { mode: "json" }),
    allowedActions: text("allowedActions", { mode: "json" }),
    channelScope: text("channelScope", { mode: "json" }),
    approvalRequired: integer("approvalRequired", { mode: "boolean" })
      .default(true)
      .notNull(),
    enabled: integer("enabled", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  table => [uniqueIndex("automation_profiles_name_unique").on(table.name)]
);

export const externalComponents = sqliteTable(
  "external_components",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name", { length: 160 }).notNull(),
    sourceUrl: text("sourceUrl", { length: 512 }).notNull(),
    sourceReference: text("sourceReference", { length: 160 }),
    license: text("license", { length: 120 }),
    attributionText: text("attributionText"),
    integrationBoundary: text("integrationBoundary").notNull(),
    reviewStatus: text("reviewStatus", {
      enum: ["pending", "approved", "rejected"],
    })
      .default("pending")
      .notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  table => [
    uniqueIndex("external_components_source_unique").on(table.sourceUrl),
  ]
);

export const activityLogs = sqliteTable(
  "activity_logs",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    category: text("category", {
      enum: [
        "catalog",
        "inventory",
        "listing",
        "approval",
        "channel",
        "profile",
        "system",
      ],
    }).notNull(),
    action: text("action", { length: 160 }).notNull(),
    subjectType: text("subjectType", { length: 80 }).notNull(),
    subjectId: integer("subjectId", { mode: "number" }),
    actorUserId: integer("actorUserId", { mode: "number" }),
    profileId: integer("profileId", { mode: "number" }),
    correlationId: text("correlationId", { length: 128 }).notNull(),
    outcome: text("outcome", {
      enum: [
        "requested",
        "approved",
        "rejected",
        "succeeded",
        "failed",
        "blocked",
      ],
    }).notNull(),
    details: text("details", { mode: "json" }),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  table => [
    index("activity_logs_category_index").on(table.category),
    index("activity_logs_correlation_index").on(table.correlationId),
    index("activity_logs_created_index").on(table.createdAt),
  ]
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
