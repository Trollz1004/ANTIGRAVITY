import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..", "..", "..");
const SERVER_PATH = path.resolve(HERE, "..", "server.mjs");
const INDEX_HTML_PATH = path.join(REPO_ROOT, "domains", "onlinerecycle.net", "site", "index.html");
const LOOPBACK = ["127", "0", "0", "1"].join(".");

function extractBookingScript(html) {
  const marker = "<!-- Booking Calendar & Direct Slot Logic -->";
  const idx = html.indexOf(marker);
  assert.ok(idx !== -1, "booking script marker must exist in index.html");
  const tail = html.slice(idx);
  const match = tail.match(/<script>([\s\S]*?)<\/script>/i);
  assert.ok(match && match[1], "booking inline script must exist");
  return match[1];
}

function createFakeStorage(backing = new Map()) {
  return {
    _map: backing,
    getItem(key) {
      return backing.has(String(key)) ? backing.get(String(key)) : null;
    },
    setItem(key, val) {
      backing.set(String(key), String(val));
    },
    removeItem(key) {
      backing.delete(String(key));
    },
    clear() {
      backing.clear();
    },
    key(i) {
      return Array.from(backing.keys())[i] ?? null;
    },
    get length() {
      return backing.size;
    },
  };
}

function createFakeElement(id = "", tagName = "div") {
  const listeners = new Map();
  const attrs = new Map();
  const classes = new Set();
  const el = {
    id,
    tagName: tagName.toUpperCase(),
    type: "",
    name: "",
    value: "",
    textContent: "",
    disabled: false,
    required: false,
    src: "",
    href: "",
    style: { display: "" },
    children: [],
    classList: {
      add(c) {
        classes.add(c);
      },
      remove(c) {
        classes.delete(c);
      },
      toggle(c, force) {
        const shouldAdd = force === undefined ? !classes.has(c) : Boolean(force);
        if (shouldAdd) classes.add(c);
        else classes.delete(c);
      },
      contains(c) {
        return classes.has(c);
      },
    },
    setAttribute(k, v) {
      attrs.set(k, String(v));
    },
    getAttribute(k) {
      return attrs.has(k) ? attrs.get(k) : null;
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    dispatchEvent(type, ev = {}) {
      const fns = listeners.get(type) || [];
      for (const fn of fns) {
        fn({
          preventDefault() {},
          target: el,
          ...ev,
        });
      }
    },
    click() {
      if (this.disabled) return;
      this.dispatchEvent("click");
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    scrollIntoView() {},
  };
  let rawClassName = "";
  Object.defineProperty(el, "className", {
    get() {
      return rawClassName;
    },
    set(v) {
      rawClassName = String(v || "");
      classes.clear();
      for (const part of rawClassName.split(/\s+/).filter(Boolean)) {
        classes.add(part);
      }
    },
  });
  let rawInnerHtml = "";
  Object.defineProperty(el, "innerHTML", {
    get() {
      return rawInnerHtml;
    },
    set(v) {
      rawInnerHtml = String(v || "");
      if (rawInnerHtml === "") {
        this.children = [];
      }
    },
  });
  return el;
}

function mountBookingDom({ sessionStorage = createFakeStorage(), onFetch } = {}) {
  const html = fs.readFileSync(INDEX_HTML_PATH, "utf8");
  const scriptSource = extractBookingScript(html);

  const elements = new Map();
  const getEl = (id) => {
    if (!elements.has(id)) {
      elements.set(id, createFakeElement(id));
    }
    return elements.get(id);
  };

  getEl("bf-service-type").value = "dropoff";
  getEl("bf-count").value = "1-5 items";
  getEl("bf-wipe").value = "Standard intake & storage wipe/destruction";

  const fetchCalls = [];
  const defaultFetch = async (url, opts = {}) => {
    fetchCalls.push({ url: String(url), opts });
    if (onFetch) {
      return onFetch(String(url), opts, fetchCalls);
    }
    if (String(url).startsWith("/api/booking-config")) {
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            ok: true,
            timezone: "America/New_York",
            googleScheduleEmbed: { dropoffUrl: "", pickupUrl: "" },
            bookedSlots: [],
          };
        },
      };
    }
    return {
      ok: true,
      status: 200,
      async json() {
        const body = opts.body ? JSON.parse(opts.body) : {};
        return {
          ok: true,
          booking: {
            bookingId: "OR-20261123-ABCDEF1234567890",
            ...body,
          },
          googleCalendarUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE",
          icsUrl: "/api/calendar.ics?id=OR-20261123-ABCDEF1234567890",
          smsUrl: "sms:+13213962008?body=test",
        };
      },
    };
  };

  const document = {
    getElementById(id) {
      return getEl(id);
    },
    createElement(tag) {
      return createFakeElement("", tag);
    },
    querySelectorAll() {
      return [];
    },
  };

  const windowObj = {
    document,
    sessionStorage,
    fetch: defaultFetch,
    location: { search: "", hash: "" },
  };

  const context = vm.createContext({
    window: windowObj,
    document,
    sessionStorage,
    fetch: defaultFetch,
    Date,
    Intl,
    Math,
    String,
    Number,
    Boolean,
    Array,
    Object,
    JSON,
    RegExp,
    Error,
    Map,
    Set,
    Promise,
    encodeURIComponent,
    decodeURIComponent,
    parseInt,
    setTimeout,
    clearTimeout,
  });

  vm.runInContext(scriptSource, context, { filename: "index.html#booking-script" });
  return { getEl, fetchCalls, sessionStorage };
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, LOOPBACK, () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close((err) => (err ? reject(err) : resolve(port)));
    });
    srv.on("error", reject);
  });
}

