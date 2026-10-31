#!/usr/bin/env node
// Domains static site server — no dependencies.
// Virtual-host static file server: routes by the Host header to one of
// three landing-site document roots, plus a /health identity probe and
// OnlineRecycle.net native Google Calendar Ultra booking endpoints (/api/booking-config, /api/book, /api/calendar.ics).
//
// Start: node ops/domains-server/server.mjs

import http from "node:http";
import { createServer as createServerFor } from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const DOMAINS_ROOT = path.join(REPO_ROOT, "domains");
const BOOKINGS_DIR = path.join(REPO_ROOT, "data", "ewaste-intake");
const BOOKINGS_JSONL = path.join(BOOKINGS_DIR, "bookings.jsonl");
const INQUIRIES_DIR = path.join(BOOKINGS_DIR, "inquiries");

// Ruled 2026-09-28 (Joshua: "use the endpoints always of 192, not localhost"):
// listen on the T5500 LAN address and on loopback for local probes and the
// cloudflared tunnel. Never every interface, and never Sabretooth (.8), which
// does not host live domains.
const HOSTS = (process.env.DOMAINS_SERVER_HOST || "127.0.0.1,192.168.0.15")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);
const PORT = Number(process.env.DOMAINS_SERVER_PORT || 9160);

// Host header -> document root (relative to DOMAINS_ROOT).
// onlinerecycle.net serves the restored static recycling site from site/
const VHOSTS = {
  "dream-online.net": "dream-online.net",
  "www.dream-online.net": "dream-online.net",
  "untilnokidinneed.com": "untilnokidinneed.com",
  "www.untilnokidinneed.com": "untilnokidinneed.com",
  "onlinerecycle.net": path.join("onlinerecycle.net", "site"),
  "www.onlinerecycle.net": path.join("onlinerecycle.net", "site"),
};

const SITES = ["dream-online.net", "untilnokidinneed.com", "onlinerecycle.net"];

// The booking APIs belong to onlinerecycle.net only.
const BOOKING_HOSTS = new Set(["onlinerecycle.net", "www.onlinerecycle.net"]);

// Public, unauthenticated booking form: cap submissions per client so a
// script cannot fill the disk. In-memory, resets on restart.
const BOOK_LIMIT = 10;
const BOOK_WINDOW_MS = 60 * 60 * 1000;
const bookHits = new Map();

// cf-connecting-ip is trusted only from loopback, where cloudflared connects;
// a LAN client could otherwise invent a fresh address per request.
function clientIp(req) {
  const remote = String(req.socket.remoteAddress || "unknown");
  const viaTunnel = remote === "127.0.0.1" || remote === "::1" || remote === "::ffff:127.0.0.1";
  return viaTunnel && req.headers["cf-connecting-ip"] ? String(req.headers["cf-connecting-ip"]) : remote;
}

function bookingAllowed(ip) {
  const now = Date.now();
  if (bookHits.size > 5000) {
    for (const [key, times] of bookHits) {
      if (!times.some((t) => now - t < BOOK_WINDOW_MS)) bookHits.delete(key);
    }
  }
  const hits = (bookHits.get(ip) || []).filter((t) => now - t < BOOK_WINDOW_MS);
  if (hits.length >= BOOK_LIMIT) {
    bookHits.set(ip, hits);
    return false;
  }
  hits.push(now);
  bookHits.set(ip, hits);
  return true;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".ics": "text/calendar; charset=utf-8",
};

