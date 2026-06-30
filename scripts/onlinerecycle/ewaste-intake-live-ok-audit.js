#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const INTAKE_DIR = path.join(ROOT, 'data', 'ewaste-intake');
const BOOKINGS_DIR = path.join(INTAKE_DIR, 'bookings');
const CODEX_STATE_DIR = path.join(ROOT, 'CodeX', 'state');

function readFile(p) {
  return fs.readFileSync(p, 'utf8');
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }
    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(cell);
      if (row.some((x) => String(x || '').trim() !== '')) rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    cell += ch;
  }

  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((x) => String(x || '').trim() !== '')) rows.push(row);
  }

  if (!rows.length) return [];
  const headers = rows[0].map((h) => String(h || '').trim());
  return rows.slice(1).map((r) => {
    const out = {};
    for (let i = 0; i < headers.length; i += 1) out[headers[i]] = String(r[i] || '').trim();
    return out;
  });
}

function parseCsvFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return parseCsv(readFile(filePath));
}

function boolish(v) {
  const s = String(v || '')
    .trim()
    .toLowerCase();
  return s === 'yes' || s === 'true' || s === 'pass';
}

function toCsv(rows, headers) {
  const esc = (value) => {
    const s = String(value ?? '');
    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => esc(row[h] || '')).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function main() {
  const intake = parseCsvFile(path.join(INTAKE_DIR, 'intake-inventory-template.csv'));
  const readiness = parseCsvFile(path.join(INTAKE_DIR, 'ebay-listing-readiness-template.csv'));
  const readinessById = new Map(readiness.map((r) => [r.intake_id, r]));

  const bookingCsvPath = path.join(BOOKINGS_DIR, 'square-bookings-intake-log.csv');
  const bookingRows = parseCsvFile(bookingCsvPath);
  const hasLiveOk = bookingRows.length > 0;
  const latestBookingTs = hasLiveOk ? String(bookingRows[bookingRows.length - 1].received_at_utc || '') : '';

  const registryRows = intake.map((item) => {
    const qa = readinessById.get(item.intake_id) || {};
    return {
      intake_id: item.intake_id || '',
      asset_tag: item.asset_tag || '',
      current_stage: item.current_stage || '',
      listing_status: qa.listing_status || 'unknown',
      final_qa_pass: boolish(qa.final_qa_pass) ? 'yes' : 'no',
      square_live_ok: hasLiveOk ? 'yes' : 'no',
      square_bookings_logged: String(bookingRows.length),
      last_square_event_at: latestBookingTs,
      notes: hasLiveOk
        ? 'Square booking webhook data is flowing into intake logs.'
        : 'No Square booking log rows found yet; run live booking/webhook test.',
    };
  });

  const registryHeaders = [
    'intake_id',
    'asset_tag',
    'current_stage',
    'listing_status',
    'final_qa_pass',
    'square_live_ok',
    'square_bookings_logged',
    'last_square_event_at',
    'notes',
  ];
  const registryPath = path.join(INTAKE_DIR, 'intake-registry.csv');
  fs.writeFileSync(registryPath, toCsv(registryRows, registryHeaders), 'utf8');

  fs.mkdirSync(CODEX_STATE_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const auditPath = path.join(CODEX_STATE_DIR, `ewaste-live-ok-audit-${ts}.md`);
  const md = [
    '# E-Waste Intake Live_OK Audit',
    '',
    `- Timestamp: ${new Date().toISOString()}`,
    `- Intake Rows: ${intake.length}`,
    `- Square Booking Rows: ${bookingRows.length}`,
    `- Live_OK Reflected: ${hasLiveOk ? 'YES' : 'NO'}`,
    '',
    '## Outcome',
    hasLiveOk
      ? '- Square booking intake logs exist and are reflected in `intake-registry.csv`.'
      : '- No Square booking rows are present yet. `intake-registry.csv` now explicitly flags `square_live_ok=no`.',
    '',
    '## Files',
    `- Registry: ${registryPath}`,
    `- Audit: ${auditPath}`,
    '',
    '## Next Verification',
    '- Trigger one real/test Square booking.',
    '- Confirm a new row appears in `data/ewaste-intake/bookings/square-bookings-intake-log.csv`.',
    '- Re-run this audit script to flip `square_live_ok` to `yes`.',
    '',
  ].join('\n');
  fs.writeFileSync(auditPath, md, 'utf8');

  console.log(`REGISTRY=${registryPath}`);
  console.log(`AUDIT=${auditPath}`);
  console.log(`LIVE_OK=${hasLiveOk ? 'YES' : 'NO'}`);
}

try {
  main();
} catch (error) {
  console.error(`ewaste-intake-live-ok-audit failed: ${error.message}`);
  process.exit(1);
}
