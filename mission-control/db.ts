import { eq, and, desc, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, chatSessions, chatMessages, providerConfigs, fetcherLogs, manusTasks, InsertChatSession, InsertChatMessage, InsertProviderConfig, InsertFetcherLog, InsertManusTask } from "../drizzle/schema";
import { ENV } from './_core/env';

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

// Chat Sessions
export async function createChatSession(userId: number, title: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(chatSessions).values({ userId, title });
  return result;
}

export async function getChatSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(chatSessions).where(eq(chatSessions.userId, userId)).orderBy(desc(chatSessions.updatedAt));
}

export async function updateChatSession(sessionId: number, title: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(chatSessions).set({ title, updatedAt: new Date() }).where(eq(chatSessions.id, sessionId));
}

export async function deleteChatSession(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(chatSessions).where(eq(chatSessions.id, sessionId));
}

// Chat Messages
export async function createChatMessage(sessionId: number, role: "user" | "assistant", content: string, provider: string, model: string, metadata?: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(chatMessages).values({ sessionId, role, content, provider, model, metadata });
}

export async function getChatMessages(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(chatMessages.createdAt);
}

// Provider Configs
export async function upsertProviderConfig(userId: number, provider: string, apiKey?: string, baseUrl?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(providerConfigs).where(and(eq(providerConfigs.userId, userId), eq(providerConfigs.provider, provider))).limit(1);
  
  if (existing.length > 0) {
    return await db.update(providerConfigs).set({ apiKey, baseUrl, updatedAt: new Date() }).where(eq(providerConfigs.id, existing[0].id));
  } else {
    return await db.insert(providerConfigs).values({ userId, provider, apiKey, baseUrl });
  }
}

export async function getProviderConfigs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(providerConfigs).where(eq(providerConfigs.userId, userId));
}

export async function getProviderConfig(userId: number, provider: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(providerConfigs).where(and(eq(providerConfigs.userId, userId), eq(providerConfigs.provider, provider))).limit(1);
  return result.length > 0 ? result[0] : null;
}

// FETCHER Logs
export async function createFetcherLog(log: InsertFetcherLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(fetcherLogs).values(log);
}

export async function getQualifiedFetcherLogs(userId: number, hoursAgo: number = 24) {
  const db = await getDb();
  if (!db) return [];
  
  const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  return await db.select().from(fetcherLogs).where(and(eq(fetcherLogs.userId, userId), eq(fetcherLogs.qualified, true), gt(fetcherLogs.createdAt, cutoffTime))).orderBy(desc(fetcherLogs.createdAt));
}

// Manus Tasks
export async function createManusTask(userId: number, taskId: string, prompt: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(manusTasks).values({ userId, taskId, prompt, status: "pending" });
}

export async function updateManusTaskStatus(taskId: string, status: "pending" | "running" | "completed" | "failed" | "stopped", result?: string, metadata?: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(manusTasks).set({ status, result, metadata, updatedAt: new Date() }).where(eq(manusTasks.taskId, taskId));
}

export async function getManusTask(taskId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(manusTasks).where(eq(manusTasks.taskId, taskId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserManusTasks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(manusTasks).where(eq(manusTasks.userId, userId)).orderBy(desc(manusTasks.updatedAt));
}
