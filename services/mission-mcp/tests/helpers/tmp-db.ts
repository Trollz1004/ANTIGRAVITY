import Database from "better-sqlite3";
import { mkdirSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { applyMigrations } from "../../src/db.js";

let counter = 0;

export function makeTmpDb(): { db: Database.Database; cleanup: () => void } {
  const dir = join(tmpdir(), `mission-mcp-test-${process.pid}-${++counter}`);
  mkdirSync(dir, { recursive: true });
  const dbPath = join(dir, "test.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  applyMigrations(db);
  return {
    db,
    cleanup: () => {
      try {
        db.close();
      } catch {}
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {}
    },
  };
}
