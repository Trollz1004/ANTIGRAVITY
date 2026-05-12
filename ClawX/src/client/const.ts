export const COOKIE_NAME = 'clawx_session';

export function getLoginUrl(): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/api/auth/google`;
}
