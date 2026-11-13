#!/usr/bin/env node
// Unit tests for booking-notify.mjs and booking-stats.mjs (no network).
// Run: node ops/domains-server/tests/booking-notify.test.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { notifyBooking, formatBookingMessage, NOT_CONFIGURED_LINE } from "../booking-notify.mjs";
import { recordPageView, recordBooking, dayKey } from "../booking-stats.mjs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "orc-notify-"));
const booking = {
  bookingId: "OR-20261120-AAAA",
  fullName: "Pat Jones",
  phone: "555-0100",
  city: "Mount Dora",
  zip: "32757",
  deviceCount: "6-20",
  notes: "Certified wipe please",
  date: "2026-11-20",
  slotLabel: "9am-12pm",
  deviceList: "x".repeat(300),
};
let n = 0;
async function t(name, fn) {
  await fn();
  n += 1;
  console.log(`ok - ${name}`);
}

await t("message format and 160 char cap", () => {
  const m = formatBookingMessage(booking);
  assert.ok(m.startsWith("New pickup request\nName: Pat Jones\nPhone: 555-0100"));
  assert.ok(m.includes("Mount Dora 32757") && m.includes("6-20") && m.includes("Certified wipe"));
  assert.ok(m.includes("2026-11-20 9am-12pm"));
  assert.ok(m.endsWith(`Items: ${"x".repeat(160)}`));
});

await t("configured sends to Telegram", async () => {
  const calls = [];
  const fetchImpl = async (url, opts) => (calls.push({ url, opts }), { ok: true, status: 200 });
  const ok = await notifyBooking(booking, { env: { ORC_NOTIFY_TELEGRAM_TOKEN: "T0K", ORC_NOTIFY_TELEGRAM_CHAT: "42" }, fetchImpl, logDir: tmp });
  assert.equal(ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.telegram.org/botT0K/sendMessage");
  const sent = JSON.parse(calls[0].opts.body);
  assert.equal(sent.chat_id, "42");
  assert.ok(sent.text.startsWith("New pickup request"));
});

await t("not configured does nothing but log one line", async () => {
  const logs = [];
  let called = false;
  const ok = await notifyBooking(booking, { env: {}, fetchImpl: async () => (called = true), logDir: tmp, log: (l) => logs.push(l) });
  assert.equal(ok, false);
  assert.equal(called, false);
  assert.deepEqual(logs, [NOT_CONFIGURED_LINE]);
});

await t("failing send does not throw, logs without token", async () => {
  const env = { ORC_NOTIFY_TELEGRAM_TOKEN: "SECRETTOKEN", ORC_NOTIFY_TELEGRAM_CHAT: "42" };
  const ok = await notifyBooking(booking, { env, fetchImpl: async () => { throw new Error("boom botSECRETTOKEN"); }, logDir: tmp });
  assert.equal(ok, false);
  const ok2 = await notifyBooking(booking, { env, fetchImpl: async () => ({ ok: false, status: 500 }), logDir: tmp });
  assert.equal(ok2, false);
  const log = fs.readFileSync(path.join(tmp, "notify-errors.log"), "utf8");
  assert.ok(log.includes("boom") && log.includes("HTTP 500"));
  assert.ok(!log.includes("SECRETTOKEN"));
});

await t("counter keeps two numbers per day, nothing else", () => {
  const dir = path.join(tmp, "stats");
  const now = new Date("2026-11-13T15:00:00Z");
  recordPageView(dir, now);
  recordPageView(dir, now);
  recordBooking(dir, now);
  const file = path.join(dir, `${dayKey(now)}.json`);
  assert.equal(path.basename(file), "2026-11-13.json");
  assert.deepEqual(JSON.parse(fs.readFileSync(file, "utf8")), { page_views: 2, bookings: 1 });
  recordBooking(dir, new Date("2026-11-14T15:00:00Z"));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, "2026-11-14.json"), "utf8")), { page_views: 0, bookings: 1 });
});

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`${n} passed`);
