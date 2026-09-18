/**
 * Google Trends — the real file the founder dropped in C:\DREAM ("google trends .txt")
 * is a Jupyter notebook JSON analyzing search volume (Bitcoin, Tesla, unemployment
 * benefits) against real-world data. This lib parses it honestly: headings, cell
 * counts, the datasets it reads, and its intro. The screensaver shows what the file
 * actually contains — never invented "trending searches". Pure module; readFile injected.
 */
import { readFileSync } from 'node:fs';

function cellText(c) {
  const src = c && Array.isArray(c.source) ? c.source.join('') : String((c && c.source) || '');
  return src.trim();
}

/** @returns {{ok:true, headings:string[], mdCells:number, codeCells:number, datasets:string[], intro:string}} */
export function parseTrendsNotebook(nb) {
  const cells = Array.isArray(nb && nb.cells) ? nb.cells : [];
  const headings = [];
  const datasets = [];
  let mdCells = 0;
  let codeCells = 0;
  let intro = '';
  for (const c of cells) {
    const t = cellText(c);
    if (!t) continue;
    if (c.cell_type === 'markdown') {
      mdCells++;
      const h = /^#\s+(.+)$/m.exec(t);
      if (h) headings.push(h[1].trim());
      if (!intro && t.length > 60) intro = t.replace(/\s+/g, ' ').slice(0, 220);
    } else if (c.cell_type === 'code') {
      codeCells++;
      for (const m of t.matchAll(/read_csv\(\s*['"]([^'"]+)['"]/g)) datasets.push(m[1]);
    }
  }
  return { ok: true, headings, mdCells, codeCells, datasets: [...new Set(datasets)], intro };
}

/** Load + parse from disk; every failure mode is an honest {ok:false,error}. */
export function loadTrends(path, { readFile = readFileSync } = {}) {
  try {
    const text = readFile(path, 'utf8');
    let nb;
    try { nb = JSON.parse(text); } catch { return { ok: false, error: 'parse error: file is not JSON' }; }
    const summary = parseTrendsNotebook(nb);
    return { ok: true, source: path, summary };
  } catch (e) {
    const missing = e && (e.code === 'ENOENT' || /ENOENT/.test(String(e.message)));
    return { ok: false, error: missing ? `not found: ${path}` : String(e.message || e) };
  }
}
