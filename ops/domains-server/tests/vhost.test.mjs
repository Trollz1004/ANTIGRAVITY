#!/usr/bin/env node
// Fallback test for ops/domains-server/server.mjs (no vitest at repo root).
// Starts the real server on a scratch port, then curls each vhost with the
// relevant Host header and checks the returned <title> matches the site's
// own index.html — proving vhost routing is not falling through to another
// site's content. Also checks /health.
//
// Run: node ops/domains-server/tests/vhost.test.mjs

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.join(__dirname, "..", "server.mjs");
const TEST_PORT = 9161; // scratch port distinct from the real 9160 service

const CASES = [
  { host: "dream-online.net", expectTitle: "DREAM Online" },
  { host: "www.dream-online.net", expectTitle: "DREAM Online" },
  { host: "untilnokidinneed.com", expectTitle: "Until No Kid In Need" },
  { host: "www.untilnokidinneed.com", expectTitle: "Until No Kid In Need" },
  { host: "onlinerecycle.net", expectTitle: "DIY NAS & Web Host Setup Guide" },
  { host: "www.onlinerecycle.net", expectTitle: "DIY NAS & Web Host Setup Guide" },
];

function get(host, port, hostHeader) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host, port, path: "/", method: "GET", headers: { Host: hostHeader } },
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
  const child = spawn(process.execPath, [SERVER_PATH], {
    env: { ...process.env, DOMAINS_SERVER_PORT: String(TEST_PORT) },
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

    for (const { host, expectTitle } of CASES) {
      const r = await get("127.0.0.1", TEST_PORT, host);
      const titleMatch = r.body.match(/<title>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : null;
      if (r.status === 200 && title === expectTitle) {
        console.log(`PASS: Host=${host} -> title "${title}"`);
      } else {
        console.error(
          `FAIL: Host=${host} -> status=${r.status} title="${title}" (expected "${expectTitle}")`
        );
        failures++;
      }
    }
  } finally {
    child.kill();
  }

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log("\nAll vhost checks passed.");
  }
}

main();
