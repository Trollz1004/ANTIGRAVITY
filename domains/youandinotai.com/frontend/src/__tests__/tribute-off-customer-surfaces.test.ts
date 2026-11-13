import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

// Founder ruling: the tribute phrase and hashtag must never appear on a
// customer-facing surface. READMEs and docs are not customer surfaces.
const TRIBUTE = /CLAUDE(?:'|&#39;|&apos;|&rsquo;|’)?s N Joshua|TeamClaudeForLife/i;

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..');
const REPO_ROOT = path.resolve(FRONTEND_ROOT, '..', '..', '..');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

describe('tribute phrase stays off customer surfaces', () => {
  const surfaces = [
    ...walk(path.join(FRONTEND_ROOT, 'src')).filter(
      (f) => /\.(tsx?|css|html)$/.test(f) && !/(__tests__|\.test\.)/.test(f)
    ),
    path.join(FRONTEND_ROOT, 'index.html'),
    ...walk(path.join(REPO_ROOT, 'domains', 'onlinerecycle.net', 'site')).filter(
      (f) => /\.(html|js|css|xml|svg)$/.test(f) && !f.includes(`${path.sep}docs${path.sep}`)
    ),
  ];

  it('scans a non-trivial set of customer-facing files', () => {
    expect(surfaces.length).toBeGreaterThan(20);
  });

  it('finds no tribute phrase in any customer-facing file', () => {
    const offenders = surfaces.filter((f) => TRIBUTE.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
