/**
 * Influencer attribution: capture a `ref` query parameter and persist it so
 * it survives navigation to the register page.
 *
 * The portal links look like `youandinotai.com/register?ref=bot-slayer`.
 * A visitor may land on any page first, so the value is stored on first sight
 * and read back at registration time.
 */

const STORAGE_KEY = 'antigravity_partner_id';
const MAX_LENGTH = 64;

/** Normalise an untrusted query value, or return null if unusable. */
export function normalizeRef(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Portal ids are slugs: letters, digits, dash, underscore.
  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) return null;
  if (trimmed.length > MAX_LENGTH) return null;
  return trimmed.toLowerCase();
}

/**
 * Read `ref` from the given search string, persisting it when present.
 * Returns the effective partner id (freshly captured, or previously stored).
 */
export function capturePartnerId(search: string): string | null {
  const fresh = normalizeRef(new URLSearchParams(search).get('ref'));
  if (fresh) {
    try {
      localStorage.setItem(STORAGE_KEY, fresh);
    } catch {
      // Storage unavailable (private mode); the value still returns below.
    }
    return fresh;
  }
  return getStoredPartnerId();
}

/** The partner id captured earlier in this browser, if any. */
export function getStoredPartnerId(): string | null {
  try {
    return normalizeRef(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Clear the stored partner id (used after a successful registration). */
export function clearPartnerId(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do.
  }
}
