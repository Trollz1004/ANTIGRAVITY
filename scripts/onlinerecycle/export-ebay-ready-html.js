#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INPUT_JSON = path.join(ROOT, 'data', 'ewaste-intake', 'output', 'latest-ebay-listings-batch.json');
const STATE_DIR = path.join(ROOT, 'CodeX', 'state');

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function render(payload) {
  const generatedAt = payload.generated_at || new Date().toISOString();
  const batchId = payload.batch_id || 'unknown-batch';
  const listings = Array.isArray(payload.listings) ? payload.listings : [];

  const sections = listings.map((item, idx) => {
    const title = esc(item.title);
    const intakeId = esc(item.intake_id);
    const variant = esc(item.listing_variant || 'primary');
    const format = esc(item.listing_format || 'buy_it_now');
    const price = Number(item.suggested_price_usd || 0).toFixed(2);
    const revenueNote = esc(item.revenue_note || item.charity_impact_line || '');
    const htmlDescription = String(item.description_html || '').trim();

    return [
      `<section class="listing">`,
      `<h2>${idx + 1}. ${title}</h2>`,
      `<ul>`,
      `<li><strong>Intake ID:</strong> ${intakeId}</li>`,
      `<li><strong>Variant:</strong> ${variant}</li>`,
      `<li><strong>Format:</strong> ${format}</li>`,
      `<li><strong>Suggested Price:</strong> $${price}</li>`,
      `<li><strong>Revenue Note:</strong> ${revenueNote}</li>`,
      `</ul>`,
      `<h3>Copy/Paste Description HTML</h3>`,
      `<textarea readonly>${esc(htmlDescription)}</textarea>`,
      `</section>`,
    ].join('\n');
  });

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>eBay Ready Batch ${esc(batchId)}</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; margin: 24px; background: #f7f9fc; color: #101828; }
    h1 { margin: 0 0 8px; }
    .meta { margin: 0 0 18px; color: #475467; }
    .listing { background: #fff; border: 1px solid #d0d5dd; border-radius: 12px; padding: 16px; margin: 12px 0; }
    ul { margin: 8px 0 14px 18px; }
    textarea { width: 100%; min-height: 240px; font-family: Consolas, monospace; font-size: 12px; border: 1px solid #98a2b3; border-radius: 8px; padding: 10px; }
  </style>
</head>
<body>
  <h1>eBay Ready Listing Pack</h1>
  <p class="meta">Batch: <strong>${esc(batchId)}</strong> | Generated: <strong>${esc(
    generatedAt,
  )}</strong> | Listings: <strong>${listings.length}</strong></p>
  ${sections.join('\n')}
</body>
</html>
`;
}

function main() {
  if (!fs.existsSync(INPUT_JSON)) {
    throw new Error(`Missing input JSON: ${INPUT_JSON}`);
  }

  fs.mkdirSync(STATE_DIR, { recursive: true });
  const payload = readJson(INPUT_JSON);
  const html = render(payload);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(STATE_DIR, `ebay-ready-batch-${ts}.html`);
  const latestPath = path.join(STATE_DIR, 'ebay-ready-batch-latest.html');

  fs.writeFileSync(outputPath, html, 'utf8');
  fs.writeFileSync(latestPath, html, 'utf8');

  console.log(`HTML=${outputPath}`);
  console.log(`LATEST=${latestPath}`);
}

try {
  main();
} catch (error) {
  console.error(`export-ebay-ready-html failed: ${error.message}`);
  process.exit(1);
}
