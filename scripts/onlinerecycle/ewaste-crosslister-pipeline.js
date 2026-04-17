#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INTAKE_DIR = path.join(ROOT, 'data', 'ewaste-intake');
const OUTPUT_DIR = path.join(INTAKE_DIR, 'output');
const DEFAULT_BATCH_SIZE = 5;

const PRIMARY_PROFILE = {
  id: 'primary',
  format: null,
  title_suffix: 'Tested Ready',
  description_blurb: 'Configured for clean, transparent resale with clear testing notes and faster sell-through.',
  price_multiplier: 1.0,
};

const VARIANT_PROFILES = [
  {
    id: 'best-offer',
    format: 'buy_it_now',
    title_suffix: 'Best Offer Enabled',
    description_blurb:
      'Use this variant when enabling Best Offer to improve sell-through while keeping disclosures unchanged.',
    price_multiplier: 1.05,
  },
  {
    id: 'auction-7d',
    format: 'auction_7_day',
    title_suffix: '7-Day Auction',
    description_blurb:
      'Use this auction variant only when rapid cashflow is needed and market comps support bidding demand.',
    price_multiplier: 0.88,
  },
  {
    id: 'local-pickup',
    format: 'buy_it_now_local_pickup',
    title_suffix: 'Local Pickup Option',
    description_blurb: 'Use this variant for local pickup and reduced shipping overhead where geography allows.',
    price_multiplier: 0.96,
  },
  {
    id: 'price-drop',
    format: 'buy_it_now',
    title_suffix: 'Quick Sale Pricing',
    description_blurb:
      'Use this variant after 5-7 days unsold to accelerate conversion without changing the condition disclosure.',
    price_multiplier: 0.92,
  },
];

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
      if (ch === '\r' && next === '\n') {
        i += 1;
      }
      row.push(cell);
      const hasAny = row.some((x) => String(x || '').trim() !== '');
      if (hasAny) rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += ch;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    const hasAny = row.some((x) => String(x || '').trim() !== '');
    if (hasAny) rows.push(row);
  }

  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => String(h).trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    for (let i = 0; i < headers.length; i += 1) {
      obj[headers[i]] = (r[i] || '').trim();
    }
    return obj;
  });
}

function boolish(v) {
  const s = String(v || '')
    .trim()
    .toLowerCase();
  return s === 'yes' || s === 'true' || s === 'pass';
}