function contentTypeFor(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function hostOnly(hostHeader) {
  if (!hostHeader) return "";
  return hostHeader.split(",")[0].trim().split(":")[0].toLowerCase();
}

function readEnvValue(key) {
  if (process.env[key]) return process.env[key];
  try {
    const envPath = path.join(REPO_ROOT, ".env");
    if (!fs.existsSync(envPath)) return "";
    const txt = fs.readFileSync(envPath, "utf8");
    const m = txt.match(new RegExp(`^${key}\\s*=\\s*(.+)$`, "m"));
    return m && m[1] ? m[1].trim().replace(/^['"]|['"]$/g, "") : "";
  } catch {
    return "";
  }
}

// Every booking, cached and re-read only when bookings.jsonl changes on disk.
let bookingCache = { mtimeMs: -1, size: -1, list: [] };

function readBookings() {
  try {
    const stat = fs.statSync(BOOKINGS_JSONL);
    if (stat.mtimeMs === bookingCache.mtimeMs && stat.size === bookingCache.size) return bookingCache.list;
    const list = fs
      .readFileSync(BOOKINGS_JSONL, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    bookingCache = { mtimeMs: stat.mtimeMs, size: stat.size, list };
    return list;
  } catch {
    return [];
  }
}

function toGoogleCalDateRange(dateStr, slotStr) {
  // dateStr: YYYY-MM-DD, slotStr e.g. "09:00-09:30" or "08:00-10:00"
  const cleanDate = String(dateStr || "").replace(/-/g, "");
  const m = String(slotStr || "").match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
  if (!/^\d{8}$/.test(cleanDate) || !m) {
    const now = new Date();
    const start = new Date(now.getTime() + 86400000);
    const end = new Date(start.getTime() + 3600000);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    return { startCompact: fmt(start), endCompact: fmt(end) };
  }
  return {
    startCompact: `${cleanDate}T${m[1]}${m[2]}00`,
    endCompact: `${cleanDate}T${m[3]}${m[4]}00`,
  };
}

function buildGoogleCalendarUrl(booking) {
  const { startCompact, endCompact } = toGoogleCalDateRange(booking.date, booking.slotCode);
  const typeLabel = booking.serviceType === "pickup" ? "Electronics Pickup" : "Electronics Drop-Off";
  const title = `OnlineRecycle.net ${typeLabel} — ${booking.fullName} (${booking.bookingId})`;
  const location =
    booking.serviceType === "pickup"
      ? `${booking.address || ""}, ${booking.city || "Central Florida"} ${booking.zip || ""}`.trim()
      : "Sorrento, FL 32776 (Exact drop-off address confirmed by text/email)";
  const details = [
    `Booking ID: ${booking.bookingId}`,
    `Service: ${typeLabel} (${booking.slotLabel || booking.slotCode})`,
    `Customer: ${booking.fullName}`,
    `Phone: ${booking.phone}`,
    `Email: ${booking.email}`,
    booking.organization ? `Organization: ${booking.organization}` : null,
    booking.serviceType === "pickup" ? `Pickup Address: ${location}` : null,
    `Estimated Device Count: ${booking.deviceCount}`,
    `Devices: ${booking.deviceList}`,
    booking.notes ? `Notes / Data Handling: ${booking.notes}` : null,
    "",
    "OnlineRecycle.net | Trash Or Treasure Online Recycler LLC | Call/Text: (321) 396-2008",
  ]
    .filter(Boolean)
    .join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startCompact}/${endCompact}`,
    ctz: "America/New_York",
    details,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// RFC 5545 TEXT escaping: customer text must never start a new property line.
function icsText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

function buildIcsContent(booking) {
  const { startCompact, endCompact } = toGoogleCalDateRange(booking.date, booking.slotCode);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const typeLabel = booking.serviceType === "pickup" ? "Electronics Pickup" : "Electronics Drop-Off";
  const summary = `OnlineRecycle.net ${typeLabel} - ${booking.fullName} (${booking.bookingId})`;
  const location =
    booking.serviceType === "pickup"
      ? `${booking.address || ""} ${booking.city || ""} ${booking.zip || ""}`.trim()
      : "Sorrento, FL 32776";
  const desc = [
    `Booking ID: ${booking.bookingId}`,
    `Service: ${typeLabel} (${booking.slotLabel || booking.slotCode})`,
    `Phone: ${booking.phone}`,
    `Email: ${booking.email}`,
    `Device Count: ${booking.deviceCount}`,
    `Devices: ${booking.deviceList}`,
    booking.notes ? `Notes: ${booking.notes}` : "",
    "OnlineRecycle.net - (321) 396-2008",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OnlineRecycle.net//Google Calendar Ultra Scheduler//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${booking.bookingId}@onlinerecycle.net`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=America/New_York:${startCompact}`,
    `DTEND;TZID=America/New_York:${endCompact}`,
    `SUMMARY:${icsText(summary)}`,
    `LOCATION:${icsText(location)}`,
    `DESCRIPTION:${icsText(desc)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

class BadRequest extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Rejects with BadRequest (413 or 400) so the caller can answer the client;
// an oversized body is drained, not destroyed, so the response still arrives.
function readJsonBody(req, maxBytes = 32768) {
  return new Promise((resolve, reject) => {
    let bytes = 0;
    let tooLarge = false;
    const chunks = [];
    req.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        tooLarge = true;
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (tooLarge) {
        reject(new BadRequest(413, "That request was too large. Please shorten the device list or notes."));
        return;
      }
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        const parsed = raw ? JSON.parse(raw) : {};
        resolve(parsed && typeof parsed === "object" ? parsed : {});
      } catch {
        reject(new BadRequest(400, "We could not read that booking request. Please try again."));
      }
    });
    req.on("error", reject);
  });
}

const SLOT_CODES = {
  dropoff: new Set([
    "08:00-08:30", "09:00-09:30", "10:00-10:30", "11:00-11:30", "13:00-13:30",
    "14:00-14:30", "15:00-15:30", "16:00-16:30", "17:00-17:30",
  ]),
  pickup: new Set(["08:00-10:00", "10:00-12:00", "12:00-14:00", "14:00-16:00", "16:00-18:00"]),
};

function todayInFlorida() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

// A real calendar date, YYYY-MM-DD, today or later.
function validBookingDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== date) return false;
  return date >= todayInFlorida();
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(payload));
}

