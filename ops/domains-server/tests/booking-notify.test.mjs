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
  serviceType: "pickup",
  fullName: "Pat Jones",
  phone: "555-0100",
  address: "123 Main St",
  city: "Mount Dora",
  zip: "32757",
  deviceCount: "6-20",
  notes: "Certified wipe please",
  date: "2026-11-20",
  slotLabel: "9am-12pm",
  deviceList: "x".repeat(300),
};
const dropoffBooking = {
  bookingId: "OR-20261121-BBBB",
  serviceType: "dropoff",
  fullName: "Sam Lee",
  phone: "555-0199",
  city: "Sorrento",
  zip: "32776",
  deviceCount: "1-5",
  notes: "Standard intake",
  date: "2026-11-21",
  slotLabel: "9:00 AM - 9:30 AM",
  deviceList: "2 laptops",
};
let n = 0;
async function t(name, fn) {
  await fn();
  n += 1;
  console.log(`ok - ${name}`);
}

await t("message format carries booking id, service type, street address, name, phone, time, and 160 char cap", () => {
  const m = formatBookingMessage(booking);
  assert.ok(m.startsWith("New pickup request\n"), `unexpected header: ${m}`);
  assert.ok(m.includes("Booking ID: OR-20261120-AAAA"), "missing bookingId");
  assert.ok(m.includes("Service: pickup"), "missing pickup service type");
  assert.ok(m.includes("Address: 123 Main St"), "missing street address");
  assert.ok(m.includes("Name: Pat Jones") && m.includes("Phone: 555-0100"));
  assert.ok(m.includes("Mount Dora 32757") && m.includes("6-20") && m.includes("Certified wipe"));
  assert.ok(m.includes("2026-11-20 9am-12pm"), "missing time window");
  assert.ok(m.endsWith(`Items: ${"x".repeat(160)}`));

  const dm = formatBookingMessage(dropoffBooking);
  assert.ok(dm.startsWith("New drop-off request\n"), `unexpected drop-off header: ${dm}`);
  assert.ok(dm.includes("Booking ID: OR-20261121-BBBB"), "missing drop-off bookingId");
  assert.ok(dm.includes("Service: drop-off"), "missing drop-off service type");
  assert.ok(!dm.includes("New pickup request"), "drop-off must not say pickup");
  assert.ok(dm.includes("Name: Sam Lee") && dm.includes("Phone: 555-0199"));
  assert.ok(dm.includes("2026-11-21 9:00 AM - 9:30 AM"));
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

await t("failed owner notice is retried three times with a timeout, logs without token", async () => {
  const env = { ORC_NOTIFY_TELEGRAM_TOKEN: "SECRETTOKEN", ORC_NOTIFY_TELEGRAM_CHAT: "42" };
  let errCalls = 0;
  const ok = await notifyBooking(booking, {
    env,
    fetchImpl: async () => {
      errCalls += 1;
      throw new Error("boom botSECRETTOKEN");
    },
    logDir: tmp,
    retryDelayMs: 5,
    timeoutMs: 50,
  });
  assert.equal(ok, false);
  assert.equal(errCalls, 4, "initial attempt + 3 retries = 4 calls");

  let httpCalls = 0;
  const ok2 = await notifyBooking(booking, {
    env,
    fetchImpl: async () => {
      httpCalls += 1;
      return { ok: false, status: 500 };
    },
    logDir: tmp,
    retryDelayMs: 5,
    timeoutMs: 50,
  });
  assert.equal(ok2, false);
  assert.equal(httpCalls, 4, "HTTP 500 retried three times");

  let recoverCalls = 0;
  const ok3 = await notifyBooking(booking, {
    env,
    fetchImpl: async () => {
      recoverCalls += 1;
      if (recoverCalls < 3) return { ok: false, status: 502 };
      return { ok: true, status: 200 };
    },
    logDir: tmp,
    retryDelayMs: 5,
    timeoutMs: 50,
  });
  assert.equal(ok3, true, "succeeds when retry succeeds");
  assert.equal(recoverCalls, 3);

  let hangCalls = 0;
  const ok4 = await notifyBooking(booking, {
    env,
    fetchImpl: async () => {
      hangCalls += 1;
      return new Promise(() => {});
    },
    logDir: tmp,
    retryDelayMs: 5,
    timeoutMs: 25,
  });
  assert.equal(ok4, false, "hanging request times out and returns false");
  assert.equal(hangCalls, 4, "timed-out request is retried three times");

  const log = fs.readFileSync(path.join(tmp, "notify-errors.log"), "utf8");
  assert.ok(log.includes("boom") && log.includes("HTTP 500") && log.includes("timeout"));
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
