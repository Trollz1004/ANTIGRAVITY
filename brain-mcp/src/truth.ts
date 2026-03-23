import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import type {
  BrainConfig,
  PlatformDefinition,
  ShaStatus,
  WorktreeState,
} from "./config.js";
import { normalizePath } from "./config.js";

export interface RepoTruthSummary {
  authorityNotice: string;
  canonicalRepoRoot: string;
  repoHeadSha: string;
  repoStatus: "clean" | "dirty" | "unknown";
  trustedExecutionBackbone: string[];
  requiredReads: { label: string; path: string }[];
  nodes: BrainConfig["nodes"];
  certificationAuthorities: {
    id: string;
    displayName: string;
    nodeId: string;
    certificationAuthority: boolean;
    tier: PlatformDefinition["tier"];
    participationMode: PlatformDefinition["participationMode"];
  }[];
}

export function readTextFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

export function getRepoHeadSha(repoRoot: string): string {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

export function getRepoStatus(repoRoot: string): "clean" | "dirty" | "unknown" {
  try {
    const output = execFileSync("git", ["status", "--porcelain"], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
    return output.length === 0 ? "clean" : "dirty";
  } catch {
    return "unknown";
  }
}

export function isPathUnder(pathValue: string, prefixes: string[]): boolean {
  const candidate = normalizePath(pathValue);
  return prefixes.some((prefix) => {
    const normalizedPrefix = normalizePath(prefix);
    return (
      candidate === normalizedPrefix ||
      candidate.startsWith(`${normalizedPrefix}\\`)
    );
  });
}

export function evaluateTargetPaths(
  platform: PlatformDefinition,
  targetPaths: string[],
): {
  allowed: boolean;
  lane: string[];
  violations: string[];
} {
  const violations: string[] = [];

  for (const targetPath of targetPaths) {
    if (
      platform.blockedPathPrefixes &&
      isPathUnder(targetPath, platform.blockedPathPrefixes)
    ) {
      violations.push(
        `${targetPath} is blocked for ${platform.id} by explicit path policy.`,
      );
      continue;
    }

    if (!isPathUnder(targetPath, platform.allowedPathPrefixes)) {
      violations.push(
        `${targetPath} is outside the allowed lane for ${platform.id}.`,
      );
    }
  }

  return {
    allowed: violations.length === 0,
    lane: platform.allowedPathPrefixes,
    violations,
  };
}

export function computeShaStatus(
  repoHeadSha: string,
  incomingGitSha: string,
  targetPaths: string[],
  canonicalRepoRoot: string,
): ShaStatus {
  if (repoHeadSha === "unknown" || incomingGitSha === repoHeadSha) {
    return "match";
  }

  return targetPaths.some((entry) =>
    isPathUnder(entry, [canonicalRepoRoot]),
  )
    ? "drift_production"
    : "drift_sandbox";
}

export function buildBaselineTag(
  gitSha: string,
  worktreeState: WorktreeState,
): string {
  const compactSha = gitSha === "unknown" ? "unknown" : gitSha.slice(0, 12);
  return `${compactSha}-${worktreeState.toUpperCase()}`;
}

export function buildRepoTruthSummary(config: BrainConfig): RepoTruthSummary {
  return {
    authorityNotice: config.authorityNotice,
    canonicalRepoRoot: config.canonicalRepoRoot,
    repoHeadSha: getRepoHeadSha(config.repoRoot),
    repoStatus: getRepoStatus(config.repoRoot),
    trustedExecutionBackbone: config.trustedExecutionBackbone,
    requiredReads: config.requiredReads,
    nodes: config.nodes,
    certificationAuthorities: config.platforms.map((platform) => ({
      id: platform.id,
      displayName: platform.displayName,
      nodeId: platform.nodeId,
      certificationAuthority: platform.certificationAuthority,
      tier: platform.tier,
      participationMode: platform.participationMode,
    })),
  };
}

export function toFileUri(filePath: string): string {
  const normalized = path.resolve(filePath).replace(/\\/g, "/");
  return `file:///${normalized}`;
}
