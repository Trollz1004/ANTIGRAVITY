/**
 * Runbook viewer (Phase B) — lists and serves ops/runbook/*.md, read-only.
 * Pure filesystem module: the directory is injected so tests use a fixture
 * instead of the real repo, and the path-sanitisation that keeps a request
 * inside the runbook directory lives here rather than duplicated in server.mjs.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

/** List every *.md file directly under dir, sorted by name. Never throws on a missing dir. */
export function listRunbooks(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.md') && statSync(join(dir, f)).isFile())
    .map((f) => {
      const st = statSync(join(dir, f));
      return { name: f, bytes: st.size, modified: st.mtime.toISOString() };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Resolve one runbook's markdown. Rejects traversal, non-.md names, and anything outside dir. */
export function resolveRunbook(dir, name) {
  if (!name || /\.\.|[\\/]/.test(name) || !name.toLowerCase().endsWith('.md')) return { ok: false, error: 'bad request' };
  const full = resolve(dir, name);
  if (!full.startsWith(resolve(dir) + sep)) return { ok: false, error: 'outside runbook dir' };
  if (!existsSync(full)) return { ok: false, error: 'not found' };
  return { ok: true, name, markdown: readFileSync(full, 'utf8') };
}
