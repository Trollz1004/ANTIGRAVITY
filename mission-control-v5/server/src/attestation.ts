import { createHash } from 'node:crypto';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { relative, resolve, sep } from 'node:path';

const execFile = promisify(execFileCallback);

export type EvidenceState = 'VERIFIED' | 'MISMATCH' | 'BLOCKED' | 'UNVERIFIED';

export interface OfficialJudgeAttestation {
  provider: 'claude' | 'gemini' | 'github-copilot' | 'grok' | 'openai-codex';
  officialClient: string;
  authentication: 'ACCOUNT_AUTHENTICATED' | 'AUTH_MISSING' | 'AUTH_REJECTED' | 'NOT_CONFIGURED';
  requestedModel: string;
  actualModel: string | null;
  recordedAt: string;
  evidenceSummary: string;
}

export interface ProvenanceVerificationRequest {
  artifactPath: string;
  commit: string;
  expectedSha256?: string;
  expectedBlob?: string;
  judge?: OfficialJudgeAttestation;
}

export interface ProvenanceVerificationResult {
  state: EvidenceState;
  artifactPath: string;
  commit: string;
  actualSha256: string | null;
  actualBlob: string | null;
  checks: {
    artifactPresent: boolean;
    commitPresent: boolean;
    blobMatchesCommit: boolean;
    shaMatchesExpected: boolean | null;
    blobMatchesExpected: boolean | null;
    judgeModelMatchesRequest: boolean | null;
  };
  judge: OfficialJudgeAttestation | null;
  sanitizedEvidence: string[];
}

function normalizeRepoPath(repoRoot: string, artifactPath: string): string | null {
  if (!artifactPath || artifactPath.includes('\0')) return null;
  const candidate = resolve(repoRoot, artifactPath);
  const rel = relative(repoRoot, candidate);
  if (!rel || rel.startsWith(`..${sep}`) || rel === '..') return null;
  return rel.split(sep).join('/');
}

function isSha256(value: string | undefined): boolean {
  return !value || /^[a-f0-9]{64}$/i.test(value);
}

function isGitObject(value: string | undefined): boolean {
  return !value || /^[a-f0-9]{7,64}$/i.test(value);
}

function judgeModelComparison(judge: OfficialJudgeAttestation | undefined): boolean | null {
  if (!judge || judge.actualModel === null) return null;
  return judge.actualModel === judge.requestedModel;
}

async function git(repoRoot: string, args: string[]): Promise<string | null> {
  try {
    const { stdout } = await execFile('git', ['--no-pager', ...args], {
      cwd: repoRoot,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    });
    return stdout.trim();
  } catch {
    return null;
  }
}

function gitBlob(repoRoot: string, blob: string): Promise<Buffer | null> {
  return new Promise((resolveBlob) => {
    execFileCallback(
      'git',
      ['--no-pager', 'cat-file', 'blob', blob],
      { cwd: repoRoot, windowsHide: true, maxBuffer: 1024 * 1024, encoding: 'buffer' },
      (error, stdout) => {
        if (error) return resolveBlob(null);
        return resolveBlob(Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout));
      },
    );
  });
}

export async function verifyProvenance(
  repoRoot: string,
  request: ProvenanceVerificationRequest,
): Promise<ProvenanceVerificationResult> {
  const artifactPath = normalizeRepoPath(repoRoot, request.artifactPath);
  const blocked = (reason: string): ProvenanceVerificationResult => ({
    state: 'BLOCKED',
    artifactPath: request.artifactPath,
    commit: request.commit,
    actualSha256: null,
    actualBlob: null,
    checks: {
      artifactPresent: false,
      commitPresent: false,
      blobMatchesCommit: false,
      shaMatchesExpected: null,
      blobMatchesExpected: null,
      judgeModelMatchesRequest: null,
    },
    judge: request.judge ?? null,
    sanitizedEvidence: [reason],
  });

  if (!artifactPath || !request.commit || !isSha256(request.expectedSha256) || !isGitObject(request.expectedBlob)) {
    return blocked('INVALID_PROVENANCE_REQUEST');
  }

  const commitPresent = Boolean(await git(repoRoot, ['rev-parse', '--verify', '--quiet', `${request.commit}^{commit}`]));
  if (!commitPresent) return blocked('COMMIT_NOT_PRESENT');

  const blob = await git(repoRoot, ['rev-parse', `${request.commit}:${artifactPath}`]);
  if (!blob || !isGitObject(blob)) {
    return {
      ...blocked('ARTIFACT_NOT_PRESENT_AT_COMMIT'),
      artifactPath,
      checks: {
        artifactPresent: false,
        commitPresent: true,
        blobMatchesCommit: false,
        shaMatchesExpected: null,
        blobMatchesExpected: null,
        judgeModelMatchesRequest: judgeModelComparison(request.judge),
      },
    };
  }

  const bytes = await gitBlob(repoRoot, blob);
  if (bytes === null) return blocked('GIT_BLOB_UNREADABLE');
  const actualSha256 = createHash('sha256').update(bytes).digest('hex');
  const expectedSha256 = request.expectedSha256?.toLowerCase();
  const expectedBlob = request.expectedBlob?.toLowerCase();
  const shaMatchesExpected = expectedSha256 ? actualSha256 === expectedSha256 : null;
  const blobMatchesExpected = expectedBlob ? blob.toLowerCase() === expectedBlob : null;
  const judgeModelMatchesRequest = judgeModelComparison(request.judge);
  const comparisonRequested = shaMatchesExpected !== null || blobMatchesExpected !== null || judgeModelMatchesRequest !== null;
  const hasMismatch = shaMatchesExpected === false || blobMatchesExpected === false || judgeModelMatchesRequest === false;
  const judgeModelUnverified = request.judge !== undefined && judgeModelMatchesRequest === null;
  const state: EvidenceState = hasMismatch
    ? 'MISMATCH'
    : !comparisonRequested || judgeModelUnverified
      ? 'UNVERIFIED'
      : 'VERIFIED';

  return {
    state,
    artifactPath,
    commit: request.commit,
    actualSha256,
    actualBlob: blob,
    checks: {
      artifactPresent: true,
      commitPresent: true,
      blobMatchesCommit: true,
      shaMatchesExpected,
      blobMatchesExpected,
      judgeModelMatchesRequest,
    },
    judge: request.judge ?? null,
    sanitizedEvidence: [
      'COMMIT_AND_BLOB_RESOLVED',
      'SHA256_COMPUTED_FROM_COMMITTED_GIT_BLOB_BYTES',
      state === 'VERIFIED'
        ? 'ALL_REQUESTED_CHECKS_MATCH'
        : state === 'MISMATCH'
          ? 'ONE_OR_MORE_REQUESTED_CHECKS_MISMATCH'
          : 'NO_ATTESTED_COMPARISON_REQUESTED',
    ],
  };
}
