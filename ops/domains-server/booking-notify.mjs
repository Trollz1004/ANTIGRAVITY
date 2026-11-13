// Owner notification for new onlinerecycle.net bookings.
// Sends one plain-text Telegram message per booking. Never throws and never
// logs the bot token. Failures are appended to notify-errors.log beside
// bookings.jsonl.

import fs from "node:fs";
import path from "node:path";

export const NOT_CONFIGURED_LINE =
  "[booking-notify] notifications are not configured (set ORC_NOTIFY_TELEGRAM_TOKEN and ORC_NOTIFY_TELEGRAM_CHAT)";

export function formatBookingMessage(booking) {
  const b = booking || {};
  const lines = [
    "New pickup request",
    `Name: ${b.fullName || ""}`,
    `Phone: ${b.phone || ""}`,
    `City/ZIP: ${[b.city, b.zip].filter(Boolean).join(" ")}`,
    `Devices: ${b.deviceCount || ""}`,
    `Data handling: ${b.notes || "not specified"}`,
  ];
  if (b.date || b.slotLabel) lines.push(`Window: ${[b.date, b.slotLabel].filter(Boolean).join(" ")}`);
  lines.push(`Items: ${String(b.deviceList || "").slice(0, 160)}`);
  return lines.join("\n");
}

function logFailure(logDir, message) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(path.join(logDir, "notify-errors.log"), `${new Date().toISOString()} ${message}\n`, "utf8");
  } catch {
    // nothing more can be done
  }
}

// Returns true when a message was accepted by Telegram, false otherwise.
export async function notifyBooking(booking, { env = process.env, fetchImpl = globalThis.fetch, logDir, log = console.log } = {}) {
  try {
    const token = env.ORC_NOTIFY_TELEGRAM_TOKEN;
    const chat = env.ORC_NOTIFY_TELEGRAM_CHAT;
    if (!token || !chat) {
      log(NOT_CONFIGURED_LINE);
      return false;
    }
    const res = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: formatBookingMessage(booking) }),
    });
    if (!res || !res.ok) {
      logFailure(logDir, `send failed for ${booking && booking.bookingId}: HTTP ${res ? res.status : "no response"}`);
      return false;
    }
    return true;
  } catch (err) {
    let msg = String((err && err.message) || err);
    const token = env && env.ORC_NOTIFY_TELEGRAM_TOKEN;
    if (token) msg = msg.split(token).join("[redacted]");
    logFailure(logDir, `send error for ${booking && booking.bookingId}: ${msg}`);
    return false;
  }
}
