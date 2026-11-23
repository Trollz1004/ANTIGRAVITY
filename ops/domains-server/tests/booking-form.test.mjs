#!/usr/bin/env node
// Behavior of the OnlineRecycle booking form in domains/onlinerecycle.net/site/index.html.
// Run: node --test ops/domains-server/
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const PAGE = new URL("../../../domains/onlinerecycle.net/site/index.html", import.meta.url);

function makeEl(id) {
  const el = {
    id,
    style: {},
    disabled: false,
    textContent: "",
    value: "",
    src: "",
    href: "",
    className: "",
    innerHTML: "",
    children: [],
    _listeners: {},
    addEventListener(type, fn) {
      (this._listeners[type] ||= []).push(fn);
    },
    setAttribute() {},
    getAttribute() {
      return null;
    },
    classList: { toggle() {}, add() {}, remove() {} },
    appendChild(child) {
      this.children.push(child);
    },
    scrollIntoView() {},
  };
  return el;
}

const IDS = [
  "date-strip",
  "slot-strip",
  "bf-service-type",
  "bf-date",
  "bf-slot-code",
  "bf-slot-label",
  "tab-dropoff",
  "tab-pickup",
  "slot-heading-text",
  "pickup-address-field",
  "pickup-city-field",
  "selected-date-display",
  "selected-slot-display",
  "gcal-embed-container",
  "gcal-schedule-iframe",
  "date-page-toggle",
  "date-page-toggle-label",
  "booking-form",
  "booking-error",
  "booking-confirm-box",
  "confirm-title",
  "confirm-summary",
  "confirm-gcal-btn",
  "confirm-ics-btn",
  "confirm-sms-btn",
  "bf-submit-btn",
  "bf-submit-btn-label",
  "bf-name",
  "bf-phone",
  "bf-email",
  "bf-org",
  "bf-address",
  "bf-city",
  "bf-count",
  "bf-wipe",
  "bf-devices",
];

function loadBooking(fetchImpl) {
  const html = fs.readFileSync(PAGE, "utf8");
  const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const booking = blocks.find((b) => b.includes("function renderSlots"));
  assert.ok(booking, "booking script with renderSlots() must exist");

  const byId = {};
  for (const id of IDS) byId[id] = makeEl(id);
  const document = {
    hidden: true,
    getElementById: (id) => byId[id] || null,
    createElement: () => makeEl(""),
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const fetchCalls = [];
  const context = {
    document,
    window: {},
    console,
    fetch: async (url, opts) => {
      fetchCalls.push({ url, opts });
      return fetchImpl(url, opts);
    },
    requestAnimationFrame() {},
    setTimeout,
    clearTimeout,
  };
  context.window = context;
  context.globalThis = context;
  const exposed = booking.replace(
    "form.addEventListener('submit'",
    "globalThis.__booking = { renderSlots, selectedDate, bookedSlots, selectedSlotCode }; form.addEventListener('submit'"
  );
  vm.runInNewContext(exposed, context, { filename: "index.html" });
  return { api: context.__booking, byId, fetchCalls };
}

const DROPOFF_CODES = [
  "08:00-08:30",
  "09:00-09:30",
  "10:00-10:30",
  "11:00-11:30",
  "13:00-13:30",
  "14:00-14:30",
  "15:00-15:30",
  "16:00-16:30",
  "17:00-17:30",
];

test("renderSlots() says a full day is closed and blocks submit until a window is chosen", async () => {
  const { api, byId } = loadBooking(async () => ({
    ok: true,
    json: async () => ({ ok: true, bookedSlots: [] }),
  }));
  const date = api.selectedDate;
  assert.match(date, /^\d{4}-\d{2}-\d{2}$/);

  api.bookedSlots.splice(
    0,
    api.bookedSlots.length,
    ...DROPOFF_CODES.map((slotCode) => ({ date, slotCode, serviceType: "dropoff" }))
  );
  api.renderSlots();

  assert.equal(
    byId["selected-slot-display"].textContent,
    "No windows left on this day — choose another date"
  );
  assert.equal(byId["bf-submit-btn"].disabled, true);

  api.bookedSlots.splice(0, api.bookedSlots.length, ...api.bookedSlots.filter((b) => b.slotCode !== "09:00-09:30"));
  api.renderSlots();
  const open = byId["slot-strip"].children.find((b) => !b.disabled);
  assert.ok(open, "an available window button must exist");
  open._listeners.click[0]();

  assert.equal(byId["bf-submit-btn"].disabled, false);
  assert.notEqual(
    byId["selected-slot-display"].textContent,
    "No windows left on this day — choose another date"
  );
});

test("POST /api/book shows a plain-text server error with the phone number instead of a parse error", async () => {
  const { byId, fetchCalls } = loadBooking(async (url) => {
    if (String(url) === "/api/book") {
      return {
        ok: false,
        status: 502,
        text: async () => "upstream exploded",
        json: async () => {
          throw new SyntaxError("Unexpected token u in JSON at position 0");
        },
      };
    }
    return { ok: true, json: async () => ({ ok: true, bookedSlots: [] }) };
  });

  byId["bf-name"].value = "Pat Jones";
  byId["bf-phone"].value = "555-0100";
  byId["bf-devices"].value = "2 laptops";
  assert.equal(byId["bf-submit-btn"].disabled, false, "an open day must leave submit enabled");

  const submit = byId["booking-form"]._listeners.submit[0];
  submit({ preventDefault() {} });
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));

  assert.deepEqual(
    fetchCalls.map((c) => String(c.url)),
    ["/api/booking-config", "/api/book"]
  );
  const shown = byId["booking-error"].textContent;
  assert.equal(byId["booking-error"].style.display, "block");
  assert.match(shown, /server error/i);
  assert.match(shown, /\(321\) 396-2008/);
  assert.doesNotMatch(shown, /Network error|SyntaxError|Unexpected token/i);
});
