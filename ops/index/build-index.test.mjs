import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(__dirname, 'build-index.mjs');

test('build-index reports exactly one duplicate group in a throwaway git repo', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-index-test-'));
  try {
    execFileSync('git', ['init'], { cwd: tempDir, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.name', 'Test Runner'], { cwd: tempDir, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempDir, stdio: 'ignore' });

    fs.mkdirSync(path.join(tempDir, 'alpha'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'beta'), { recursive: true });

    fs.writeFileSync(path.join(tempDir, 'alpha', 'README.md'), '# Alpha Module\nAlpha description.\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, 'alpha', 'dup.txt'), 'identical payload\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, 'beta', 'dup-copy.txt'), 'identical payload\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, 'beta', 'unique.txt'), 'only one of me\n', 'utf8');

    execFileSync('git', ['add', '.'], { cwd: tempDir, stdio: 'ignore' });
    execFileSync('git', ['commit', '-m', 'seed test repo'], { cwd: tempDir, stdio: 'ignore' });

    execFileSync(process.execPath, [scriptPath], { cwd: tempDir, stdio: 'pipe' });

    const duplicatesMd = fs.readFileSync(path.join(tempDir, 'docs', 'index', 'DUPLICATES.md'), 'utf8');
    const repoIndexMd = fs.readFileSync(path.join(tempDir, 'docs', 'index', 'REPO-INDEX.md'), 'utf8');
    const staleMd = fs.readFileSync(path.join(tempDir, 'docs', 'index', 'STALE-CANDIDATES.md'), 'utf8');

    assert.match(duplicatesMd, /groups:\s*1\b/i);
    assert.match(duplicatesMd, /extra copies:\s*1\b/i);
    assert.match(duplicatesMd, /alpha\/dup\.txt/);
    assert.match(duplicatesMd, /beta\/dup-copy\.txt/);
    assert.doesNotMatch(duplicatesMd, /beta\/unique\.txt/);

    assert.match(repoIndexMd, /Alpha Module/);
    assert.match(repoIndexMd, /no README/);
    assert.match(staleMd, /candidates/i);
    assert.match(staleMd, /nothing was checked by running it/i);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});