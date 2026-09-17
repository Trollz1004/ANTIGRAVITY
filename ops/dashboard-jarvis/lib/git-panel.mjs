/**
 * Git panel (Phase B) — branch, dirty count, ahead/behind vs the locally
 * known origin ref (never `git fetch`), and the last 5 commits, for one or
 * more repos. The git binary is invoked through an injected `exec(cwd, args)`
 * so tests never touch a real checkout unless they want to.
 */
import { execFileSync } from 'node:child_process';

export function defaultExec(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
}

/** One repo's git state. Never throws: a repo that fails any git call reports { ok: false, error }. */
export function gitInfo(repoPath, { exec = defaultExec } = {}) {
  try {
    const branch = exec(repoPath, ['rev-parse', '--abbrev-ref', 'HEAD']).trim();
    const statusOut = exec(repoPath, ['status', '--porcelain']);
    const dirty = statusOut.split(/\r?\n/).filter((l) => l.length > 0).length;
    let ahead = null;
    let behind = null;
    let upstream = null;
    try {
      upstream = exec(repoPath, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']).trim();
      // --left-right --count "<upstream>...HEAD": left = commits only on upstream (behind), right = only on HEAD (ahead).
      // This compares against the locally recorded upstream ref only; no network call is made.
      const counts = exec(repoPath, ['rev-list', '--left-right', '--count', `${upstream}...HEAD`]).trim();
      const parts = counts.split(/\s+/).map(Number);
      behind = Number.isFinite(parts[0]) ? parts[0] : null;
      ahead = Number.isFinite(parts[1]) ? parts[1] : null;
    } catch {
      // no upstream configured for this branch — ahead/behind stay null, not fabricated zeros.
    }
    const commits = exec(repoPath, ['log', '-5', '--pretty=format:%h %s'])
      .split(/\r?\n/)
      .filter((l) => l.length > 0);
    return { ok: true, path: repoPath, branch, dirty, upstream, ahead, behind, commits };
  } catch (e) {
    return { ok: false, path: repoPath, error: String((e && e.message) || e) };
  }
}

/** Git state for every repo in `repos` ([{id, path}]). */
export function gitPanel(repos, opts) {
  return (repos || []).map((r) => ({ id: r.id, ...gitInfo(r.path, opts) }));
}
