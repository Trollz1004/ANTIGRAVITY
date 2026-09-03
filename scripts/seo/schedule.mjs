#!/usr/bin/env node
// scripts/seo/schedule.mjs — reads docs/seo/schedule.json and runs (or prints)
// today's due rows. Designed to be invoked once an hour by a Paperclip
// routine or Windows Task Scheduler. Zero-dependency Node 24 ESM.
//
// Usage:
//   node scripts/seo/schedule.mjs                # execute rows due this hour
//   node scripts/seo/schedule.mjs --dry-run       # print what would run
//   node scripts/seo/schedule.mjs --now 11:20     # override "now" for testing
//
// schtasks line (documented, NOT executed here):
//   schtasks /Create /TN "FableTierSEO-Hourly" /TR "node C:\ANTIGRAVITY\scripts\seo\schedule.mjs" /SC HOURLY /ST 00:00 /F

import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const ROOT = 'C:\\ANTIGRAVITY';
const SCHEDULE_FILE = path.join(ROOT, 'docs', 'seo', 'schedule.json');
const POST_SCRIPT = path.join(ROOT, 'scripts', 'seo', 'post.mjs');

function parseArgs(argv) {
  const out = { dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--now') out.now = argv[++i];
  }
  return out;
}

function currentHour(nowOverride) {
  if (nowOverride) {
    const [h] = nowOverride.split(':').map(Number);
    return h;
  }
  return new Date().getHours();
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!existsSync(SCHEDULE_FILE)) {
    console.error(`Schedule file not found: ${SCHEDULE_FILE}`);
    process.exit(2);
  }
  const schedule = JSON.parse(readFileSync(SCHEDULE_FILE, 'utf8'));
  const hour = currentHour(opts.now);
  const due = schedule.rows.filter((r) => Number(r.time.split(':')[0]) === hour);

  if (!due.length) {
    console.log(`No rows due for hour ${String(hour).padStart(2, '0')}:00.`);
    return;
  }

  for (const row of due) {
    const args = ['--brand', row.brand, '--platform', row.platform, '--all-new'];
    if (opts.dryRun) args.push('--dry-run');
    console.log(`\n=== ${row.brand}/${row.platform} scheduled ${row.time} ===`);
    console.log(`node ${POST_SCRIPT} ${args.join(' ')}`);
    const result = spawnSync('node', [POST_SCRIPT, ...args], { stdio: 'inherit' });
    if (result.status !== 0) {
      console.error(`Row ${row.brand}/${row.platform} exited ${result.status}`);
    }
  }
}

main();
