import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(__dirname, 'build-index.mjs');

function parseCandidateCount(markdown) {
  const match = markdown.match(/Total candidates found:\s*(\d+)/i);
  assert.ok(match, 'Expected Total candidates found line in STALE-CANDIDATES.md');
  return Number(match[1]);
}

test('build-index reports duplicate groups and keeps stale candidates stable across runs after committing docs/index', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-index-test-'));
  try {
    execFileSync('git', ['init'], { cwd: tempDir, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.name', 'Test Runner'], { cwd: tempDir, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempDir, stdio: 'ignore' });

    const pastDate = new Date(Date.now() - 200 * 86400 * 1000).toISOString();
    fs.writeFileSync(path.join(tempDir, 'old-orphan-script.ps1'), 'Write-Host "orphan"\n', 'utf8');
    execFileSync('git', ['add', 'old-orphan-script.ps1'], { cwd: tempDir, stdio: 'ignore' });
    execFileSync('git', ['commit', '-m', 'add old orphan script'], {
      cwd: tempDir,
      stdio: 'ignore',
      env: {
        ...process.env,
        GIT_AUTHOR_DATE: pastDate,
        GIT_COMMITTER_DATE: pastDate
      }
    });

    fs.mkdirSync(path.join(tempDir, 'alpha'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'beta'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'gamma'), { recursive: true });

    fs.writeFileSync(path.join(tempDir, 'alpha', 'README.md'), '# Alpha Module\nAlpha description.\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, 'gamma', 'README.md'), '# Gamma <script>alert(1)</script> Module\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, 'alpha', 'dup.txt'), 'identical payload\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, 'beta', 'dup-copy.txt'), 'identical payload\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, 'beta', 'unique.txt'), 'only one of me\n', 'utf8');

    execFileSync('git', ['add', '.'], { cwd: tempDir, stdio: 'ignore' });
    execFileSync('git', ['commit', '-m', 'seed test repo'], { cwd: tempDir, stdio: 'ignore' });

    execFileSync(process.execPath, [scriptPath], { cwd: tempDir, stdio: 'pipe' });

    const duplicatesMd = fs.readFileSync(path.join(tempDir, 'docs', 'index', 'DUPLICATES.md'), 'utf8');
    const repoIndexMd = fs.readFileSync(path.join(tempDir, 'docs', 'index', 'REPO-INDEX.md'), 'utf8');
    const staleMdRun1 = fs.readFileSync(path.join(tempDir, 'docs', 'index', 'STALE-CANDIDATES.md'), 'utf8');

    assert.match(duplicatesMd, /groups:\s*1\b/i);
    assert.match(duplicatesMd, /extra copies:\s*1\b/i);
    assert.match(duplicatesMd, /alpha\/dup\.txt/);
    assert.match(duplicatesMd, /beta\/dup-copy\.txt/);
    assert.doesNotMatch(duplicatesMd, /beta\/unique\.txt/);

    assert.match(repoIndexMd, /Alpha Module/);
    assert.match(repoIndexMd, /no README/);
    assert.doesNotMatch(repoIndexMd, /<script/);
    assert.match(repoIndexMd, /&lt;script/);
    assert.match(staleMdRun1, /candidates/i);
    assert.match(staleMdRun1, /nothing was checked by running it/i);
    assert.match(staleMdRun1, /old-orphan-script\.ps1/);
    const countRun1 = parseCandidateCount(staleMdRun1);
    assert.equal(countRun1, 1);

    execFileSync('git', ['add', 'docs/index'], { cwd: tempDir, stdio: 'ignore' });
    execFileSync('git', ['commit', '-m', 'commit generated docs/index pages'], { cwd: tempDir, stdio: 'ignore' });

    execFileSync(process.execPath, [scriptPath], { cwd: tempDir, stdio: 'pipe' });

    const staleMdRun2 = fs.readFileSync(path.join(tempDir, 'docs', 'index', 'STALE-CANDIDATES.md'), 'utf8');
    const countRun2 = parseCandidateCount(staleMdRun2);
    assert.match(staleMdRun2, /old-orphan-script\.ps1/);
    assert.equal(countRun2, countRun1);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});