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
  { host: "onlinerecycle.net", path: "/", expectTitle: "OnlineRecycle.net | Florida Electronics Recycling & Free Pickup" },
  { host: "www.onlinerecycle.net", path: "/", expectTitle: "OnlineRecycle.net | Florida Electronics Recycling & Free Pickup" },
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
  const child = spawn(process.execPath, [SERVER_PATH], {
    env: { ...process.env, DOMAINS_SERVER_PORT: String(TEST_PORT), ORC_STATS_DIR: tmpStatsDir },
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

    // /health check
    const health = await getPath("127.0.0.1", TEST_PORT, "/health");
    const healthBody = JSON.parse(health.body);
    if (health.status !== 200 || healthBody.service !== "domains-server") {
      console.error("FAIL: /health did not report domains-server identity:", health.body);
      failures++;
    } else {
      console.log("PASS: /health ->", health.body);
    }

    for (const { host, path: urlPath, expectTitle } of CASES) {
      const r = await get("127.0.0.1", TEST_PORT, host, urlPath, {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
      });
      const titleMatch = r.body.match(/<title>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : null;
      // The founder-ruled tribute phrase must stay off customer-facing pages.
      const tributeRe = /CLAUDE(?:'|&#39;|&apos;|&rsquo;|\u2019)?s N Joshua|TeamClaudeForLife/i;
      if (tributeRe.test(r.body)) {
        console.error(`FAIL: Host=${host} path=${urlPath} -> tribute phrase present on a customer surface`);
        failures++;
      } else if (r.status === 200 && title === expectTitle) {
        console.log(`PASS: Host=${host} path=${urlPath} -> title "${title}"`);
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
  } finally {
    child.kill();
    fs.rmSync(tmpStatsDir, { recursive: true, force: true });
  }

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log("\nAll vhost checks passed.");
  }
}

main();
