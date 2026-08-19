import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { authorHermesArtifact } from './hermes-authoring.js';

const testPath = 'ops/skills/.hermes-authoring.test.md';
const absoluteTestPath = resolve(process.cwd(), '..', '..', testPath);

afterEach(() => rmSync(absoluteTestPath, { force: true }));

describe('Hermes authoring boundary', () => {
  it('writes an allowed repository skill-hub artifact atomically', () => {
    const result = authorHermesArtifact({ relativePath: testPath, content: '# Verified authoring artifact\n' });
    expect(result.relativePath).toBe(testPath);
    expect(result.bytes).toBeGreaterThan(0);
    expect(existsSync(absoluteTestPath)).toBe(true);
  });

  it('rejects a path outside the Hermes authoring allowlist', () => {
    expect(() => authorHermesArtifact({ relativePath: 'mission-control-v5/server/.env', content: 'x' })).toThrow(
      'Path is outside the Hermes authoring allowlist.',
    );
  });

  it('rejects credential-like content before it reaches disk', () => {
    expect(() => authorHermesArtifact({ relativePath: testPath, content: 'api_key: prohibited' })).toThrow(
      'Credential-like content is not accepted by the Hermes authoring tool.',
    );
  });
});
