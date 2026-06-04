import { z } from "zod";
import type Database from "better-sqlite3";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, join, normalize, dirname } from "path";
import { applyPatch } from "diff";
import { logEvent } from "../events.js";

// ── Config ────────────────────────────────────────────────────────────────────

export function getFileRoot(): string {
  return process.env.MISSION_FILE_ROOT ?? "C:\\Antigravity";
}

// ── Schemas ───────────────────────────────────────────────────────────────────

export const ReadFileInput = z.object({
  path: z.string().min(1),
  max_bytes: z.number().int().positive().optional().default(1_048_576),
});

export const WriteFileInput = z.object({
  path: z.string().min(1),
  content: z.string(),
  create_only: z.boolean().optional().default(false),
});

export const PatchFileInput = z.object({
  path: z.string().min(1),
  diff: z.string().min(1),
});

// ── Safe path resolver ────────────────────────────────────────────────────────

export function resolveSafePath(relPath: string, root?: string): string {
  const fileRoot = root ?? getFileRoot();

  // Reject absolute paths
  if (
    relPath.startsWith("/") ||
    relPath.startsWith("\\") ||
    /^[A-Za-z]:/.test(relPath)
  ) {
    throw new Error(
      `Absolute paths are not allowed. Use a path relative to the repo root.`
    );
  }

  const normalized = normalize(relPath);
  const absolute = resolve(join(fileRoot, normalized));
  const rootResolved = resolve(fileRoot);

  // Reject traversal outside root
  if (!absolute.startsWith(rootResolved + "/") && absolute !== rootResolved) {
    // Windows path separator
    if (
      !absolute.startsWith(rootResolved + "\\") &&
      absolute !== rootResolved
    ) {
      throw new Error(
        `Path traversal rejected: ${relPath} resolves outside repo root.`
      );
    }
  }

  return absolute;
}

// ── Tool implementations ──────────────────────────────────────────────────────

export function readFileTool(
  db: Database.Database,
  input: z.infer<typeof ReadFileInput>
): { path: string; content: string; truncated: boolean } {
  const parsed = ReadFileInput.parse(input);
  const absPath = resolveSafePath(parsed.path);

  if (!existsSync(absPath)) {
    throw new Error(`File not found: ${parsed.path}`);
  }

  const raw = readFileSync(absPath);
  const truncated = raw.length > parsed.max_bytes;
  const content = raw.slice(0, parsed.max_bytes).toString("utf-8");

  logEvent(db, {
    kind: "file_read",
    payload: { path: parsed.path, bytes: content.length, truncated },
  });

  return { path: parsed.path, content, truncated };
}

export function writeFileTool(
  db: Database.Database,
  input: z.infer<typeof WriteFileInput>
): { path: string; created: boolean } {
  const parsed = WriteFileInput.parse(input);
  const absPath = resolveSafePath(parsed.path);

  const existed = existsSync(absPath);

  if (parsed.create_only && existed) {
    throw new Error(
      `create_only=true but file already exists: ${parsed.path}`
    );
  }

  mkdirSync(dirname(absPath), { recursive: true });
  writeFileSync(absPath, parsed.content, "utf-8");

  logEvent(db, {
    kind: "file_write",
    payload: { path: parsed.path, created: !existed },
  });

  return { path: parsed.path, created: !existed };
}

export function patchFileTool(
  db: Database.Database,
  input: z.infer<typeof PatchFileInput>
): { path: string; applied: boolean } {
  const parsed = PatchFileInput.parse(input);
  const absPath = resolveSafePath(parsed.path);

  if (!existsSync(absPath)) {
    throw new Error(`File not found: ${parsed.path}`);
  }

  const original = readFileSync(absPath, "utf-8");
  const result = applyPatch(original, parsed.diff);

  if (result === false) {
    throw new Error(`Patch did not apply cleanly to ${parsed.path}`);
  }

  writeFileSync(absPath, result, "utf-8");

  logEvent(db, {
    kind: "file_patch",
    payload: { path: parsed.path },
  });

  return { path: parsed.path, applied: true };
}