function httpRequestJson(port, method, urlPath, bodyObj, hostHeader = "onlinerecycle.net") {
  return new Promise((resolve, reject) => {
    const payload = bodyObj !== undefined ? JSON.stringify(bodyObj) : null;
    const headers = { Host: hostHeader };
    if (payload !== null) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(payload);
    }
    const req = http.request(
      { host: LOOPBACK, port, path: urlPath, method, headers },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch {
            json = null;
          }
          resolve({ status: res.statusCode, raw, json });
        });
      }
    );
    req.on("error", reject);
    if (payload !== null) req.write(payload);
    req.end();
  });
}

async function waitForServer(port, tries = 50) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await httpRequestJson(port, "GET", "/health");
      if (r.status === 200) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 80));
  }
  throw new Error(`server did not start on port ${port}`);
}

test("#booking-form inputs in index.html declare maxlength attributes matching server caps (120, 40, 200, 100, 2000)", () => {
  const html = fs.readFileSync(INDEX_HTML_PATH, "utf8");
  const formMatch = html.match(/<form\s+id="booking-form"[\s\S]*?<\/form>/i);
  assert.ok(formMatch, "#booking-form must exist in index.html");
  const formHtml = formMatch[0];

  const expectedMaxLengths = [
    { id: "bf-name", max: "120" },
    { id: "bf-phone", max: "40" },
    { id: "bf-email", max: "200" },
    { id: "bf-org", max: "200" },
    { id: "bf-address", max: "200" },
    { id: "bf-city", max: "100" },
    { id: "bf-devices", max: "2000" },
  ];

  for (const { id, max } of expectedMaxLengths) {
    const tagRe = new RegExp(`<(?:input|textarea)\\b[^>]*\\bid="${id}"[^>]*>`, "i");
    const tagMatch = formHtml.match(tagRe);
    assert.ok(tagMatch, `control #${id} must exist inside #booking-form`);
    const maxMatch = tagMatch[0].match(/\bmaxlength="(\d+)"/i);
    assert.ok(maxMatch, `control #${id} must have a maxlength attribute`);
    assert.equal(maxMatch[1], max, `control #${id} maxlength must be ${max}`);
  }
});

