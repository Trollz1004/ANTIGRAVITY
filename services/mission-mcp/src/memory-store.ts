import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const DEFAULT_MEMORIES_DIR = "C:\\Users\\joshl\\.hermes\\memories";

export function getMemoriesDir(): string {
  return process.env.MISSION_MEMORIES_DIR ?? DEFAULT_MEMORIES_DIR;
}

export function writeMemoryFile(id: string, content: string): string {
  const dir = getMemoriesDir();
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, `${id}.md`);
  writeFileSync(filePath, content, "utf-8");
  return filePath;
}

export function readMemoryFile(contentRef: string): string {
  if (!existsSync(contentRef)) {
    throw new Error(`Memory file not found: ${contentRef}`);
  }
  return readFileSync(contentRef, "utf-8");
}
