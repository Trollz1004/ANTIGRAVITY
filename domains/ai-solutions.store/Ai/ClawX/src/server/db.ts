import { eq, desc, sql, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import {
  InsertUser,
  users,
  conversations,
  messages,
  usageLogs,
  aiProviders,
  type InsertConversation,
  type InsertMessage,
  type InsertUsageLog,
  type InsertAiProvider,
} from '../drizzle/schema';
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn('[Database] Failed to connect:', error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers ───────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error('User openId is required for upsert');
  const db = await getDb();
  if (!db) {
    console.warn('[Database] Cannot upsert user: database not available');
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ['name', 'email', 'loginMethod'] as const;
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
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error('[Database] Failed to upsert user:', error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Conversation helpers ───────────────────────────────────────────

export async function createConversation(data: InsertConversation) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(conversations).values(data);
  return { id: result[0].insertId };
}

export async function getConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
}

export async function getConversation(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
    .limit(1);
  return result[0];
}

export async function updateConversationTitle(id: number, title: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(conversations).set({ title }).where(eq(conversations.id, id));
}

export async function deleteConversation(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(messages).where(eq(messages.conversationId, id));
  await db.delete(conversations).where(eq(conversations.id, id));
}

// ─── Message helpers ────────────────────────────────────────────────

export async function addMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(messages).values(data);
  return { id: result[0].insertId };
}

export async function getMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
}

// ─── Usage log helpers ──────────────────────────────────────────────

export async function addUsageLog(data: InsertUsageLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(usageLogs).values(data);
}

export async function getUsageStats(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      providerSlug: usageLogs.providerSlug,
      totalInputTokens: sql<number>`SUM(${usageLogs.inputTokens})`,
      totalOutputTokens: sql<number>`SUM(${usageLogs.outputTokens})`,
      avgResponseTime: sql<number>`AVG(${usageLogs.responseTimeMs})`,
      totalRequests: sql<number>`COUNT(*)`,
      totalCost: sql<string>`SUM(CAST(${usageLogs.estimatedCost} AS DECIMAL(10,6)))`,
    })
    .from(usageLogs)
    .where(eq(usageLogs.userId, userId))
    .groupBy(usageLogs.providerSlug);
}

export async function getUsageTimeline(userId: number, days: number = 7) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      date: sql<string>`DATE(${usageLogs.createdAt})`,
      providerSlug: usageLogs.providerSlug,
      totalTokens: sql<number>`SUM(${usageLogs.inputTokens} + ${usageLogs.outputTokens})`,
      requests: sql<number>`COUNT(*)`,
    })
    .from(usageLogs)
    .where(and(eq(usageLogs.userId, userId), sql`${usageLogs.createdAt} >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`))
    .groupBy(sql`DATE(${usageLogs.createdAt})`, usageLogs.providerSlug)
    .orderBy(sql`DATE(${usageLogs.createdAt})`);
}

// ─── Provider helpers ───────────────────────────────────────────────

export async function getProviders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiProviders).orderBy(aiProviders.priority);
}

export async function upsertProvider(data: InsertAiProvider) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(aiProviders)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        name: data.name,
        type: data.type,
        baseUrl: data.baseUrl,
        model: data.model,
        isEnabled: data.isEnabled,
        priority: data.priority,
        costPerInputToken: data.costPerInputToken,
        costPerOutputToken: data.costPerOutputToken,
      },
    });
}
