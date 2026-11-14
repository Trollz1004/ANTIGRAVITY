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
  { host: "dream-online.net", path: "/", expectTitle: "DREAM Online" },
  { host: "www.dream-online.net", path: "/", expectTitle: "DREAM Online" },
  { host: "dream-online.net", path: "/privacy", expectTitle: "Privacy Policy - ANTIGRAVITY Backup (dream-online.net)" },
  { host: "dream-online.net", path: "/terms", expectTitle: "Terms of Service - ANTIGRAVITY Backup (dream-online.net)" },
  { host: "untilnokidinneed.com", path: "/", expectTitle: "Until No Kid In Need" },
  { host: "www.untilnokidinneed.com", path: "/", expectTitle: "Until No Kid In Need" },
  { host: "onlinerecycle.net", path: "/", expectTitle: "OnlineRecycle.net | Florida Electronics Recycling & Free Pickup" },
  { host: "www.onlinerecycle.net", path: "/", expectTitle: "OnlineRecycle.net | Florida Electronics Recycling & Free Pickup" },
  { host: "onlinerecycle.net", path: "/service-areas", expectTitle: "Central Florida Electronics Recycling & Free Pickup Areas", forbidText: ["NOT IN INPUTS", "Refused Equipment"] },
  { host: "onlinerecycle.net", path: "/service-areas.html", expectTitle: "Central Florida Electronics Recycling & Free Pickup Areas", forbidText: ["NOT IN INPUTS", "Refused Equipment"] },
  { host: "www.onlinerecycle.net", path: "/service-areas", expectTitle: "Central Florida Electronics Recycling & Free Pickup Areas", forbidText: ["NOT IN INPUTS", "Refused Equipment"] },
];

function get(host, port, hostHeader, urlPath = "/") {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host, port, path: urlPath, method: "GET", headers: { Host: hostHeader } },
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

    for (const { host, path: urlPath, expectTitle, forbidText } of CASES) {
      const r = await get("127.0.0.1", TEST_PORT, host, urlPath);
      const titleMatch = r.body.match(/<title>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(/&amp;/g, "&") : null;
      // The founder-ruled tribute phrase must stay off customer-facing pages.
      const tributeRe = /CLAUDE(?:'|&#39;|&apos;|&rsquo;|\u2019)?s N Joshua|TeamClaudeForLife/i;
      const forbiddenHit = Array.isArray(forbidText)
        ? forbidText.find((needle) => r.body.toLowerCase().includes(needle.toLowerCase()))
        : null;
      if (tributeRe.test(r.body)) {
        console.error(`FAIL: Host=${host} path=${urlPath} -> tribute phrase present on a customer surface`);
        failures++;
      } else if (forbiddenHit) {
        console.error(`FAIL: Host=${host} path=${urlPath} -> forbidden text "${forbiddenHit}" present`);
        failures++;
      } else if (r.status === 200 && title === expectTitle) {
        console.log(`PASS: Host=${host} path=${urlPath} -> title "${title}" (no forbidden text)`);
      } else {
        console.error(
          `FAIL: Host=${host} path=${urlPath} -> status=${r.status} title="${title}" (expected "${expectTitle}")`
        );
        failures++;
      }
    }

    // Service Areas content, navigation link, sitemap & structured data check
    const home = await get("127.0.0.1", TEST_PORT, "onlinerecycle.net", "/");
    const sitemap = await get("127.0.0.1", TEST_PORT, "onlinerecycle.net", "/sitemap.xml");
    const sa = await get("127.0.0.1", TEST_PORT, "onlinerecycle.net", "/service-areas");
    const requiredSnippets = [
      "Sorrento",
      "Lake County",
      "Orange County",
      "Seminole County",
      "(321) 396-2008",
      "https://schema.org/FAQPage",
      "https://schema.org/Question",
    ];
    const forbiddenServiceAreaSnippets = [
      "NOT IN INPUTS",
      "Mount Dora",
      "Eustis",
      "Tavares",
      "Leesburg",
      "Clermont",
      "Apopka",
      "Orlando",
      "Winter Park",
      "Winter Garden",
      "Ocoee",
      "Sanford",
      "Lake Mary",
      "Longwood",
      "Altamonte Springs",
      "Oviedo",
      "32776",
      "28.7953",
      "at your home or business",
      "central drop-off",
      "run on a battery",
      "personal and business data",
    ];
    const missingSnippet = requiredSnippets.find((s) => !sa.body.includes(s));
    const forbiddenSaSnippet = forbiddenServiceAreaSnippets.find((s) => sa.body.includes(s));
    if (forbiddenSaSnippet) {
      console.error(`FAIL: /service-areas contains forbidden snippet '${forbiddenSaSnippet}'`);
      failures++;
    } else if (missingSnippet) {
      console.error(`FAIL: /service-areas missing expected content: ${missingSnippet}`);
      failures++;
    } else if (!home.body.includes("/service-areas.html") || !sitemap.body.includes("https://onlinerecycle.net/service-areas.html")) {
      console.error("FAIL: home page navigation or sitemap.xml missing /service-areas.html link");
      failures++;
    } else {
      console.log("PASS: /service-areas renders Sorrento and Lake, Orange, and Seminole Counties, FAQ structured data, nav/sitemap links, and omits unverified towns/postal/geo");
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
