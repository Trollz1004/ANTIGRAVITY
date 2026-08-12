#!/usr/bin/env node
// locator-scan — inventory of every ANTIGRAVITY-ish asset across all drives.
//
// WHY THIS EXISTS:
// Nothing is ever really lost here; it is misplaced. On 2026-08-05 a single
// session found: the live repo nested one folder deep, two MCP servers stranded
// in a dead worktree, the README meme deleted by a cleanup sweep, a 1268-commit
// stale graph, a deleted canonical-guard, and an ANTIGRAVITY folder in the
// Recycle Bin. Every one was a location problem, not a build problem.
//
// Emits inventory.json. Read-only — touches nothing.

import { readdirSync, statSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOTS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['C:\\', 'F:\\', 'C:\\Users\\joshl\\OneDrive', 'C:\\Users\\joshl\\_worktrees'];

const SKIP = new Set([
  'node_modules',
  '.git',
  '$RECYCLE.BIN',
  'System Volume Information',
  'Windows',
  'Program Files',
  'Program Files (x86)',
  'ProgramData',
  '.venv',
  'venv',
  '__pycache__',
  'AppData',
  '.cache',
  'dist',
  'build',
]);
const MAX_DEPTH = 5;

// A directory is "interesting" if it carries one of these markers.
const MARKERS = [
  ['git-repo', (d) => existsSync(join(d, '.git'))],
  ['mcp-config', (d) => existsSync(join(d, '.mcp.json'))],
  ['skills', (d) => existsSync(join(d, 'SKILL.md')) || existsSync(join(d, 'skills'))],
  ['node-project', (d) => existsSync(join(d, 'package.json'))],
  ['py-project', (d) => existsSync(join(d, 'pyproject.toml')) || existsSync(join(d, 'requirements.txt'))],
  ['claude-doc', (d) => existsSync(join(d, 'CLAUDE.md')) || existsSync(join(d, 'AGENTS.md'))],
];

const sh = (cmd, args, cwd) => {
  try {
    return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
};

function gitInfo(dir) {
  const remote = sh('git', ['remote', 'get-url', 'origin'], dir);
  if (remote === null && !existsSync(join(dir, '.git'))) return null;
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], dir);
  const head = sh('git', ['rev-parse', '--short', 'HEAD'], dir);
  const dirty = sh('git', ['status', '--porcelain'], dir);
  const upstream = sh('git', ['rev-parse', '--abbrev-ref', '@{u}'], dir);
  let ahead = null,
    behind = null;
  if (upstream) {
    const c = sh('git', ['rev-list', '--left-right', '--count', `${upstream}...HEAD`], dir);
    if (c) {
      const [b, a] = c.split(/\s+/);
      behind = +b;
      ahead = +a;
    }
  }
  const lastCommit = sh('git', ['log', '-1', '--format=%cI|%s'], dir);
  return {
    remote,
    branch,
    head,
    upstream,
    dirtyCount: dirty ? dirty.split('\n').filter(Boolean).length : 0,
    ahead,
    behind,
    lastCommitISO: lastCommit ? lastCommit.split('|')[0] : null,
    lastCommitMsg: lastCommit ? lastCommit.split('|').slice(1).join('|') : null,
  };
}

const found = [];
const seen = new Set();

function walk(dir, depth) {
  if (depth > MAX_DEPTH) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  const kinds = MARKERS.filter(([, test]) => {
    try {
      return test(dir);
    } catch {
      return false;
    }
  }).map(([k]) => k);
  if (kinds.length && !seen.has(dir.toLowerCase())) {
    seen.add(dir.toLowerCase());
    let mtime = null,
      sizeHint = 0;
    try {
      mtime = statSync(dir).mtime.toISOString();
    } catch {}
    try {
      sizeHint = entries.length;
    } catch {}
    const rec = { path: dir, name: basename(dir) || dir, kinds, mtime, entries: sizeHint, drive: dir[0].toUpperCase() };
    if (kinds.includes('git-repo')) rec.git = gitInfo(dir);
    // Note what notable things live inside, without descending for it.
    rec.has = {
      mcpJson: existsSync(join(dir, '.mcp.json')),
      claudeMd: existsSync(join(dir, 'CLAUDE.md')),
      agentsMd: existsSync(join(dir, 'AGENTS.md')),
      skills: existsSync(join(dir, '.agents', 'skills')) || existsSync(join(dir, 'skills')),
      dist: existsSync(join(dir, 'dist')),
      nodeMods: existsSync(join(dir, 'node_modules')),
    };
    if (rec.has.skills) {
      for (const sp of [join(dir, '.agents', 'skills'), join(dir, 'skills')]) {
        try {
          rec.skillCount = readdirSync(sp, { withFileTypes: true }).filter((e) => e.isDirectory()).length;
          break;
        } catch {}
      }
    }
    found.push(rec);
    // A git repo is a leaf for our purposes — don't index its every subdir.
    if (kinds.includes('git-repo') && depth > 0) return;
  }

  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (SKIP.has(e.name)) continue;
    if (e.name.startsWith('.') && !['.agents', '.claude', '.codex'].includes(e.name)) continue;
    walk(join(dir, e.name), depth + 1);
  }
}

for (const r of ROOTS) {
  if (existsSync(r)) walk(r, 0);
}

found.sort((a, b) => (b.mtime || '').localeCompare(a.mtime || ''));

const out = {
  scannedAt: new Date().toISOString(),
  roots: ROOTS,
  count: found.length,
  assets: found,
};

const dest = join(process.cwd(), 'graphify-out');
try {
  mkdirSync(dest, { recursive: true });
} catch {}
writeFileSync(join(dest, 'inventory.json'), JSON.stringify(out, null, 2));

// Console summary
console.log(`scanned ${ROOTS.length} roots -> ${found.length} assets`);
const byDrive = {};
for (const a of found) byDrive[a.drive] = (byDrive[a.drive] || 0) + 1;
console.log('by drive:', JSON.stringify(byDrive));
const repos = found.filter((a) => a.git);
console.log(`git repos: ${repos.length}`);
for (const r of repos) {
  const g = r.git;
  const flags = [
    g.dirtyCount ? `${g.dirtyCount} dirty` : null,
    g.behind ? `${g.behind} BEHIND` : null,
    g.ahead ? `${g.ahead} ahead` : null,
    !g.upstream ? 'NO UPSTREAM' : null,
  ]
    .filter(Boolean)
    .join(', ');
  console.log(
    `  ${r.path}\n      ${g.remote || '(no remote)'} @ ${g.branch || '?'} ${g.head || ''} ${flags ? '[' + flags + ']' : '[clean]'}`,
  );
}
console.log(`\nwrote graphify-out/inventory.json`);