async function resolveFile(docRootAbs, urlPath) {
  let cleanPath = decodeURIComponent(urlPath.split("?")[0]);
  if (cleanPath === "/" || cleanPath === "") cleanPath = "/index.html";

  const requested = path.normalize(path.join(docRootAbs, cleanPath));
  if (!requested.startsWith(docRootAbs)) {
    return null; // traversal attempt
  }

  try {
    let stat = await fsp.stat(requested);
    if (stat.isDirectory()) {
      const indexPath = path.join(requested, "index.html");
      stat = await fsp.stat(indexPath);
      if (stat.isFile()) return indexPath;
      return null;
    }
    if (stat.isFile()) return requested;
    return null;
  } catch {
    const last = path.basename(cleanPath);
    if (!last.includes(".")) {
      const indexPath = path.join(docRootAbs, "index.html");
      try {
        const stat = await fsp.stat(indexPath);
        if (stat.isFile()) return indexPath;
      } catch {
        return null;
      }
    }
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const host = hostOnly(req.headers.host);
    const rawUrl = req.url || "/";
    const parsedUrl = new URL(rawUrl, `http://${host || "localhost"}`);
    const urlPath = parsedUrl.pathname;

    if (urlPath === "/health") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ service: "domains-server", sites: SITES }));
      return;
    }

    // OnlineRecycle.net native Google Calendar Ultra booking APIs
    const isBookingHost = BOOKING_HOSTS.has(host);

    if (isBookingHost && urlPath === "/api/booking-config" && req.method === "GET") {
      const dropoffScheduleUrl =
        readEnvValue("GOOGLE_CALENDAR_DROPOFF_URL") || readEnvValue("GOOGLE_CALENDAR_SCHEDULE_URL") || "";
      const pickupScheduleUrl =
        readEnvValue("GOOGLE_CALENDAR_PICKUP_URL") || readEnvValue("GOOGLE_CALENDAR_SCHEDULE_URL") || "";
      const today = todayInFlorida();
      const bookedSlots = readBookings()
        .filter((b) => String(b.date || "") >= today)
        .map((b) => ({
        date: b.date,
        slotCode: b.slotCode,
        serviceType: b.serviceType,
      }));
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      res.end(
        JSON.stringify({
          ok: true,
          timezone: "America/New_York",
          googleScheduleEmbed: {
            dropoffUrl: dropoffScheduleUrl,
            pickupUrl: pickupScheduleUrl,
          },
          bookedSlots,
        })
      );
      return;
    }

    if (isBookingHost && urlPath === "/api/book" && req.method === "POST") {
      if (!bookingAllowed(clientIp(req))) {
        sendJson(res, 429, { ok: false, error: "Too many booking requests. Please call or text (321) 396-2008." });
        return;
      }
      let body;
      try {
        body = await readJsonBody(req);
      } catch (err) {
        if (err instanceof BadRequest) {
          sendJson(res, err.status, { ok: false, error: err.message });
          return;
        }
        throw err;
      }
      const field = (key, fallback = "", max = 500) => String(body[key] ?? fallback).trim().slice(0, max);
      const serviceType = field("serviceType", "dropoff").toLowerCase() === "pickup" ? "pickup" : "dropoff";
      const fullName = field("fullName", "", 120);
      const phone = field("phone", "", 40);
      const email = field("email", "", 200);
      const date = field("date", "", 10);
      const slotCode = field("slotCode", "", 20);
      const slotLabel = field("slotLabel", slotCode, 60);
      const deviceCount = field("deviceCount", "1-5", 20);
      const deviceList = field("deviceList", "", 2000);
      const organization = field("organization", "", 200);
      const address = field("address", "", 200);
      const city = field("city", "", 100);
      const zip = field("zip", "", 10);
      const notes = field("notes", "", 2000);

      if (!fullName || !phone || !date || !slotCode || !deviceList) {
        sendJson(res, 400, {
          ok: false,
          error: "Please fill in your name, phone number, preferred date/time window, and device list.",
        });
        return;
      }
      if (!validBookingDate(date) || !SLOT_CODES[serviceType].has(slotCode)) {
        sendJson(res, 400, { ok: false, error: "Please choose a date from today onward and one of the listed time windows." });
        return;
      }
      if (serviceType === "pickup" && !address) {
        sendJson(res, 400, {
          ok: false,
          error: "Please provide the pickup street address so we can route your Central Florida pickup.",
        });
        return;
      }

      const dayCompact = date.replace(/-/g, "");
      // The ID is the only key to /api/calendar.ics, which returns the
      // customer's contact details, so it must not be guessable.
      const rand = crypto.randomBytes(8).toString("hex").toUpperCase();
      const bookingId = `OR-${dayCompact}-${rand}`;
      const createdAt = new Date().toISOString();

      const booking = {
        bookingId,
        createdAt,
        serviceType,
        fullName,
        phone,
        email,
        organization,
        address,
        city,
        zip,
        date,
        slotCode,
        slotLabel,
        deviceCount,
        deviceList,
        notes,
        status: "SCHEDULED",
      };

      await fsp.mkdir(INQUIRIES_DIR, { recursive: true });
      // Check and record in one synchronous step so two requests for the same
      // window cannot both pass the check.
      const taken = readBookings().some(
        (b) => b.date === date && b.slotCode === slotCode && b.serviceType === serviceType && b.status !== "CANCELLED"
      );
      if (taken) {
        sendJson(res, 409, { ok: false, error: "That time window was just booked. Please pick another one." });
        return;
      }
      fs.appendFileSync(BOOKINGS_JSONL, `${JSON.stringify(booking)}\n`, "utf8");

      const inquiryMd = [
        `Full Name: ${fullName}`,
        `Email: ${email || "not provided"}`,
        `Phone: ${phone}`,
        organization ? `Organization: ${organization}` : null,
        serviceType === "pickup" ? `Pickup Address: ${address}` : null,
        city ? `City: ${city}` : null,
        zip ? `ZIP: ${zip}` : null,
        `Estimated Device Count: ${deviceCount}`,
        serviceType === "pickup"
          ? `Preferred Pickup Window: ${date} (${slotLabel})`
          : `Preferred Drop-Off Window: ${date} (${slotLabel})`,
        `Device List: ${deviceList}`,
        notes ? `Security / Data Wipe Notes: ${notes}` : null,
      ]
        .filter(Boolean)
        .join("\n");
      await fsp.writeFile(path.join(INQUIRIES_DIR, `${bookingId}.txt`), `${inquiryMd}\n`, "utf8");

      const googleCalendarUrl = buildGoogleCalendarUrl(booking);
      const icsUrl = `/api/calendar.ics?id=${encodeURIComponent(bookingId)}`;
      const smsBody = `OnlineRecycle.net ${serviceType.toUpperCase()} Booking ${bookingId}: ${fullName}, ${date} (${slotLabel}). Items (${deviceCount}): ${deviceList}${
        serviceType === "pickup" ? ` | Address: ${address}, ${city} ${zip}` : ""
      }`;
      const smsUrl = `sms:+13213962008?&body=${encodeURIComponent(smsBody)}`;

      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      res.end(
        JSON.stringify({
          ok: true,
          booking,
          googleCalendarUrl,
          icsUrl,
          smsUrl,
        })
      );
      return;
    }

    if (isBookingHost && urlPath === "/api/calendar.ics" && req.method === "GET") {
      const id = String(parsedUrl.searchParams.get("id") || "").trim();
      const found = /^OR-\d{8}-[0-9A-F]{4,16}$/.test(id) ? readBookings().find((b) => b.bookingId === id) : null;
      if (!found) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Booking not found\n");
        return;
      }
      const ics = buildIcsContent(found);
      res.writeHead(200, {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${found.bookingId}.ics"`,
      });
      res.end(ics);
      return;
    }

    const relDocRoot = VHOSTS[host];
    if (!relDocRoot) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`No site configured for Host: ${req.headers.host || "(none)"}\n`);
      return;
    }

    const docRootAbs = path.join(DOMAINS_ROOT, relDocRoot);
    const filePath = await resolveFile(docRootAbs, rawUrl);
    if (!filePath) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found\n");
      return;
    }

    const data = await fsp.readFile(filePath);
    res.writeHead(200, { "Content-Type": contentTypeFor(filePath) });
    res.end(data);
  } catch (err) {
    if (res.headersSent || res.destroyed) return;
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal error\n");
  }
});

const listeners = HOSTS.map((host) => {
  const srv = host === HOSTS[0] ? server : createServerFor(server.listeners("request")[0]);
  srv.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error(`domains-server cannot listen on http://${host}:${PORT}: ${err && err.code ? err.code : err}`);
  });
  srv.listen(PORT, host, () => {
    // eslint-disable-next-line no-console
    console.log(`domains-server listening on http://${host}:${PORT} (sites: ${SITES.join(", ")})`);
  });
  return srv;
});

export { VHOSTS, SITES, HOSTS, listeners, resolveFile, contentTypeFor, hostOnly };
