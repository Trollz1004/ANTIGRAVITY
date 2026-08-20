/**
 * Brain journal store — per-platform STATE.md memory.
 *
 * Each harness owns a repository journal (read on session start, written on
 * session end). This module writes the harness file first and keeps an audited
 * server mirror for recovery. Writes are atomic (tmp + rename, same pattern as
 * store.ts) and capped at maxChars so the journal cannot bloat a context window.
 *
 * Platform registry: server/data/brain-platforms.json (gitignored, created from
 * the committed brain-platforms.example.json on first run). Per-entry path
 * overrides via env BRAIN_PLATFORM_<ID>_PATH. Paths are never logged.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '../../..');
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

// One repository-owned journal per active harness. Read on session start and
// written on session end; Graphy and optional Obsidian mirrors consume these
// files rather than a retired external memory dependency.
const DEFAULT_PLATFORMS: BrainPlatform[] = [
  {
    id: 'hermes',
    label: 'Hermes',
    statePath: join(REPO_ROOT, '.agents', 'journals', 'hermes', 'STATE.md'),
    maxChars: DEFAULT_MAX_CHARS,
    enabled: true,
  },
  {
    id: 'openclaw',
    label: 'OpenClaw',
    statePath: join(REPO_ROOT, '.agents', 'journals', 'openclaw', 'STATE.md'),
    maxChars: DEFAULT_MAX_CHARS,
    enabled: true,
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    statePath: join(REPO_ROOT, '.agents', 'journals', 'opencode', 'STATE.md'),
    maxChars: DEFAULT_MAX_CHARS,
    enabled: true,
  },
];

function ensureExample(): void {
  if (!existsSync(EXAMPLE_FILE)) {
    try {
      mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(EXAMPLE_FILE, JSON.stringify(DEFAULT_PLATFORMS, null, 2));
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
  // The harness journal is authoritative; the server mirror is recovery only.
  let content = '';
  let updatedAt: string | null = null;
  try {
    if (existsSync(platform.statePath)) {
      content = readFileSync(platform.statePath, 'utf8');
    } else if (existsSync(mirror)) {
      content = readFileSync(mirror, 'utf8');
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

export interface SessionCloseout {
  taskId: string;
  objective: string;
  skills: string[];
  evidence: string[];
  blocker: string | null;
  nextAction: string;
}

function redactJournalText(value: string): string {
  return value
    .replace(/\b(?:sk|xai)-[A-Za-z0-9_-]{16,}\b/g, '[REDACTED_TOKEN]')
    .replace(/\b(?:authorization|api[_-]?key|token)\s*[:=]\s*[^\s]+/gi, '[REDACTED_CREDENTIAL]');
}

function capJournal(value: string, max: number): { body: string; truncated: boolean } {
  if (value.length <= max) return { body: value, truncated: false };
  return { body: value.slice(-Math.max(0, max - 20)) + '\n…<truncated-tail>', truncated: true };
}

export function writeJournal(platformId: string, content: string): JournalWrite | null {
  const platform = findPlatform(platformId);
  if (!platform) return null;
  const updatedAt = new Date().toISOString();
  const max = platform.maxChars || DEFAULT_MAX_CHARS;
  const capped = capJournal(redactJournalText(content ?? ''), max);
  const body = capped.body;
  const truncated = capped.truncated;
  const stamped = `<!-- updated: ${updatedAt} -->\n${body}`;
  // Write the harness-owned journal first, then maintain a best-effort mirror.
  try {
    atomicWriteText(platform.statePath, stamped);
  } catch (err) {
    console.error(`[brain] journal write failed for ${platformId}:`, err);
  }
  try {
    atomicWriteText(mirrorPath(platformId), stamped);
  } catch (err) {
    console.error(`[brain] recovery mirror write skipped for ${platformId}:`, err);
  }
  const bytes = Buffer.byteLength(stamped, 'utf8');
  appendAudit(platformId, 'write', bytes);
  return { bytes, truncated, updatedAt };
}

export function appendSessionCloseout(platformId: string, closeout: SessionCloseout): JournalWrite | null {
  const platform = findPlatform(platformId);
  if (!platform) return null;
  const previous = readJournal(platformId)?.content ?? '';
  const updatedAt = new Date().toISOString();
  const safe = redactJournalText(
    [
      `## Session closeout · ${updatedAt}`,
      `- Task: ${closeout.taskId}`,
      `- Objective: ${closeout.objective}`,
      `- Skills: ${closeout.skills.join(', ') || 'not recorded'}`,
      `- Evidence: ${closeout.evidence.join('; ') || 'not recorded'}`,
      `- Blocker: ${closeout.blocker || 'none'}`,
      `- Next action: ${closeout.nextAction}`,
    ].join('\n'),
  );
  const max = platform.maxChars || DEFAULT_MAX_CHARS;
  const capped = capJournal(`${previous.trimEnd()}\n\n${safe}\n`, max);
  const stamped = `<!-- updated: ${updatedAt} -->\n${capped.body}`;
  try {
    atomicWriteText(platform.statePath, stamped);
    atomicWriteText(mirrorPath(platformId), stamped);
  } catch (err) {
    console.error(`[brain] session closeout write failed for ${platformId}:`, err);
  }
  const bytes = Buffer.byteLength(stamped, 'utf8');
  appendAudit(platformId, 'write', bytes);
  return { bytes, truncated: capped.truncated, updatedAt };
}

export function platformSummary(platform: BrainPlatform): BrainPlatform & { bytes: number; updatedAt: string | null } {
  const j = readJournal(platform.id);
  return { ...platform, bytes: j?.bytes ?? 0, updatedAt: j?.updatedAt ?? null };
}
