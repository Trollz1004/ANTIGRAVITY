/**
 * MATERIALIZE — turn orchestrator text into files on disk, committed to the repo.
 *
 * WHY THIS EXISTS: the orchestrators had no hands. They emitted markdown
 * *describing* files — "File: graph-3d.schema.json" followed by a fenced block —
 * and nothing ever touched disk. Observed failures that motivated this:
 *
 *   - "Plan only ... nothing solved or coded in this response"
 *   - files "written" to /home/user/graph-renderer/ (a Linux path that does not
 *     exist on this Windows box)
 *   - a subtask emitting raw <DSML invoke name="Shell"> markup as TEXT because
 *     it tried to call a tool it does not have
 *
 * So a task could report "done" while producing nothing. That is the drift and
 * lost work this module exists to stop: every task that yields file content now
 * lands in the repo and is committed, or the task says plainly that it produced
 * no artifacts.
 *
 * SAFETY: paths from a model are untrusted input. Absolute paths, drive letters,
 * UNC paths and .. traversal are rejected — everything is forced inside the
 * task's own workspace directory.
 */
import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize, resolve, sep } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

// The canonical workspace is C:\ANTIGRAVITY. Materialization stays local and
// uncommitted by default; the judge lane controls any later delivery action.
const REPO_ROOT = (process.env.MATERIALIZE_REPO_ROOT ?? 'C:\\ANTIGRAVITY').trim();
const OUT_DIR = (process.env.MATERIALIZE_OUT_DIR ?? 'mission-control-output').trim();
const AUTO_COMMIT = (process.env.MATERIALIZE_AUTO_COMMIT ?? '0').trim() === '1';

export interface ExtractedFile {
  path: string;
  content: string;
  lang: string;
}

export interface MaterializeResult {
  workspace: string | null;
  files: string[];
  skipped: { path: string; why: string }[];
  committed: boolean;
  pushed: boolean;
  note: string;
}

/**
 * Pull file blocks out of orchestrator markdown.
 *
 * Handles the shapes the models actually emit:
 *   File: `path/name.ext`      then a fenced block
 *   **File:** path/name.ext    then a fenced block
 *   /abs/or/rel/path.ext       on its own line, then a fenced block
 *   ### path/name.ext          then a fenced block
 *
 * A fenced block with no filename above it is prose or an example, not a
 * deliverable, and is deliberately ignored.
 */
