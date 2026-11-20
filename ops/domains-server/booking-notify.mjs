// Owner notification for new onlinerecycle.net bookings.
// Sends one plain-text Telegram message per booking. Never throws and never
// logs the bot token. Failures are retried three times with a timeout and
// appended to notify-errors.log beside bookings.jsonl.

import fs from "node:fs";
import path from "node:path";

export const NOT_CONFIGURED_LINE =
  "[booking-notify] notifications are not configured (set ORC_NOTIFY_TELEGRAM_TOKEN and ORC_NOTIFY_TELEGRAM_CHAT)";

export function isBookingNotifyConfigured(env = process.env) {
  const token = String((env && env.ORC_NOTIFY_TELEGRAM_TOKEN) || "").trim();
  const chat = String((env && env.ORC_NOTIFY_TELEGRAM_CHAT) || "").trim();
  return Boolean(token && chat);
}

export function formatBookingMessage(booking) {
  const b = booking || {};
  const isDropoff = String(b.serviceType || "").toLowerCase() === "dropoff";
  const serviceLabel = isDropoff ? "drop-off" : "pickup";
  const addressVal = b.address || (isDropoff ? "Sorrento drop-off" : "");
  const lines = [
    `New ${serviceLabel} request`,
    `Booking ID: ${b.bookingId || ""}`,
    `Service: ${serviceLabel}`,
    `Name: ${b.fullName || ""}`,
    `Phone: ${b.phone || ""}`,
  ];
  if (addressVal) lines.push(`Address: ${addressVal}`);
  lines.push(`City/ZIP: ${[b.city, b.zip].filter(Boolean).join(" ")}`);
  lines.push(`Devices: ${b.deviceCount || ""}`);
  lines.push(`Data handling: ${b.notes || "not specified"}`);
  if (b.date || b.slotLabel || b.slotCode) {
    lines.push(`Window: ${[b.date, b.slotLabel || b.slotCode].filter(Boolean).join(" ")}`);
  }
  lines.push(`Items: ${String(b.deviceList || "").slice(0, 160)}`);
  return lines.join("\n");
}

function logFailure(logDir, message) {
  if (!logDir) return;
  try {
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(path.join(logDir, "notify-errors.log"), `${new Date().toISOString()} ${message}\n`, "utf8");
  } catch {
    // nothing more can be done
  }
}

function fetchWithTimeout(fetchImpl, url, opts, timeoutMs) {
  const controller = new AbortController();
  let timer = null;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  const reqPromise = Promise.resolve().then(() => fetchImpl(url, { ...opts, signal: controller.signal }));
  return Promise.race([reqPromise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

// Returns true when a message was accepted by Telegram, false otherwise.
export async function notifyBooking(
  booking,
  {
    env = process.env,
    fetchImpl = globalThis.fetch,
    logDir,
    log = console.log,
    retries = 3,
    timeoutMs = 5000,
    retryDelayMs = 50,
  } = {}
) {
  const token = String((env && env.ORC_NOTIFY_TELEGRAM_TOKEN) || "").trim();
  const chat = String((env && env.ORC_NOTIFY_TELEGRAM_CHAT) || "").trim();
  if (!token || !chat) {
    log(NOT_CONFIGURED_LINE);
    return false;
  }

  const totalAttempts = Math.max(1, 1 + Number(retries || 0));
  let lastFailure = "";
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = JSON.stringify({ chat_id: chat, text: formatBookingMessage(booking) });

  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    try {
      const res = await fetchWithTimeout(
        fetchImpl,
        url,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        },
        timeoutMs
      );
      if (res && res.ok) {
        return true;
      }
      lastFailure = `send failed for ${booking && booking.bookingId} (attempt ${attempt}/${totalAttempts}): HTTP ${
        res ? res.status : "no response"
      }`;
    } catch (err) {
      let msg = String((err && err.message) || err);
      if (token) msg = msg.split(token).join("[redacted]");
      lastFailure = `send error for ${booking && booking.bookingId} (attempt ${attempt}/${totalAttempts}): ${msg}`;
    }
    if (attempt < totalAttempts && retryDelayMs > 0) {
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
  }

  logFailure(logDir, lastFailure);
  return false;
}