test("pickup bookings extract a 5-digit zip into payload.zip and server.mjs records zip in booking and inquiry", async () => {
  const { getEl, fetchCalls } = mountBookingDom();
  await new Promise((r) => setTimeout(r, 20));

  getEl("tab-pickup").click();
  getEl("bf-name").value = "Jordan Blake";
  getEl("bf-phone").value = "(321) 555-0144";
  getEl("bf-address").value = "12345 Orange Blossom Trail";
  getEl("bf-city").value = "Sorrento, FL 32776-4102";
  getEl("bf-devices").value = "4 laptops and 2 monitors";

  getEl("booking-form").dispatchEvent("submit");
  await new Promise((r) => setTimeout(r, 20));

  const postCall = fetchCalls.find((c) => c.url === "/api/book");
  assert.ok(postCall, "submit must POST to /api/book");
  const sentPayload = JSON.parse(postCall.opts.body);
  assert.equal(sentPayload.serviceType, "pickup");
  assert.equal(sentPayload.zip, "32776", "pickup submit must extract 5-digit ZIP from city/address into payload.zip");

  const port = await getFreePort();
  const tmpBookingsDir = fs.mkdtempSync(path.join(os.tmpdir(), "orc-b55-bookings-"));
  const child = spawn(process.execPath, [SERVER_PATH], {
    env: {
      ...process.env,
      DOMAINS_SERVER_PORT: String(port),
      DOMAINS_SERVER_HOST: LOOPBACK,
      ORC_BOOKINGS_DIR: tmpBookingsDir,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  try {
    await waitForServer(port);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const bookRes = await httpRequestJson(port, "POST", "/api/book", {
      serviceType: "pickup",
      date: tomorrow,
      slotCode: "10:00-12:00",
      slotLabel: "10:00 AM - 12:00 PM",
      fullName: "Jordan Blake",
      phone: "(321) 555-0144",
      address: "12345 Orange Blossom Trail",
      city: "Sorrento, FL 32776-4102",
      deviceCount: "1-5 items",
      deviceList: "4 laptops and 2 monitors",
    });
    assert.equal(bookRes.status, 200);
    assert.equal(bookRes.json?.ok, true);
    assert.equal(bookRes.json?.booking?.zip, "32776");

    const jsonlPath = path.join(tmpBookingsDir, "bookings.jsonl");
    const savedLine = JSON.parse(fs.readFileSync(jsonlPath, "utf8").trim());
    assert.equal(savedLine.zip, "32776");

    const inquiryPath = path.join(tmpBookingsDir, "inquiries", `${bookRes.json.booking.bookingId}.txt`);
    const inquiryText = fs.readFileSync(inquiryPath, "utf8");
    assert.match(inquiryText, /^ZIP:\s*32776$/m);
  } finally {
    child.kill();
    fs.rmSync(tmpBookingsDir, { recursive: true, force: true });
  }
});

test("#booking-form draft inputs persist in sessionStorage across reloads until booking succeeds", async () => {
  const sharedStorage = createFakeStorage();

  // First session: user fills in draft fields
  const first = mountBookingDom({ sessionStorage: sharedStorage });
  await new Promise((r) => setTimeout(r, 20));

  first.getEl("tab-pickup").click();
  first.getEl("bf-name").value = "Casey Morgan";
  first.getEl("bf-name").dispatchEvent("input");
  first.getEl("bf-phone").value = "(407) 555-0192";
  first.getEl("bf-phone").dispatchEvent("input");
  first.getEl("bf-email").value = "casey@example.com";
  first.getEl("bf-email").dispatchEvent("input");
  first.getEl("bf-org").value = "Morgan Studios";
  first.getEl("bf-org").dispatchEvent("input");
  first.getEl("bf-address").value = "400 Lakeview Ave";
  first.getEl("bf-address").dispatchEvent("input");
  first.getEl("bf-city").value = "Mount Dora, FL 32757";
  first.getEl("bf-city").dispatchEvent("input");
  first.getEl("bf-count").value = "16-50 items";
  first.getEl("bf-count").dispatchEvent("change");
  first.getEl("bf-wipe").value = "Includes laptops/PCs/drives needing priority data wipe";
  first.getEl("bf-wipe").dispatchEvent("change");
  first.getEl("bf-devices").value = "12 workstations, 4 switches, 2 UPS units";
  first.getEl("bf-devices").dispatchEvent("input");

  assert.ok(sharedStorage.length > 0, "draft must be saved in sessionStorage after input events");

  // Second session (reload): draft values restore into #booking-form
  let shouldFailSubmit = true;
  const second = mountBookingDom({
    sessionStorage: sharedStorage,
    async onFetch(url, opts) {
      if (url.startsWith("/api/booking-config")) {
        return {
          ok: true,
          status: 200,
          async json() {
            return { ok: true, bookedSlots: [] };
          },
        };
      }
      if (shouldFailSubmit) {
        return {
          ok: false,
          status: 500,
          async json() {
            return { ok: false, error: "Temporary error" };
          },
        };
      }
      const body = JSON.parse(opts.body);
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            ok: true,
            booking: { bookingId: "OR-20261123-1111222233334444", ...body },
            googleCalendarUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE",
            icsUrl: "/api/calendar.ics?id=OR-20261123-1111222233334444",
            smsUrl: "sms:+13213962008?body=ok",
          };
        },
      };
    },
  });
  await new Promise((r) => setTimeout(r, 20));

  assert.equal(second.getEl("bf-service-type").value, "pickup");
  assert.equal(second.getEl("bf-name").value, "Casey Morgan");
  assert.equal(second.getEl("bf-phone").value, "(407) 555-0192");
  assert.equal(second.getEl("bf-email").value, "casey@example.com");
  assert.equal(second.getEl("bf-org").value, "Morgan Studios");
  assert.equal(second.getEl("bf-address").value, "400 Lakeview Ave");
  assert.equal(second.getEl("bf-city").value, "Mount Dora, FL 32757");
  assert.equal(second.getEl("bf-count").value, "16-50 items");
  assert.equal(second.getEl("bf-wipe").value, "Includes laptops/PCs/drives needing priority data wipe");
  assert.equal(second.getEl("bf-devices").value, "12 workstations, 4 switches, 2 UPS units");

  // Failed submit keeps the draft in sessionStorage
  second.getEl("booking-form").dispatchEvent("submit");
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(sharedStorage.length > 0, "draft must remain in sessionStorage when booking fails");

  // Successful submit clears the draft from sessionStorage
  shouldFailSubmit = false;
  second.getEl("booking-form").dispatchEvent("submit");
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(sharedStorage.length, 0, "draft must be cleared from sessionStorage once booking succeeds");
});

