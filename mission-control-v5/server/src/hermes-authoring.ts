/**
 * Bounded authoring surface for the Hermes harness. It permits repository skills,
 * skill-hub documentation, agent contracts, and Hermes's own YAML configuration.
 * It deliberately rejects .env files, arbitrary runtime configuration, paths
 * outside C:\ANTIGRAVITY, and credential-like content.
 */
import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');
const MAX_CONTENT_BYTES = 100_000;
const ALLOWED_EXTENSIONS = new Set(['.md', '.yaml', '.yml', '.json']);
const ALLOWED_PREFIXES = [
  '.agents/skills/',
  '.agents/harness-config/hermes.yaml',
  'ops/skills/',
  'agent-contracts/',
];

export interface HermesAuthoringInput {
  relativePath: string;
  content: string;
}

function normalizeRepoPath(candidate: string): { absolute: string; relativePath: string } {
  const absolute = resolve(REPO_ROOT, candidate);
  const relativePath = relative(REPO_ROOT, absolute).split(sep).join('/');
  if (!relativePath || relativePath.startsWith('../') || relativePath === '..') {
    throw new Error('Path must remain inside the canonical repository.');
  }
  if (!ALLOWED_PREFIXES.some((prefix) => relativePath === prefix || relativePath.startsWith(prefix))) {
    throw new Error('Path is outside the Hermes authoring allowlist.');
  }
  if (!ALLOWED_EXTENSIONS.has(extname(relativePath).toLowerCase())) {
    throw new Error('Only Markdown, YAML, and JSON artifacts may be authored.');
  }
  if (relativePath.includes('.env') || /(?:secret|token|credential|private[-_]?key)/i.test(relativePath)) {
    throw new Error('Environment and credential-bearing artifacts are not writable through this tool.');
  }
  if (relativePath.startsWith('.agents/skills/') && !relativePath.endsWith('/SKILL.md')) {
    throw new Error('Repository skills must be written as .agents/skills/<name>/SKILL.md.');
  }
  if (relativePath.startsWith('.agents/harness-config/') && relativePath !== '.agents/harness-config/hermes.yaml') {
    throw new Error('Hermes may author only its own harness configuration.');
  }
  return { absolute, relativePath };
}

function validateContent(relativePath: string, content: string): void {
  if (!content.trim()) throw new Error('Content must not be empty.');
  if (Buffer.byteLength(content, 'utf8') > MAX_CONTENT_BYTES) throw new Error('Content exceeds the authoring size limit.');
  if (/-----BEGIN (?:[A-Z ]+)?PRIVATE KEY-----|(?:api[_-]?key|authorization)\s*[:=]\s*[^\s]+/i.test(content)) {
    throw new Error('Credential-like content is not accepted by the Hermes authoring tool.');
  }
  if (relativePath.startsWith('.agents/skills/')) {
    const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    if (!frontmatter || !/^name:\s*[-a-z0-9]+\s*$/m.test(frontmatter[1]) || !/^description:\s*.+/m.test(frontmatter[1])) {
      throw new Error('A repository SKILL.md requires YAML frontmatter with name and description.');
    }
  }
}

export function authorHermesArtifact(input: HermesAuthoringInput): { relativePath: string; bytes: number; updatedAt: string } {
  const { absolute, relativePath } = normalizeRepoPath(input.relativePath.trim());
  validateContent(relativePath, input.content);
  mkdirSync(dirname(absolute), { recursive: true });
  const temporary = `${absolute}.tmp`;
  writeFileSync(temporary, input.content, 'utf8');
  renameSync(temporary, absolute);
  return { relativePath, bytes: Buffer.byteLength(input.content, 'utf8'), updatedAt: new Date().toISOString() };
}
