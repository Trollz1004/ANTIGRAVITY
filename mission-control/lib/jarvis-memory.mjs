/**
 * JARVIS memory — a small durable store of recent conversations with the
 * operator, read back into every HUD preamble so JARVIS remembers across page
 * reloads and server restarts. JSON only, no dependencies, kept small: oldest
 * entries are pruned past MEMORY_LIMIT, bodies are trimmed. The file lives in
 * dashboard/jarvis/data/ (created on first write, never served as a static
 * route — the server's static handler must refuse /data).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const MEMORY_LIMIT = 30;
const BODY_MAX = 700;
const DEFAULTS = { owner: 'Joshua', entries: [], updatedAt: new Date(0).toISOString() };

const clip = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, BODY_MAX);

/** Parse raw store text; anything that is not the expected object heals to empty. */
function parseStore(raw) {
  if (!raw) return { ...DEFAULTS, entries: [] };
  try {
    const j = JSON.parse(raw);
    if (!j || typeof j !== 'object' || Array.isArray(j)) return { ...DEFAULTS, entries: [] };
    return {
      owner: typeof j.owner === 'string' && j.owner ? j.owner : DEFAULTS.owner,
      entries: Array.isArray(j.entries) ? j.entries.filter((e) => e && typeof e === 'object') : [],
      updatedAt: typeof j.updatedAt === 'string' ? j.updatedAt : DEFAULTS.updatedAt,
    };
  } catch {
    return { ...DEFAULTS, entries: [] };
  }
}

export function readMemory({ dataFile, raw } = {}) {
  if (!dataFile) return { ...DEFAULTS, entries: [] };
  let text = raw;
  if (typeof raw !== 'function') {
    try { text = existsSync(dataFile) ? readFileSync(dataFile, 'utf8') : ''; } catch { text = ''; }
  } else {
    try { text = raw(dataFile); } catch { text = ''; }
  }
  return parseStore(text);
}

export function appendMemory({ dataFile, entry, write, raw } = {}) {
  if (!dataFile || !entry) return null;
  const store = readMemory({ dataFile, raw });
  const clean = {
    at: new Date().toISOString(),
    prompt: clip(entry.prompt),
    reply: clip(entry.reply),
    ok: entry.ok !== false,
  };
  const entries = [...store.entries, clean].slice(-MEMORY_LIMIT);
  const next = { owner: store.owner, entries, updatedAt: clean.at };
  const text = JSON.stringify(next, null, 1);
  try {
    if (typeof write === 'function') write(dataFile, text);
    else {
      mkdirSync(dirname(dataFile), { recursive: true });
      writeFileSync(dataFile, text, 'utf8');
    }
  } catch {}
  return next;
}

/**
 * The compact memory block the composer drops into the preamble. Empty when
 * there is nothing to remember (the composer then omits it entirely).
 */
export function memoryBlock(memory) {
  const entries = (memory && Array.isArray(memory.entries)) ? memory.entries : [];
  if (!entries.length) return '';
  const lines = ['[JARVIS memory — recent turns with this operator, oldest first]'];
  for (const e of entries.slice(-12)) {
    const tag = e.ok === false ? ' (error)' : '';
    lines.push(`You: ${clip(e.prompt)}`.slice(0, 300));
    lines.push(`JARVIS: ${clip(e.reply)}${tag}`.slice(0, 300));
  }
  lines.push('[/JARVIS memory]');
  return lines.join('\n');
}
