import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type PlatformTier = 'trusted_execution' | 'first_party_limited' | 'sandbox_only';
export type ParticipationMode = 'required' | 'voluntary';
export type ShaStatus = 'match' | 'drift_production' | 'drift_sandbox';
export type WorktreeState = 'clean' | 'dirty' | 'unknown';

export interface SecretReference {
  label: string;
  path?: string;
  repo?: string;
  secretName?: string;
  note?: string;
}

export interface PlatformDefinition {
  id: string;
  displayName: string;
  nodeId: string;
  tier: PlatformTier;
  participationMode: ParticipationMode;
  certificationAuthority: boolean;
  allowedIps: string[];
  allowedPathPrefixes: string[];
  blockedPathPrefixes?: string[];
  tokenHash?: string;
}

interface PlatformConfigFile {
  platforms?: PlatformDefinition[];
  secretRefs?: Record<string, SecretReference[]>;
}

export interface NodeDefinition {
  id: string;
  displayName: string;
  ip: string;
  roles: string[];
}

export interface RequiredRead {
  label: string;
  path: string;
}

export interface BrainConfig {
  repoRoot: string;
  canonicalRepoRoot: string;
  dataDir: string;
  databasePath: string;
  auditDir: string;
  authorityNotice: string;
  publicDomainRoutingRule: string;
  sessionTtlMs: number;
  requiredReads: RequiredRead[];
  liveRepoWriteScope: string[];
  trustedExecutionBackbone: string[];
  nodes: NodeDefinition[];
  platforms: PlatformDefinition[];
  secretRefs: Record<string, SecretReference[]>;
  http: {
    host: string;
    port: number;
    requireAuth: boolean;
  };
}

const authorityNotice = 'AGENTS.md is canonical. Josh is sole authority. BRAIN is operational telemetry only.';
const publicDomainRoutingRule =
  'Owned domains use Cloudflare DNS. Live public edits must preserve routing to the owned public domain and its intended redirects; do not treat preview URLs or temporary upload URLs as the final destination.';

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(sourceDir, '..');
const repoRootDefault = path.resolve(packageRoot, '..');

const DEFAULT_PLATFORMS: PlatformDefinition[] = [
  {
    id: 'codex-sabretooth',
    displayName: 'OpenAI Codex',
    nodeId: 'sabretooth',
    tier: 'trusted_execution',
    participationMode: 'required',
    certificationAuthority: true,
    allowedIps: ['127.0.0.1', '192.168.0.8'],
    allowedPathPrefixes: ['C:\\ANTIGRAVITY'],
    blockedPathPrefixes: [],
  },
  {
    id: 'claude-opus-sabretooth',
    displayName: 'Claude Code Opus',
    nodeId: 'sabretooth',
    tier: 'trusted_execution',
    participationMode: 'required',
    certificationAuthority: true,
    allowedIps: ['127.0.0.1', '192.168.0.8'],
    allowedPathPrefixes: ['C:\\ANTIGRAVITY', 'E:\\claudes-claw', 'E:\\sandbox-repo'],
    blockedPathPrefixes: [],
  },
  {
    id: 'gemini-cli-sabretooth',
    displayName: 'Gemini CLI',
    nodeId: 'sabretooth',
    tier: 'trusted_execution',
    participationMode: 'voluntary',
    certificationAuthority: true,
    allowedIps: ['127.0.0.1', '192.168.0.8'],
    allowedPathPrefixes: ['C:\\ANTIGRAVITY'],
    blockedPathPrefixes: [],
  },
  {
    id: 'manus-t5500',
    displayName: 'Manus',
    nodeId: 't5500',
    tier: 'first_party_limited',
    participationMode: 'required',
    certificationAuthority: false,
    allowedIps: ['192.168.0.8'],
    allowedPathPrefixes: ['E:\\ANTIGRAVITY-CLAWBOTS'],
    blockedPathPrefixes: ['C:\\ANTIGRAVITY'],
  },
  {
    id: 'genspark-9020',
    displayName: 'GenSpark',
    nodeId: '9020',
    tier: 'sandbox_only',
    participationMode: 'required',
    certificationAuthority: false,
    allowedIps: ['192.168.0.5'],
    allowedPathPrefixes: ['D:\\sandbox-repos', 'D:\\claws'],
    blockedPathPrefixes: ['C:\\ANTIGRAVITY'],
  },
  {
    id: 'anythingllm-sabretooth',
    displayName: 'AnythingLLM Desktop',
    nodeId: 'sabretooth',
    tier: 'trusted_execution',
    participationMode: 'voluntary',
    certificationAuthority: false,
    allowedIps: ['127.0.0.1', '192.168.0.8'],
    allowedPathPrefixes: ['C:\\ANTIGRAVITY', 'E:\\sandbox-repo', 'E:\\ANYTHINGLLM'],
    blockedPathPrefixes: [],
  },
];

