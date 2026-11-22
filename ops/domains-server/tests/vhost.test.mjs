#!/usr/bin/env node
// Fallback test for ops/domains-server/server.mjs (no vitest at repo root).
// Starts the real server on a scratch port, then curls each vhost with the
// relevant Host header and checks the returned <title> matches the site's
// own index.html — proving vhost routing is not falling through to another
// site's content. Also checks /health.
//
// Run: node ops/domains-server/tests/vhost.test.mjs

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import { dayKey } from "../booking-stats.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.join(__dirname, "..", "server.mjs");
const TEST_PORT = 9161; // scratch port distinct from the real 9160 service

const CASES = [
  { host: "dream-online.net", path: "/", expectTitle: "DREAM Online" },
  { host: "www.dream-online.net", path: "/", expectTitle: "DREAM Online" },
  { host: "dream-online.net", path: "/privacy", expectTitle: "Privacy Policy - ANTIGRAVITY Backup (dream-online.net)" },
  { host: "dream-online.net", path: "/terms", expectTitle: "Terms of Service - ANTIGRAVITY Backup (dream-online.net)" },
  { host: "untilnokidinneed.com", path: "/", expectTitle: "Until No Kid In Need" },
  { host: "www.untilnokidinneed.com", path: "/", expectTitle: "Until No Kid In Need" },
  { host: "onlinerecycle.net", path: "/", expectTitle: "OnlineRecycle.net | Central Florida Electronics Recycling & Free Pickup (Sorrento, Lake, Orange & Seminole)" },
  { host: "www.onlinerecycle.net", path: "/", expectTitle: "OnlineRecycle.net | Central Florida Electronics Recycling & Free Pickup (Sorrento, Lake, Orange & Seminole)" },
  { host: "onlinerecycle.net", path: "/service-areas", expectTitle: "Lake, Orange & Seminole County Electronics Pickup & Sorrento Drop-Off | OnlineRecycle.net", forbidText: ["NOT IN INPUTS", "Refused Equipment"] },
  { host: "onlinerecycle.net", path: "/service-areas.html", expectTitle: "Lake, Orange & Seminole County Electronics Pickup & Sorrento Drop-Off | OnlineRecycle.net", forbidText: ["NOT IN INPUTS", "Refused Equipment"] },
  { host: "www.onlinerecycle.net", path: "/service-areas", expectTitle: "Lake, Orange & Seminole County Electronics Pickup & Sorrento Drop-Off | OnlineRecycle.net", forbidText: ["NOT IN INPUTS", "Refused Equipment"] },
];

function get(host, port, hostHeader, urlPath = "/", extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host, port, path: urlPath, method: "GET", headers: { Host: hostHeader, ...extraHeaders } },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      }
    );
    req.on("error", reject);
    req.end();
  });
}

function getPath(host, port, urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host, port, path: urlPath, method: "GET" }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode, body }));
    });
    req.on("error", reject);
    req.end();
  });
}

function postJson(host, port, hostHeader, urlPath, payload, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        host,
        port,
        path: urlPath,
        method: "POST",
        headers: {
          Host: hostHeader,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          ...extraHeaders,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve({ status: res.statusCode, body, headers: res.headers }));
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function postOversizedBody(host, port, hostHeader, urlPath, byteCount = 40000) {
  return new Promise((resolve) => {
    let status = 0;
    let body = "";
    let socketClosed = false;
    let settled = false;
    const finish = (extra = {}) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ status, body, socketClosed, ...extra });
    };
    const req = http.request(
      {
        host,
        port,
        path: urlPath,
        method: "POST",
        headers: {
          Host: hostHeader,
          "Content-Type": "application/json",
          "Content-Length": byteCount * 2,
          Connection: "keep-alive",
          "cf-connecting-ip": "198.51.100.200",
        },
      },
      (res) => {
        status = res.statusCode || 0;
        res.on("data", (chunk) => (body += chunk));
        res.socket?.on("close", () => {
          socketClosed = true;
          finish();
        });
        res.on("end", () => {
          setTimeout(() => {
            socketClosed = socketClosed || Boolean(res.socket?.destroyed);
            req.destroy();
            finish();
          }, 80);
        });
      }
    );
    req.on("socket", (sock) => {
      sock.on("close", () => {
        socketClosed = true;
        if (status) finish();
      });
    });
    req.on("error", () => finish());
    const timer = setTimeout(() => {
      req.destroy();
      finish({ timedOut: true });
    }, 1000);
    req.write(`{"notes":"${"a".repeat(byteCount)}`);
  });
}