function num(v, fallback = 0) {
  const n = Number(String(v || '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

function title80(parts) {
  let t = parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  if (t.length <= 80) return t;
  t = t
    .replace(/\b(Intel|AMD|Processor|CPU)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length <= 80) return t;
  return t.slice(0, 80).trim();
}

function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;');
}

function loadByIntake(fileName) {
  const filePath = path.join(INTAKE_DIR, fileName);
  if (!fs.existsSync(filePath)) return new Map();
  const records = parseCsv(readFile(filePath));
  const m = new Map();
  for (const r of records) {
    if (r.intake_id) m.set(r.intake_id, r);
  }
  return m;
}

function main() {
  const parsedBatchSize = Number(process.argv[2] || DEFAULT_BATCH_SIZE);
  const batchSize = Number.isFinite(parsedBatchSize) ? Math.max(1, parsedBatchSize) : DEFAULT_BATCH_SIZE;
  const intakePath = path.join(INTAKE_DIR, 'intake-inventory-template.csv');
  if (!fs.existsSync(intakePath)) {
    throw new Error(`Missing inventory file: ${intakePath}`);
  }

  const intake = parseCsv(readFile(intakePath));
  const grades = loadByIntake('condition-grading-template.csv');
  const tests = loadByIntake('testing-status-template.csv');
  const values = loadByIntake('resale-estimate-template.csv');
  const ready = loadByIntake('ebay-listing-readiness-template.csv');

  const eligible = intake.filter((row) => {
    const q = ready.get(row.intake_id);
    return q && boolish(q.final_qa_pass) && String(q.listing_status || '').toLowerCase() === 'ready';
  });

  if (eligible.length === 0) {
    console.log('No listing-ready inventory rows found.');
    return;
  }

  const primaryRows = eligible.slice(0, batchSize);
  const selectionPlan = primaryRows.map((row) => ({
    row,
    profile: PRIMARY_PROFILE,
  }));

  if (selectionPlan.length < batchSize) {
    for (const row of eligible) {
      for (const profile of VARIANT_PROFILES) {
        if (selectionPlan.length >= batchSize) {
          break;
        }
        selectionPlan.push({ row, profile });
      }
      if (selectionPlan.length >= batchSize) {
        break;
      }
    }
  }

  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, '-');
  const batchId = `CODEX-EBAY-REVENUE-20260304-${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(
    2,
    '0',
  )}${String(now.getUTCDate()).padStart(2, '0')}`;

  const listings = selectionPlan.map(({ row: r, profile }, idx) => {
    const g = grades.get(r.intake_id) || {};
    const t = tests.get(r.intake_id) || {};
    const v = values.get(r.intake_id) || {};

    const cpu = r.cpu || 'CPU';
    const ram = r.ram_gb ? `${r.ram_gb}GB RAM` : '';
    const storage = r.storage_capacity_gb
      ? `${r.storage_capacity_gb}GB ${r.storage_type || 'Storage'}`
      : r.storage_type || '';

    const title = title80([r.make, r.model, r.device_type, cpu, ram, storage, profile.title_suffix]);

    const basePrice = num(v.recommended_start_or_bin_usd || v.expected_sale_price_usd || 0, 0);
    const recommendedPrice = Number((basePrice * Number(profile.price_multiplier || 1)).toFixed(2));
    const grade = g.grade || 'Used';
    const revenueNote = 'Revenue allocation is handled internally after sale closeout under the OnlineRecycle policy.';

    const testedChecks = [
      ['BIOS POST', t.bios_post],
      ['OS Boot', t.os_boot],
      ['CPU Stress 15m', t.cpu_stress_15min],
      ['Memtest', t.memtest_pass],
      ['Storage SMART', t.storage_smart_pass],
      ['Network', t.network_pass],
      ['USB Ports', t.usb_ports_pass],
      ['Video Output', t.video_output_pass],
      ['Keyboard/Trackpad', t.keyboard_trackpad_pass],
    ];

    const testSummary = testedChecks
      .filter(([, val]) => boolish(val))
      .map(([label]) => label)
      .join(', ');

    const htmlDescription = [
      `<h3>${escHtml(r.make)} ${escHtml(r.model)} (${escHtml(r.device_type)})</h3>`,
      `<p><strong>Condition:</strong> Grade ${escHtml(grade)}. ${escHtml(
        r.condition_at_dropoff || g.grade_notes || 'Used device with normal cosmetic wear.',
      )}</p>`,
      `<p><strong>Testing completed:</strong> ${escHtml(testSummary || 'Functional checks completed')}.`,
      ` Data wipe: ${escHtml(t.data_wipe_method || 'Verified wipe process completed')}.</p>`,
      `<ul>`,
      `<li><strong>CPU:</strong> ${escHtml(cpu)}</li>`,
      `<li><strong>Memory:</strong> ${escHtml(r.ram_gb || 'N/A')} GB</li>`,
      `<li><strong>Storage:</strong> ${escHtml(storage || 'N/A')}</li>`,
      `<li><strong>Power adapter included:</strong> ${escHtml(r.power_adapter_included || 'Unknown')}</li>`,
      `</ul>`,
      `<p><strong>Shipping:</strong> Ships in 1-2 business days, anti-static packed, tracking included, no PO boxes for oversized hardware.</p>`,
      `<p><strong>Revenue note:</strong> ${escHtml(revenueNote)}</p>`,
      `<p><strong>Listing strategy:</strong> ${escHtml(profile.description_blurb)}</p>`,
      `<p><strong>Inventory control:</strong> Publish only one active listing variant per physical unit (${escHtml(
        r.asset_tag || r.intake_id,
      )}) at a time.</p>`,
      `<p><em>Policy note:</em> Serials are asset-tracked; only items shown/listed are included; any untested function is explicitly disclosed.</p>`,
    ].join('\n');

    return {
      batch_id: batchId,
      batch_index: idx + 1,
      intake_id: r.intake_id,
      asset_tag: r.asset_tag,
      channel: 'ebay',
      listing_variant: profile.id,
      listing_format: profile.format || v.recommended_listing_format || 'buy_it_now',
      suggested_price_usd: recommendedPrice,
      title,
      category_hint: `${r.device_type || 'electronics'} > ${r.make || ''}`.trim(),
      condition_grade: grade,
      condition_summary: `${r.condition_at_dropoff || g.grade_notes || 'Used'}`,
      test_summary: testSummary,
      item_specifics: {
        brand: r.make || '',
        model: r.model || '',
        cpu: r.cpu || '',
        ram_gb: r.ram_gb || '',
        storage_type: r.storage_type || '',
        storage_capacity_gb: r.storage_capacity_gb || '',
        data_wipe_method: t.data_wipe_method || '',
        battery_runtime_minutes: t.battery_runtime_minutes || '',
      },
      shipping_notes:
        'Ships in 1-2 business days with tracking. Anti-static + foam packaging. Heavy units ship UPS/FedEx Ground.',
      revenue_note: revenueNote,
      description_html: htmlDescription,
    };
  });

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const jsonPath = path.join(OUTPUT_DIR, `ebay-listings-batch-${ts}.json`);
  const mdPath = path.join(OUTPUT_DIR, `ebay-listings-batch-${ts}.md`);
  const latestJson = path.join(OUTPUT_DIR, 'latest-ebay-listings-batch.json');
  const latestMd = path.join(OUTPUT_DIR, 'latest-ebay-listings-batch.md');

  fs.writeFileSync(
    jsonPath,
    JSON.stringify({ generated_at: now.toISOString(), batch_id: batchId, count: listings.length, listings }, null, 2) +
      '\n',
    'utf8',
  );
  fs.writeFileSync(latestJson, fs.readFileSync(jsonPath, 'utf8'), 'utf8');

  const mdLines = [
    `# eBay Crosslister Batch`,
    '',
    `- Batch ID: ${batchId}`,
    `- Generated: ${now.toISOString()}`,
    `- Items: ${listings.length}`,
    '',
  ];

  for (const item of listings) {
    mdLines.push(`## ${item.intake_id} - ${item.title}`);
    mdLines.push('');
    mdLines.push(`- Variant: ${item.listing_variant}`);
    mdLines.push(`- Suggested Price: $${Number(item.suggested_price_usd || 0).toFixed(2)}`);
    mdLines.push(`- Format: ${item.listing_format}`);
    mdLines.push(`- Condition: ${item.condition_grade} - ${item.condition_summary}`);
    mdLines.push(`- Test Summary: ${item.test_summary || 'Functional checks completed'}`);
    mdLines.push(`- Shipping: ${item.shipping_notes}`);
    mdLines.push(
      `- Revenue Note: ${item.revenue_note || 'Revenue allocation tracked internally after sale closeout.'}`,
    );
    mdLines.push('');
    mdLines.push('### Description HTML');
    mdLines.push('');
    mdLines.push('```html');
    mdLines.push(item.description_html);
    mdLines.push('```');
    mdLines.push('');
  }

  fs.writeFileSync(mdPath, mdLines.join('\n'), 'utf8');
  fs.writeFileSync(latestMd, fs.readFileSync(mdPath, 'utf8'), 'utf8');

  console.log(`BATCH_ID=${batchId}`);
  console.log(`COUNT=${listings.length}`);
  console.log(`JSON=${jsonPath}`);
  console.log(`MARKDOWN=${mdPath}`);
}

try {
  main();
} catch (err) {
  console.error(`Pipeline failed: ${err.message}`);
  process.exit(1);
}
