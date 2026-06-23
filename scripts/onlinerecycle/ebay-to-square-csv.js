#!/usr/bin/env node
/**
 * ebay-to-square-csv.js
 * OnlineRecycle — eBay Active Listings → Square Item Import Format
 *
 * Usage:
 *   node scripts/ebay-to-square-csv.js <input-ebay-csv> [output-square-csv]
 *
 * Input:  eBay "edit price/quantity" export CSV
 * Output: Square item library import CSV (upload via Square Dashboard > Items > Actions > Import)
 *
 * After upload to Square:
 *   Dashboard > Online > Sales Channels > Meta for Business  → syncs to Facebook Marketplace
 *   Dashboard > Online > Sales Channels > Google Listings     → syncs to Google Shopping (free)
 */

'use strict';
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Square CSV column spec (required + useful optional columns)
// Ref: https://squareup.com/help/us/en/article/5153-import-items-online
// ---------------------------------------------------------------------------
const SQUARE_HEADERS = [
  'membership record', // leave blank on first import; Square fills it in on export
  'Item Name',
  'Variation Name',
  'SKU',
  'Description',
  'Price',
  'Currency',
  'Category',
  'Enabled (Square Online)',
  'Sellable',
  'Stockable',
  'Current Quantity Alma', // location name — Square uses your location name here
];

// ---------------------------------------------------------------------------
// eBay category → Square category mapping
// ---------------------------------------------------------------------------
const CAT_MAP = {
  'DVDs & Blu-ray Discs (617)': 'Movies & Entertainment',
  'CDs (176984)': 'Music & Audio',
  'Books (261186)': 'Books',
  'Textbooks (1105)': 'Books',
  'Video Games (139973)': 'Video Games',
  'Antiquarian & Collectible (29223)': 'Collectibles & Antiques',
  'Sculptures & Figurines (261628)': 'Collectibles & Antiques',
  'Motherboards (1244)': 'Computer Parts',
  'CPUs/Processors (164)': 'Computer Parts',
  'CD, DVD & Blu-ray Drives (131542)': 'Computer Parts',
  'Cases, Covers & Skins (20349)': 'Computer Parts',
  'Additional ABS Parts (33560)': 'Auto Parts',
  'Window Motors & Regulators (33706)': 'Auto Parts',
  'Instrument Clusters (33675)': 'Auto Parts',
  'Headlight Assemblies (33710)': 'Auto Parts',
  'Engine Mounts (50454)': 'Auto Parts',
  'Wiring Harnesses, Cables & Connectors (179847)': 'Auto Parts',
  'Other Interior Parts & Accessories (9887)': 'Auto Parts',
  'Exterior Locks & Lock Hardware (33648)': 'Auto Parts',
  'Additional Seat Parts (262201)': 'Auto Parts',
  'Switches & Controls (50459)': 'Auto Parts',
  'Other Wheel & Tire Parts (179684)': 'Auto Parts',
  'Oil Filters (177973)': 'Auto Parts',
  'Gaskets & Seals (33665)': 'Auto Parts',
  'Mirror Assemblies (262161)': 'Auto Parts',
  'Engine Cleaners (179491)': 'Auto Parts',
  'Wheel Bearings, Hubs & Seals (170141)': 'Auto Parts',
  'Other Starters, Alternators, ECUs & Wiring (33578)': 'Auto Parts',
  'Center & Overhead Console Parts (262189)': 'Auto Parts',
  'Emblems & Ornaments (33643)': 'Auto Parts',
  'Solar Panels & Kits (41981)': 'Electronics',
  'Power Tool Batteries (260204)': 'Tools & Hardware',
  'Sockets & Socket Sets (179527)': 'Tools & Hardware',
  'Every Other Thing (88433)': 'General Merchandise',
  'CCG Individual Cards (183454)': 'Collectibles & Antiques',
};

function squareCategory(ebayCategory) {
  return CAT_MAP[ebayCategory] || 'General Merchandise';
}