export function extractFiles(markdown: string): ExtractedFile[] {
  const out: ExtractedFile[] = [];
  if (!markdown) return out;

  const lines = markdown.split(/\r?\n/);
  let pending: string | null = null;

  // A filename line: optional "File:"/"###"/bold, then something with an
  // extension. Kept deliberately tight so prose does not match.
  const nameRe =
    /^\s*(?:#{1,6}\s*)?(?:\*\*)?\s*(?:File|Path|Filename)?\s*:?\s*(?:\*\*)?\s*[`'"]?([A-Za-z0-9_./\\@-]+\.[A-Za-z0-9]{1,12})[`'"]?\s*:?\s*$/;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const fence = line.match(/^\s*```+\s*([A-Za-z0-9+#-]*)\s*$/);

    if (fence) {
      // Collect to the closing fence regardless — we must not re-scan block
      // contents for filenames, or JSON keys become "files".
      const lang = fence[1] ?? '';
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !/^\s*```+\s*$/.test(lines[i])) {
        body.push(lines[i]);
        i += 1;
      }
      if (pending) {
        out.push({ path: pending, content: body.join('\n').trimEnd() + '\n', lang });
        pending = null;
      }
      continue;
    }

    const m = line.match(nameRe);
    if (m) {
      pending = m[1];
      continue;
    }
    // Any other non-blank line breaks the filename→fence association.
    if (line.trim()) pending = null;
  }
  return out;
}

/** Force a model-supplied path inside `root`. Returns null if it escapes. */
export function safeJoin(root: string, candidate: string): string | null {
  let p = candidate.replace(/\\/g, '/').trim();
  if (!p) return null;
  // Reject drive letters, UNC and absolute paths outright — a model writing
  // /home/user/... or C:\... is describing its own imagination, not this repo.
  if (/^[A-Za-z]:/.test(p) || p.startsWith('//') || p.startsWith('/')) {
    p = p.replace(/^([A-Za-z]:)?[/\\]+/, '');
    // strip a leading /home/<user>/ style prefix so the basename survives
    p = p.replace(/^(home|users|Users|tmp|var)\/[^/]+\//, '');
  }
  if (!p || p === '.' || p === '..') return null;
  const full = resolve(root, normalize(p));
  const rootResolved = resolve(root);
  if (full !== rootResolved && !full.startsWith(rootResolved + sep)) return null;
  return full;
}

function slug(s: string): string {
  return (
    (s || 'task')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'task'
  );
}

async function git(args: string[]): Promise<string> {
  const { stdout } = await run('git', ['-C', REPO_ROOT, ...args], { windowsHide: true });
  return stdout.trim();
}

/**
 * Write every file a task produced into its own workspace. Materialization does
 * not push; uncommitted output is the default so the judge lane can inspect it.
 */
export async function materializeTask(params: {
  taskId: string;
  title: string;
  outputs: { agentId: string; text: string }[];
}): Promise<MaterializeResult> {
  const result: MaterializeResult = {
    workspace: null,
    files: [],
    skipped: [],
    committed: false,
    pushed: false,
    note: '',
  };

  const found: ExtractedFile[] = [];
  for (const o of params.outputs) found.push(...extractFiles(o.text));

  if (found.length === 0) {
    result.note = 'No file blocks in the output — nothing to materialize. The task produced text only.';
    return result;
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const rel = join(OUT_DIR, `${stamp}-${slug(params.title)}-${params.taskId.slice(0, 8)}`);
  const workspace = join(REPO_ROOT, rel);
  mkdirSync(workspace, { recursive: true });
  result.workspace = rel.replace(/\\/g, '/');

  const seen = new Set<string>();
  for (const f of found) {
    const target = safeJoin(workspace, f.path);
    if (!target) {
      result.skipped.push({ path: f.path, why: 'path escaped the workspace' });
      continue;
    }
    if (seen.has(target)) {
      result.skipped.push({ path: f.path, why: 'duplicate filename in output' });
      continue;
    }
    seen.add(target);
    try {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, f.content, 'utf8');
      result.files.push(target.slice(workspace.length + 1).replace(/\\/g, '/'));
    } catch (err) {
      result.skipped.push({ path: f.path, why: err instanceof Error ? err.message : String(err) });
    }
  }

  if (result.files.length === 0) {
    result.note = 'File blocks were found but none could be written safely.';
    return result;
  }

  if (!AUTO_COMMIT) {
    result.note = `Wrote ${result.files.length} file(s). Auto-commit disabled.`;
    return result;
  }

  try {
    await git(['add', '--', result.workspace!]);
    const staged = await git(['diff', '--cached', '--name-only', '--', result.workspace!]);
    if (!staged) {
      result.note = `Wrote ${result.files.length} file(s); git reported nothing to commit.`;
      return result;
    }
    const msg = [
      `chore(mission-control): task output — ${params.title}`.slice(0, 100),
      '',
      `Task ${params.taskId}`,
      `Agents: ${params.outputs.map((o) => o.agentId).join(', ')}`,
      `Files: ${result.files.length}`,
      '',
      'Written by the Mission Control materializer so task output lands in the',
      'repo instead of existing only as chat text.',
    ].join('\n');
    await git(['commit', '-q', '-m', msg]);
    result.committed = true;

    if (!result.note) {
      result.note = `Wrote ${result.files.length} file(s), committed locally; judge review is still required before delivery.`;
    }
  } catch (err) {
    result.note = `Wrote ${result.files.length} file(s); git failed: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`;
  }

  return result;
}
