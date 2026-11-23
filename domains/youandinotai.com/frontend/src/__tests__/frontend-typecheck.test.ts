import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateMax, validateMin } from '../lib/validation';

const frontendDir = path.resolve(__dirname, '../..');
const repoRoot = path.resolve(frontendDir, '../../..');

describe('frontend type-check and CI workflow contract', () => {
  it('validates numeric bounds for numbers, numeric strings, and empty values', () => {
    expect(validateMin(5, 3)).toBe(true);
    expect(validateMin('5', 3)).toBe(true);
    expect(validateMin(2, 3)).toBe(false);
    expect(validateMin('', 3)).toBe(false);
    expect(validateMin(null, 3)).toBe(false);
    expect(validateMin(undefined, 3)).toBe(false);

    expect(validateMax(3, 5)).toBe(true);
    expect(validateMax('3', 5)).toBe(true);
    expect(validateMax(6, 5)).toBe(false);
    expect(validateMax('', 5)).toBe(true);
    expect(validateMax(null, 5)).toBe(true);
    expect(validateMax(undefined, 5)).toBe(true);
  });

  it('runs tsc --noEmit cleanly with zero errors', () => {
    const tscBin = path.join(
      frontendDir,
      'node_modules',
      'typescript',
      'bin',
      'tsc'
    );
    const output = execFileSync(process.execPath, [tscBin, '--noEmit'], {
      cwd: frontendDir,
      encoding: 'utf8',
    });
    expect(output.trim()).toBe('');
  }, 30000);

  it('includes the frontend tsc --noEmit step in .github/workflows/ci-validate.yml', () => {
    const workflowPath = path.join(
      repoRoot,
      '.github',
      'workflows',
      'ci-validate.yml'
    );
    const workflow = fs.readFileSync(workflowPath, 'utf8');
    expect(workflow).toMatch(/tsc --noEmit/);
  });
});
