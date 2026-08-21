import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveServiceTransitions, redactSupportText, type ControlServiceSample, type ControlServiceState } from './control-center.js';

export type SupportPriority = 'low' | 'normal' | 'high' | 'urgent';
export type SupportCaseStatus = 'open' | 'assigned' | 'waiting' | 'resolved';

export interface SupportCase {
  id: string;
  source: 'local' | 'openclaw';
  subject: string;
  summary: string;
  priority: SupportPriority;
  status: SupportCaseStatus;
  assignee: string | null;
  internalNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TrustCaseKind = 'report' | 'bot-check' | 'check-in' | 'circle-date';
export type TrustCaseState = 'received' | 'needs_review' | 'limited' | 'resolved' | 'appealed';
export type TrustSeverity = 'low' | 'moderate' | 'high' | 'urgent';

export interface PaperMatesTrustCase {
  id: string;
  kind: TrustCaseKind;
  state: TrustCaseState;
  severity: TrustSeverity;
  subject: string;
  summary: string;
  reference: string | null;
  reviewer: string | null;
  decisionNote: string | null;
  appealAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ControlAlert {
  id: string;
  kind: 'service-down' | 'service-recovered' | 'service-state-change';
  subject: string;
  previousState: ControlServiceState;
  state: ControlServiceState;
  detail: string;
  createdAt: string;
  acknowledgedAt: string | null;
}

interface PersistedControlState {
  version: number;
  serviceStates: Record<string, ControlServiceState>;
  alerts: ControlAlert[];
  supportCases: SupportCase[];
  trustCases: PaperMatesTrustCase[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, '..', 'data', 'control-center.json');
const MAX_ALERTS = 250;
const MAX_CASES = 500;
const MAX_TRUST_CASES = 500;
let serviceStates: Record<string, ControlServiceState> = {};
let alerts: ControlAlert[] = [];
let supportCases: SupportCase[] = [];
let trustCases: PaperMatesTrustCase[] = [];
let flushTimer: NodeJS.Timeout | null = null;

function flush(): void {
  try {
    mkdirSync(dirname(DATA_FILE), { recursive: true });
    const tmp = `${DATA_FILE}.tmp`;
    writeFileSync(tmp, JSON.stringify({ version: 2, serviceStates, alerts, supportCases, trustCases } satisfies PersistedControlState, null, 2));
    renameSync(tmp, DATA_FILE);
  } catch (error) {
    console.error('[control-store] Flush failed:', error);
  }
}

function persist(): void {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 150);
}

function isServiceState(value: unknown): value is ControlServiceState {
  return ['UP', 'DOWN', 'WRONG SERVICE', 'AUTH MISSING', 'AUTH REJECTED', 'NOT CONFIGURED'].includes(String(value));
}

function isCaseStatus(value: unknown): value is SupportCaseStatus {
  return ['open', 'assigned', 'waiting', 'resolved'].includes(String(value));
}

function isPriority(value: unknown): value is SupportPriority {
  return ['low', 'normal', 'high', 'urgent'].includes(String(value));
}

function isTrustCaseKind(value: unknown): value is TrustCaseKind {
  return ['report', 'bot-check', 'check-in', 'circle-date'].includes(String(value));
}

function isTrustCaseState(value: unknown): value is TrustCaseState {
  return ['received', 'needs_review', 'limited', 'resolved', 'appealed'].includes(String(value));
}

function isTrustSeverity(value: unknown): value is TrustSeverity {
  return ['low', 'moderate', 'high', 'urgent'].includes(String(value));
}

export function loadControlState(): void {
  try {
    if (!existsSync(DATA_FILE)) return;
    const raw = JSON.parse(readFileSync(DATA_FILE, 'utf8')) as Partial<PersistedControlState>;
    serviceStates = Object.fromEntries(Object.entries(raw.serviceStates ?? {}).filter(([, value]) => isServiceState(value)));
    alerts = Array.isArray(raw.alerts) ? raw.alerts.filter((item): item is ControlAlert => Boolean(item?.id && isServiceState(item.state) && isServiceState(item.previousState))).slice(0, MAX_ALERTS) : [];
    supportCases = Array.isArray(raw.supportCases)
      ? raw.supportCases.filter((item): item is SupportCase => Boolean(item?.id && isCaseStatus(item.status) && isPriority(item.priority))).slice(0, MAX_CASES)
      : [];
    trustCases = Array.isArray(raw.trustCases)
      ? raw.trustCases.filter((item): item is PaperMatesTrustCase => Boolean(item?.id && isTrustCaseKind(item.kind) && isTrustCaseState(item.state) && isTrustSeverity(item.severity))).slice(0, MAX_TRUST_CASES)
      : [];
  } catch (error) {
    console.error('[control-store] Failed to load state; starting with empty control data:', error);
    serviceStates = {};
    alerts = [];
    supportCases = [];
    trustCases = [];
  }
}

export function observeServices(services: ControlServiceSample[]): ControlAlert[] {
  const transition = deriveServiceTransitions(serviceStates, services, new Date().toISOString());
  serviceStates = transition.next;
  if (transition.alerts.length === 0) return [];
  const created = transition.alerts.map((alert) => ({ ...alert, id: randomUUID(), acknowledgedAt: null } satisfies ControlAlert));
  alerts = [...created, ...alerts].slice(0, MAX_ALERTS);
  persist();
  return created;
}

export function listAlerts(): ControlAlert[] {
  return alerts;
}

export function acknowledgeAlert(id: string): ControlAlert {
  const alert = alerts.find((item) => item.id === id);
  if (!alert) throw new Error('Alert not found.');
  if (!alert.acknowledgedAt) {
    alert.acknowledgedAt = new Date().toISOString();
    persist();
  }
  return alert;
}

export function listSupportCases(): SupportCase[] {
  return supportCases;
}

export function createSupportCase(input: { source?: unknown; subject?: unknown; summary?: unknown; priority?: unknown; assignee?: unknown }): SupportCase {
  const subject = redactSupportText(input.subject, 140);
  const summary = redactSupportText(input.summary, 900);
  if (subject.length < 3 || summary.length < 3) throw new Error('Support case subject and redacted summary must each contain at least 3 characters.');
  const now = new Date().toISOString();
  const assignee = redactSupportText(input.assignee, 80) || null;
  const item: SupportCase = {
    id: randomUUID(),
    source: input.source === 'openclaw' ? 'openclaw' : 'local',
    subject,
    summary,
    priority: isPriority(input.priority) ? input.priority : 'normal',
    status: assignee ? 'assigned' : 'open',
    assignee,
    internalNote: null,
    createdAt: now,
    updatedAt: now,
  };
  supportCases = [item, ...supportCases].slice(0, MAX_CASES);
  persist();
  return item;
}

export function listPaperMatesTrustCases(): PaperMatesTrustCase[] {
  return trustCases;
}

export function createPaperMatesTrustCase(input: { kind?: unknown; severity?: unknown; subject?: unknown; summary?: unknown; reference?: unknown; reviewer?: unknown; appealAvailable?: unknown }): PaperMatesTrustCase {
  const subject = redactSupportText(input.subject, 140);
  const summary = redactSupportText(input.summary, 900);
  if (subject.length < 3 || summary.length < 3) throw new Error('Trust case subject and redacted summary must each contain at least 3 characters.');
  const now = new Date().toISOString();
  const item: PaperMatesTrustCase = {
    id: randomUUID(),
    kind: isTrustCaseKind(input.kind) ? input.kind : 'report',
    state: 'received',
    severity: isTrustSeverity(input.severity) ? input.severity : 'moderate',
    subject,
    summary,
    reference: redactSupportText(input.reference, 160) || null,
    reviewer: redactSupportText(input.reviewer, 80) || null,
    decisionNote: null,
    appealAvailable: input.appealAvailable !== false,
    createdAt: now,
    updatedAt: now,
  };
  trustCases = [item, ...trustCases].slice(0, MAX_TRUST_CASES);
  persist();
  return item;
}

export function updatePaperMatesTrustCase(id: string, input: { state?: unknown; severity?: unknown; reviewer?: unknown; decisionNote?: unknown; appealAvailable?: unknown }): PaperMatesTrustCase {
  const item = trustCases.find((candidate) => candidate.id === id);
  if (!item) throw new Error('Trust case not found.');
  if (isTrustCaseState(input.state)) item.state = input.state;
  if (isTrustSeverity(input.severity)) item.severity = input.severity;
  if (typeof input.reviewer !== 'undefined') item.reviewer = redactSupportText(input.reviewer, 80) || null;
  if (typeof input.decisionNote !== 'undefined') item.decisionNote = redactSupportText(input.decisionNote, 900) || null;
  if (typeof input.appealAvailable === 'boolean') item.appealAvailable = input.appealAvailable;
  item.updatedAt = new Date().toISOString();
  persist();
  return item;
}

export function updateSupportCase(id: string, input: { status?: unknown; priority?: unknown; assignee?: unknown; internalNote?: unknown }): SupportCase {
  const item = supportCases.find((candidate) => candidate.id === id);
  if (!item) throw new Error('Support case not found.');
  if (isCaseStatus(input.status)) item.status = input.status;
  if (isPriority(input.priority)) item.priority = input.priority;
  if (typeof input.assignee !== 'undefined') item.assignee = redactSupportText(input.assignee, 80) || null;
  if (typeof input.internalNote !== 'undefined') item.internalNote = redactSupportText(input.internalNote, 900) || null;
  if (item.assignee && item.status === 'open') item.status = 'assigned';
  item.updatedAt = new Date().toISOString();
  persist();
  return item;
}
