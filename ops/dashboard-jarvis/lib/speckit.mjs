/**
 * Spec Kit panel (Phase A, read-only) — lists every feature under specs/ with
 * its spec/plan/tasks status and live task counts, and serves the ratified
 * constitution. Pure filesystem module: paths are injected so tests use a
 * fixture directory instead of the real repo, and so server.mjs never has to
 * duplicate the path-sanitisation logic that keeps a request inside specs/.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

export const SPECKIT_DOCS = ['spec', 'plan', 'tasks'];

export function readConstitution(constitutionPath) {
  try { return readFileSync(constitutionPath, 'utf8'); } catch { return ''; }
}

export function taskCounts(text) {
  const lines = String(text || '').match(/^\s*-\s*\[( |x|X)\]/gm) || [];
  const done = lines.filter((l) => /\[[xX]\]/.test(l)).length;
  return { tasksTotal: lines.length, tasksDone: done };
}

export function featureTitle(specText, fallback) {
  const m = /^#\s*Feature Specification:\s*(.+)$/m.exec(specText || '');
  return m ? m[1].trim() : fallback;
}

/** List every feature directory under specsDir with its doc/task status. Never throws on a missing dir. */
export function listFeatures(specsDir) {
  if (!existsSync(specsDir)) return [];
  const out = [];
  for (const id of readdirSync(specsDir)) {
    if (id.includes('..') || id.includes('/') || id.includes('\\')) continue;
    const dir = join(specsDir, id);
    if (!statSync(dir).isDirectory()) continue;
    const specPath = join(dir, 'spec.md');
    const planPath = join(dir, 'plan.md');
    const tasksPath = join(dir, 'tasks.md');
    const hasSpec = existsSync(specPath);
    const hasPlan = existsSync(planPath);
    const hasTasks = existsSync(tasksPath);
    const specText = hasSpec ? readFileSync(specPath, 'utf8') : '';
    const tasksText = hasTasks ? readFileSync(tasksPath, 'utf8') : '';
    const { tasksTotal, tasksDone } = taskCounts(tasksText);
    let updatedAt = null;
    for (const f of [specPath, planPath, tasksPath]) {
      if (!existsSync(f)) continue;
      const m = statSync(f).mtime.toISOString();
      if (!updatedAt || m > updatedAt) updatedAt = m;
    }
    out.push({ id, title: featureTitle(specText, id), hasSpec, hasPlan, hasTasks, tasksTotal, tasksDone, updatedAt });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Resolve one feature's doc markdown. Rejects any id/doc that could escape
 * specsDir (traversal segments, path separators, or a doc outside the fixed
 * spec|plan|tasks set) before ever touching the filesystem.
 */
export function resolveDoc(specsDir, id, doc) {
  if (!id || !doc || /\.\.|[\\/]/.test(id) || !SPECKIT_DOCS.includes(doc)) return { ok: false, error: 'bad request' };
  const full = resolve(specsDir, id, doc + '.md');
  if (!full.startsWith(resolve(specsDir) + sep)) return { ok: false, error: 'outside specs/' };
  if (!existsSync(full)) return { ok: false, error: 'not found' };
  return { ok: true, id, doc, markdown: readFileSync(full, 'utf8') };
}
