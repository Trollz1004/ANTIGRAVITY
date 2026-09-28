#!/usr/bin/env node
// Domains static site server — no dependencies.
// Virtual-host static file server: routes by the Host header to one of
// three landing-site document roots, plus a /health identity probe.
//
// Bound to 127.0.0.1:9160 by design — this is a local-only origin that the
// cloudflared tunnel points at (see ~/.cloudflared/config.yml ingress
// rules); it is not meant to be reachable directly from the LAN or WAN.
//
// Start: node ops/domains-server/server.mjs

import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const DOMAINS_ROOT = path.join(REPO_ROOT, "domains");

// Ruled 2026-09-28 (Joshua: "use the endpoints always of 192, not localhost"):
// listen on the Sabretooth LAN address so http://192.168.0.8:9160/ answers for
// the screenshot health cron and JARVIS, and on loopback for the House's own
// probe and the cloudflared tunnel. Never every interface. DOMAINS_SERVER_HOST
// overrides with a comma-separated list.
const HOSTS = (process.env.DOMAINS_SERVER_HOST || "127.0.0.1,192.168.0.8").split(",").map((h) => h.trim()).filter(Boolean);
const PORT = Number(process.env.DOMAINS_SERVER_PORT || 9160);

// Host header -> document root (relative to DOMAINS_ROOT).
// onlinerecycle.net is a Vite build; served from its dist/ output.
const VHOSTS = {
  "dream-online.net": "dream-online.net",
  "www.dream-online.net": "dream-online.net",
  "untilnokidinneed.com": "untilnokidinneed.com",
  "www.untilnokidinneed.com": "untilnokidinneed.com",
  "onlinerecycle.net": path.join("onlinerecycle.net", "dist"),
  "www.onlinerecycle.net": path.join("onlinerecycle.net", "dist"),
};

const SITES = ["dream-online.net", "untilnokidinneed.com", "onlinerecycle.net"];

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
};

function contentTypeFor(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function hostOnly(hostHeader) {
  if (!hostHeader) return "";
  return hostHeader.split(",")[0].trim().split(":")[0].toLowerCase();
}

async function resolveFile(docRootAbs, urlPath) {
  // Strip query string, decode, and prevent path traversal outside docRootAbs.
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
    // SPA-style fallback to index.html for unknown paths (no dot in last segment).
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
    const urlPath = req.url || "/";

    if (urlPath === "/health") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ service: "domains-server", sites: SITES }));
      return;
    }

    const relDocRoot = VHOSTS[host];
    if (!relDocRoot) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`No site configured for Host: ${req.headers.host || "(none)"}\n`);
      return;
    }

    const docRootAbs = path.join(DOMAINS_ROOT, relDocRoot);
    const filePath = await resolveFile(docRootAbs, urlPath);
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

// One listener per address: the same request handler, the same port, on the
// loopback and LAN addresses only. A bind failure on one address (for example
// the LAN address on a box that is not Sabretooth) is reported and the others
// keep serving, so the House probe on loopback never depends on the LAN NIC.
import { createServer as createServerFor } from "node:http";
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