async function waitForServer(port, tries = 50) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await getPath("127.0.0.1", port, "/health");
      if (r.status === 200) return true;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

async function main() {
  const tmpStatsDir = fs.mkdtempSync(path.join(os.tmpdir(), "orc-vhost-stats-"));
  const tmpBookingsDir = fs.mkdtempSync(path.join(os.tmpdir(), "orc-vhost-bookings-"));
  const childEnv = {
    ...process.env,
    DOMAINS_SERVER_PORT: String(TEST_PORT),
    ORC_STATS_DIR: tmpStatsDir,
    ORC_BOOKINGS_DIR: tmpBookingsDir,
  };
  delete childEnv.ORC_NOTIFY_TELEGRAM_TOKEN;
  delete childEnv.ORC_NOTIFY_TELEGRAM_CHAT;

  const child = spawn(process.execPath, [SERVER_PATH], {
    env: childEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let failures = 0;
  try {
    const up = await waitForServer(TEST_PORT);
    if (!up) {
      console.error("FAIL: server did not come up on scratch port", TEST_PORT);
      process.exitCode = 1;
      return;
    }

    // /health check (notices off -> not green, reports 'booking notices: off' and unnotifiedBookings: 0)
    const health = await getPath("127.0.0.1", TEST_PORT, "/health");
    const healthBody = JSON.parse(health.body);
    if (
      health.status !== 200 ||
      healthBody.service !== "domains-server" ||
      healthBody.bookingNotices !== "off" ||
      !health.body.includes("booking notices: off") ||
      healthBody.unnotifiedBookings !== 0 ||
      healthBody.nodeLight === "green"
    ) {
      console.error("FAIL: /health did not report expected booking notice off state:", health.body);
      failures++;
    } else {
      console.log("PASS: /health ->", health.body);
    }

    for (const { host, path: urlPath, expectTitle, forbidText } of CASES) {
      const r = await get("127.0.0.1", TEST_PORT, host, urlPath, {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
      });
      const titleMatch = r.body.match(/<title>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(/&amp;/g, "&") : null;
      // The founder-ruled tribute phrase must stay off customer-facing pages.
      const tributeRe = /CLAUDE(?:'|&#39;|&apos;|&rsquo;|\u2019)?s N Joshua|TeamClaudeForLife/i;
      const forbiddenHit = Array.isArray(forbidText)
        ? forbidText.find((needle) => r.body.toLowerCase().includes(needle.toLowerCase()))
        : null;
      if (tributeRe.test(r.body)) {
        console.error(`FAIL: Host=${host} path=${urlPath} -> tribute phrase present on a customer surface`);
        failures++;
      } else if (forbiddenHit) {
        console.error(`FAIL: Host=${host} path=${urlPath} -> forbidden text "${forbiddenHit}" present`);
        failures++;
      } else if (r.status === 200 && title === expectTitle) {
        console.log(`PASS: Host=${host} path=${urlPath} -> title "${title}" (no forbidden text)`);
      } else {
        console.error(
          `FAIL: Host=${host} path=${urlPath} -> status=${r.status} title="${title}" (expected "${expectTitle}")`
        );
        failures++;
      }
    }

    // Verify crawler user agent increments page_views_all but leaves page_views unchanged
    await get("127.0.0.1", TEST_PORT, "onlinerecycle.net", "/", {
      "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    });
    const statsFile = path.join(tmpStatsDir, `${dayKey()}.json`);
    const stats = fs.existsSync(statsFile) ? JSON.parse(fs.readFileSync(statsFile, "utf8")) : null;
    if (!stats || stats.page_views !== 2 || stats.page_views_all !== 3) {
      console.error(
        `FAIL: daily stats crawler filter -> expected page_views=2, page_views_all=3, got ${JSON.stringify(stats)}`
      );
      failures++;
    } else {
      console.log(`PASS: daily stats crawler filter -> ${JSON.stringify(stats)}`);
    }

    // Service Areas content, navigation link, sitemap & structured data check
    const home = await get("127.0.0.1", TEST_PORT, "onlinerecycle.net", "/");
    const sitemap = await get("127.0.0.1", TEST_PORT, "onlinerecycle.net", "/sitemap.xml");
    const sa = await get("127.0.0.1", TEST_PORT, "onlinerecycle.net", "/service-areas");
    const requiredSnippets = [
      "Sorrento",
      "Lake County",
      "Orange County",
      "Seminole County",
      "(321) 396-2008",
      '"@type": "FAQPage"',
      '"@type": "Question"',
    ];
    const forbiddenServiceAreaSnippets = [
      "NOT IN INPUTS",
      "Mount Dora",
      "Eustis",
      "Tavares",
      "Leesburg",
      "Clermont",
      "Apopka",
      "Orlando",
      "Winter Park",
      "Winter Garden",
      "Ocoee",
      "Sanford",
      "Lake Mary",
      "Longwood",
      "Altamonte Springs",
      "Oviedo",
      "at your home or business",
      "central drop-off",
      "run on a battery",
      "personal and business data",
    ];
    const missingSnippet = requiredSnippets.find((s) => !sa.body.includes(s));
    const forbiddenSaSnippet = forbiddenServiceAreaSnippets.find((s) => sa.body.includes(s));
    if (forbiddenSaSnippet) {
      console.error(`FAIL: /service-areas contains forbidden snippet '${forbiddenSaSnippet}'`);
      failures++;
    } else if (missingSnippet) {
      console.error(`FAIL: /service-areas missing expected content: ${missingSnippet}`);
      failures++;
    } else if (!home.body.includes("/service-areas.html") || !sitemap.body.includes("https://onlinerecycle.net/service-areas.html")) {
      console.error("FAIL: home page navigation or sitemap.xml missing /service-areas.html link");
      failures++;
    } else {
      console.log("PASS: /service-areas renders Sorrento and Lake, Orange, and Seminole Counties, FAQ structured data, nav/sitemap links, and omits unverified towns/postal/geo");
    }

    // Check that no page claims Google Calendar scheduling where no calendar entry is made
    const pagesToCheck = ["/", "/service-areas.html", "/about.html", "/terms.html", "/privacy.html", "/disclaimer.html"];
    for (const p of pagesToCheck) {
      const resp = await get("127.0.0.1", TEST_PORT, "onlinerecycle.net", p);
      if (/Google Calendar/i.test(resp.body)) {
        console.error(`FAIL: ${p} still contains 'Google Calendar' wording`);
        failures++;
      }
    }
    if (failures === 0) {
      console.log("PASS: OnlineRecycle pages contain no false 'Google Calendar' wording");
    }

    // Check that 'Request Pickup' links on other pages open pickup mode with address fields showing
    const otherPages = ["/service-areas.html", "/about.html", "/terms.html", "/privacy.html"];
    for (const p of otherPages) {
      const resp = await get("127.0.0.1", TEST_PORT, "onlinerecycle.net", p);
      const pickupLinks = [...resp.body.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].filter((m) =>
        /Request (?:Free Route )?Pickup/i.test(m[2])
      );
      if (pickupLinks.length === 0) {
        console.error(`FAIL: ${p} has no 'Request Pickup' link`);
        failures++;
      }
      for (const m of pickupLinks) {
        if (!m[1].includes("service=pickup") && !m[1].includes("pickup")) {
          console.error(`FAIL: ${p} pickup link '${m[2].trim()}' points to '${m[1]}' instead of pickup mode`);
          failures++;
        }
      }
    }
    if (!home.body.includes("serviceTypeFromLocation") || !home.body.includes("setServiceType(initialService")) {
      console.error("FAIL: index.html does not switch to pickup mode from URL location");
      failures++;
    } else {
      console.log("PASS: 'Request Pickup' links on subpages target pickup mode and index.html activates pickup mode + address fields");
    }

    // Booking records notified: false when notices are off and increments unnotifiedBookings on /health
    const futureDate = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    const bookRes = await postJson("127.0.0.1", TEST_PORT, "onlinerecycle.net", "/api/book", {
      serviceType: "pickup",
      date: futureDate,
      slotCode: "10:00-12:00",
      slotLabel: "10:00 AM - 12:00 PM",
      fullName: "Taylor Smith",
      phone: "321-555-0144",
      address: "456 Oak Ave",
      city: "Sorrento",
      zip: "32776",
      deviceCount: "1-5 items",
      deviceList: "2 desktops and 1 monitor",
    });
    const bookJson = JSON.parse(bookRes.body);
    const savedLines = fs
      .readFileSync(path.join(tmpBookingsDir, "bookings.jsonl"), "utf8")
      .trim()
      .split(/\r?\n/)
      .map((l) => JSON.parse(l));
    const healthAfter = JSON.parse((await getPath("127.0.0.1", TEST_PORT, "/health")).body);
    if (
      bookRes.status !== 200 ||
      !bookJson.ok ||
      bookJson.booking.notified !== false ||
      savedLines.length !== 1 ||
      savedLines[0].notified !== false ||
      healthAfter.unnotifiedBookings !== 1
    ) {
      console.error("FAIL: booking notified=false tracking or /health unnotifiedBookings failed:", bookRes.body, healthAfter);
      failures++;
    } else {
      console.log("PASS: booking record stores notified=false and /health reports unnotifiedBookings=1");
    }

    // 1. Booking dates accepted only from today to 14 days ahead (Florida time)
    const flToday = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
    const flDay = (offsetDays) =>
      new Date(new Date(`${flToday}T00:00:00Z`).getTime() + offsetDays * 86400000).toISOString().slice(0, 10);
    const yesterdayRes = await postJson(
      "127.0.0.1",
      TEST_PORT,
      "onlinerecycle.net",
      "/api/book",
      {
        serviceType: "dropoff",
        date: flDay(-1),
        slotCode: "08:00-08:30",
        fullName: "Date Check",
        phone: "321-555-0144",
        deviceList: "1 laptop",
      },
      { "cf-connecting-ip": "198.51.100.11" }
    );
    const day15Res = await postJson(
      "127.0.0.1",
      TEST_PORT,
      "onlinerecycle.net",
      "/api/book",
      {
        serviceType: "dropoff",
        date: flDay(15),
        slotCode: "08:00-08:30",
        fullName: "Date Check",
        phone: "321-555-0144",
        deviceList: "1 laptop",
      },
      { "cf-connecting-ip": "198.51.100.11" }
    );
    const day14Res = await postJson(
      "127.0.0.1",
      TEST_PORT,
      "onlinerecycle.net",
      "/api/book",
      {
        serviceType: "dropoff",
        date: flDay(14),
        slotCode: "08:00-08:30",
        fullName: "Date Check",
        phone: "321-555-0144",
        deviceList: "1 laptop",
      },
      { "cf-connecting-ip": "198.51.100.11" }
    );
    if (yesterdayRes.status !== 400 || day15Res.status !== 400 || day14Res.status !== 200) {
      console.error(
        `FAIL: booking date range (today..+14d FL) -> yesterday=${yesterdayRes.status} day15=${day15Res.status} day14=${day14Res.status}`
      );
      failures++;
    } else {
      console.log("PASS: booking dates accepted only from today to 14 days ahead (Florida time)");
    }

    // 2. Phone number needs at least 10 digits
    const shortPhoneRes = await postJson(
      "127.0.0.1",
      TEST_PORT,
      "onlinerecycle.net",
      "/api/book",
      {
        serviceType: "dropoff",
        date: flToday,
        slotCode: "08:00-08:30",
        fullName: "Short Phone",
        phone: "555-0199",
        deviceList: "1 desktop",
      },
      { "cf-connecting-ip": "198.51.100.22" }
    );
    if (shortPhoneRes.status !== 400) {
      console.error(`FAIL: short phone (<10 digits) -> expected 400, got ${shortPhoneRes.status}`);
      failures++;
    } else {
      console.log("PASS: phone number with fewer than 10 digits is rejected with 400");
    }

    // 3. At most 2 saved bookings per IP per 24h; refused bookings do not spend allowance; hit table is capped
    const rateIp = { "cf-connecting-ip": "198.51.100.33" };
    // Refused bookings (400 bad phone, 400 out-of-range date, 409 already-booked slot) must not spend allowance
    await postJson(
      "127.0.0.1",
      TEST_PORT,
      "onlinerecycle.net",
      "/api/book",
      {
        serviceType: "dropoff",
        date: flToday,
        slotCode: "09:00-09:30",
        fullName: "Refused One",
        phone: "12345",
        deviceList: "1 monitor",
      },
      rateIp
    );
    await postJson(
      "127.0.0.1",
      TEST_PORT,
      "onlinerecycle.net",
      "/api/book",
      {
        serviceType: "dropoff",
        date: flDay(20),
        slotCode: "09:00-09:30",
        fullName: "Refused Two",
        phone: "321-555-0199",
        deviceList: "1 monitor",
      },
      rateIp
    );
    const conflictRes = await postJson(
      "127.0.0.1",
      TEST_PORT,
      "onlinerecycle.net",
      "/api/book",
      {
        serviceType: "dropoff",
        date: flDay(14),
        slotCode: "08:00-08:30",
        fullName: "Refused Conflict",
        phone: "321-555-0199",
        deviceList: "1 monitor",
      },
      rateIp
    );
    const saved1 = await postJson(
      "127.0.0.1",
      TEST_PORT,
      "onlinerecycle.net",
      "/api/book",
      {
        serviceType: "dropoff",
        date: flToday,
        slotCode: "09:00-09:30",
        fullName: "Saved One",
        phone: "(321) 555-0191",
        deviceList: "1 router",
      },
      rateIp
    );
    const saved2 = await postJson(
      "127.0.0.1",
      TEST_PORT,
      "onlinerecycle.net",
      "/api/book",
      {
        serviceType: "dropoff",
        date: flToday,
        slotCode: "10:00-10:30",
        fullName: "Saved Two",
        phone: "(321) 555-0192",
        deviceList: "1 switch",
      },
      rateIp
    );
    const thirdRes = await postJson(
      "127.0.0.1",
      TEST_PORT,
      "onlinerecycle.net",
      "/api/book",
      {
        serviceType: "dropoff",
        date: flToday,
        slotCode: "11:00-11:30",
        fullName: "Third Blocked",
        phone: "(321) 555-0193",
        deviceList: "1 server",
      },
      rateIp
    );
    const srvMod = await import("../server.mjs");
    let hitCapOk = false;
    if (typeof srvMod.bookingAllowed === "function" && srvMod.bookHits instanceof Map) {
      srvMod.bookHits.clear();
      for (let i = 0; i < 5050; i++) {
        srvMod.bookingAllowed(`203.0.113.${i}`);
      }
      hitCapOk = srvMod.bookHits.size <= 5000;
      srvMod.bookHits.clear();
    }
    if (
      conflictRes.status !== 409 ||
      saved1.status !== 200 ||
      saved2.status !== 200 ||
      thirdRes.status !== 429 ||
      !hitCapOk
    ) {
      console.error(
        `FAIL: rate limit & hit cap -> conflict=${conflictRes.status} saved1=${saved1.status} saved2=${saved2.status} third=${thirdRes.status} hitCapOk=${hitCapOk}`
      );
      failures++;
    } else {
      console.log("PASS: at most 2 saved bookings per IP per 24h, refused bookings do not spend allowance, and hit table is capped at 5000");
    }

    // 4. Body larger than limit gets 413 and socket is closed
    const oversized = await postOversizedBody("127.0.0.1", TEST_PORT, "onlinerecycle.net", "/api/book", 40000);
    if (oversized.status !== 413 || !oversized.socketClosed || oversized.timedOut) {
      console.error(`FAIL: oversized body -> expected 413 and closed socket, got ${JSON.stringify(oversized)}`);
      failures++;
    } else {
      console.log("PASS: oversized body gets 413 and socket is closed");
    }

    // 5. Cancelled bookings free their slot in /api/booking-config
    const cancelledSlot = {
      bookingId: `OR-${flToday.replace(/-/g, "")}-CANC0001`,
      createdAt: new Date().toISOString(),
      serviceType: "dropoff",
      fullName: "Cancelled Customer",
      phone: "321-555-0199",
      date: flToday,
      slotCode: "15:00-15:30",
      slotLabel: "3:00 PM - 3:30 PM",
      deviceCount: "1-5",
      deviceList: "1 printer",
      status: "CANCELLED",
      notified: true,
    };
    fs.appendFileSync(path.join(tmpBookingsDir, "bookings.jsonl"), `${JSON.stringify(cancelledSlot)}\n`, "utf8");
    const cfgRes = await get("127.0.0.1", TEST_PORT, "onlinerecycle.net", "/api/booking-config");
    const cfgJson = JSON.parse(cfgRes.body);
    const hasCancelled = (cfgJson.bookedSlots || []).some(
      (s) => s.date === flToday && s.slotCode === "15:00-15:30" && s.serviceType === "dropoff"
    );
    const hasScheduled = (cfgJson.bookedSlots || []).some(
      (s) => s.date === flToday && s.slotCode === "09:00-09:30" && s.serviceType === "dropoff"
    );
    if (hasCancelled || !hasScheduled) {
      console.error(
        `FAIL: /api/booking-config cancelled slot filter -> hasCancelled=${hasCancelled} hasScheduled=${hasScheduled}`
      );
      failures++;
    } else {
      console.log("PASS: cancelled bookings free their slot in /api/booking-config");
    }

    // Verify /health reports 'booking notices: on' when token and chat are configured
    const onPort = 9162;
    const onBookingsDir = fs.mkdtempSync(path.join(os.tmpdir(), "orc-vhost-on-"));
    const onChild = spawn(process.execPath, [SERVER_PATH], {
      env: {
        ...process.env,
        DOMAINS_SERVER_PORT: String(onPort),
        DOMAINS_SERVER_HOST: "127.0.0.1",
        FLEET_SHARED_TOKEN: "test-fleet-token",
        ORC_NOTIFY_TELEGRAM_TOKEN: "test-token",
        ORC_NOTIFY_TELEGRAM_CHAT: "test-chat",
        ORC_BOOKINGS_DIR: onBookingsDir,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    try {
      const onUp = await waitForServer(onPort);
      const onHealth = onUp ? await getPath("127.0.0.1", onPort, "/health") : { status: 0, body: "{}" };
      const onBody = JSON.parse(onHealth.body);
      if (
        !onUp ||
        onHealth.status !== 200 ||
        onBody.bookingNotices !== "on" ||
        !onHealth.body.includes("booking notices: on") ||
        onBody.unnotifiedBookings !== 0
      ) {
        console.error("FAIL: /health did not report 'booking notices: on' when configured:", onHealth.body);
        failures++;
      } else {
        console.log("PASS: /health reports 'booking notices: on' when configured ->", onHealth.body);
      }
    } finally {
      onChild.kill();
      fs.rmSync(onBookingsDir, { recursive: true, force: true });
    }
  } finally {
    child.kill();
    fs.rmSync(tmpStatsDir, { recursive: true, force: true });
    fs.rmSync(tmpBookingsDir, { recursive: true, force: true });
  }

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log("\nAll vhost checks passed.");
  }
}

main();
