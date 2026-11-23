/**
 * OnlineRecycle booking page — calendar embed reference notice and
 * "Schedule another window" reset. Run: node --test ops/domains-server/
 *
 * Pins the static page contract for domains/onlinerecycle.net/site/index.html:
 *   1. #gcal-embed-container carries a note saying the form below (#booking-form)
 *      is what issues the instant OR- reference ID, the .ics file, and the SMS
 *      confirmation link.
 *   2. #booking-confirm-box has a "Schedule another window" button whose handler
 *      hides #booking-confirm-box, selects the next available slot in
 *      renderSlots(), and focuses #date-strip.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.join(__dirname, "..", "..", "..", "domains", "onlinerecycle.net", "site", "index.html");

function readPage() {
  return fs.readFileSync(PAGE, "utf8");
}

function sliceBetween(html, startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  assert.notEqual(start, -1, `missing ${startMarker}`);
  const end = html.indexOf(endMarker, start);
  assert.notEqual(end, -1, `missing ${endMarker} after ${startMarker}`);
  return html.slice(start, end);
}

test("calendar embed note: submitting the form below issues the OR- id, .ics file, and SMS link", () => {
  const html = readPage();
  const embed = sliceBetween(html, 'id="gcal-embed-container"', "</div>");
  const note = embed.toLowerCase();
  assert.match(note, /#booking-form/, "note names #booking-form");
  assert.match(note, /\bor-/, "note names the instant OR- reference ID");
  assert.match(note, /\.ics/, "note names the .ics file");
  assert.match(note, /sms/, "note names the SMS confirmation link");
  assert.match(note, /below/, "note says the form below is what issues them");
  assert.match(note, /submitting|submit/, "note says submitting the form issues them");
});

test("confirm box has a Schedule another window button that resets the booking window", () => {
  const html = readPage();
  const box = sliceBetween(html, 'id="booking-confirm-box"', "</div>\r\n          </div>");
  const button = box.match(/<button\b[^>]*>[\s\S]*?<\/button>/gi) || [];
  const scheduleAnother = button.find((b) => /schedule another window/i.test(b));
  assert.ok(scheduleAnother, "#booking-confirm-box has a Schedule another window button");

  const script = sliceBetween(html, "function renderSlots()", "</script>");
  const handler = script.match(/schedule another window[\s\S]{0,1600}/i);
  assert.ok(handler, "page script handles the Schedule another window button");
  const body = handler[0];
  assert.match(body, /booking-confirm-box/, "handler hides #booking-confirm-box");
  assert.match(body, /display\s*=\s*['"]none['"]/, "handler sets display to none");
  assert.match(body, /renderSlots\(\)/, "handler selects the next available slot in renderSlots()");
  assert.match(body, /date-strip/, "handler focuses #date-strip");
  assert.match(body, /\.focus\(\)/, "handler calls focus()");
});
