#!/usr/bin/env node
// Direct booking buttons on the OnlineRecycle static pages.
// Run: node --test ops/domains-server/

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "domains",
  "onlinerecycle.net",
  "site"
);

function page(name) {
  return fs.readFileSync(path.join(SITE, name), "utf8");
}

// The bottom scheduler call to action is the last /#book link on the page.
// The pickup button has to sit beside it, so it must come after that link.
function afterLastBookLink(html) {
  const marker = 'href="/#book"';
  const at = html.lastIndexOf(marker);
  assert.notEqual(at, -1, "page has no /#book scheduler link");
  return html.slice(at);
}

test("service areas page offers a direct route pickup button beside the bottom scheduler", () => {
  const tail = afterLastBookLink(page("service-areas.html"));
  assert.match(
    tail,
    /<a\b[^>]*href="\/\?service=pickup#book"[^>]*>\s*Request Free Route Pickup\s*<\/a>/
  );
});

test("about page offers a direct route pickup button beside the bottom scheduler", () => {
  const tail = afterLastBookLink(page("about.html"));
  assert.match(
    tail,
    /<a\b[^>]*href="\/\?service=pickup#book"[^>]*>\s*Request Free Route Pickup\s*<\/a>/
  );
});

test("disclaimer page links both booking modes", () => {
  const html = page("disclaimer.html");
  assert.match(html, /<a\b[^>]*href="\/#book"[^>]*>\s*Book Drop-Off\s*<\/a>/);
  assert.match(html, /<a\b[^>]*href="\/\?service=pickup#book"[^>]*>\s*Request Pickup\s*<\/a>/);
});
