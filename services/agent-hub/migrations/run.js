const { readFileSync } = require('fs');
const { join } = require('path');
const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/agent_hub'
  });

  const sql = readFileSync(join(__dirname, '001_create_tasks.sql'), 'utf8');

  try {
    await pool.query(sql);
    console.log('[migrate] Schema created successfully');
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
