// Daily counts: data/ewaste-intake/stats/YYYY-MM-DD.json holds
// { "page_views": n, "bookings": n }. No IPs, user agents or cookies are
// stored, and nothing here is exposed over HTTP.

import fs from "node:fs";
import path from "node:path";

export function dayKey(now = new Date()) {
  // en-CA formats as YYYY-MM-DD; the business day is Florida time.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(now);
}

function bump(statsDir, field, now) {
  try {
    fs.mkdirSync(statsDir, { recursive: true });
    const file = path.join(statsDir, `${dayKey(now)}.json`);
    let cur = { page_views: 0, bookings: 0 };
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
      cur = { page_views: Number(parsed.page_views) || 0, bookings: Number(parsed.bookings) || 0 };
    } catch {
      // missing or unreadable: start from zero
    }
    cur[field] += 1;
    fs.writeFileSync(file, `${JSON.stringify(cur)}\n`, "utf8");
  } catch {
    // counting must never break a request
  }
}

export const recordPageView = (statsDir, now = new Date()) => bump(statsDir, "page_views", now);
export const recordBooking = (statsDir, now = new Date()) => bump(statsDir, "bookings", now);
