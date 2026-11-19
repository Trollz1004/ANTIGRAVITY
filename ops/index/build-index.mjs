import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function formatBytes(bytes) {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)} MB (${bytes} B)`;
  const kb = bytes / 1024;
  if (kb >= 1) return `${kb.toFixed(1)} KB (${bytes} B)`;
  return `${bytes} B`;
}

function classifyStaleCategory(filePath, base) {
  const lowerBase = base.toLowerCase();
  if (lowerBase === 'claude.md' || lowerBase === 'agents.md' || lowerBase === 'gemini.md') return 'agent';
  if (lowerBase === 'skill.md') return 'skill';
  if (/(^|\/)workflows?\//i.test(filePath)) return 'workflow';
  if (/\.(ps1|psm1|psd1)$/i.test(lowerBase)) return 'powershell';
  if (/\.json$/i.test(lowerBase)) return 'json';
  return null;
}

function escapeTableText(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('|', '-');
}

function extractReadmeSummary(repoRoot, blobHash) {
  if (!blobHash) return 'no README';
  const raw = execFileSync('git', ['cat-file', '-p', blobHash], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024
  });
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const headingMatch = line.match(/^\s*#{1,6}\s+(.+?)\s*#*$/);
    if (headingMatch) {
      const cleaned = escapeTableText(headingMatch[1]).trim();
      if (cleaned) return cleaned;
    }
  }
  for (const line of lines) {
    const cleaned = escapeTableText(line).trim();
    if (!cleaned || cleaned.startsWith('---') || cleaned.startsWith('![')) continue;
    const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0].trim();
    if (firstSentence) return firstSentence;
  }
  return 'no README';
}

function computeFolderPairs(dupGroups, folderFn) {
  const pairs = new Map();
  for (const group of dupGroups) {
    const folders = [...new Set(group.paths.map(folderFn))].sort();
    if (folders.length === 1 && group.paths.length > 1) {
      const key = `${folders[0]} <-> ${folders[0]}`;
      const cur = pairs.get(key) || { pair: key, groups: 0, bytes: 0 };
      cur.groups += 1;
      cur.bytes += group.size;
      pairs.set(key, cur);
    }
    for (let i = 0; i < folders.length; i++) {
      for (let j = i + 1; j < folders.length; j++) {
        const key = `${folders[i]} <-> ${folders[j]}`;
        const cur = pairs.get(key) || { pair: key, groups: 0, bytes: 0 };
        cur.groups += 1;
        cur.bytes += group.size;
        pairs.set(key, cur);
      }
    }
  }
  return [...pairs.values()].sort((a, b) => b.groups - a.groups || b.bytes - a.bytes || a.pair.localeCompare(b.pair));
}

export function buildIndex(repoRoot = process.cwd()) {
  const treeOut = execFileSync('git', ['ls-tree', '-r', '-l', 'HEAD'], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  });

  const files = [];
  const trackedSet = new Set();
  const pathToHash = new Map();
  const basenameCounts = new Map();

  for (const line of treeOut.split(/\r?\n/)) {
    const match = line.match(/^\S+\s+blob\s+(\S+)\s+(\d+)\t(.+)$/);
    if (!match) continue;
    const [, hash, sizeStr, filePath] = match;
    const size = Number(sizeStr);
    const base = path.posix.basename(filePath);
    files.push({ hash, size, path: filePath, base });
    trackedSet.add(filePath);
    pathToHash.set(filePath, hash);
    basenameCounts.set(base, (basenameCounts.get(base) || 0) + 1);
  }

  const logOut = execFileSync(
    'git',
    ['log', '--first-parent', '-m', '--no-renames', '--format=COMMIT:%ct %cs', '--name-only', 'HEAD'],
    { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  );

  const lastCommit = new Map();
  let curTs = 0;
  let curDate = '';
  let headTs = 0;

  for (const line of logOut.split(/\r?\n/)) {
    if (!line) continue;
    if (line.startsWith('COMMIT:')) {
      const parts = line.slice(7).split(' ');
      curTs = Number(parts[0]);
      curDate = parts[1];
      if (curTs > headTs) headTs = curTs;
    } else if (trackedSet.has(line) && !lastCommit.has(line)) {
      lastCommit.set(line, { ts: curTs, date: curDate });
    }
  }

  // 1. REPO-INDEX.md
  const folders = new Map();
  let rootFilesCount = 0;
  let rootFilesSize = 0;
  let rootLastTs = 0;
  let rootLastDate = 'unknown';

  for (const f of files) {
    const c = lastCommit.get(f.path);
    if (!f.path.includes('/')) {
      rootFilesCount++;
      rootFilesSize += f.size;
      if (c && c.ts > rootLastTs) {
        rootLastTs = c.ts;
        rootLastDate = c.date;
      }
      continue;
    }
    const slashIdx = f.path.indexOf('/');
    const top = f.path.slice(0, slashIdx);
    const rel = f.path.slice(slashIdx + 1);
    if (!folders.has(top)) {
      folders.set(top, { name: top, files: 0, size: 0, lastTs: 0, lastDate: 'unknown', readmeHash: null });
    }
    const entry = folders.get(top);
    entry.files += 1;
    entry.size += f.size;
    if (c && c.ts > entry.lastTs) {
      entry.lastTs = c.ts;
      entry.lastDate = c.date;
    }
    if (/^readme(\.[a-z0-9]+)?$/i.test(rel)) {
      if (!entry.readmeHash || rel.toLowerCase() === 'readme.md') {
        entry.readmeHash = f.hash;
      }
    }
  }

  const folderRows = [...folders.values()].sort((a, b) => a.name.localeCompare(b.name));
  const repoIndexLines = [
    '# Repository Index',
    '',
    `Tracked files in HEAD: ${files.length} (${rootFilesCount} at root, ${files.length - rootFilesCount} in ${folderRows.length} top-level folders).`,
    '',
    '| Folder | File Count | Size | Last Commit | Description |',
    '| --- | ---: | ---: | --- | --- |'
  ];

  for (const r of folderRows) {
    const desc = extractReadmeSummary(repoRoot, r.readmeHash);
    repoIndexLines.push(`| \`${r.name}\` | ${r.files} | ${formatBytes(r.size)} | ${r.lastDate} | ${desc} |`);
  }
  if (rootFilesCount > 0) {
    repoIndexLines.push('', `Root-level tracked files (not inside a subfolder): ${rootFilesCount} files, ${formatBytes(rootFilesSize)}, last commit ${rootLastDate}.`);
  }
  repoIndexLines.push('');

  // 2. DUPLICATES.md
  const byHash = new Map();
  for (const f of files) {
    if (!byHash.has(f.hash)) {
      byHash.set(f.hash, { hash: f.hash, size: f.size, paths: [] });
    }
    byHash.get(f.hash).paths.push(f.path);
  }
  for (const g of byHash.values()) {
    g.paths.sort();
  }

  const dupGroups = [...byHash.values()]
    .filter(g => g.paths.length > 1)
    .sort((a, b) =>
      b.paths.length - a.paths.length ||
      (b.size * (b.paths.length - 1)) - (a.size * (a.paths.length - 1)) ||
      a.hash.localeCompare(b.hash)
    );

  let filesInDupGroups = 0;
  let extraCopies = 0;
  let repeatedBytes = 0;
  for (const g of dupGroups) {
    filesInDupGroups += g.paths.length;
    extraCopies += g.paths.length - 1;
    repeatedBytes += g.size * (g.paths.length - 1);
  }
  const repeatedMB = (repeatedBytes / (1024 * 1024)).toFixed(2);

  const topLevelPairs = computeFolderPairs(dupGroups, p => (p.includes('/') ? p.split('/')[0] : '(root)'));
  const twoLevelPairs = computeFolderPairs(dupGroups, p => {
    const parts = p.split('/');
    return parts.length >= 3 ? `${parts[0]}/${parts[1]}` : (parts.length === 2 ? parts[0] : '(root)');
  });
  const dirPairs = computeFolderPairs(dupGroups, p => path.posix.dirname(p));

  const dupLines = [
    '# Duplicate Files in HEAD',
    '',
    '## Duplicate Groups (Biggest Group First)',
    ''
  ];

  dupGroups.forEach((g, idx) => {
    const repeated = g.size * (g.paths.length - 1);
    dupLines.push(`### Group ${idx + 1}: ${g.paths.length} files, ${g.size} B each (${ repeated } B repeated) — blob \`${g.hash}\``);
    for (const p of g.paths) {
      dupLines.push(`- \`${p}\``);
    }
    dupLines.push('');
  });

  dupLines.push(
    '## Folder Pairs Sharing the Most Identical Files',
    '',
    '### Top-Level Folder Pairs',
    '',
    '| Folder Pair | Shared Identical File Groups | Shared Bytes (1 copy) |',
    '| --- | ---: | ---: |'
  );
  for (const pair of topLevelPairs) {
    dupLines.push(`| \`${pair.pair}\` | ${pair.groups} | ${formatBytes(pair.bytes)} |`);
  }

  dupLines.push(
    '',
    '### Two-Level Subtree Pairs',
    '',
    '| Subtree Pair | Shared Identical File Groups | Shared Bytes (1 copy) |',
    '| --- | ---: | ---: |'
  );
  for (const pair of twoLevelPairs.slice(0, 30)) {
    dupLines.push(`| \`${pair.pair}\` | ${pair.groups} | ${formatBytes(pair.bytes)} |`);
  }

  dupLines.push(
    '',
    '### Exact Parent Directory Pairs (Top 30)',
    '',
    '| Directory Pair | Shared Identical File Groups | Shared Bytes (1 copy) |',
    '| --- | ---: | ---: |'
  );
  for (const pair of dirPairs.slice(0, 30)) {
    dupLines.push(`| \`${pair.pair}\` | ${pair.groups} | ${formatBytes(pair.bytes)} |`);
  }

  dupLines.push(
    '',
    '## Summary',
    '',
    `Summary: files: ${filesInDupGroups} (total tracked files: ${files.length}), groups: ${dupGroups.length}, extra copies: ${extraCopies}, megabytes repeated: ${repeatedMB} MB`,
    ''
  );

  // 3. STALE-CANDIDATES.md
  const refSec = Math.max(Math.floor(Date.now() / 1000), headTs);
  const cutoffSec = refSec - 90 * 86400;

  const preCandidates = [];
  for (const f of files) {
    const category = classifyStaleCategory(f.path, f.base);
    if (!category) continue;
    const commit = lastCommit.get(f.path);
    if (!commit || commit.ts >= cutoffSec) continue;
    const isFixedName = category === 'agent' || category === 'skill';
    if (!isFixedName && (basenameCounts.get(f.base) || 0) > 1) continue;
    const token =
      isFixedName && (basenameCounts.get(f.base) || 0) > 1 && f.path.includes('/')
        ? f.path.split('/').slice(-2).join('/')
        : f.base;
    preCandidates.push({
      ...f,
      category,
      lastCommit: commit.date,
      ts: commit.ts,
      token
    });
  }

  const uniqueTokens = [...new Set(preCandidates.map(c => c.token))];
  const matchedTreeFiles = new Set();
  for (let i = 0; i < uniqueTokens.length; i += 100) {
    const chunk = uniqueTokens.slice(i, i + 100);
    const patternArgs = [];
    for (const t of chunk) patternArgs.push('-e', t);
    const grepRes = spawnSync('git', ['grep', '-F', '-I', '--name-only', ...patternArgs, 'HEAD'], {
      cwd: repoRoot,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024
    });
    for (const l of (grepRes.stdout || '').split(/\r?\n/)) {
      if (!l) continue;
      matchedTreeFiles.add(l.startsWith('HEAD:') ? l.slice(5) : l);
    }
  }

  const matchedList = [...matchedTreeFiles];
  const hashesToFetch = [...new Set(matchedList.map(p => pathToHash.get(p)).filter(Boolean))];
  const blobTextByHash = new Map();
  if (hashesToFetch.length > 0) {
    const batchOut = execFileSync('git', ['cat-file', '--batch'], {
      cwd: repoRoot,
      input: `${hashesToFetch.join('\n')}\n`,
      maxBuffer: 128 * 1024 * 1024
    });
    let offset = 0;
    while (offset < batchOut.length) {
      const nl = batchOut.indexOf(10, offset);
      if (nl === -1) break;
      const header = batchOut.subarray(offset, nl).toString('utf8');
      const [h, , sizeStr] = header.split(' ');
      const sz = Number(sizeStr);
      const bodyStart = nl + 1;
      const bodyEnd = bodyStart + sz;
      blobTextByHash.set(h, batchOut.subarray(bodyStart, bodyEnd).toString('utf8'));
      offset = bodyEnd + 1;
    }
  }

  const staleCandidates = [];
  for (const c of preCandidates) {
    let referencedElsewhere = false;
    for (const otherPath of matchedList) {
      if (otherPath === c.path) continue;
      const txt = blobTextByHash.get(pathToHash.get(otherPath)) || '';
      if (txt.includes(c.token)) {
        referencedElsewhere = true;
        break;
      }
    }
    if (!referencedElsewhere) staleCandidates.push(c);
  }

  staleCandidates.sort((a, b) => a.ts - b.ts || a.path.localeCompare(b.path));

  const staleLines = [
    '# Stale File Candidates',
    '',
    'These files are candidates only. Nothing was checked by running it.',
    '',
    'Criteria: PowerShell, JSON, workflow, agent (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`), and skill (`SKILL.md`) files whose file name appears nowhere else in the tracked files and whose last commit is older than 90 days.',
    '',
    `Total candidates found: ${staleCandidates.length}`,
    '',
    '| Path | Category | Last Commit | Size |',
    '| --- | --- | --- | ---: |'
  ];

  for (const c of staleCandidates) {
    staleLines.push(`| \`${c.path}\` | ${c.category} | ${c.lastCommit} | ${formatBytes(c.size)} |`);
  }
  staleLines.push('');

  const outDir = path.join(repoRoot, 'docs', 'index');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'REPO-INDEX.md'), repoIndexLines.join('\n'), 'utf8');
  fs.writeFileSync(path.join(outDir, 'DUPLICATES.md'), dupLines.join('\n'), 'utf8');
  fs.writeFileSync(path.join(outDir, 'STALE-CANDIDATES.md'), staleLines.join('\n'), 'utf8');

  return {
    totalTrackedFiles: files.length,
    topLevelFolders: folderRows.length,
    filesInDupGroups,
    duplicateGroups: dupGroups.length,
    extraCopies,
    repeatedMB: Number(repeatedMB),
    staleCandidates: staleCandidates.length
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const targetRepo = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const summary = buildIndex(targetRepo);
  console.log(JSON.stringify(summary));
}