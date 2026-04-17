/**
 * Secure API Key Storage
 * Keys are AES-256-GCM encrypted before storage in the database.
 * The encryption key is derived from JWT_SECRET (server-only env var).
 * Keys are NEVER returned to the frontend in plaintext — only hints are shown.
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { eq, and } from 'drizzle-orm';
import { getDb } from './db';
import { userApiKeys } from '../drizzle/schema';
import type { AiProviderSlug } from '../shared/ai-providers';

const ALGORITHM = 'aes-256-gcm';

/** Derive a 32-byte cipher key from JWT_SECRET */
function getCipherKey(): Buffer {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set — cannot encrypt API keys');
  return createHash('sha256').update(secret).digest();
}

/** Encrypt a plaintext API key. Returns a base64-encoded string: iv:authTag:ciphertext */
export function encryptKey(plaintext: string): string {
  const key = getCipherKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':');
}

/** Decrypt a stored encrypted key back to plaintext */
export function decryptKey(stored: string): string {
  const [ivB64, tagB64, dataB64] = stored.split(':');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Invalid encrypted key format');
  const key = getCipherKey();
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/** Get the last 4 chars of a key for display hint (e.g. "...4xZ9") */
function keyHint(plaintext: string): string {
  return plaintext.slice(-4);
}

/** Save or update a user's API key for a specific provider */
export async function saveUserApiKey(
  userId: number,
  providerSlug: AiProviderSlug,
  plaintextKey: string,
  label?: string,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const encrypted = encryptKey(plaintextKey);
  const hint = keyHint(plaintextKey);

  // Check if key already exists for this user+provider
  const existing = await db
    .select()
    .from(userApiKeys)
    .where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.providerSlug, providerSlug)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(userApiKeys)
      .set({ encryptedKey: encrypted, keyHint: hint, label: label ?? null, isActive: 1, updatedAt: new Date() })
      .where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.providerSlug, providerSlug)));
  } else {
    await db.insert(userApiKeys).values({
      userId,
      providerSlug,
      encryptedKey: encrypted,
      keyHint: hint,
      label: label ?? null,
      isActive: 1,
    });
  }
}

/** Delete a user's API key for a specific provider */
export async function deleteUserApiKey(userId: number, providerSlug: AiProviderSlug): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(userApiKeys).where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.providerSlug, providerSlug)));
}

/** Get all stored key metadata (hints only — no plaintext) for a user */
export async function getUserApiKeyMeta(
  userId: number,
): Promise<Array<{ providerSlug: string; keyHint: string | null; label: string | null; isActive: number }>> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      providerSlug: userApiKeys.providerSlug,
      keyHint: userApiKeys.keyHint,
      label: userApiKeys.label,
      isActive: userApiKeys.isActive,
    })
    .from(userApiKeys)
    .where(eq(userApiKeys.userId, userId));
  return rows;
}

/** Get decrypted API keys for all providers for a user (server-side only, never sent to frontend) */
export async function getUserApiKeys(userId: number): Promise<Partial<Record<AiProviderSlug, string>>> {
  const db = await getDb();
  if (!db) return {};
  const rows = await db
    .select({
      providerSlug: userApiKeys.providerSlug,
      encryptedKey: userApiKeys.encryptedKey,
      isActive: userApiKeys.isActive,
    })
    .from(userApiKeys)
    .where(eq(userApiKeys.userId, userId));

  const result: Partial<Record<AiProviderSlug, string>> = {};
  for (const row of rows) {
    if (row.isActive) {
      try {
        result[row.providerSlug as AiProviderSlug] = decryptKey(row.encryptedKey);
      } catch {
        // Silently skip corrupted keys
      }
    }
  }
  return result;
}
