export type ControlServiceState =
  | 'UP'
  | 'DOWN'
  | 'WRONG SERVICE'
  | 'AUTH MISSING'
  | 'AUTH REJECTED'
  | 'NOT CONFIGURED';

export interface ControlServiceSample {
  name: string;
  status: ControlServiceState;
  detail: string;
}

export interface ControlAlertDraft {
  kind: 'service-down' | 'service-recovered' | 'service-state-change';
  subject: string;
  previousState: ControlServiceState;
  state: ControlServiceState;
  detail: string;
  createdAt: string;
}

const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE = /\b(?:\+?\d{1,2}[ .-]?)?(?:\(?\d{3}\)?[ .-]?)\d{3}[ .-]\d{4}\b/g;
const CREDENTIAL = /\b(token|secret|api[-_ ]?key|authorization|password)\s*[:=]\s*[^\s,;]+/gi;

/**
 * Customer support is stored as redacted operational metadata, never as a raw
 * transcript or credential container. This is a defense-in-depth formatter;
 * production support connectors need their own privacy and retention review.
 */
export function redactSupportText(value: unknown, maxLength = 900): string {
  const text = String(value ?? '').trim();
  if (!text) return '';
  const redacted = text
    .replace(CREDENTIAL, (_all, label: string) => `${label}=[redacted credential]`)
    .replace(EMAIL, '[redacted email]')
    .replace(PHONE, '[redacted phone]')
    .replace(/\s+/g, ' ')
    .trim();
  return redacted.length > maxLength ? `${redacted.slice(0, maxLength - 1)}…` : redacted;
}

/**
 * Generate a single alert per observed state transition. The first observation
 * establishes baseline only; a poll result or port alone is never an alert.
 */
export function deriveServiceTransitions(
  previous: Record<string, ControlServiceState>,
  services: ControlServiceSample[],
  now: string,
): { next: Record<string, ControlServiceState>; alerts: ControlAlertDraft[] } {
  const next = { ...previous };
  const alerts: ControlAlertDraft[] = [];
  for (const service of services) {
    const prior = previous[service.name];
    next[service.name] = service.status;
    if (!prior || prior === service.status) continue;
    const kind: ControlAlertDraft['kind'] =
      service.status === 'UP'
        ? 'service-recovered'
        : service.status === 'DOWN'
          ? 'service-down'
          : 'service-state-change';
    alerts.push({
      kind,
      subject: service.name,
      previousState: prior,
      state: service.status,
      detail: redactSupportText(service.detail, 360),
      createdAt: now,
    });
  }
  return { next, alerts };
}
