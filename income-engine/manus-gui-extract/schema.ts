import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

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

/**
 * Chat sessions table for storing conversation threads.
 */
export const chatSessions = mysqlTable("chatSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

/**
 * Chat messages table for storing conversation history.
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  provider: varchar("provider", { length: 64 }).notNull(), // "ollama", "openrouter", "openai", "manus"
  model: varchar("model", { length: 255 }).notNull(),
  metadata: json("metadata"), // Store additional info like tokens, latency, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Provider configurations table for storing API keys and endpoints.
 */
export const providerConfigs = mysqlTable("providerConfigs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: varchar("provider", { length: 64 }).notNull(), // "ollama", "openrouter", "openai", "manus"
  apiKey: text("apiKey"), // Encrypted in production
  baseUrl: varchar("baseUrl", { length: 500 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProviderConfig = typeof providerConfigs.$inferSelect;
export type InsertProviderConfig = typeof providerConfigs.$inferInsert;

/**
 * FETCHER logs table for storing lead scanning results.
 */
export const fetcherLogs = mysqlTable("fetcherLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  source: varchar("source", { length: 64 }).notNull(), // "reddit_forhire", "reddit_websiteservices", "upwork", "fiverr"
  title: varchar("title", { length: 500 }).notNull(),
  url: text("url").notNull(),
  budget: int("budget"),
  postedAt: timestamp("postedAt"),
  deliverable: text("deliverable"),
  estimatedHourlyRate: int("estimatedHourlyRate"),
  qualified: boolean("qualified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FetcherLog = typeof fetcherLogs.$inferSelect;
export type InsertFetcherLog = typeof fetcherLogs.$inferInsert;

/**
 * Manus API tasks table for tracking task lifecycle.
 */
export const manusTasks = mysqlTable("manusTasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  taskId: varchar("taskId", { length: 255 }).notNull().unique(),
  prompt: text("prompt").notNull(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed", "stopped"]).default("pending").notNull(),
  result: text("result"),
  metadata: json("metadata"), // Store task details, messages, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ManusTask = typeof manusTasks.$inferSelect;
export type InsertManusTask = typeof manusTasks.$inferInsert;