import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { makeTmpDb } from "../helpers/tmp-db.js";
import {
  resolveSafePath,
  readFileTool,
  writeFileTool,
  patchFileTool,
} from "../../src/tools/files.js";

describe("files", () => {
  let tmpRoot: string;
  const cleanups: Array<() => void> = [];

  beforeEach(() => {
    tmpRoot = join(tmpdir(), `mission-mcp-files-${process.pid}-${Date.now()}`);
    mkdirSync(tmpRoot, { recursive: true });
    process.env.MISSION_FILE_ROOT = tmpRoot;
  });

  afterEach(() => {
    delete process.env.MISSION_FILE_ROOT;
    try {
      rmSync(tmpRoot, { recursive: true, force: true });
    } catch {}
    for (const fn of cleanups.splice(0)) fn();
  });

  // ── resolveSafePath ──────────────────────────────────────────────────────

  it("resolveSafePath: rejects absolute Unix paths", () => {
    expect(() => resolveSafePath("/etc/passwd", tmpRoot)).toThrow(
      "Absolute paths are not allowed"
    );
  });

  it("resolveSafePath: rejects absolute Windows paths", () => {
    expect(() => resolveSafePath("C:\\Windows\\system32", tmpRoot)).toThrow(
      "Absolute paths are not allowed"
    );
  });

  it("resolveSafePath: rejects path traversal", () => {
    expect(() => resolveSafePath("../../etc/passwd", tmpRoot)).toThrow(
      "Path traversal rejected"
    );
  });

  it("resolveSafePath: resolves relative path within root", () => {
    const result = resolveSafePath("src/foo.ts", tmpRoot);
    expect(result).toContain("src");
    expect(result).toContain("foo.ts");
  });

  // ── readFile ─────────────────────────────────────────────────────────────

  it("readFileTool: reads existing file", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    writeFileSync(join(tmpRoot, "hello.txt"), "Hello world");
    const result = readFileTool(db, { path: "hello.txt" });
    expect(result.content).toBe("Hello world");
    expect(result.truncated).toBe(false);
  });

  it("readFileTool: throws for missing file", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    expect(() => readFileTool(db, { path: "nonexistent.txt" })).toThrow(
      "File not found"
    );
  });

  it("readFileTool: truncates at max_bytes", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    writeFileSync(join(tmpRoot, "big.txt"), "ABCDEFGHIJ");
    const result = readFileTool(db, { path: "big.txt", max_bytes: 3 });
    expect(result.content).toBe("ABC");
    expect(result.truncated).toBe(true);
  });

  // ── writeFile ────────────────────────────────────────────────────────────

  it("writeFileTool: creates new file", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const result = writeFileTool(db, {
      path: "new-file.txt",
      content: "Fresh content",
    });

    expect(result.created).toBe(true);
    expect(readFileSync(join(tmpRoot, "new-file.txt"), "utf-8")).toBe(
      "Fresh content"
    );
  });

  it("writeFileTool: overwrites existing file", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    writeFileSync(join(tmpRoot, "existing.txt"), "Old");
    const result = writeFileTool(db, {
      path: "existing.txt",
      content: "New content",
    });

    expect(result.created).toBe(false);
    expect(readFileSync(join(tmpRoot, "existing.txt"), "utf-8")).toBe(
      "New content"
    );
  });

  it("writeFileTool: create_only=true rejects existing file", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    writeFileSync(join(tmpRoot, "guard.txt"), "Original");
    expect(() =>
      writeFileTool(db, {
        path: "guard.txt",
        content: "Override",
        create_only: true,
      })
    ).toThrow("create_only=true");
  });

  it("writeFileTool: creates parent directories", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    writeFileTool(db, {
      path: "deep/nested/file.txt",
      content: "Nested",
    });

    expect(existsSync(join(tmpRoot, "deep/nested/file.txt"))).toBe(true);
  });

  // ── patchFile ────────────────────────────────────────────────────────────

  it("patchFileTool: applies clean unified diff", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    writeFileSync(join(tmpRoot, "patch-me.txt"), "Hello world\nLine two\n");

    const diff = [
      "--- a/patch-me.txt",
      "+++ b/patch-me.txt",
      "@@ -1,2 +1,2 @@",
      "-Hello world",
      "+Hello ANTIGRAVITY",
      " Line two",
    ].join("\n") + "\n";

    const result = patchFileTool(db, { path: "patch-me.txt", diff });
    expect(result.applied).toBe(true);

    const patched = readFileSync(join(tmpRoot, "patch-me.txt"), "utf-8");
    expect(patched).toContain("Hello ANTIGRAVITY");
  });

  it("patchFileTool: throws on non-applying diff", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    writeFileSync(join(tmpRoot, "unmatch.txt"), "completely different content\n");

    const diff = [
      "--- a/unmatch.txt",
      "+++ b/unmatch.txt",
      "@@ -1,1 +1,1 @@",
      "-Hello world",
      "+Hello ANTIGRAVITY",
    ].join("\n") + "\n";

    expect(() => patchFileTool(db, { path: "unmatch.txt", diff })).toThrow(
      "Patch did not apply cleanly"
    );
  });
});