// ---------------------------------------------------------------------------
// CSV parsing (handles quoted fields with commas and embedded quotes)
// ---------------------------------------------------------------------------
function parseCsvLine(line) {
  const fields = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        field += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(field);
      field = '';
    } else {
      field += ch;
    }
  }
  fields.push(field);
  return fields;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const vals = parseCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = (vals[i] || '').trim();
    });
    return obj;
  });
}

// ---------------------------------------------------------------------------
// CSV serialisation — quote fields that contain commas, quotes, or newlines
// ---------------------------------------------------------------------------
function escField(val) {
  const s = String(val == null ? '' : val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function toCsvLine(fields) {
  return fields.map(escField).join(',');
}

// ---------------------------------------------------------------------------
// Build a short description from eBay title + category
// ---------------------------------------------------------------------------
function buildDescription(title, category) {
  const cat = squareCategory(category);
  // Strip emoji and excessive special chars from title for clean description
  const clean = title
    .replace(/[✅️⭐👀❤️🎉]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  return `${clean}. Category: ${cat}. Sold by OnlineRecycle — tested, described accurately. Local pickup available in Central Florida or ships with tracking.`;
}

// ---------------------------------------------------------------------------
// Main conversion
// ---------------------------------------------------------------------------
function convert(inputPath, outputPath) {
  const raw = fs.readFileSync(inputPath, 'utf8').replace(/^\uFEFF/, ''); // strip BOM

  // eBay export has a #INFO header line — skip it, find the real header
  const lines = raw.split(/\r?\n/);
  const headerIdx = lines.findIndex((l) => l.startsWith('Action'));
  if (headerIdx === -1) {
    console.error("ERROR: Could not find eBay CSV header row starting with 'Action'");
    process.exit(1);
  }
  const csvText = lines.slice(headerIdx).join('\n');
  const rows = parseCsv(csvText).filter((r) => r['Action'] === 'Revise');

  console.log(`Parsed ${rows.length} active eBay listings`);

  const outputRows = [toCsvLine(SQUARE_HEADERS)];
  let skipped = 0;

  for (const row of rows) {
    const title = (row['Title'] || '')
      .replace(/[✅️⭐👀❤️🎉]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
    const priceRaw = row['Start price'] || '';
    const price = parseFloat(priceRaw);
    const ebayItemNum = row['Item number'] || '';
    const category = row['Category name'] || '';
    const qty = parseInt(row['Available quantity'] || '1', 10) || 1;
    const sku = row['Custom label (SKU)'] || `EB-${ebayItemNum}`;

    if (!title || isNaN(price) || price <= 0) {
      skipped++;
      continue;
    }

    const description = buildDescription(row['Title'] || title, category);
    const squareCat = squareCategory(category);

    outputRows.push(
      toCsvLine([
        '', // membership record — blank for new import
        title, // Item Name
        'Default', // Variation Name
        sku, // SKU
        description, // Description
        price.toFixed(2), // Price
        'USD', // Currency
        squareCat, // Category
        'TRUE', // Enabled (Square Online)
        'TRUE', // Sellable
        'TRUE', // Stockable
        qty.toString(), // Current Quantity (your location)
      ]),
    );
  }

  fs.writeFileSync(outputPath, outputRows.join('\n'), 'utf8');
  console.log(`✅ Square CSV written: ${outputPath}`);
  console.log(`   ${outputRows.length - 1} items ready to import`);
  if (skipped > 0) console.log(`   ${skipped} rows skipped (missing title or price)`);
  console.log(`\nNext steps:`);
  console.log(`  1. Square Dashboard > Items > Actions > Import`);
  console.log(`  2. Upload the generated CSV`);
  console.log(`  3. Dashboard > Online > Sales Channels > Meta for Business`);
  console.log(`  4. Dashboard > Online > Sales Channels > Google Listings`);
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: node scripts/ebay-to-square-csv.js <input-ebay.csv> [output-square.csv]');
  process.exit(0);
}

const inputFile = path.resolve(args[0]);
const outputFile = args[1]
  ? path.resolve(args[1])
  : path.join(path.dirname(inputFile), 'square-import-' + path.basename(inputFile));

if (!fs.existsSync(inputFile)) {
  console.error(`ERROR: Input file not found: ${inputFile}`);
  process.exit(1);
}

convert(inputFile, outputFile);
