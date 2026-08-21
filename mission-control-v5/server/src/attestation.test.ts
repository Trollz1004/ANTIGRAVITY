import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { verifyProvenance } from './attestation.js';

const cleanup: string[] = [];

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function createFixture(): { repo: string; commit: string; blob: string; sha256: string } {
  const repo = mkdtempSync(join(tmpdir(), 'mission-control-attestation-'));
  cleanup.push(repo);
  git(repo, ['init']);
  git(repo, ['config', 'user.email', 'mission-control@example.invalid']);
  git(repo, ['config', 'user.name', 'Mission Control Test']);
  const contents = '# Evidence\n\nA committed artifact.\n';
  writeFileSync(join(repo, 'artifact.md'), contents, 'utf8');
  git(repo, ['add', 'artifact.md']);
  git(repo, ['commit', '-m', 'fixture']);
  return {
    repo,
    commit: git(repo, ['rev-parse', 'HEAD']),
    blob: git(repo, ['rev-parse', 'HEAD:artifact.md']),
    sha256: createHash('sha256').update(Buffer.from(contents, 'utf8')).digest('hex'),
  };
}

afterEach(() => {
  for (const path of cleanup.splice(0)) rmSync(path, { recursive: true, force: true });
});

describe('verifyProvenance', () => {
  it('verifies a committed Markdown artifact when blob and SHA-256 agree', async () => {
    const fixture = createFixture();
    const result = await verifyProvenance(fixture.repo, {
      artifactPath: 'artifact.md',
      commit: fixture.commit,
      expectedSha256: fixture.sha256,
      expectedBlob: fixture.blob,
      judge: {
        provider: 'openai-codex',
        officialClient: 'Codex CLI',
        authentication: 'ACCOUNT_AUTHENTICATED',
        requestedModel: 'gpt-5.6-sol',
        actualModel: 'gpt-5.6-sol',
        recordedAt: '2026-08-19T00:00:00.000Z',
        evidenceSummary: 'TEST_ONLY',
      },
    });

    expect(result.state).toBe('VERIFIED');
    expect(result.actualBlob).toBe(fixture.blob);
    expect(result.actualSha256).toBe(fixture.sha256);
    expect(result.checks.judgeModelMatchesRequest).toBe(true);
  });

  it('returns UNVERIFIED when no attested hash, blob, or judge-model comparison is supplied', async () => {
    const fixture = createFixture();
    const result = await verifyProvenance(fixture.repo, {
      artifactPath: 'artifact.md',
      commit: fixture.commit,
    });

    expect(result.state).toBe('UNVERIFIED');
    expect(result.actualBlob).toBe(fixture.blob);
    expect(result.checks.shaMatchesExpected).toBeNull();
    expect(result.checks.blobMatchesExpected).toBeNull();
    expect(result.checks.judgeModelMatchesRequest).toBeNull();
    expect(result.sanitizedEvidence).toContain('NO_ATTESTED_COMPARISON_REQUESTED');
  });

  it('returns UNVERIFIED when an account-authenticated judge has no verified actual model', async () => {
    const fixture = createFixture();
    const result = await verifyProvenance(fixture.repo, {
      artifactPath: 'artifact.md',
      commit: fixture.commit,
      expectedSha256: fixture.sha256,
      expectedBlob: fixture.blob,
      judge: {
        provider: 'claude',
        officialClient: 'Claude Code',
        authentication: 'ACCOUNT_AUTHENTICATED',
        requestedModel: 'claude-opus-5',
        actualModel: null,
        recordedAt: '2026-08-20T00:00:00.000Z',
        evidenceSummary: 'TEST_ONLY',
      },
    });

    expect(result.state).toBe('UNVERIFIED');
    expect(result.checks.shaMatchesExpected).toBe(true);
    expect(result.checks.blobMatchesExpected).toBe(true);
    expect(result.checks.judgeModelMatchesRequest).toBeNull();
  });

  it('reports MISMATCH when an attested SHA-256 does not match the committed artifact', async () => {
    const fixture = createFixture();
    const result = await verifyProvenance(fixture.repo, {
      artifactPath: 'artifact.md',
      commit: fixture.commit,
      expectedSha256: '0'.repeat(64),
      expectedBlob: fixture.blob,
    });

    expect(result.state).toBe('MISMATCH');
    expect(result.checks.shaMatchesExpected).toBe(false);
  });
});
