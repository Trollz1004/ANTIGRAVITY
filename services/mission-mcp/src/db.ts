import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import migration001 from "./migrations/001_initial.sql";
import migration002 from "./migrations/002_agents_and_completed_at.sql";

const DEFAULT_DB_PATH = "C:\\Users\\joshl\\.hermes\\state.db";

export function openDb(dbPath?: string): Database.Database {
  const path = dbPath ?? process.env.MISSION_MCP_DB ?? DEFAULT_DB_PATH;
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  applyMigrations(db);
  return db;
}

export function applyMigrations(db: Database.Database): void {
  // Bootstrap migrations table first (can't be in the migration itself)
  db.prepare(
    `CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)`
  ).run();

  runMigration(db, "001_initial", migration001);
  runMigration(db, "002_agents_and_completed_at", migration002);
}

function runMigration(
  db: Database.Database,
  id: string,
  sql: string
): void {
  const already = db
    .prepare("SELECT id FROM schema_migrations WHERE id = ?")
    .get(id);
  if (already) return;

  // Run each statement individually to avoid needing db.exec()
  const statements = sql
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    db.prepare(stmt).run();
  }

  db.prepare(
    "INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)"
  ).run(id, Date.now());
}
