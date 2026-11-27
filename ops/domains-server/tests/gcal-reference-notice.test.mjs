/**
 * OnlineRecycle booking page — calendar embed reference notice and
 * "Schedule another window" reset. Run: node --test ops/domains-server/
 *
 * Pins the static page contract for domains/onlinerecycle.net/site/index.html:
 *   1. #gcal-embed-container carries a plain note saying to fill in the form below
 *      to get the reference number, calendar file, and text confirmation link.
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

test("calendar embed note: filling in the form below issues the reference number, calendar file, and text confirmation link", () => {
  const html = readPage();
  const embed = sliceBetween(html, 'id="gcal-embed-container"', "</div>");
  const note = embed.toLowerCase();
  assert.doesNotMatch(note, /#booking-form/, "note does not show customers the element id #booking-form");
  assert.doesNotMatch(note, /\bor-\b/, "note does not show the prefix OR-");
  assert.match(note, /reference number/, "note names the reference number in plain words");
  assert.match(note, /calendar file/, "note names the calendar file in plain words");
  assert.match(note, /text confirmation link/, "note names the text confirmation link in plain words");
  assert.match(note, /form below/, "note says to fill in the form below");
  assert.match(note, /submit/, "note says as soon as you submit");
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