const DEFAULT_NODES: NodeDefinition[] = [
  {
    id: 'sabretooth',
    displayName: 'Sabretooth',
    ip: '192.168.0.8',
    roles: ['canonical live repo', 'LAN command post', 'Claude Dispatch lane on E:'],
  },
  {
    id: '9020',
    displayName: '9020',
    ip: '192.168.0.5',
    roles: ['support sandbox', 'openclaw lane on D:', 'future isolated GenSpark drive'],
  },
  {
    id: 't5500',
    displayName: 'T5500',
    ip: '192.168.0.8',
    roles: ['Manus media sandbox', 'Crossfire lane on E:'],
  },
];

const DEFAULT_SECRET_REFS: Record<string, SecretReference[]> = {
  CLOUDFLARE_API_TOKEN: [
    {
      label: 'Sabretooth local env',
      path: 'C:\\ANTIGRAVITY\\.env',
      note: 'Rotated 2026-03-23',
    },
    {
      label: 'GitHub Actions secret',
      repo: 'Trollz1004/ANTIGRAVITY',
      secretName: 'CLOUDFLARE_API_TOKEN',
    },
    {
      label: 'GitHub Actions secret',
      repo: 'Trollz1004/Sandbox-REPO-NEW-CODE-NOTHING-NEW-GOES-ON-ANTIGRAVITY',
      secretName: 'CLOUDFLARE_API_TOKEN',
    },
  ],
  CLOUDFLARE_ACCOUNT_ID: [
    {
      label: 'GitHub Actions secret',
      repo: 'Trollz1004/ANTIGRAVITY',
      secretName: 'CLOUDFLARE_ACCOUNT_ID',
    },
  ],
  CLOUDFLARE_GLOBAL_API_KEY: [
    {
      label: 'GitHub Actions secret',
      repo: 'Trollz1004/ANTIGRAVITY',
      secretName: 'CLOUDFLARE_GLOBAL_API_KEY',
    },
  ],
};

function readOptionalJson(filePath: string): PlatformConfigFile | undefined {
  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as PlatformConfigFile;
}

export function normalizePath(input: string): string {
  return input.replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase();
}

export function loadBrainConfig(): BrainConfig {
  const repoRoot = process.env.BRAIN_REPO_ROOT ?? repoRootDefault;
  const canonicalRepoRoot = path.resolve(repoRoot);
  const dataDir = process.env.BRAIN_DATA_DIR ?? path.join(canonicalRepoRoot, 'logs', 'brain-mcp');
  const configFilePath = process.env.BRAIN_PLATFORM_CONFIG;
  const externalConfig = configFilePath ? readOptionalJson(configFilePath) : undefined;
  const platforms = externalConfig?.platforms ?? DEFAULT_PLATFORMS;
  const secretRefs = externalConfig?.secretRefs ?? DEFAULT_SECRET_REFS;

  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(path.join(dataDir, 'audit'), { recursive: true });

  const sessionTtlMinutes = Number.parseInt(process.env.BRAIN_SESSION_TTL_MINUTES ?? '120', 10);

  return {
    repoRoot: canonicalRepoRoot,
    canonicalRepoRoot,
    dataDir,
    databasePath: path.join(dataDir, 'brain.db'),
    auditDir: path.join(dataDir, 'audit'),
    authorityNotice,
    publicDomainRoutingRule,
    sessionTtlMs: sessionTtlMinutes * 60 * 1000,
    requiredReads: [
      { label: 'AGENTS.md', path: path.join(canonicalRepoRoot, 'AGENTS.md') },
      {
        label: 'REPOSITORY_RECORD.md',
        path: path.join(canonicalRepoRoot, 'briefings', 'REPOSITORY_RECORD.md'),
      },
      {
        label: 'UNIVERSAL-SYNC-PROMPT.md',
        path: path.join(canonicalRepoRoot, 'briefings', 'UNIVERSAL-SYNC-PROMPT.md'),
      },
      {
        label: 'projectState.md',
        path: path.join(canonicalRepoRoot, 'memory', 'projectState.md'),
      },
    ],
    liveRepoWriteScope: ['OpenAI Codex', 'Claude Code Opus', 'Gemini CLI', 'GitHub-approved repo workflows'],
    trustedExecutionBackbone: platforms
      .filter((platform) => platform.certificationAuthority)
      .map((platform) => platform.displayName),
    nodes: DEFAULT_NODES,
    platforms,
    secretRefs,
    http: {
      host: process.env.BRAIN_HTTP_HOST ?? '127.0.0.1',
      port: Number.parseInt(process.env.BRAIN_HTTP_PORT ?? '3900', 10),
      requireAuth: (process.env.BRAIN_REQUIRE_AUTH ?? 'true').toLowerCase() === 'true',
    },
  };
}
