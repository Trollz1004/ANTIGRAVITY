/**
 * Brain journal store — per-platform STATE.md memory.
 *
 * Each AI platform keeps its own journal in its own folder (read on session
 * start, written on session end). This module reads/writes those files and
 * keeps an authoritative audited mirror under server/data/brain/. Writes are
 * atomic (tmp + rename, same pattern as store.ts) and capped at maxChars so
 * the journal can never bloat a context window.
 *
 * Platform registry: server/data/brain-platforms.json (gitignored, created from
 * the committed brain-platforms.example.json on first run). Per-entry path
 * overrides via env BRAIN_PLATFORM_<ID>_PATH. Paths are never logged.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const BRAIN_DIR = join(DATA_DIR, 'brain');
const PLATFORMS_FILE = join(DATA_DIR, 'brain-platforms.json');
const EXAMPLE_FILE = join(DATA_DIR, 'brain-platforms.example.json');

export interface BrainPlatform {
  id: string;
  label: string;
  statePath: string; // absolute path the agent itself reads/writes
  maxChars: number; // cap (2000-4000)
  enabled: boolean;
}

const DEFAULT_MAX_CHARS = Math.min(4000, Math.max(2000, Number(process.env.BRAIN_JOURNAL_MAX_CHARS ?? 4000) || 4000));

const DEFAULT_PLATFORMS: BrainPlatform[] = [
  { id: 'free-claude-code', label: 'Free Claude Code', statePath: 'C:/Users/joshl/.fcc/STATE.md', maxChars: DEFAULT_MAX_CHARS, enabled: true },
];

function ensureExample(): void {
  if (!existsSync(EXAMPLE_FILE)) {
    try {
      mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(
        EXAMPLE_FILE,
        JSON.stringify(DEFAULT_PLATFORMS, null, 2),
      );
    } catch {
      /* best-effort */
    }
  }
}

let platformCache: BrainPlatform[] | null = null;

export function loadBrainPlatforms(): BrainPlatform[] {
  if (platformCache) return platformCache;
  ensureExample();
  let raw: BrainPlatform[] = DEFAULT_PLATFORMS;
  try {
    if (existsSync(PLATFORMS_FILE)) {
      const parsed = JSON.parse(readFileSync(PLATFORMS_FILE, 'utf8'));
      if (Array.isArray(parsed)) raw = parsed;
    } else {
      // First run: materialize the gitignored registry from the defaults.
      mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(PLATFORMS_FILE, JSON.stringify(DEFAULT_PLATFORMS, null, 2));
    }
  } catch {
    /* fall back to defaults */
  }
  // Merge env overrides: BRAIN_PLATFORM_<ID>_PATH (uppercase id, - → _).
  const merged = raw.map((p) => {
    const envKey = `BRAIN_PLATFORM_${p.id.toUpperCase().replace(/-/g, '_')}_PATH`;
    const override = (process.env[envKey] ?? '').trim();
    return { ...p, statePath: override || p.statePath };
  });
  platformCache = merged;
  return merged;
}

function findPlatform(platformId: string): BrainPlatform | undefined {
  return loadBrainPlatforms().find((p) => p.id === platformId && p.enabled);
}

function mirrorPath(platformId: string): string {
  return join(BRAIN_DIR, `${platformId}.STATE.md`);
}

function auditPath(platformId: string): string {
  return join(BRAIN_DIR, `${platformId}.audit.jsonl`);
}

function atomicWriteText(filePath: string, content: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp`;
  writeFileSync(tmp, content, 'utf8');
  renameSync(tmp, filePath);
}

function appendAudit(platformId: string, action: 'read' | 'write', bytes: number): void {
  try {
    mkdirSync(BRAIN_DIR, { recursive: true });
    const line = JSON.stringify({ updatedAt: new Date().toISOString(), action, bytes }) + '\n';
    // Append-only; not atomic, but audit is best-effort.
    writeFileSync(auditPath(platformId), line, { flag: 'a', encoding: 'utf8' });
  } catch {
    /* audit never blocks */
  }
}

export interface JournalRead {
  content: string;
  updatedAt: string | null;
  bytes: number;
}

export function readJournal(platformId: string): JournalRead | null {
  const platform = findPlatform(platformId);
  if (!platform) return null;
  const mirror = mirrorPath(platformId);
  // Prefer the authoritative mirror; fall back to the platform file.
  let content = '';
  let updatedAt: string | null = null;
  try {
    if (existsSync(mirror)) {
      content = readFileSync(mirror, 'utf8');
    } else if (existsSync(platform.statePath)) {
      content = readFileSync(platform.statePath, 'utf8');
    }
  } catch {
    content = '';
  }
  const m = content.match(/<!-- updated: (.+?) -->/);
  if (m) updatedAt = m[1];
  const bytes = Buffer.byteLength(content, 'utf8');
  appendAudit(platformId, 'read', bytes);
  return { content, updatedAt, bytes };
}

export interface JournalWrite {
  bytes: number;
  truncated: boolean;
  updatedAt: string;
}

export function writeJournal(platformId: string, content: string): JournalWrite | null {
  const platform = findPlatform(platformId);
  if (!platform) return null;
  const updatedAt = new Date().toISOString();
  let body = content ?? '';
  let truncated = false;
  const max = platform.maxChars || DEFAULT_MAX_CHARS;
  if (body.length > max) {
    body = body.slice(0, Math.max(0, max - 16)) + '\n…<truncated>';
    truncated = true;
  }
  const stamped = `<!-- updated: ${updatedAt} -->\n${body}`;
  // Authoritative mirror first (atomic), then best-effort write to the
  // platform's own folder. The platform write must never throw to the caller.
  try {
    atomicWriteText(mirrorPath(platformId), stamped);
  } catch (err) {
    console.error(`[brain] mirror write failed for ${platformId}:`, err);
  }
  try {
    atomicWriteText(platform.statePath, stamped);
  } catch (err) {
    // Platform folder may not exist yet / be read-only. Mirror is authoritative.
    console.error(`[brain] platform write skipped for ${platformId}:`, err);
  }
  const bytes = Buffer.byteLength(stamped, 'utf8');
  appendAudit(platformId, 'write', bytes);
  return { bytes, truncated, updatedAt };
}

export function platformSummary(platform: BrainPlatform): BrainPlatform & { bytes: number; updatedAt: string | null } {
  const j = readJournal(platform.id);
  return { ...platform, bytes: j?.bytes ?? 0, updatedAt: j?.updatedAt ?? null };
}