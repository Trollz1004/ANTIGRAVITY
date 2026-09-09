/**
 * Cross-listing metadata helper for the accompanying review workbook.
 *
 * This script only enriches spreadsheet rows. It never creates, publishes,
 * revises, or deletes an eBay listing. It uses publicly exposed structured
 * product metadata (JSON-LD and Open Graph) from an HTTP(S) source URL.
 */

const LISTINGS_SHEET = 'Listings';
const MAX_ROWS_PER_RUN = 15;

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Cross-listing')
    .addItem('Enrich selected rows', 'enrichSelectedRows')
    .addItem('Enrich first pending rows', 'enrichPendingRows')
    .addToUi();
}

function enrichSelectedRows() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LISTINGS_SHEET);
  if (!sheet) throw new Error(`Sheet "${LISTINGS_SHEET}" was not found.`);
  const range = sheet.getActiveRange();
  if (!range) throw new Error('Select one or more data rows in the Listings sheet first.');

  const start = Math.max(2, range.getRow());
  const end = Math.min(sheet.getLastRow(), range.getLastRow());
  const rows = [];
  for (let row = start; row <= end; row++) rows.push(row);
  enrichRows_(sheet, rows);
}

function enrichPendingRows() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LISTINGS_SHEET);
  if (!sheet) throw new Error(`Sheet "${LISTINGS_SHEET}" was not found.`);
  const map = getColumnMap_(sheet);
  const values = sheet.getRange(2, 1, Math.max(0, sheet.getLastRow() - 1), sheet.getLastColumn()).getValues();
  const rows = [];

  values.forEach((row, index) => {
    const sourceUrl = String(row[map['Source URL'] - 1] || '').trim();
    const extractionStatus = String(row[map['Extraction Status'] - 1] || '').trim();
    if (sourceUrl && ['Not run', 'HTTP or access error', 'No structured data found'].includes(extractionStatus) && rows.length < MAX_ROWS_PER_RUN) {
      rows.push(index + 2);
    }
  });

  if (!rows.length) {
    SpreadsheetApp.getUi().alert('No pending rows with a source URL were found.');
    return;
  }
  enrichRows_(sheet, rows);
}

function enrichRows_(sheet, rowNumbers) {
  const map = getColumnMap_(sheet);
  const ui = SpreadsheetApp.getUi();
  const limitedRows = rowNumbers.slice(0, MAX_ROWS_PER_RUN);
  let enriched = 0;
  const errors = [];

  limitedRows.forEach(rowNumber => {
    const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
    const url = String(row[map['Source URL'] - 1] || '').trim();
    if (!url) {
      setCell_(sheet, rowNumber, map, 'Review Status', 'Needs Source URL');
      setCell_(sheet, rowNumber, map, 'Extraction Status', 'URL invalid');
      errors.push(`Row ${rowNumber}: no Source URL`);
      return;
    }

    try {
      const product = fetchProductMetadata_(url);
      if (!product.title && !product.description && !product.images.length) {
        setCell_(sheet, rowNumber, map, 'Review Status', 'Research Needed');
        setCell_(sheet, rowNumber, map, 'Extraction Status', 'No structured data found');
        setCell_(sheet, rowNumber, map, 'Last Extracted', new Date());
        errors.push(`Row ${rowNumber}: no usable Product/OG metadata`);
        return;
      }

      // Only write a value where the source offers data. Existing user-entered
      // values are retained unless enrichment provides a clearer empty field.
      writeIfPresent_(sheet, rowNumber, map, 'Listing Title', product.title);
      writeIfPresent_(sheet, rowNumber, map, 'Description', product.description);
      writeIfPresent_(sheet, rowNumber, map, 'Brand / Studio', product.brand);
      writeIfPresent_(sheet, rowNumber, map, 'MPN', product.mpn || product.sku);
      writeIfPresent_(sheet, rowNumber, map, 'UPC', product.gtin);
      product.images.slice(0, 4).forEach((imageUrl, index) => {
        writeIfPresent_(sheet, rowNumber, map, `Image URL ${index + 1}`, imageUrl);
      });

      const note = buildReferenceNote_(product, url);
      appendNote_(sheet, rowNumber, map, note);
      setCell_(sheet, rowNumber, map, 'Review Status', 'Needs Review');
      setCell_(sheet, rowNumber, map, 'Extraction Status', 'Fetched — review required');
      setCell_(sheet, rowNumber, map, 'Last Extracted', new Date());
      enriched++;
    } catch (error) {
      setCell_(sheet, rowNumber, map, 'Review Status', 'Research Needed');
      setCell_(sheet, rowNumber, map, 'Extraction Status', 'HTTP or access error');
      setCell_(sheet, rowNumber, map, 'Last Extracted', new Date());
      appendNote_(sheet, rowNumber, map, `Metadata extraction error: ${safeError_(error)}`);
      errors.push(`Row ${rowNumber}: ${safeError_(error)}`);
    }
  });

  const suffix = errors.length ? `\n\nIssues:\n${errors.slice(0, 8).join('\n')}` : '';
  ui.alert(`Metadata extraction complete. ${enriched} row(s) updated.${suffix}`);
}

