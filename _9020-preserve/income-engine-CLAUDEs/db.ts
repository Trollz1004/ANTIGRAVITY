import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  chatSessions,
  chatMessages,
  providerConfigs,
  manusTasks,
  paperclipConfigs,
  fetcherLeads,
  paperclipDelegations,
  ChatSession,
  ChatMessage,
  ProviderConfig,
  ManusTask,
  PaperclipConfig,
  FetcherLead,
  PaperclipDelegation,
  InsertPaperclipDelegation,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

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
      values.role = "admin";
      updateSet.role = "admin";
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

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Chat Sessions
export async function createChatSession(
  userId: number,
  title: string
): Promise<ChatSession> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .insert(chatSessions)
    .values({ userId, title });

  const result = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy((t) => t.id)
    .limit(1);

  return result[0] as ChatSession;
}

export async function getChatSessions(userId: number): Promise<ChatSession[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId));
}

export async function updateChatSession(
  sessionId: number,
  title: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(chatSessions)
    .set({ title })
    .where(eq(chatSessions.id, sessionId));
}

export async function deleteChatSession(sessionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(chatSessions)
    .where(eq(chatSessions.id, sessionId));
}

// Chat Messages
export async function createChatMessage(
  sessionId: number,
  role: "user" | "assistant" | "system",
  content: string,
  provider: string,
  model: string,
  metadata?: any
): Promise<ChatMessage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .insert(chatMessages)
    .values({ sessionId, role, content, provider, model, metadata });

  const result = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy((m) => m.id)
    .limit(1);

  return result[0] as ChatMessage;
}

export async function getChatMessages(sessionId: number): Promise<ChatMessage[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId));
}

// Provider Configs
export async function upsertProviderConfig(
  userId: number,
  provider: string,
  apiKey?: string,
  baseUrl?: string
): Promise<ProviderConfig> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(providerConfigs)
    .where(
      and(
        eq(providerConfigs.userId, userId),
        eq(providerConfigs.provider, provider)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(providerConfigs)
      .set({ apiKey: apiKey || null, baseUrl: baseUrl || null })
      .where(eq(providerConfigs.id, existing[0].id));
    return { ...existing[0], apiKey: apiKey || null, baseUrl: baseUrl || null };
  }

  const result = await db
    .insert(providerConfigs)
    .values({ userId, provider, apiKey: apiKey || null, baseUrl: baseUrl || null })
    .$returningId();

  return result[0] as ProviderConfig;
}

