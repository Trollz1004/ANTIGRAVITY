#!/usr/bin/env node
/**
 * Screenshot health runner (ruled 2026-09-28). Opens every target in
 * config/screenshot-targets.json in headless Chromium, saves one PNG per
 * target, reads the visible text, and writes ops/heartbeat/screenshot-health.json
 * plus one line in ops/heartbeat/screenshot-health.log. JARVIS reads the JSON
 * at /api/screenshot-health. Hermes runs this from its gateway cron every 30
 * minutes on Sabretooth:
 *
 *   node C:\ANTIGRAVITY\mission-control\scripts\screenshot-health.mjs
 *
 * Options: --targets <json> --out <shots dir> --json <result> --log <log>
 *          --only id1,id2  --timeout <ms>
 *
 * Playwright is resolved from this package, then NODE_PATH. When it is not
 * installed the result file says NOT CONFIGURED and the exit code is 0: an
 * honest "not measured" beats a fake green or a crashed cron.
 */
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { loadTargets, verdictOf, summarize, DEFAULT_TARGETS_PATH } from '../lib/screenshot-health.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');

function arg(name, fallback) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const targetsPath = arg('targets', DEFAULT_TARGETS_PATH);
const jsonPath = arg('json', join(REPO, 'ops', 'heartbeat', 'screenshot-health.json'));
const logPath = arg('log', join(REPO, 'ops', 'heartbeat', 'screenshot-health.log'));
const day = new Date().toISOString().slice(0, 10);
const outDir = arg('out', join(REPO, 'evidence', 'health-shots', day));
const only = arg('only', '').split(',').map((s) => s.trim()).filter(Boolean);
const timeoutMs = Number(arg('timeout', '30000'));

function resolvePlaywright() {
  const req = createRequire(import.meta.url);
  const candidates = [null, ...(process.env.NODE_PATH ? process.env.NODE_PATH.split(/[;:]/) : [])];
  for (const base of candidates) {
    try {
      const spec = base ? join(base, 'playwright') : 'playwright';
      return req(spec);
    } catch { /* next */ }
  }
  return null;
}

function writeResult(result) {
  mkdirSync(dirname(jsonPath), { recursive: true });
  writeFileSync(jsonPath, JSON.stringify(result, null, 2) + '\n');
  const s = result.summary || summarize([]);
  const line = `${result.at} ${result.state || s.overall} up=${s.up}/${s.total} pending=${s.pending}` +
    (result.targets ? ' ' + result.targets.filter((t) => !t.up).map((t) => t.id + ':' + t.state).join(',') : '') +
    (result.detail ? ' ' + result.detail : '');
  appendFileSync(logPath, line + '\n');
  console.log(line);
}

async function main() {
  const at = new Date().toISOString();
  let targets = loadTargets(targetsPath);
  if (only.length) targets = targets.filter((t) => only.includes(t.id));
  const pw = resolvePlaywright();
  if (!pw || !pw.chromium) {
    writeResult({ at, state: 'NOT CONFIGURED', detail: 'playwright is not installed for node on this node (npm i -g playwright; set NODE_PATH to the global root)', targets: [], summary: summarize([]) });
    return;
  }
  mkdirSync(outDir, { recursive: true });
  // A target with `host` is a vhost on a local port (the domains server on
  // :9160 routes by Host header). Chromium refuses a Host header override, so
  // such a target gets its own browser whose resolver maps that hostname to
  // the target's IP, and the page is opened as http://<host>:<port>/ — the
  // same request the tunnel makes.
  const plain = await pw.chromium.launch({ headless: true });
  const results = [];
  const extra = [];
  try {
    for (const t of targets) {
      let browser = plain;
      let openUrl = t.url;
      if (t.host) {
        const u = new URL(t.url);
        browser = await pw.chromium.launch({ headless: true, args: ['--host-resolver-rules=MAP ' + t.host + ' ' + u.hostname] });
        extra.push(browser);
        openUrl = u.protocol + '//' + t.host + (u.port ? ':' + u.port : '') + u.pathname + u.search;
      }
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, ignoreHTTPSErrors: false });
      const page = await context.newPage();
      const shot = join(outDir, t.id + '.png');
      const observed = { status: null, finalUrl: null, title: null, text: null, error: null };
      const t0 = Date.now();
      try {
        const resp = await page.goto(openUrl, { waitUntil: 'load', timeout: timeoutMs });
        await page.waitForTimeout(1500);
        observed.status = resp ? resp.status() : null;
        observed.finalUrl = page.url();
        observed.title = await page.title();
        observed.text = await page.evaluate(() => (document.body && document.body.innerText) || '');
      } catch (e) {
        observed.error = String((e && e.message) || e).split('\n')[0];
      }
      let shotOk = false;
      try { await page.screenshot({ path: shot, fullPage: false }); shotOk = true; } catch { /* no frame */ }
      const v = verdictOf(t, observed);
      results.push({ id: t.id, label: t.label, url: t.url, group: t.group || null, optional: Boolean(t.optional), access: Boolean(t.access), ...v, status: observed.status, title: observed.title, textChars: observed.text ? observed.text.length : 0, latencyMs: Date.now() - t0, shot: shotOk ? shot : null });
      await context.close();
    }
  } finally {
    await plain.close();
    for (const b of extra) await b.close();
  }
  writeResult({ at, targets: results, summary: summarize(results), shotsDir: outDir, targetsPath });
}

main().catch((e) => { console.error('screenshot-health failed:', e); process.exit(1); });
