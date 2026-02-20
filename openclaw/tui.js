#!/usr/bin/env node
/**
 * OPENCLAW TUI
 * Terminal UI for interacting with OpenClaw marketing agent
 * Run: node tui.js
 */

require('dotenv').config();
const blessed = require('blessed');
const http = require('http');

const OPENCLAW_URL = process.env.OPENCLAW_URL || 'http://localhost:3200';
const SESSION_ID = `tui-${process.env.USERNAME || 'opus'}-${Date.now()}`;

// ─── HTTP helper ──────────────────────────────────────────────────────────────
function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(path, OPENCLAW_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3200,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch { resolve({ response: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, OPENCLAW_URL);
    http.get({ hostname: url.hostname, port: url.port || 3200, path: url.pathname }, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve({}); } });
    }).on('error', reject);
  });
}

// ─── Screen setup ─────────────────────────────────────────────────────────────
const screen = blessed.screen({ smartCSR: true, title: 'OpenClaw — OPUS' });

// Header
const header = blessed.box({
  top: 0, left: 0, width: '100%', height: 3,
  content: ' {bold}OPENCLAW{/bold} | Marketing Agent for youandinotai.com | {cyan-fg}Ctrl+C{/cyan-fg} quit | {cyan-fg}Ctrl+L{/cyan-fg} clear',
  tags: true,
  style: { fg: 'white', bg: 'blue' }
});

// Status bar
const statusBar = blessed.box({
  top: 3, left: 0, width: '100%', height: 1,
  content: ' Connecting...',
  tags: true,
  style: { fg: 'black', bg: 'cyan' }
});

// Chat log
const chatLog = blessed.log({
  top: 4, left: 0, width: '100%', height: screen.height - 9,
  tags: true, scrollable: true, alwaysScroll: true,
  scrollbar: { ch: '│', style: { fg: 'cyan' } },
  border: { type: 'line', fg: 'blue' },
  label: ' Conversation ',
  style: { fg: 'white', bg: 'black', border: { fg: 'blue' } },
  mouse: true
});

// Input label
const inputLabel = blessed.box({
  bottom: 3, left: 0, width: 10, height: 3,
  content: ' {bold}You:{/bold}',
  tags: true,
  style: { fg: 'cyan', bg: 'black' }
});

// Input box
const inputBox = blessed.textbox({
  bottom: 3, left: 10, width: screen.width - 10, height: 3,
  inputOnFocus: true,
  border: { type: 'line', fg: 'cyan' },
  style: { fg: 'white', bg: 'black', border: { fg: 'cyan' }, focus: { border: { fg: 'yellow' } } }
});

// Footer
const footer = blessed.box({
  bottom: 0, left: 0, width: '100%', height: 3,
  content: ' {bold}Session:{/bold} ' + SESSION_ID + ' | Model: claude-opus-4-6 | Memory: Qdrant + Redis',
  tags: true,
  style: { fg: 'gray', bg: '#111' }
});

screen.append(header);
screen.append(statusBar);
screen.append(chatLog);
screen.append(inputLabel);
screen.append(inputBox);
screen.append(footer);

// ─── Status polling ────────────────────────────────────────────────────────────
async function updateStatus() {
  try {
    const health = await get('/health');
    const s = health.services || {};
    const r = s.redis ? '{green-fg}Redis ✓{/green-fg}' : '{red-fg}Redis ✗{/red-fg}';
    const q = s.qdrant ? '{green-fg}Qdrant ✓{/green-fg}' : '{red-fg}Qdrant ✗{/red-fg}';
    const c = s.claude ? '{green-fg}Claude ✓{/green-fg}' : '{red-fg}Claude ✗{/red-fg}';
    statusBar.setContent(` ${r}   ${q}   ${c}   {gray-fg}${new Date().toLocaleTimeString()}{/gray-fg}`);
  } catch {
    statusBar.setContent(` {red-fg}OpenClaw offline — is Docker running? docker compose up -d{/red-fg}`);
  }
  screen.render();
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
let busy = false;

function addMessage(who, text, color) {
  const ts = new Date().toLocaleTimeString();
  chatLog.log(`{gray-fg}[${ts}]{/gray-fg} {${color}-fg}{bold}${who}{/bold}{/${color}-fg}: ${text}`);
  screen.render();
}

async function sendMessage(text) {
  if (busy || !text.trim()) return;
  busy = true;
  addMessage('You', text, 'yellow');
  statusBar.setContent(' {yellow-fg}OpenClaw thinking...{/yellow-fg}');
  screen.render();
  try {
    const res = await post('/chat', { sessionId: SESSION_ID, message: text });
    addMessage('OpenClaw', res.response || res.error || 'No response', 'cyan');
  } catch (err) {
    addMessage('ERROR', err.message, 'red');
  }
  busy = false;
  await updateStatus();
  inputBox.focus();
}

// ─── Key bindings ─────────────────────────────────────────────────────────────
screen.key(['C-c', 'q'], () => process.exit(0));

screen.key('C-l', () => {
  chatLog.setContent('');
  screen.render();
});

inputBox.key('enter', async () => {
  const text = inputBox.getValue().trim();
  inputBox.clearValue();
  screen.render();
  if (text) await sendMessage(text);
  else inputBox.focus();
});

// ─── Init ─────────────────────────────────────────────────────────────────────
screen.render();
inputBox.focus();
chatLog.log('{blue-fg}━━━ OpenClaw TUI ━━━{/blue-fg}');
chatLog.log('{gray-fg}Connected to: ' + OPENCLAW_URL + '{/gray-fg}');
chatLog.log('{gray-fg}Type a message and press Enter. Ctrl+C to quit. Ctrl+L to clear.{/gray-fg}');
chatLog.log('');

updateStatus();
setInterval(updateStatus, 10000);

screen.render();