export async function getProviderConfig(
  userId: number,
  provider: string
): Promise<ProviderConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(providerConfigs)
    .where(
      and(
        eq(providerConfigs.userId, userId),
        eq(providerConfigs.provider, provider)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getProviderConfigs(userId: number): Promise<ProviderConfig[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(providerConfigs)
    .where(eq(providerConfigs.userId, userId));
}

// Manus Tasks
export async function createManusTask(
  userId: number,
  taskId: string,
  prompt: string
): Promise<ManusTask> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .insert(manusTasks)
    .values({ userId, taskId, prompt });

  const result = await db
    .select()
    .from(manusTasks)
    .where(eq(manusTasks.taskId, taskId))
    .limit(1);

  return result[0] as ManusTask;
}

export async function updateManusTaskStatus(
  taskId: string,
  status: "pending" | "running" | "completed" | "failed" | "stopped",
  result?: string,
  metadata?: any
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(manusTasks)
    .set({ status, result, metadata })
    .where(eq(manusTasks.taskId, taskId));
}

export async function getManusTask(taskId: string): Promise<ManusTask | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(manusTasks)
    .where(eq(manusTasks.taskId, taskId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserManusTasks(userId: number): Promise<ManusTask[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(manusTasks)
    .where(eq(manusTasks.userId, userId));
}

// Paperclip Config
export async function upsertPaperclipConfig(
  userId: number,
  apiUrl: string,
  apiKey: string,
  companyId: string,
  agentId?: string
): Promise<PaperclipConfig> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(paperclipConfigs)
    .where(eq(paperclipConfigs.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(paperclipConfigs)
      .set({ apiUrl, apiKey, companyId, agentId: agentId || null, isConnected: true })
      .where(eq(paperclipConfigs.id, existing[0].id));
    return { ...existing[0], apiUrl, apiKey, companyId, agentId: agentId || null, isConnected: true };
  }

  const result = await db
    .insert(paperclipConfigs)
    .values({
      userId,
      apiUrl,
      apiKey,
      companyId,
      agentId,
      isConnected: true,
    })
    .$returningId();

  return result[0] as PaperclipConfig;
}

export async function getPaperclipConfig(
  userId: number
): Promise<PaperclipConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(paperclipConfigs)
    .where(eq(paperclipConfigs.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// FETCHER Leads
export async function createFetcherLead(
  userId: number,
  source: string,
  title: string,
  url: string,
  budget?: number,
  postedAt?: Date,
  deliverable?: string,
  estimatedHourlyRate?: number,
  qualified?: boolean
): Promise<FetcherLead> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .insert(fetcherLeads)
    .values({
      userId,
      source,
      title,
      url,
      budget: budget ? (budget as any) : null,
      postedAt,
      deliverable,
      estimatedHourlyRate: estimatedHourlyRate ? (estimatedHourlyRate as any) : null,
      qualified: qualified ?? false,
    });

  const result = await db
    .select()
    .from(fetcherLeads)
    .where(eq(fetcherLeads.userId, userId))
    .orderBy((l) => l.id)
    .limit(1);

  return result[0] as FetcherLead;
}

export async function getQualifiedFetcherLeads(
  userId: number,
  hoursAgo: number = 24
): Promise<FetcherLead[]> {
  const db = await getDb();
  if (!db) return [];

  const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  return await db
    .select()
    .from(fetcherLeads)
    .where(
      and(
        eq(fetcherLeads.userId, userId),
        eq(fetcherLeads.qualified, true)
      )
    );
}

export async function getFetcherLeads(userId: number): Promise<FetcherLead[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(fetcherLeads)
    .where(eq(fetcherLeads.userId, userId));
}

// Paperclip Delegation Helpers

export async function delegateTask(
  userId: number,
  agentId: string,
  taskDescription: string,
  metadata?: Record<string, unknown>
): Promise<PaperclipDelegation> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(paperclipDelegations).values({
    userId,
    agentId,
    taskDescription,
    status: "pending",
    metadata: metadata || {},
  });

  const result = await db
    .select()
    .from(paperclipDelegations)
    .where(
      and(
        eq(paperclipDelegations.userId, userId),
        eq(paperclipDelegations.agentId, agentId)
      )
    )
    .orderBy(desc(paperclipDelegations.id))
    .limit(1);

  return result[0] as PaperclipDelegation;
}

export async function updateDelegationStatus(
  delegationId: number,
  status: "pending" | "assigned" | "in_progress" | "completed" | "failed",
  result?: string
): Promise<PaperclipDelegation> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const updateData: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };

  if (result) {
    updateData.result = result;
  }

  if (status === "completed" || status === "failed") {
    updateData.completedAt = new Date();
  }

  await db
    .update(paperclipDelegations)
    .set(updateData)
    .where(eq(paperclipDelegations.id, delegationId));

  const updated = await db
    .select()
    .from(paperclipDelegations)
    .where(eq(paperclipDelegations.id, delegationId))
    .limit(1);

  return updated[0] as PaperclipDelegation;
}

export async function getDelegationHistory(
  userId: number,
  agentId?: string,
  limit: number = 50
): Promise<PaperclipDelegation[]> {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select()
    .from(paperclipDelegations)
    .where(eq(paperclipDelegations.userId, userId));

  if (agentId) {
    query = db
      .select()
      .from(paperclipDelegations)
      .where(
        and(
          eq(paperclipDelegations.userId, userId),
          eq(paperclipDelegations.agentId, agentId)
        )
      );
  }

  return await query
    .orderBy(desc(paperclipDelegations.delegatedAt))
    .limit(limit);
}

export async function getDelegation(delegationId: number): Promise<PaperclipDelegation | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(paperclipDelegations)
    .where(eq(paperclipDelegations.id, delegationId))
    .limit(1);

  return result[0];
}

export async function getAgentWorkload(agentId: string): Promise<{
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  failed: number;
}> {
  const db = await getDb();
  if (!db) {
    return { total: 0, pending: 0, inProgress: 0, completed: 0, failed: 0 };
  }

  const delegations = await db
    .select()
    .from(paperclipDelegations)
    .where(eq(paperclipDelegations.agentId, agentId));

  const workload = {
    total: delegations.length,
    pending: delegations.filter((d) => d.status === "pending").length,
    inProgress: delegations.filter((d) => d.status === "in_progress").length,
    completed: delegations.filter((d) => d.status === "completed").length,
    failed: delegations.filter((d) => d.status === "failed").length,
  };

  return workload;
}
