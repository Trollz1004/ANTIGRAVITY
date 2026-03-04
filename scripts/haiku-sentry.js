#!/usr/bin/env node
/**
 * HAIKU SENTRY — Opus House Guardian
 * Sends haiku-style status updates to Josh via Telegram.
 *
 * Usage:
 *   node haiku-sentry.js              # Full status report
 *   node haiku-sentry.js --boot       # Boot-up announcement
 *   node haiku-sentry.js --heartbeat  # Periodic heartbeat
 *   node haiku-sentry.js --custom "your message here"
 *
 * Runs from: C:\ANTIGRAVITY\scripts\
 * Scheduled via Task Scheduler or called by other scripts.
 */

const https = require('https');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// --- Config ---
const BOT_TOKEN = '8095270166:AAFwcCvY2_j07MbEPlkngzQ1GK2WEb-7otY';
const CHAT_ID = '6244456983';
const LOG_FILE = 'C:\\ANTIGRAVITY\\logs\\haiku-sentry.log';

// --- Haiku Templates ---
// 5-7-5 syllable structure, status-themed
const HAIKU_BOOT = [
  'Engines hum awake\nAntigravity stands tall\nOpus guards the house',
  'Dawn breaks, systems rise\nDocker breathes, Redis alive\nSentry watches all',
  'Power flows through wires\nContainers spin into life\nThe house stands ready',
];

const HAIKU_HEALTHY = [
  'All systems are green\nQuiet hum of steady work\nOpus house at peace',
  'Redis pings return\nQdrant holds our memories\nClaude stands ever sharp',
  'Containers all run\nTelegram lines stay open\nNo storms on radar',
];

const HAIKU_WARN = [
  'A shadow flickers\nOne service stumbles and coughs\nSentry sounds the bell',
  'Not all lights are green\nSomething stirs in the silence\nOpus takes a look',
  'Clouds gather softly\nA container lost its breath\nFixing what I can',
];

const HAIKU_HEARTBEAT = [
  'Hours pass in peace\nThe house hums its steady song\nAll is as it should',
  'Clock ticks, systems breathe\nNo alarms disturb the calm\nOpus keeps the watch',
  'Steady through the day\nEvery service holds its ground\nTeam Claude marches on',
];

function pickHaiku(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- System Checks (using execFileSync to avoid shell injection) ---
function checkDocker() {
  try {
    const output = execFileSync('docker', ['ps', '--format', '{{.Names}}|{{.Status}}'], { encoding: 'utf8', timeout: 10000 });
    const containers = output.trim().split('\n').filter(Boolean).map(line => {
      const [name, ...statusParts] = line.split('|');
      const status = statusParts.join('|');
      return { name, status, healthy: status.startsWith('Up') };
    });
    return containers;
  } catch {
    return [];
  }
}

function checkDisk() {
  try {
    const output = execFileSync('wmic', ['logicaldisk', 'get', 'caption,freespace,size', '/format:csv'], { encoding: 'utf8', timeout: 10000 });
    const lines = output.trim().split('\n').filter(l => l.includes(',') && !l.startsWith('Node'));
    return lines.map(line => {
      const parts = line.trim().split(',');
      const drive = parts[1];
      const free = parseInt(parts[2]) || 0;
      const total = parseInt(parts[3]) || 0;
      const usedPct = total > 0 ? Math.round((1 - free / total) * 100) : 0;
      return { drive, freeGB: Math.round(free / 1073741824), totalGB: Math.round(total / 1073741824), usedPct };
    }).filter(d => d.totalGB > 0);
  } catch {
    return [];
  }
}

function checkOpenClawHealth() {
  return new Promise((resolve) => {
    const req = require('http').get('http://localhost:3200/health', { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.status === 'healthy');
        } catch {
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

function checkOpenClawGateway() {
  return new Promise((resolve) => {
    const req = require('http').get('http://127.0.0.1:18789/', { timeout: 5000 }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

// --- Report Builder ---
async function buildReport(mode) {
  const containers = checkDocker();
  const disks = checkDisk();
  const openclawHealthy = await checkOpenClawHealth();
  const gatewayUp = await checkOpenClawGateway();

  const allUp = containers.length > 0 && containers.every(c => c.healthy);

  // Pick haiku based on mode and health
  let haiku;
  if (mode === 'boot') {
    haiku = pickHaiku(HAIKU_BOOT);
  } else if (mode === 'heartbeat') {
    haiku = allUp ? pickHaiku(HAIKU_HEARTBEAT) : pickHaiku(HAIKU_WARN);
  } else {
    haiku = allUp ? pickHaiku(HAIKU_HEALTHY) : pickHaiku(HAIKU_WARN);
  }

  // Status icons
  const icon = (ok) => ok ? '.' : 'X';

  // Build message
  const lines = [];
  lines.push('--- HAIKU SENTRY ---');
  lines.push('');
  lines.push(haiku);
  lines.push('');
  lines.push('--- STATUS ---');

  // Docker
  if (containers.length === 0) {
    lines.push('Docker: no containers found');
  } else {
    containers.forEach(c => {
      lines.push(`  [${icon(c.healthy)}] ${c.name}: ${c.status}`);
    });
  }

  // OpenClaw API
  lines.push(`  [${icon(openclawHealthy)}] OpenClaw API: ${openclawHealthy ? 'healthy' : 'DOWN'}`);
  lines.push(`  [${icon(gatewayUp)}] Gateway: ${gatewayUp ? 'running' : 'DOWN'}`);

  // Disks
  lines.push('');
  lines.push('Drives:');
  disks.forEach(d => {
    const warn = d.usedPct > 90 ? ' !! LOW SPACE' : '';
    lines.push(`  ${d.drive} ${d.usedPct}% used (${d.freeGB}GB free)${warn}`);
  });

  // Timestamp
  lines.push('');
  lines.push(`T5500 | ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}`);

  return lines.join('\n');
}

// --- Telegram Send ---
function sendTelegram(text) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      chat_id: CHAT_ID,
      text: text
    });

    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.ok) {
            resolve(result);
          } else {
            reject(new Error(`Telegram API error: ${result.description}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// --- Logging ---
function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}\n`;
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, line);
  } catch { /* ignore */ }
  console.log(line.trim());
}

// --- Main ---
async function main() {
  const args = process.argv.slice(2);
  let mode = 'status';
  let customMsg = null;

  if (args.includes('--boot')) mode = 'boot';
  else if (args.includes('--heartbeat')) mode = 'heartbeat';
  else if (args.includes('--custom')) {
    mode = 'custom';
    customMsg = args[args.indexOf('--custom') + 1];
  }

  try {
    let message;
    if (mode === 'custom' && customMsg) {
      message = `--- HAIKU SENTRY ---\n\n${customMsg}\n\nT5500 | ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}`;
    } else {
      message = await buildReport(mode);
    }

    log(`Sending ${mode} report...`);
    await sendTelegram(message);
    log(`${mode} report sent successfully.`);
  } catch (err) {
    log(`ERROR: ${err.message}`);
    process.exit(1);
  }
}

main();
