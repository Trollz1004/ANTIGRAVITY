import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getEnvDriftSummary,
  getMissionStatus,
  runTool,
  toolCatalog
} from "./lib/mission-data.mjs";

const APP_DIR = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(APP_DIR, "public");
const PORT = Number(process.env.PORT || 8788);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(body, null, 2));
}

function sendText(response, statusCode, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, {
    "content-type": contentType,
    "cache-control": "no-store"
  });
  response.end(body);
}

async function readRequestJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text.trim()) return {};
  return JSON.parse(text);
}

async function serveStatic(response, pathname) {
  const requested = pathname === "/" ? "/widget.html" : pathname;
  const safePath = path.normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const absolutePath = path.join(PUBLIC_DIR, safePath);
  const publicRoot = `${PUBLIC_DIR}${path.sep}`;
  if (!absolutePath.startsWith(publicRoot)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const file = await fs.readFile(absolutePath);
    const contentType = MIME_TYPES[path.extname(absolutePath)] || "application/octet-stream";
    response.writeHead(200, {
      "content-type": contentType,
      "cache-control": "no-store"
    });
    response.end(file);
  } catch (error) {
    sendText(response, error.code === "ENOENT" ? 404 : 500, error.message);
  }
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || "127.0.0.1"}`);

  try {
    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, { ok: true, app: "antigravity-mission-control-chatgpt-app" });
      return;
    }

    if (request.method === "GET" && url.pathname === "/mcp/manifest") {
      sendJson(response, 200, {
        name: "ANTIGRAVITY Mission Control",
        description: "Read-only/draft-first mission coordination tools for ChatGPT Apps SDK wiring.",
        widget: "/widget.html",
        tools: toolCatalog()
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/mission/status") {
      sendJson(response, 200, await getMissionStatus());
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/env/drift") {
      sendJson(response, 200, await getEnvDriftSummary());
      return;
    }

    if (request.method === "POST" && url.pathname.startsWith("/api/tools/")) {
      const toolName = url.pathname.split("/").pop();
      const input = await readRequestJson(request);
      sendJson(response, 200, await runTool(toolName, input));
      return;
    }

    if (request.method === "GET") {
      await serveStatic(response, url.pathname);
      return;
    }

    sendText(response, 405, "Method not allowed");
  } catch (error) {
    sendJson(response, 500, {
      error: error.message,
      safety: "No destructive action was attempted."
    });
  }
}

if (process.argv.includes("--check")) {
  const [status, drift] = await Promise.all([getMissionStatus(), getEnvDriftSummary()]);
  console.log(
    JSON.stringify(
      {
        ok: true,
        tools: toolCatalog().map((tool) => tool.name),
        safeSources: status.safeSources.length,
        envEvidence: drift.evidenceAvailable
      },
      null,
      2
    )
  );
  process.exit(0);
}

http.createServer(handleRequest).listen(PORT, "127.0.0.1", () => {
  console.log(`ANTIGRAVITY Mission Control app listening on http://127.0.0.1:${PORT}`);
});
