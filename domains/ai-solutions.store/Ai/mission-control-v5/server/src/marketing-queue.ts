/**
 * MARKETING APPROVAL QUEUE — the routing point for Paperclip (9020, marketing
 * only) and any other marketing producer. Producers never publish directly:
 * items land here as PENDING, Joshua approves/denies (optionally with a
 * response) from the PAPERWEIGHT social command center, and only approved
 * items move on.
 *
 * Intake is deliberately transport-poor: a loopback POST, or a JSON file
 * dropped in ops/marketing-inbox/ at the repo root (the one root exists on
 * every node, so 9020 delivers by file/repo sync — Mission Control is never
 * exposed on the LAN for this).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DATA_FILE = join(DATA_DIR, 'marketing-queue.json');
const INBOX_DIR = join(__dirname, '..', '..', '..', 'ops', 'marketing-inbox');
const PROCESSED_DIR = join(INBOX_DIR, 'processed');

export type MarketingStatus = 'pending' | 'approved' | 'denied';

export interface MarketingItem {
  id: string;
  /** Who produced it — e.g. 'paperclip-9020', 'local'. Free text, capped. */
  source: string;
  /** Target platform slug — youtube, instagram, ebay, … Free text, capped. */
  platform: string;
  kind: 'post' | 'reply' | 'campaign' | 'listing' | 'other';
  title: string;
  body: string;
  status: MarketingStatus;
  /**
   * Public-surface compliance terms found in the copy (FL 496.405 vocabulary
   * plus the "split" wording trap). Non-empty means legal review before
   * approval — the queue surfaces it, it never auto-denies.
   */
  complianceFlags: string[];
  /** Joshua's response text sent back with the decision, if any. */
  response: string | null;
  createdAt: string;
  updatedAt: string;
  decidedAt: string | null;
}

let items: MarketingItem[] = [];

function persist(): void {
  mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify({ version: 1, items }, null, 2));
  renameSync(tmp, DATA_FILE);
}

export function loadMarketingState(): void {
  try {
    if (!existsSync(DATA_FILE)) return;
    const raw = JSON.parse(readFileSync(DATA_FILE, 'utf8')) as { items?: MarketingItem[] };
    if (Array.isArray(raw.items)) items = raw.items;
  } catch {
    // Corrupt state file: start empty rather than crash the server.
    items = [];
  }
}

const str = (v: unknown, cap: number): string => String(v ?? '').trim().slice(0, cap);

const KINDS = new Set(['post', 'reply', 'campaign', 'listing', 'other']);

// Customer-facing copy may never contain these (canonical record surface rule,
// FL 496.405), and "split" falsely trips fraud/structuring reviews.
const COMPLIANCE_TERMS = [
  'donate',
  'donation',
  'solicitation',
  'charity',
  'charitable',
  'giving back',
  'disbursement',
  'tax-deductible',
  'tax deductible',
  'split',
];

function scanCompliance(title: string, body: string): string[] {
  const hay = `${title}\n${body}`.toLowerCase();
  return COMPLIANCE_TERMS.filter((term) => hay.includes(term));
}

export function createMarketingItem(input: Record<string, unknown>): MarketingItem {
  const title = str(input.title, 300);
  const body = str(input.body, 20_000);
  if (!title || !body) throw new Error('Marketing item needs title and body.');
  const now = new Date().toISOString();
  const item: MarketingItem = {
    id: randomUUID(),
    source: str(input.source, 80) || 'local',
    platform: str(input.platform, 40) || 'unspecified',
    kind: KINDS.has(String(input.kind)) ? (input.kind as MarketingItem['kind']) : 'post',
    title,
    body,
    status: 'pending',
    complianceFlags: scanCompliance(title, body),
    response: null,
    createdAt: now,
    updatedAt: now,
    decidedAt: null,
  };
  items.unshift(item);
  persist();
  return item;
}

export function decideMarketingItem(
  id: string,
  input: { decision?: unknown; response?: unknown },
): MarketingItem {
  const item = items.find((i) => i.id === id);
  if (!item) throw new Error('No such marketing item.');
  const decision = String(input.decision ?? '');
  if (decision !== 'approved' && decision !== 'denied') {
    throw new Error("Decision must be 'approved' or 'denied'.");
  }
  item.status = decision;
  item.response = str(input.response, 5000) || null;
  item.decidedAt = new Date().toISOString();
  item.updatedAt = item.decidedAt;
  persist();
  return item;
}

export function listMarketingItems(): MarketingItem[] {
  return items;
}

/**
 * Import pending drops from ops/marketing-inbox/*.json, then move each file to
 * processed/ so it is ingested exactly once. A file that fails to parse is
 * moved aside with a .rejected suffix — never silently deleted, never retried
 * forever.
 */
export function ingestMarketingInbox(): number {
  if (!existsSync(INBOX_DIR)) return 0;
  let imported = 0;
  for (const name of readdirSync(INBOX_DIR)) {
    if (!name.toLowerCase().endsWith('.json')) continue;
    const path = join(INBOX_DIR, name);
    mkdirSync(PROCESSED_DIR, { recursive: true });
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8'));
      const drops = Array.isArray(raw) ? raw : [raw];
      for (const drop of drops) {
        if (drop && typeof drop === 'object') {
          createMarketingItem(drop as Record<string, unknown>);
          imported += 1;
        }
      }
      renameSync(path, join(PROCESSED_DIR, `${Date.now()}-${name}`));
    } catch {
      try {
        renameSync(path, join(PROCESSED_DIR, `${Date.now()}-${name}.rejected`));
      } catch {
        // File locked mid-write by the producer: leave it for the next pass.
      }
    }
  }
  return imported;
}
