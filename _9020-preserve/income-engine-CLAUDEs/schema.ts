import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Chat Sessions
export const chatSessions = mysqlTable("chat_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

// Chat Messages
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  model: varchar("model", { length: 255 }).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// Provider Configurations
export const providerConfigs = mysqlTable("provider_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  apiKey: text("apiKey"),
  baseUrl: varchar("baseUrl", { length: 1024 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProviderConfig = typeof providerConfigs.$inferSelect;
export type InsertProviderConfig = typeof providerConfigs.$inferInsert;

// Manus Tasks
export const manusTasks = mysqlTable("manus_tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  taskId: varchar("taskId", { length: 255 }).notNull().unique(),
  prompt: text("prompt").notNull(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed", "stopped"]).default("pending"),
  result: text("result"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ManusTask = typeof manusTasks.$inferSelect;
export type InsertManusTask = typeof manusTasks.$inferInsert;

// Paperclip Configuration
export const paperclipConfigs = mysqlTable("paperclip_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  apiUrl: varchar("apiUrl", { length: 1024 }).notNull(),
  apiKey: text("apiKey").notNull(),
  companyId: varchar("companyId", { length: 255 }).notNull(),
  agentId: varchar("agentId", { length: 255 }),
  isConnected: boolean("isConnected").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaperclipConfig = typeof paperclipConfigs.$inferSelect;
export type InsertPaperclipConfig = typeof paperclipConfigs.$inferInsert;

// FETCHER Leads
export const fetcherLeads = mysqlTable("fetcher_leads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  source: varchar("source", { length: 64 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  url: varchar("url", { length: 2048 }).notNull(),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  postedAt: timestamp("postedAt"),
  deliverable: text("deliverable"),
  estimatedHourlyRate: decimal("estimatedHourlyRate", { precision: 10, scale: 2 }),
  qualified: boolean("qualified").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FetcherLead = typeof fetcherLeads.$inferSelect;
export type InsertFetcherLead = typeof fetcherLeads.$inferInsert;

// Paperclip Task Delegations
export const paperclipDelegations = mysqlTable("paperclip_delegations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentId: varchar("agentId", { length: 255 }).notNull(),
  taskDescription: text("taskDescription").notNull(),
  status: mysqlEnum("status", ["pending", "assigned", "in_progress", "completed", "failed"]).default("pending"),
  result: text("result"),
  delegatedAt: timestamp("delegatedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaperclipDelegation = typeof paperclipDelegations.$inferSelect;
export type InsertPaperclipDelegation = typeof paperclipDelegations.$inferInsert;