test("HTTP 409 from POST /api/book re-fetches /api/booking-config and disables newly booked slots without clearing the form", async () => {
  let configCalls = 0;
  let activeDate = "";
  const conflictedSlot = "10:00-12:00";

  const { getEl, fetchCalls, sessionStorage } = mountBookingDom({
    async onFetch(url) {
      if (url.startsWith("/api/booking-config")) {
        configCalls += 1;
        return {
          ok: true,
          status: 200,
          async json() {
            return {
              ok: true,
              timezone: "America/New_York",
              googleScheduleEmbed: { dropoffUrl: "", pickupUrl: "" },
              bookedSlots:
                configCalls >= 2 && activeDate
                  ? [{ date: activeDate, slotCode: conflictedSlot, serviceType: "pickup" }]
                  : [],
            };
          },
        };
      }
      return {
        ok: false,
        status: 409,
        async json() {
          return {
            ok: false,
            error: "That time window was just booked. Please pick another one.",
          };
        },
      };
    },
  });
  await new Promise((r) => setTimeout(r, 20));

  getEl("tab-pickup").click();
  activeDate = getEl("bf-date").value;
  assert.equal(getEl("bf-slot-code").value, conflictedSlot);

  getEl("bf-name").value = "Taylor Reed";
  getEl("bf-name").dispatchEvent("input");
  getEl("bf-phone").value = "(321) 555-0177";
  getEl("bf-phone").dispatchEvent("input");
  getEl("bf-address").value = "88 Magnolia Way";
  getEl("bf-address").dispatchEvent("input");
  getEl("bf-city").value = "Orlando, FL 32801";
  getEl("bf-city").dispatchEvent("input");
  getEl("bf-devices").value = "3 servers and 2 stereo receivers";
  getEl("bf-devices").dispatchEvent("input");

  const configCallsBeforeSubmit = configCalls;
  getEl("booking-form").dispatchEvent("submit");
  await new Promise((r) => setTimeout(r, 30));

  // Must have re-fetched /api/booking-config on HTTP 409
  assert.equal(configCalls, configCallsBeforeSubmit + 1, "client must re-fetch /api/booking-config on HTTP 409");
  assert.ok(
    fetchCalls.filter((c) => c.url.startsWith("/api/booking-config")).length >= 2,
    "fetch('/api/booking-config') must be called again after HTTP 409"
  );

  // Newly booked slot (10:00-12:00, index 1 in PICKUP_SLOTS) must now be disabled and unselected
  const slotButtons = getEl("slot-strip").children;
  const takenBtn = slotButtons.find((btn) => btn.textContent.includes("10:00 AM") && btn.textContent.includes("12:00 PM"));
  assert.ok(takenBtn, "10:00-12:00 slot button must exist");
  assert.equal(takenBtn.disabled, true, "conflicted slot button must be disabled after 409 refresh");
  assert.match(takenBtn.textContent, /\(Booked\)/);
  assert.notEqual(getEl("bf-slot-code").value, conflictedSlot, "#bf-slot-code must move off the newly booked slot");

  // Form inputs and sessionStorage draft must NOT be cleared
  assert.equal(getEl("bf-name").value, "Taylor Reed");
  assert.equal(getEl("bf-phone").value, "(321) 555-0177");
  assert.equal(getEl("bf-address").value, "88 Magnolia Way");
  assert.equal(getEl("bf-city").value, "Orlando, FL 32801");
  assert.equal(getEl("bf-devices").value, "3 servers and 2 stereo receivers");
  assert.ok(sessionStorage.length > 0, "sessionStorage draft must remain intact after HTTP 409");
});
