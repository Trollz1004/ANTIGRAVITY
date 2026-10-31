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
// listen on the LAN address and on loopback for local probes and the cloudflared tunnel.
const HOSTS = (process.env.DOMAINS_SERVER_HOST || "127.0.0.1,192.168.0.15,192.168.0.8")
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

function clientIp(req) {
  return String(req.headers["cf-connecting-ip"] || req.socket.remoteAddress || "unknown");
}

function bookingAllowed(ip) {
  const now = Date.now();
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

function readRecentBookings() {
  try {
    if (!fs.existsSync(BOOKINGS_JSONL)) return [];
    const lines = fs.readFileSync(BOOKINGS_JSONL, "utf8").split(/\r?\n/).filter(Boolean);
    return lines
      .slice(-200)
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
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
    add: "collaboration@youandinotai.com",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
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
    .join("\\n");

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
    `SUMMARY:${summary.replace(/[\r\n]+/g, " ")}`,
    `LOCATION:${location.replace(/[\r\n]+/g, " ")}`,
    `DESCRIPTION:${desc}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

function readJsonBody(req, maxBytes = 32768) {
  return new Promise((resolve, reject) => {
    let bytes = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
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
      const recent = readRecentBookings();
      const bookedSlots = recent.map((b) => ({
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
        res.writeHead(429, { "Content-Type": "application/json; charset=utf-8" });
        res.end(
          JSON.stringify({
            ok: false,
            error: "Too many booking requests. Please call or text (321) 396-2008.",
          })
        );
        return;
      }
      const body = await readJsonBody(req);
      const serviceType = String(body.serviceType || "dropoff").toLowerCase() === "pickup" ? "pickup" : "dropoff";
      const fullName = String(body.fullName || "").trim();
      const phone = String(body.phone || "").trim();
      const email = String(body.email || "").trim();
      const date = String(body.date || "").trim();
      const slotCode = String(body.slotCode || "").trim();
      const slotLabel = String(body.slotLabel || slotCode).trim();
      const deviceCount = String(body.deviceCount || "1-5").trim();
      const deviceList = String(body.deviceList || "").trim();
      const organization = String(body.organization || "").trim();
      const address = String(body.address || "").trim();
      const city = String(body.city || "").trim();
      const zip = String(body.zip || "").trim();
      const notes = String(body.notes || "").trim();

      if (!fullName || !phone || !date || !slotCode || !deviceList) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(
          JSON.stringify({
            ok: false,
            error: "Please fill in your name, phone number, preferred date/time window, and device list.",
          })
        );
        return;
      }
      if (serviceType === "pickup" && !address) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(
          JSON.stringify({
            ok: false,
            error: "Please provide the pickup street address so we can route your Central Florida pickup.",
          })
        );
        return;
      }

      const dayCompact = date.replace(/-/g, "").slice(0, 8) || new Date().toISOString().slice(0, 10).replace(/-/g, "");
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
      await fsp.appendFile(BOOKINGS_JSONL, `${JSON.stringify(booking)}\n`, "utf8");

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
      const found = readRecentBookings().find((b) => b.bookingId === id);
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
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`Internal error: ${err && err.message ? err.message : String(err)}\n`);
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
