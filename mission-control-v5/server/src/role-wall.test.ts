import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AGENTS } from './agents.js';
import { harnessLanes, requireJudgeApproval } from './role-wall.js';

const checker = new URL('../scripts/role-wall-check.mjs', import.meta.url);

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'mc-role-wall-'));
  mkdirSync(join(root, 'server', 'src'), { recursive: true });
  writeFileSync(join(root, 'server', 'src', 'official-vote-engine.ts'), 'export const isolated = true;\n');
  return root;
}

function runChecker(root: string): string {
  return execFileSync(process.execPath, [checker.pathname, root], { encoding: 'utf8' });
}

describe('role wall', () => {
  it('defines exactly the three harness lanes and never maps a retired executor to an agent lane', () => {
    expect(harnessLanes()).toEqual(['openclaw', 'hermes', 'opencode']);
    expect(AGENTS.map((agent) => agent.id)).toEqual(harnessLanes());
  });

  it('requires a matching official judge approval shape for every protected Git action', () => {
    expect(() => requireJudgeApproval(undefined, 'push')).toThrow('judge approval required');
    expect(() => requireJudgeApproval({ role: 'judge', actor: 'official-account', action: 'merge', approvedAt: '2026-08-19T00:00:00.000Z' }, 'push')).toThrow('judge approval required');
    expect(requireJudgeApproval({ role: 'judge', actor: 'official-account', action: 'push', approvedAt: '2026-08-19T00:00:00.000Z' }, 'push')).toMatchObject({ action: 'push' });
  });

  it('passes an isolated fixture and rejects a vote-module import of the general bridge', () => {
    const root = fixture();
    expect(runChecker(root)).toContain('Role wall passed');
    writeFileSync(join(root, 'server', 'src', 'official-vote-engine.ts'), "import './bridge.js';\n");
    expect(() => runChecker(root)).toThrow('official vote module imports a general routing module');
    rmSync(root, { recursive: true, force: true });
  });

  it('rejects retired identifiers, prohibited key names, and Git mutation commands in source fixtures', () => {
    const root = fixture();
    const retired = ['f', 'cc'].join('');
    const keyName = ['ANTHROPIC', 'API', 'KEY'].join('_');
    writeFileSync(join(root, 'server', 'src', 'unsafe.ts'), `const a = '${retired}'; const b = '${keyName}'; // git push\n`);
    expect(() => runChecker(root)).toThrow('ROLE WALL VIOLATION');
    rmSync(root, { recursive: true, force: true });
  });
});
