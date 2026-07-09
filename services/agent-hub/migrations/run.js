const { readdirSync, readFileSync } = require('fs');
const { join } = require('path');
const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/agent_hub'
  });

  try {
    const files = readdirSync(__dirname)
      .filter(file => /^\d+_.*\.sql$/.test(file))
      .sort();

    for (const file of files) {
      const sql = readFileSync(join(__dirname, file), 'utf8');
      await pool.query(sql);
      console.log(`[migrate] Applied ${file}`);
    }

    console.log('[migrate] Schema migrations completed successfully');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('[migrate] Tables already exist — skipping');
    } else {
      throw err;
    }
  } finally {
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('[migrate] FAILED:', err.message);
  process.exit(1);
});