function fetchProductMetadata_(url) {
  validateSourceUrl_(url);
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    followRedirects: true,
    muteHttpExceptions: true,
    headers: {
      'Accept': 'text/html,application/xhtml+xml',
      'User-Agent': 'CrosslistingReviewSheet/1.0 (metadata extraction)'
    }
  });
  const status = response.getResponseCode();
  if (status < 200 || status >= 400) throw new Error(`Source returned HTTP ${status}`);

  const html = response.getContentText();
  const jsonLdProducts = extractJsonLdProducts_(html);
  const jsonLd = chooseBestProduct_(jsonLdProducts);
  const og = extractOpenGraph_(html);

  const images = unique_(toArray_(jsonLd.image).concat(toArray_(og['og:image']))).filter(isHttpUrl_);
  return {
    title: cleanText_(firstNonEmpty_(jsonLd.name, og['og:title'], htmlTitle_(html))),
    description: cleanText_(firstNonEmpty_(jsonLd.description, og['og:description'], metaDescription_(html))),
    brand: cleanText_(normalizeValue_(jsonLd.brand)),
    sku: cleanText_(jsonLd.sku),
    mpn: cleanText_(jsonLd.mpn),
    gtin: cleanText_(firstNonEmpty_(jsonLd.gtin, jsonLd.gtin12, jsonLd.gtin13, jsonLd.gtin14, jsonLd.gtin8)),
    images: images,
    sourcePrice: normalizeValue_(jsonLd.offers && (jsonLd.offers.price || (Array.isArray(jsonLd.offers) && jsonLd.offers[0] && jsonLd.offers[0].price))),
    currency: normalizeValue_(jsonLd.offers && (jsonLd.offers.priceCurrency || (Array.isArray(jsonLd.offers) && jsonLd.offers[0] && jsonLd.offers[0].priceCurrency)))
  };
}

function validateSourceUrl_(url) {
  if (!isHttpUrl_(url)) throw new Error('Source URL must begin with http:// or https://');
  const hostMatch = url.match(/^https?:\/\/([^\/?#:]+)/i);
  const host = hostMatch ? hostMatch[1].toLowerCase() : '';
  const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
  if (!host || blocked.includes(host) || host.endsWith('.local')) {
    throw new Error('Local or non-public source URLs are not allowed.');
  }
}

function extractJsonLdProducts_(html) {
  const products = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    try {
      collectProducts_(JSON.parse(match[1].trim()), products);
    } catch (ignore) {
      // Some pages embed malformed schema. Continue with remaining data sources.
    }
  }
  return products;
}

function collectProducts_(node, products) {
  if (!node) return;
  if (Array.isArray(node)) {
    node.forEach(item => collectProducts_(item, products));
    return;
  }
  if (typeof node !== 'object') return;
  const type = node['@type'];
  const isProduct = Array.isArray(type) ? type.includes('Product') : type === 'Product';
  if (isProduct) products.push(node);
  if (node['@graph']) collectProducts_(node['@graph'], products);
}

function chooseBestProduct_(products) {
  if (!products.length) return {};
  return products.sort((a, b) => scoreProduct_(b) - scoreProduct_(a))[0];
}

function scoreProduct_(product) {
  return ['name', 'description', 'image', 'brand', 'sku', 'mpn', 'gtin', 'offers']
    .reduce((score, key) => score + (product[key] ? 1 : 0), 0);
}

function extractOpenGraph_(html) {
  const data = {};
  const pattern = /<meta\s+[^>]*(?:property|name)=["']([^"']+)["'][^>]*content=["']([^"']*)["'][^>]*>/gi;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const name = match[1].toLowerCase();
    if (name.indexOf('og:') === 0) {
      if (!data[name]) data[name] = [];
      data[name].push(decodeHtml_(match[2]));
    }
  }
  return data;
}

function htmlTitle_(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml_(match[1]) : '';
}

function metaDescription_(html) {
  const match = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  return match ? decodeHtml_(match[1]) : '';
}

function buildReferenceNote_(product, url) {
  const price = product.sourcePrice ? `Source metadata price: ${product.sourcePrice}${product.currency ? ' ' + product.currency : ''}; verify independently before setting a listing price.` : '';
  return [`Source reviewed: ${url}`, price, 'Extracted fields require accuracy, rights, category, condition, and policy review before approval.'].filter(Boolean).join('\n');
}

function getColumnMap_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((header, index) => map[String(header).trim()] = index + 1);
  const required = ['Source URL', 'Review Status', 'Extraction Status', 'Last Extracted', 'Review Notes'];
  required.forEach(name => { if (!map[name]) throw new Error(`Required column "${name}" is missing.`); });
  return map;
}

function writeIfPresent_(sheet, row, map, header, value) {
  if (!value || !map[header]) return;
  sheet.getRange(row, map[header]).setValue(value);
}

function setCell_(sheet, row, map, header, value) {
  if (map[header]) sheet.getRange(row, map[header]).setValue(value);
}

function appendNote_(sheet, row, map, note) {
  if (!note || !map['Review Notes']) return;
  const cell = sheet.getRange(row, map['Review Notes']);
  const existing = String(cell.getValue() || '').trim();
  cell.setValue(existing ? `${existing}\n\n${note}` : note);
}

function toArray_(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeValue_(value) {
  if (Array.isArray(value)) return normalizeValue_(value[0]);
  if (value && typeof value === 'object') return value.name || value.value || '';
  return value || '';
}

function firstNonEmpty_() {
  for (let i = 0; i < arguments.length; i++) {
    const value = normalizeValue_(arguments[i]);
    if (value) return value;
  }
  return '';
}

function cleanText_(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function unique_(values) {
  return values.filter((value, index, arr) => value && arr.indexOf(value) === index);
}

function isHttpUrl_(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function decodeHtml_(value) {
  return String(value || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function safeError_(error) {
  return String(error && error.message ? error.message : error).replace(/[\r\n]+/g, ' ').slice(0, 220);
}
