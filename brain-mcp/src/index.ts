#!/usr/bin/env node

import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { createHash, timingSafeEqual } from "node:crypto";

import "dotenv/config";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { loadBrainConfig } from "./config.js";
import { createBrainServer, type AuthContext } from "./server.js";
import { BrainStateStore } from "./state.js";

const config = loadBrainConfig();
const state = new BrainStateStore(config);

function sha256(input: string): string {
  return `sha256:${createHash("sha256").update(input, "utf8").digest("hex")}`;
}

function getRemoteAddress(req: IncomingMessage): string | undefined {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim();
  }

  return req.socket.remoteAddress ?? undefined;
}

function authenticateHttpRequest(req: IncomingMessage): AuthContext {
  const remoteIp = getRemoteAddress(req);
  if (!config.http.requireAuth) {
    return { remoteIp };
  }

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new Error("Missing bearer token.");
  }

  const tokenHash = sha256(header.slice("Bearer ".length));
  const platform = config.platforms.find((entry) => {
    if (!entry.tokenHash) {
      return false;
    }

    const left = Buffer.from(entry.tokenHash);
    const right = Buffer.from(tokenHash);
    if (left.length !== right.length) {
      return false;
    }

    return timingSafeEqual(left, right);
  });

  if (!platform) {
    throw new Error("Invalid bearer token.");
  }

  if (remoteIp && !platform.allowedIps.includes(remoteIp)) {
    state.recordAudit("credential_migration_attempt", {
      platformId: platform.id,
      remoteIp,
    });
    throw new Error(
      `Credential migration attempt. ${platform.id} is not allowed from ${remoteIp}.`,
    );
  }

  return {
    authenticatedPlatformId: platform.id,
    remoteIp,
  };
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) {
        resolve(undefined);
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

async function runHttpServer(): Promise<void> {
  createServer(async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          server: "brain-mcp",
          transport: "http",
          auth_required: config.http.requireAuth,
          host: config.http.host,
          port: config.http.port,
        }),
      );
      return;
    }

    if (req.url !== "/mcp" && req.url !== "/") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    try {
      const authContext = authenticateHttpRequest(req);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      const server = createBrainServer(config, state, authContext);
      await server.connect(transport);
      const body = req.method === "POST" ? await readBody(req) : undefined;
      await transport.handleRequest(req, res, body);
    } catch (error) {
      if (!res.headersSent) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error:
              error instanceof Error ? error.message : "Unauthorized request.",
          }),
        );
      }
    }
  }).listen(config.http.port, config.http.host, () => {
    process.stderr.write(
      `brain-mcp HTTP server listening on http://${config.http.host}:${config.http.port}/mcp\n`,
    );
  });
}

async function main(): Promise<void> {
  if ((process.env.BRAIN_TRANSPORT ?? "stdio") === "http") {
    await runHttpServer();
    return;
  }

  const transport = new StdioServerTransport();
  const server = createBrainServer(config, state);
  await server.connect(transport);
}

await main();
