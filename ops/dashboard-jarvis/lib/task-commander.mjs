/**
 * Task commander (Phase B) — every specs/*&#47;tasks.md with a done/total count
 * and the unchecked task lines. Pure filesystem module: paths are injected
 * so tests use a fixture directory instead of the real repo. Never throws on
 * a missing specs/ directory or a feature with no tasks.md yet.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Parse `- [ ]`/`- [x]` checkbox lines into total/done counts and the unchecked text. */
export function parseTasks(text) {
  let total = 0;
  let done = 0;
  const unchecked = [];
  for (const line of String(text || '').split(/\r?\n/)) {
    const m = /^\s*-\s*\[( |x|X)\]\s*(.*)$/.exec(line);
    if (!m) continue;
    total++;
    if (/x/i.test(m[1])) done++;
    else unchecked.push(m[2].trim());
  }
  return { total, done, unchecked };
}

/** List every feature under specsDir with its task done/total and unchecked lines. */
export function listTaskCommander(specsDir) {
  if (!existsSync(specsDir)) return [];
  const out = [];
  for (const id of readdirSync(specsDir)) {
    if (id.includes('..') || id.includes('/') || id.includes('\\')) continue;
    const dir = join(specsDir, id);
    if (!statSync(dir).isDirectory()) continue;
    const tasksPath = join(dir, 'tasks.md');
    if (!existsSync(tasksPath)) { out.push({ id, total: 0, done: 0, unchecked: [] }); continue; }
    const { total, done, unchecked } = parseTasks(readFileSync(tasksPath, 'utf8'));
    out.push({ id, total, done, unchecked });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}
