/**
 * Catalog — scans the monorepo (E:\ANTIGRAVITY) for skill + task definitions so
 * any agent can discover what it must do and which tools/skills it may access.
 *
 * Pure file scan, no dependencies. Frontmatter is parsed by a tiny hand-rolled
 * reader (only needs name / description / metadata.category) — never crashes the
 * server: any read/parse error degrades to a skipped entry, and loadCatalog as a
 * whole returns [] on catastrophe. Results are cached for 5 min and invalidated by
 * a cheap mtime key so edits show up without a restart.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import type { Dirent } from 'node:fs';
import { join, relative, sep, basename, dirname } from 'node:path';

const env = (k: string, d = ''): string => (process.env[k] ?? d).trim();

export const CATALOG_ROOT = env('CATALOG_ROOT') || 'E:\\ANTIGRAVITY';

const SKILL_GLOBS = env('CATALOG_SKILL_GLOBS', 'skills/**/SKILL.md')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const TASK_GLOBS = env('CATALOG_TASK_GLOBS', 'tasks/**/*.md')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export interface BrainSkill {
  id: string;
  label: string;
  category: string;
  description: string;
  tools: string[];
  path: string; // repo-relative
  body: string; // full markdown (detail view)
  kind: 'skill' | 'task';
}

export interface BrainCatalog {
  skills: BrainSkill[];
  categories: { id: string; label: string; count: number }[];
}

let cache: { key: string; at: number; data: BrainCatalog } | null = null;
const CACHE_TTL_MS = 5 * 60_000;

/** Recursively collect files under `root` matching a glob like skills/STAR/STAR/SKILL.md. */
function walk(root: string, pattern: string): string[] {
  if (!existsSync(root)) return [];
  // Split pattern into segments; `**` means any depth, `*` means one segment.
  const segs = pattern.split(/[\\/]/).filter((s) => s.length > 0);
  const out: string[] = [];
  const visit = (dir: string, idx: number) => {
    if (idx >= segs.length) return;
    const seg = segs[idx];
    const last = idx === segs.length - 1;
    let entries: Dirent[] = [];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (seg === '**') {
        const next = join(dir, e.name);
        if (last) {
          if (e.isFile() && matchSeg(e.name, segs[segs.length - 1])) out.push(next);
        } else {
          // ** matches zero or more dirs — try matching the next seg here too, and descend.
          visit(dir, idx + 1);
          if (e.isDirectory()) visit(next, idx);
        }
      } else if (e.isDirectory() && matchSeg(e.name, seg)) {
        visit(join(dir, e.name), idx + 1);
      } else if (last && e.isFile() && matchSeg(e.name, seg)) {
        out.push(join(dir, e.name));
      }
    }
  };
  visit(root, 0);
  return out;
}

function matchSeg(name: string, seg: string): boolean {
  if (seg === '*' || seg === '**') return true;
  // glob * → regex [^/]*, escape other regex chars
  const re = new RegExp('^' + seg.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^\\\\/]*') + '$');
  return re.test(name);
}

/** Minimal YAML frontmatter reader: name, description (incl. `|`/`>` block), metadata.category. */
function parseFmProper(src: string): { name?: string; description?: string; category?: string; body: string } {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { body: src };
  const fm = m[1];
  const body = src.slice(m[0].length);
  const lines = fm.split(/\r?\n/);
  const get = (key: string): string | undefined => {
    for (const ln of lines) {
      const mm = ln.match(new RegExp('^\\s*' + key + '\\s*:\\s*(.*)$'));
      if (mm) return mm[1].trim();
    }
    return undefined;
  };
  let description = get('description');
  if (description === '|' || description === '>') {
    const start = lines.findIndex((l) => /^\s*description\s*:\s*[|>]/.test(l)) + 1;
    const block: string[] = [];
    for (const ln of lines.slice(start)) {
      if (/^\S/.test(ln)) break; // dedent → end of block
      block.push(ln.replace(/^\s{2}/, ''));
    }
    description = block.join(' ').trim() || undefined;
  }
  return { name: get('name'), description, category: get('category'), body };
}

function firstHeading(body: string): string | undefined {
  const m = body.match(/^#\s+(.+)$/m);
  if (!m) return undefined;
  // "Agent Browser — Browser Automation" → "Agent Browser"
  return m[1].split(/[—–-]/)[0].trim();
}

function extractTools(body: string): string[] {
  const tools: string[] = [];
  const lines = body.split(/\r?\n/);
  let inTools = false;
  for (const ln of lines) {
    const head = ln.match(/^##\s+(.+?)\s*$/);
    if (head) {
      inTools = /^tools\b/i.test(head[1]);
      continue;
    }
    if (!inTools) continue;
    const b = ln.match(/^\s*[-*]\s+(.+)$/);
    if (b) tools.push(b[1].trim());
  }
  return tools;
}

function buildEntry(absPath: string, kind: 'skill' | 'task'): BrainSkill | null {
  try {
    const src = readFileSync(absPath, 'utf8');
    const fm = parseFmProper(src);
    const rel = relative(CATALOG_ROOT, absPath).split(sep).join('/');
    const stem = basename(absPath, '.md');
    const dirName = basename(dirname(absPath));
    const id = fm.name || (kind === 'skill' && dirName !== 'skills' ? dirName : stem);
    const label = firstHeading(fm.body) || id;
    const description = (fm.description || '').trim() || fm.body.slice(0, 160).replace(/\s+/g, ' ').trim();
    return {
      id,
      label,
      category: (fm.category || 'uncategorized').toLowerCase(),
      description,
      tools: extractTools(fm.body),
      path: rel,
      body: fm.body,
      kind,
    };
  } catch {
    return null;
  }
}

/** Mtime key for cache invalidation — changes when any matched file changes. */
function mtimeKey(paths: string[]): string {
  let key = '';
  for (const p of paths.sort()) {
    try {
      key += statSync(p).mtimeMs.toString(36) + '|';
    } catch {
      /* skip */
    }
  }
  return key;
}

export function loadCatalog(): BrainCatalog {
  try {
    const skillPaths = SKILL_GLOBS.flatMap((g) => walk(CATALOG_ROOT, g));
    const taskPaths = TASK_GLOBS.flatMap((g) => walk(CATALOG_ROOT, g));
    const key = mtimeKey([...skillPaths, ...taskPaths]);
    const now = Date.now();
    if (cache && cache.key === key && now - cache.at < CACHE_TTL_MS) return cache.data;

    const skills = [...skillPaths.map((p) => buildEntry(p, 'skill')), ...taskPaths.map((p) => buildEntry(p, 'task'))]
      .filter((s): s is BrainSkill => s !== null)
      .sort((a, b) => a.label.localeCompare(b.label));

    const catMap = new Map<string, number>();
    for (const s of skills) catMap.set(s.category, (catMap.get(s.category) ?? 0) + 1);
    const categories = [...catMap.entries()]
      .map(([id, count]) => ({ id, label: id.toUpperCase().replace(/-/g, ' '), count }))
      .sort((a, b) => b.count - a.count);

    const data: BrainCatalog = { skills, categories };
    cache = { key, at: now, data };
    return data;
  } catch {
    return cache?.data ?? { skills: [], categories: [] };
  }
}

export function getCatalogEntry(id: string, kind?: 'skill' | 'task'): BrainSkill | null {
  const { skills } = loadCatalog();
  return skills.find((s) => s.id === id && (kind ? s.kind === kind : true)) ?? null;
}
