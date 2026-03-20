#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const BOOKINGS_DIR = path.join(ROOT, "data", "ewaste-intake", "bookings");
const BOOKINGS_CSV = path.join(BOOKINGS_DIR, "square-bookings-intake-log.csv");
const STATE_DIR = path.join(ROOT, "CodeX", "state");
const ALERTS_DIR = path.join(STATE_DIR, "alerts");
const ALERT_LOG = path.join(STATE_DIR, "square-booking-alerts.log");
const RUNTIME_STATE = path.join(STATE_DIR, "square-booking-monitor-state.json");

function nowIso() {
  return new Date().toISOString();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
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

    if (ch === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((x) => String(x || "").trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += ch;
  }

  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((x) => String(x || "").trim() !== "")) rows.push(row);
  }

  if (!rows.length) return [];
  const headers = rows[0].map((h) => String(h || "").trim());
  return rows.slice(1).map((r) => {
    const out = {};
    for (let i = 0; i < headers.length; i += 1) out[headers[i]] = String(r[i] || "").trim();
    return out;
  });
}

function readCsvRows() {
  if (!fs.existsSync(BOOKINGS_CSV)) return [];
  const text = fs.readFileSync(BOOKINGS_CSV, "utf8");
  return parseCsv(text);
}

function loadState() {
  try {
    if (!fs.existsSync(RUNTIME_STATE)) return { seen_event_ids: [] };
    return JSON.parse(fs.readFileSync(RUNTIME_STATE, "utf8"));
  } catch {
    return { seen_event_ids: [] };
  }
}

function saveState(payload) {
  fs.mkdirSync(path.dirname(RUNTIME_STATE), { recursive: true });
  fs.writeFileSync(RUNTIME_STATE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function appendAlertLog(line) {
  fs.mkdirSync(path.dirname(ALERT_LOG), { recursive: true });
  fs.appendFileSync(ALERT_LOG, `${line}\n`, "utf8");
}

function writeAlertFile(event) {
  fs.mkdirSync(ALERTS_DIR, { recursive: true });
  const safeEventId = String(event.event_id || "unknown").replace(/[^a-zA-Z0-9_-]/g, "_");
  const ts = nowIso().replace(/[:.]/g, "-");
  const filePath = path.join(ALERTS_DIR, `square-booking-${safeEventId}-${ts}.md`);
  const body = [
    "# HOST ALERT: New Square Booking",
    "",
    `- detected_at_utc: ${nowIso()}`,
    `- event_id: ${event.event_id || ""}`,
    `- booking_id: ${event.booking_id || ""}`,
    `- booking_status: ${event.booking_status || ""}`,
    `- start_at: ${event.start_at || ""}`,
    `- customer_phone: ${event.customer_phone || ""}`,
    `- customer_email: ${event.customer_email || ""}`,
    "",
    "Action: Prepare intake handling immediately.",
    "",
  ].join("\n");
  fs.writeFileSync(filePath, body, "utf8");
  return filePath;
}

function runLiveOkAudit() {
  const scriptPath = path.join(ROOT, "scripts", "ewaste-intake-live-ok-audit.js");
  if (!fs.existsSync(scriptPath)) return { ok: false, message: "missing audit script" };
  const result = spawnSync("node", [scriptPath], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });
  const ok = result.status === 0;
  const msg = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  return { ok, message: msg || `exit=${result.status}` };
}

function getNewEvents(rows, seenSet) {
  const discovered = [];
  for (const row of rows) {
    const eventId = String(row.event_id || "").trim();
    if (!eventId || seenSet.has(eventId)) continue;
    discovered.push(row);
  }
  return discovered;
}

function checkOnce(state) {
  const rows = readCsvRows();
  const seenSet = new Set(Array.isArray(state.seen_event_ids) ? state.seen_event_ids : []);
  const newEvents = getNewEvents(rows, seenSet);

  if (!newEvents.length) {
    console.log(`NO_NEW_BOOKINGS rows=${rows.length} csv_exists=${fs.existsSync(BOOKINGS_CSV) ? "yes" : "no"} time=${nowIso()}`);
    return { state, found: 0 };
  }

  for (const event of newEvents) {
    const eventId = String(event.event_id || "");
    const line = `NEW_BOOKING event_id=${eventId} booking_id=${event.booking_id || ""} status=${event.booking_status || ""} start_at=${event.start_at || ""}`;
    console.log(line);
    appendAlertLog(`[${nowIso()}] ${line}`);
    const alertPath = writeAlertFile(event);
    console.log(`HOST_ALERT_FILE=${alertPath}`);
    seenSet.add(eventId);
  }

  const audit = runLiveOkAudit();
  console.log(`LIVE_OK_AUDIT=${audit.ok ? "OK" : "FAILED"} ${audit.message}`);

  const nextState = {
    updated_at: nowIso(),
    last_total_rows: rows.length,
    seen_event_ids: Array.from(seenSet),
  };
  saveState(nextState);
  return { state: nextState, found: newEvents.length };
}

function parseArgs(argv) {
  const opts = {
    watch: false,
    once: false,
    intervalSeconds: 10,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--watch") {
      opts.watch = true;
      continue;
    }
    if (arg === "--once") {
      opts.once = true;
      continue;
    }
    if (arg === "--interval-seconds" && next) {
      opts.intervalSeconds = Number(next);
      i += 1;
      continue;
    }
  }
  if (!Number.isFinite(opts.intervalSeconds) || opts.intervalSeconds < 2) opts.intervalSeconds = 10;
  if (!opts.watch && !opts.once) opts.once = true;
  return opts;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  fs.mkdirSync(STATE_DIR, { recursive: true });
  let state = loadState();

  if (!Array.isArray(state.seen_event_ids) || state.seen_event_ids.length === 0) {
    const rows = readCsvRows();
    state = {
      updated_at: nowIso(),
      last_total_rows: rows.length,
      seen_event_ids: rows.map((r) => String(r.event_id || "").trim()).filter(Boolean),
    };
    saveState(state);
  }

  if (options.once) {
    checkOnce(state);
    return;
  }

  if (options.watch) {
    console.log(`SQUARE_BOOKING_WATCHDOG_STARTED interval_seconds=${options.intervalSeconds}`);
    for (;;) {
      const result = checkOnce(state);
      state = result.state;
      await new Promise((resolve) => setTimeout(resolve, options.intervalSeconds * 1000));
    }
  }
}

main().catch((err) => {
  console.error(`square-booking-watchdog failed: ${err.message}`);
  process.exit(1);
});

