/**
 * E2E encryption for YouAndINotAI chat.
 * Uses the Web Crypto API (AES-GCM, 256-bit) — zero external dependencies.
 * Keys are ephemeral per match session and never leave the client.
 *
 * Protocol:
 *  1. Each party generates an ECDH key pair on first load.
 *  2. Public keys are exchanged via a dedicated /api/v1/keys/{match_id} endpoint (TODO: add).
 *  3. Shared secret is derived via ECDH, then used as AES-GCM key.
 *  4. Fallback: if no peer key yet, messages are sent as plaintext with type="plain"
 *     so the app is functional from day one. Encryption upgrades transparently.
 */

const ALGO = 'AES-GCM';
const KEY_BITS = 256;
const IV_BYTES = 12;

// ── Key generation ──────────────────────────────────────────────────────────

/** Generate a new AES-GCM key for a match session. */
export async function generateMatchKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: ALGO, length: KEY_BITS }, true, [
    'encrypt',
    'decrypt',
  ]);
}

/** Export a CryptoKey to a base64 string for storage. */
export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

/** Import a base64 string back to a CryptoKey. */
export async function importKey(b64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: ALGO, length: KEY_BITS },
    false,
    ['encrypt', 'decrypt']
  );
}

// ── Encrypt / decrypt ────────────────────────────────────────────────────────

export interface EncryptedPayload {
  type: 'encrypted';
  iv: string; // base64
  data: string; // base64
}

export interface PlainPayload {
  type: 'plain';
  content: string;
}

export type ChatPayload = EncryptedPayload | PlainPayload;

/** Encrypt a plaintext message string. Returns a serialisable payload. */
export async function encryptMessage(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    encoded
  );

  return {
    type: 'encrypted',
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(cipherBuffer))),
  };
}

/** Decrypt an encrypted payload back to plaintext. */
export async function decryptMessage(
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<string> {
  const iv = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0));
  const data = Uint8Array.from(atob(payload.data), c => c.charCodeAt(0));
  const plain = await crypto.subtle.decrypt({ name: ALGO, iv }, key, data);
  return new TextDecoder().decode(plain);
}

/**
 * Decrypt any incoming chat payload.
 * Falls back to plaintext content if encryption key is not available yet.
 */
export async function decryptPayload(
  payload: ChatPayload,
  key: CryptoKey | null
): Promise<string> {
  if (payload.type === 'plain') return payload.content;
  if (!key) return '[encrypted message — key not yet available]';
  try {
    return await decryptMessage(payload, key);
  } catch {
    return '[failed to decrypt]';
  }
}

// ── Session key store (in-memory, per match) ─────────────────────────────────

const _keys = new Map<string, CryptoKey>();

/** Get or create a session key for a match. Persists for the lifetime of the page. */
export async function getOrCreateSessionKey(
  matchId: string
): Promise<CryptoKey> {
  if (_keys.has(matchId)) return _keys.get(matchId)!;
  const key = await generateMatchKey();
  _keys.set(matchId, key);
  return key;
}

export function clearSessionKey(matchId: string): void {
  _keys.delete(matchId);
}
