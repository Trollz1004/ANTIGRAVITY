#!/usr/bin/env node
// Behavior checks for the OnlineRecycle home page booking script.
// Runs the real inline script from domains/onlinerecycle.net/site/index.html
// against a small fake window built from node builtins only.
// Run: node --test ops/domains-server/
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.join(__dirname, "..", "..", "..", "domains", "onlinerecycle.net", "site", "index.html");
const html = fs.readFileSync(PAGE, "utf8");

const BOOKING_SCRIPT = html.slice(
  html.indexOf("<!-- Booking Calendar & Direct Slot Logic -->"),
  html.lastIndexOf("</script>")
);
const SCRIPT_BODY = BOOKING_SCRIPT.slice(BOOKING_SCRIPT.indexOf("(function () {"));

function el(id) {
  const node = {
    id,
    style: {},
    value: "",
    textContent: "",
    innerHTML: "",
    className: "",
    children: [],
    listeners: {},
    appendChild(child) {
      this.children.push(child);
      if (!child.addEventListener) this.textContent += child.textContent;
    },
    querySelectorAll() {
      return this.children;
    },
    addEventListener(type, fn) {
      (this.listeners[type] ||= []).push(fn);
    },
    click() {
      (this.listeners.click || []).forEach((fn) => fn({ preventDefault() {} }));
    },
    setAttribute() {},
    getAttribute() {
      return null;
    },
    classList: { toggle() {} },
    closest() {
      return null;
    },
  };
  return node;
}

const NEEDED_IDS = [
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

function runPage({ fetchImpl, hash = "" }) {
  const byId = {};
  for (const id of NEEDED_IDS) byId[id] = el(id);
  byId["gcal-schedule-iframe"].src = "";
  const anchors = [];
  const document = {
    hidden: false,
    getElementById: (id) => byId[id] || null,
    querySelectorAll: (sel) => (sel === "[data-select-service]" ? [] : []),
    createElement: () => el(""),
    createTextNode: (text) => ({ textContent: text }),
    clickHandlers: [],
    addEventListener(type, fn) {
      if (type === "click") this.clickHandlers.push(fn);
    },
    body: {
      appendChild(node) {
        anchors.push(node);
      },
    },
  };
  const listeners = {};
  const location = { hash, href: "https://onlinerecycle.net/" + hash };
  const window = {
    document,
    location,
    fetch: fetchImpl,
    addEventListener(type, fn) {
      (listeners[type] ||= []).push(fn);
    },
    requestAnimationFrame() {},
    matchMedia: () => ({ matches: true }),
  };
  window.window = window;
  vm.runInNewContext(SCRIPT_BODY, window, { filename: "onlinerecycle-booking.js" });
  return { byId, window, listeners, anchors, location };
}

test("a booking-config response that is not ok warns in #booking-error and offers a retry button", async () => {
  let calls = 0;
  const { byId } = runPage({
    fetchImpl: async (url) => {
      assert.equal(url, "/api/booking-config");
      calls += 1;
      return { ok: false, status: 503, json: async () => ({}) };
    },
  });
  await new Promise((r) => setTimeout(r, 50));
  const errBox = byId["booking-error"];
  assert.notEqual(errBox.style.display, "none", "warning is shown, not left hidden");
  assert.ok(errBox.textContent.trim().length > 0, "warning has words");
  const retry = errBox.children.find((c) => /retry loading slots/i.test(c.textContent));
  assert.ok(retry, "a Retry loading slots button sits inside the warning");
  retry.click();
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(calls, 2, "clicking retry fetches /api/booking-config again");
});

test("a service= link switches booking mode even when #book is already the window hash", () => {
  const page = runPage({
    fetchImpl: async () => ({ ok: true, json: async () => ({ ok: true, bookedSlots: [] }) }),
    hash: "#book",
  });
  assert.equal(page.byId["bf-service-type"].value, "dropoff", "page starts on drop-off");

  function clickServiceLink(href) {
    const link = el("");
    link.getAttribute = (name) => (name === "href" ? href : null);
    link.closest = (sel) => (sel === "a" ? link : null);
    page.window.document.clickHandlers.forEach((fn) => fn({ target: link, preventDefault() {} }));
  }
  clickServiceLink("#book?service=pickup");
  assert.equal(
    page.byId["bf-service-type"].value,
    "pickup",
    "service=pickup calls setServiceType('pickup') while #book is already the hash"
  );
  clickServiceLink("#book?service=dropoff");
  assert.equal(
    page.byId["bf-service-type"].value,
    "dropoff",
    "service=dropoff calls setServiceType('dropoff') while #book is already the hash"
  );
});
