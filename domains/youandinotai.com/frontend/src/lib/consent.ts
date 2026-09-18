export const COOKIE_CONSENT_VERSION = '2026-03-15';
export const COOKIE_CONSENT_KEY = `yai-cookie-consent-${COOKIE_CONSENT_VERSION}`;

export interface CookieConsentState {
  essential: true;
  preferences: boolean;
  performance: boolean;
  version: string;
  respondedAt: string;
}

export function readCookieConsent(): CookieConsentState | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CookieConsentState;
  } catch {
    window.localStorage.removeItem(COOKIE_CONSENT_KEY);
    return null;
  }
}

export function saveCookieConsent(
  preferences: Pick<CookieConsentState, 'preferences' | 'performance'>
): CookieConsentState {
  const value: CookieConsentState = {
    essential: true,
    preferences: preferences.preferences,
    performance: preferences.performance,
    version: COOKIE_CONSENT_VERSION,
    respondedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(value));
  return value;
}
