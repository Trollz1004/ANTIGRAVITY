/**
 * First-touch sign-up source attribution.
 *
 * Stores a compact lowercase token (at most 128 chars) in localStorage using
 * the same browser storage approach as partnerAttribution.ts:
 *   - ref:<slug> when ?ref= or /c/<name> is present
 *   - utm:<utm_source>[/<utm_medium>][/<utm_campaign>]
 *   - site:<host> from document.referrer (external host only, no www., no IP)
 *   - direct
 *
 * First touch wins once stored, except a real partner code replaces a stored
 * value that does not start with "ref:".
 */

import { SHORT_NAME_PATTERN, normalizeRef } from './partnerAttribution';

export const SIGNUP_SOURCE_STORAGE_KEY = 'antigravity_signup_source';
export const MAX_SIGNUP_SOURCE_LENGTH = 128;
const ALLOWED_SIGNUP_SOURCE_RE = /^[a-z0-9._:/-]+$/;
const OWN_DOMAIN = 'youandinotai.com';

export interface SignupSourceInput {
  search?: string;
  pathname?: string;
  referrer?: string;
}

/** Validate and normalize a candidate signup_source value, or return null. */
export function normalizeSignupSource(
  raw: string | null | undefined
): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed.length > MAX_SIGNUP_SOURCE_LENGTH) return null;
  if (!ALLOWED_SIGNUP_SOURCE_RE.test(trimmed)) return null;
  return trimmed;
}

function extractShortLinkSlug(pathname: string): string | null {
  const match = /^\/c(?:\/([^/]*))?\/?$/.exec(pathname || '');
  if (!match) return null;
  let name = match[1] || '';
  try {
    name = decodeURIComponent(name);
  } catch {
    return null;
  }
  return SHORT_NAME_PATTERN.test(name) ? name : null;
}

function cleanUtmSegment(raw: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');
  return cleaned || null;
}

function isIpOrLocalHost(host: string): boolean {
  if (!host || !host.includes('.')) return true;
  if (host.includes(':') || host.startsWith('[')) return true;
  if (/^[0-9.]+$/.test(host)) return true;
  if (!/^[a-z0-9.-]+$/.test(host)) return true;
  return false;
}

function extractExternalReferrerHost(referrer: string): string | null {
  if (!referrer || !referrer.trim()) return null;
  try {
    const parsed = new URL(referrer.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    const rawHost = parsed.hostname.toLowerCase().trim().replace(/\.$/, '');
    if (isIpOrLocalHost(rawHost)) return null;
    const host = rawHost.replace(/^www\./, '');
    if (!host || isIpOrLocalHost(host)) return null;
    if (host === OWN_DOMAIN || host.endsWith(`.${OWN_DOMAIN}`)) {
      return null;
    }
    return host;
  } catch {
    return null;
  }
}

function resolveCandidateSource(
  search: string,
  pathname: string,
  referrer: string
): string {
  const params = new URLSearchParams(search);
  const partnerSlug =
    normalizeRef(params.get('ref')) ?? extractShortLinkSlug(pathname);
  if (partnerSlug) {
    return (
      normalizeSignupSource(`ref:${partnerSlug}`.slice(0, MAX_SIGNUP_SOURCE_LENGTH)) ??
      'direct'
    );
  }

  const utmSource = cleanUtmSegment(params.get('utm_source'));
  if (utmSource) {
    const parts = [utmSource];
    const utmMedium = cleanUtmSegment(params.get('utm_medium'));
    const utmCampaign = cleanUtmSegment(params.get('utm_campaign'));
    if (utmMedium) parts.push(utmMedium);
    if (utmCampaign) parts.push(utmCampaign);
    const candidate = `utm:${parts.join('/')}`
      .slice(0, MAX_SIGNUP_SOURCE_LENGTH)
      .replace(/[/:]+$/, '');
    return normalizeSignupSource(candidate) ?? 'direct';
  }

  const host = extractExternalReferrerHost(referrer);
  if (host) {
    const candidate = `site:${host}`
      .slice(0, MAX_SIGNUP_SOURCE_LENGTH)
      .replace(/[.:/-]+$/, '');
    return normalizeSignupSource(candidate) ?? 'direct';
  }

  return 'direct';
}

/** Read the stored signup_source from localStorage, if any. */
export function getStoredSignupSource(): string | null {
  try {
    return normalizeSignupSource(
      localStorage.getItem(SIGNUP_SOURCE_STORAGE_KEY)
    );
  } catch {
    return null;
  }
}

/**
 * Capture the visitor's signup_source at boot and persist it in localStorage.
 * First touch wins, except a real partner code (ref:<slug>) replaces an
 * existing stored value that does not start with "ref:".
 */
export function captureSignupSource(
  input?: SignupSourceInput | string
): string {
  const search =
    typeof input === 'string'
      ? input
      : (input?.search ??
        (typeof window !== 'undefined' ? window.location.search : ''));
  const pathname =
    typeof input === 'object' && input !== null && input.pathname !== undefined
      ? input.pathname
      : typeof window !== 'undefined'
        ? window.location.pathname
        : '';
  const referrer =
    typeof input === 'object' && input !== null && input.referrer !== undefined
      ? input.referrer
      : typeof document !== 'undefined'
        ? document.referrer
        : '';

  const fresh = resolveCandidateSource(search, pathname, referrer);
  const stored = getStoredSignupSource();

  if (stored) {
    if (!stored.startsWith('ref:') && fresh.startsWith('ref:')) {
      try {
        localStorage.setItem(SIGNUP_SOURCE_STORAGE_KEY, fresh);
      } catch {
        // Ignore storage failures in private browsing mode.
      }
      return fresh;
    }
    return stored;
  }

  try {
    localStorage.setItem(SIGNUP_SOURCE_STORAGE_KEY, fresh);
  } catch {
    // Ignore storage failures in private browsing mode.
  }
  return fresh;
}

/** Clear the stored signup_source after a successful registration. */
export function clearSignupSource(): void {
  try {
    localStorage.removeItem(SIGNUP_SOURCE_STORAGE_KEY);
  } catch {
    // Nothing to do.
  }
}
