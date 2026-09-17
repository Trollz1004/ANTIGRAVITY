/**
 * Mission ribbon (Phase B) — the current rulings and the last few judge
 * handoffs, read live off disk. Pure module: paths are injected so tests use
 * fixtures instead of the real repo. No fabricated content: a missing file
 * reports an error string, never a placeholder ruling.
 */
import { readFileSync } from 'node:fs';

const DATE_RE = /\d{4}-\d{2}-\d{2}/;

/** Every `## ` heading in CLAUDE.md that mentions a ruling or carries a date. */
export function extractRulingHeadings(claudeMdText) {
  const out = [];
  for (const raw of String(claudeMdText || '').split(/\r?\n/)) {
    const m = /^##\s+(.*)$/.exec(raw);
    if (!m) continue;
    const heading = m[1].trim();
    if (/ruling/i.test(heading) || DATE_RE.test(heading)) out.push(heading);
  }
  return out;
}

/**
 * The judge journal is append-only, entries separated by a `## ` heading line
 * (e.g. `## 2026-09-17 (judge, claude-lane, sabretooth-runbook)`). Returns the
 * last `count` entries in file order (oldest of the tail first) with each
 * entry's `next:` line, or null when that entry has none.
 */
export function extractJournalEntries(stateMdText, count = 3) {
  const text = String(stateMdText || '');
  const parts = text.split(/\n(?=##\s)/).filter((p) => /^##\s/.test(p.trim()));
  const entries = parts.map((part) => {
    const headingLine = part.split(/\r?\n/)[0] || '';
    const heading = (/^##\s+(.*)$/.exec(headingLine) || [, headingLine])[1].trim();
    const nextMatch = /^[-*]?\s*\*?\*?next\*?\*?:\s*(.+)$/im.exec(part);
    return { heading, next: nextMatch ? nextMatch[1].trim() : null };
  });
  return entries.slice(-count);
}

export function readMissionRibbon({ claudeMdPath, stateMdPath, readFile = readFileSync }) {
  const errors = [];
  let claudeMd = '';
  let stateMd = '';
  try { claudeMd = readFile(claudeMdPath, 'utf8'); } catch (e) { errors.push('CLAUDE.md: ' + (e.message || e)); }
  try { stateMd = readFile(stateMdPath, 'utf8'); } catch (e) { errors.push('STATE.md: ' + (e.message || e)); }
  return {
    ok: errors.length === 0,
    errors,
    rulings: extractRulingHeadings(claudeMd),
    recentNext: extractJournalEntries(stateMd, 3),
    at: new Date().toISOString(),
  };
}
