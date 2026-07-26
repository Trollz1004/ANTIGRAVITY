import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const MIGRATIONS_DIR =
  "C:/Users/joshl/AppData/Roaming/npm/node_modules/paperclipai/node_modules/@paperclipai/db/dist/migrations";

const journal = JSON.parse(
  fs.readFileSync(path.join(MIGRATIONS_DIR, "meta/_journal.json"), "utf8")
);

const rows = journal.entries.map((entry) => {
  const sql = fs.readFileSync(
    path.join(MIGRATIONS_DIR, `${entry.tag}.sql`),
    "utf8"
  );
  const hash = crypto.createHash("sha256").update(sql).digest("hex");
  return `(${entry.when}, '${hash}')`;
});

const ddl = `
CREATE SCHEMA IF NOT EXISTS drizzle;
CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);
INSERT INTO drizzle.__drizzle_migrations (created_at, hash) VALUES
${rows.join(",\n")}
ON CONFLICT DO NOTHING;
`;

fs.writeFileSync("E:/ANTIGRAVITY/scripts/migration-journal-seed.sql", ddl);
console.log(`Generated seed for ${rows.length} migrations.`);
