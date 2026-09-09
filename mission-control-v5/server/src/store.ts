/**
 * Persistent task store. State survives restarts via atomic JSON writes
 * to server/data/state.json. Single writer, debounced flush.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SwarmTask } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const STATE_FILE = join(DATA_DIR, 'state.json');

interface PersistedState {
  version: number;
  tasks: SwarmTask[];
}

let tasks: SwarmTask[] = [];
let flushTimer: NodeJS.Timeout | null = null;

export function loadState(): void {
  try {
    if (existsSync(STATE_FILE)) {
      const raw = JSON.parse(readFileSync(STATE_FILE, 'utf8')) as PersistedState;
      tasks = Array.isArray(raw.tasks) ? raw.tasks : [];
      // Anything mid-flight when the process died is honestly marked blocked.
      for (const t of tasks) {
        if (t.status === 'running' || t.status === 'queued') {
          t.status = 'error';
          t.column = 'BLOCKED';
          t.error = 'Interrupted by server restart. Retry to re-queue.';
          for (const r of t.results) {
            if (r.status === 'running' || r.status === 'pending') {
              r.status = 'error';
              r.error = 'Interrupted by server restart.';
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[store] Failed to load state, starting empty:', err);
    tasks = [];
  }
}

function flush(): void {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    const tmp = `${STATE_FILE}.tmp`;
    writeFileSync(tmp, JSON.stringify({ version: 1, tasks } satisfies PersistedState, null, 2));
    renameSync(tmp, STATE_FILE);
  } catch (err) {
    console.error('[store] Flush failed:', err);
  }
}

export function persist(): void {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 150);
}

export function allTasks(): SwarmTask[] {
  return tasks;
}

export function getTask(id: string): SwarmTask | undefined {
  return tasks.find((t) => t.id === id);
}

export function addTask(task: SwarmTask): void {
  tasks.unshift(task);
  persist();
}

export function removeTask(id: string): boolean {
  const before = tasks.length;
  tasks = tasks.filter((t) => t.id !== id);
  const removed = tasks.length !== before;
  if (removed) persist();
  return removed;
}
