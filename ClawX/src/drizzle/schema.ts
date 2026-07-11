import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, json } from 'drizzle-orm/mysql-core';

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  openId: varchar('openId', { length: 64 }).notNull().unique(),
  name: text('name'),
  email: varchar('email', { length: 320 }),
  loginMethod: varchar('loginMethod', { length: 64 }),
  role: mysqlEnum('role', ['user', 'admin']).default('user').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp('lastSignedIn').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * AI Provider configurations
 */
export const aiProviders = mysqlTable('ai_providers', {
  id: int('id').autoincrement().primaryKey(),
  slug: varchar('slug', { length: 32 }).notNull().unique(),
  name: varchar('name', { length: 64 }).notNull(),
  type: mysqlEnum('type', ['cloud', 'local', 'builtin']).notNull(),
  baseUrl: text('baseUrl'),
  model: varchar('model', { length: 128 }),
  isEnabled: int('isEnabled').default(1).notNull(),
  priority: int('priority').default(0).notNull(),
  costPerInputToken: text('costPerInputToken'),
  costPerOutputToken: text('costPerOutputToken'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

export type AiProvider = typeof aiProviders.$inferSelect;
export type InsertAiProvider = typeof aiProviders.$inferInsert;

/**
 * Conversations (chat sessions)
 */
export const conversations = mysqlTable('conversations', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull(),
  title: varchar('title', { length: 256 }).default('New Chat').notNull(),
  mode: mysqlEnum('mode', ['single', 'broadcast']).default('single').notNull(),
  selectedProviders: json('selectedProviders').$type<string[]>(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages within conversations
 */
export const messages = mysqlTable('messages', {
  id: int('id').autoincrement().primaryKey(),
  conversationId: int('conversationId').notNull(),
  role: mysqlEnum('role', ['user', 'assistant', 'system']).notNull(),
  content: text('content').notNull(),
  providerSlug: varchar('providerSlug', { length: 32 }),
  model: varchar('model', { length: 128 }),
  inputTokens: int('inputTokens'),
  outputTokens: int('outputTokens'),
  responseTimeMs: int('responseTimeMs'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Usage logs for analytics
 */
export const usageLogs = mysqlTable('usage_logs', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull(),
  providerSlug: varchar('providerSlug', { length: 32 }).notNull(),
  model: varchar('model', { length: 128 }),
  inputTokens: int('inputTokens').default(0).notNull(),
  outputTokens: int('outputTokens').default(0).notNull(),
  responseTimeMs: int('responseTimeMs'),
  estimatedCost: text('estimatedCost'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type UsageLog = typeof usageLogs.$inferSelect;
export type InsertUsageLog = typeof usageLogs.$inferInsert;

/**
 * JoshuaCLAW Governance System
 * 7 voters: Joshua (human, odd tiebreaker) + 6 AI platforms (even)
 * Majority = 4/7 votes to pass
 * Tier 1 (Critical): Pricing changes, contract deployments, Iron Wall changes
 * Tier 2 (Operational): Bug fixes, UI updates, marketing pushes
 */
export const governanceProposals = mysqlTable('governance_proposals', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 256 }).notNull(),
  description: text('description').notNull(),
  tier: mysqlEnum('tier', ['critical', 'operational']).notNull(),
  category: varchar('category', { length: 64 }).notNull(),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected', 'expired']).default('pending').notNull(),
  proposedBy: varchar('proposedBy', { length: 64 }).notNull(),
  requiredVotes: int('requiredVotes').default(4).notNull(),
  totalVotes: int('totalVotes').default(0).notNull(),
  approveVotes: int('approveVotes').default(0).notNull(),
  rejectVotes: int('rejectVotes').default(0).notNull(),
  expiresAt: timestamp('expiresAt'),
  resolvedAt: timestamp('resolvedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

export type GovernanceProposal = typeof governanceProposals.$inferSelect;
export type InsertGovernanceProposal = typeof governanceProposals.$inferInsert;

export const governanceVotes = mysqlTable('governance_votes', {
  id: int('id').autoincrement().primaryKey(),
  proposalId: int('proposalId').notNull(),
  voterSlug: varchar('voterSlug', { length: 64 }).notNull(),
  voterType: mysqlEnum('voterType', ['human', 'ai']).notNull(),
  vote: mysqlEnum('vote', ['approve', 'reject']).notNull(),
  reasoning: text('reasoning'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type GovernanceVote = typeof governanceVotes.$inferSelect;
export type InsertGovernanceVote = typeof governanceVotes.$inferInsert;

/**
 * Per-user API keys — encrypted at rest, never sent to frontend.
 * Each user can store their own key for each AI provider.
 * Keys are AES-256 encrypted before storage using JWT_SECRET as the cipher key.
 */
export const userApiKeys = mysqlTable('user_api_keys', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull(),
  providerSlug: varchar('providerSlug', { length: 32 }).notNull(),
  // Encrypted API key — never stored in plaintext
  encryptedKey: text('encryptedKey').notNull(),
  // Last 4 chars of the raw key for display (e.g. "...sk-4xZ9")
  keyHint: varchar('keyHint', { length: 8 }),
  // Optional label for the key
  label: varchar('label', { length: 64 }),
  isActive: int('isActive').default(1).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

export type UserApiKey = typeof userApiKeys.$inferSelect;
export type InsertUserApiKey = typeof userApiKeys.$inferInsert;
