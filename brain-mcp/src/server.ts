import path from 'node:path';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { BrainConfig, PlatformDefinition, WorktreeState } from './config.js';
import { BrainStateStore } from './state.js';
import {
  buildBaselineTag,
  buildRepoTruthSummary,
  computeShaStatus,
  evaluateTargetPaths,
  readTextFile,
} from './truth.js';

export interface AuthContext {
  authenticatedPlatformId?: string;
  remoteIp?: string;
}

function jsonContent(payload: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

function resolvePlatform(config: BrainConfig, platformId: string, authContext?: AuthContext): PlatformDefinition {
  const platform = config.platforms.find((entry) => entry.id === platformId);
  if (!platform) {
    throw new Error(`Unknown platform_id: ${platformId}`);
  }

  if (authContext?.authenticatedPlatformId && authContext.authenticatedPlatformId !== platformId) {
    throw new Error(
      `Authenticated platform mismatch. Expected ${authContext.authenticatedPlatformId}, received ${platformId}.`,
    );
  }

  if (authContext?.remoteIp && !platform.allowedIps.includes(authContext.remoteIp)) {
    throw new Error(`Credential migration attempt. ${platform.id} is not allowed from ${authContext.remoteIp}.`);
  }

  return platform;
}

function validateNode(platform: PlatformDefinition, nodeId: string): void {
  if (platform.nodeId.toLowerCase() !== nodeId.toLowerCase()) {
    throw new Error(`Node mismatch for ${platform.id}. Expected ${platform.nodeId}, received ${nodeId}.`);
  }
}

function ensurePathsAllowed(platform: PlatformDefinition, targetPaths: string[]): { lane: string[] } {
  const result = evaluateTargetPaths(platform, targetPaths);
  if (!result.allowed) {
    throw new Error(result.violations.join(' '));
  }
  return { lane: result.lane };
}

function buildSyncPayload(args: {
  config: BrainConfig;
  state: BrainStateStore;
  platform: PlatformDefinition;
  gitSha: string;
  worktreeState: WorktreeState;
  targetPaths: string[];
}) {
  const repoTruth = buildRepoTruthSummary(args.config);
  const shaStatus = computeShaStatus(
    repoTruth.repoHeadSha,
    args.gitSha,
    args.targetPaths,
    args.config.canonicalRepoRoot,
  );

  return {
    authority_notice: args.config.authorityNotice,
    public_domain_routing_rule: args.config.publicDomainRoutingRule,
    canonical_repo_root: args.config.canonicalRepoRoot,
    repo_head_sha: repoTruth.repoHeadSha,
    repo_status: repoTruth.repoStatus,
    baseline_tag: buildBaselineTag(args.gitSha, args.worktreeState),
    sha_status: shaStatus,
    lane: args.platform.allowedPathPrefixes,
    participation_mode: args.platform.participationMode,
    certification_authority: args.platform.certificationAuthority,
    active_sessions: args.state.listActiveSessions(),
    required_reads: args.config.requiredReads,
    live_repo_write_scope: args.config.liveRepoWriteScope,
    trusted_execution_backbone: args.config.trustedExecutionBackbone,
    secret_catalog: Object.keys(args.config.secretRefs).sort(),
  };
}

export function createBrainServer(config: BrainConfig, state: BrainStateStore, authContext?: AuthContext): McpServer {
  const server = new McpServer({
    name: 'brain-mcp',
    version: '0.1.0',
  });

  server.registerResource(
    'brain-repo-agents',
    'brain://repo/agents',
    {
      title: 'AGENTS.md',
      description: 'Canonical authority file for ANTIGRAVITY',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [
        {
          uri: 'brain://repo/agents',
          mimeType: 'text/markdown',
          text: readTextFile(path.join(config.canonicalRepoRoot, 'AGENTS.md')),
        },
      ],
    }),
  );

  server.registerResource(
    'brain-repo-record',
    'brain://repo/record',
    {
      title: 'REPOSITORY_RECORD.md',
      description: 'Latest shared repository state record',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [
        {
          uri: 'brain://repo/record',
          mimeType: 'text/markdown',
          text: readTextFile(path.join(config.canonicalRepoRoot, 'briefings', 'REPOSITORY_RECORD.md')),
        },
      ],
    }),
  );

  server.registerResource(
    'brain-repo-state',
    'brain://repo/state',
    {
      title: 'projectState.md',
      description: 'Current shared operational state',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [
        {
          uri: 'brain://repo/state',
          mimeType: 'text/markdown',
          text: readTextFile(path.join(config.canonicalRepoRoot, 'memory', 'projectState.md')),
        },
      ],
    }),
  );

  server.registerResource(
    'brain-sessions-active',
    'brain://sessions/active',
    {
      title: 'Active Sessions',
      description: 'Currently active BRAIN sessions',
      mimeType: 'application/json',
    },
    async () => ({
      contents: [
        {
          uri: 'brain://sessions/active',
          mimeType: 'application/json',
          text: JSON.stringify(state.listActiveSessions(), null, 2),
        },
      ],
    }),
  );

  server.registerResource(
    'brain-audit-recent',
    'brain://audit/recent',
    {
      title: 'Recent Audit Log',
      description: 'Last 50 BRAIN audit events',
      mimeType: 'application/json',
    },
    async () => ({
      contents: [
        {
          uri: 'brain://audit/recent',
          mimeType: 'application/json',
          text: JSON.stringify(state.recentAudit(50), null, 2),
        },
      ],
    }),
  );

  server.registerTool(
    'brain.getRepoTruth',
    {
      title: 'Get Repo Truth',
      description: 'Return the current repo truth summary and certification backbone',
    },
    async () => jsonContent(buildRepoTruthSummary(config)),
  );

  server.registerTool(
    'brain.getActiveContext',
    {
      title: 'Get Active Context',
      description: 'Return active sessions and recent audit events',
    },
    async () =>
      jsonContent({
        authority_notice: config.authorityNotice,
        public_domain_routing_rule: config.publicDomainRoutingRule,
        active_sessions: state.listActiveSessions(),
        recent_audit: state.recentAudit(20),
      }),
  );

  server.registerTool(
    'brain.getSecretRef',
    {
      title: 'Get Secret Reference',
      description: 'Return safe lookup references for a named secret without revealing its value',
      inputSchema: z.object({
        platform_id: z.string(),
        secret_name: z.string(),
      }),
    },
    async ({ platform_id, secret_name }) => {
      const platform = resolvePlatform(config, platform_id, authContext);
      if (platform.tier === 'sandbox_only') {
        throw new Error(`Secret references are not exposed to sandbox_only platforms: ${platform_id}`);
      }

      return jsonContent({
        authority_notice: config.authorityNotice,
        public_domain_routing_rule: config.publicDomainRoutingRule,
        secret_name,
        references: config.secretRefs[secret_name] ?? [],
      });
    },
  );

  const syncSchema = z.object({
    platform_id: z.string(),
    node_id: z.string(),
    target_paths: z.array(z.string()).min(1).max(25),
    git_sha: z.string().min(7),
    worktree_state: z.enum(['clean', 'dirty', 'unknown']).default('unknown'),
  });

  server.registerTool(
    'brain.sync',
    {
      title: 'Sync',
      description: 'Return a single operational truth payload without opening a session',
      inputSchema: syncSchema,
    },
    async ({ platform_id, node_id, target_paths, git_sha, worktree_state }) => {
      const platform = resolvePlatform(config, platform_id, authContext);
      validateNode(platform, node_id);
      ensurePathsAllowed(platform, target_paths);
      const payload = buildSyncPayload({
        config,
        state,
        platform,
        gitSha: git_sha,
        worktreeState: worktree_state,
        targetPaths: target_paths,
      });

      return jsonContent({
        ...payload,
      });
    },
  );

  server.registerTool(
    'brain.enterWorkspace',
    {
      title: 'Enter Workspace',
      description: 'Open a BRAIN session and return synchronized operational context',
      inputSchema: syncSchema.extend({
        intent: z.string().min(1),
        estimated_scope: z.enum(['read', 'edit', 'review', 'deploy', 'push']).default('read'),
      }),
    },
    async ({ platform_id, node_id, target_paths, git_sha, worktree_state, intent, estimated_scope }) => {
      const platform = resolvePlatform(config, platform_id, authContext);
      validateNode(platform, node_id);
      ensurePathsAllowed(platform, target_paths);
      const syncPayload = buildSyncPayload({
        config,
        state,
        platform,
        gitSha: git_sha,
        worktreeState: worktree_state,
        targetPaths: target_paths,
      });

      const session = state.enterSession({
        platformId: platform.id,
        nodeId: node_id,
        intent,
        estimatedScope: estimated_scope,
        gitSha: git_sha,
        worktreeState: worktree_state,
        shaStatus: syncPayload.sha_status,
        baselineTag: syncPayload.baseline_tag,
        targetPaths: target_paths,
        clientIp: authContext?.remoteIp,
        participationMode: platform.participationMode,
        certificationAuthority: platform.certificationAuthority,
      });

      return jsonContent({
        ...syncPayload,
        session_id: session.sessionId,
        participation_mode: session.participationMode,
        certification_authority: session.certificationAuthority,
      });
    },
  );

  server.registerTool(
    'brain.heartbeat',
    {
      title: 'Heartbeat',
      description: 'Keep an active BRAIN session alive',
      inputSchema: z.object({
        session_id: z.string().uuid(),
      }),
    },
    async ({ session_id }) => {
      const session = state.heartbeat(session_id);
      if (authContext?.authenticatedPlatformId && authContext.authenticatedPlatformId !== session.platformId) {
        throw new Error(`Heartbeat platform mismatch. Session belongs to ${session.platformId}.`);
      }

      return jsonContent({
        authority_notice: config.authorityNotice,
        public_domain_routing_rule: config.publicDomainRoutingRule,
        session_id: session.sessionId,
        status: session.status,
        last_heartbeat_at: session.lastHeartbeatAt,
      });
    },
  );

  server.registerTool(
    'brain.reportAction',
    {
      title: 'Report Action',
      description: 'Record a significant file or workflow action during a session',
      inputSchema: z.object({
        session_id: z.string().uuid(),
        action_type: z.string().min(1),
        path: z.string().min(1),
        summary: z.string().min(1),
        metadata: z.record(z.unknown()).optional(),
      }),
    },
    async ({ session_id, action_type, path: actionPath, summary, metadata }) => {
      const session = state.getSession(session_id);
      if (authContext?.authenticatedPlatformId && authContext.authenticatedPlatformId !== session.platformId) {
        throw new Error(`Action platform mismatch. Session belongs to ${session.platformId}.`);
      }

      const platform = resolvePlatform(config, session.platformId, authContext);
      ensurePathsAllowed(platform, [actionPath]);
      const updated = state.reportAction({
        sessionId: session_id,
        actionType: action_type,
        path: actionPath,
        summary,
        metadata,
      });

      return jsonContent({
        authority_notice: config.authorityNotice,
        public_domain_routing_rule: config.publicDomainRoutingRule,
        session_id: updated.sessionId,
        status: updated.status,
        last_heartbeat_at: updated.lastHeartbeatAt,
      });
    },
  );

  server.registerTool(
    'brain.exitWorkspace',
    {
      title: 'Exit Workspace',
      description: 'Close an active BRAIN session with a factual summary',
      inputSchema: z.object({
        session_id: z.string().uuid(),
        summary: z.string().min(1),
        files_touched: z.array(z.string()).default([]),
        tests_run: z.boolean().default(false),
        tests_passed: z.boolean().optional(),
        committed: z.boolean().default(false),
        pushed: z.boolean().default(false),
        commit_hash: z.string().optional(),
        exit_reason: z.enum(['normal', 'handoff', 'timeout', 'crash']).default('normal'),
      }),
    },
    async ({
      session_id,
      summary,
      files_touched,
      tests_run,
      tests_passed,
      committed,
      pushed,
      commit_hash,
      exit_reason,
    }) => {
      const session = state.getSession(session_id);
      if (authContext?.authenticatedPlatformId && authContext.authenticatedPlatformId !== session.platformId) {
        throw new Error(`Exit platform mismatch. Session belongs to ${session.platformId}.`);
      }

      const platform = resolvePlatform(config, session.platformId, authContext);
      for (const filePath of files_touched) {
        ensurePathsAllowed(platform, [filePath]);
      }

      const closed = state.exitSession({
        sessionId: session_id,
        summary,
        filesTouched: files_touched,
        testsRun: tests_run,
        testsPassed: tests_passed,
        committed,
        pushed,
        commitHash: commit_hash,
        exitReason: exit_reason,
      });

      return jsonContent({
        authority_notice: config.authorityNotice,
        public_domain_routing_rule: config.publicDomainRoutingRule,
        session_id: closed.sessionId,
        status: closed.status,
        ended_at: closed.endedAt,
        summary: closed.summary,
      });
    },
  );

  return server;
}
