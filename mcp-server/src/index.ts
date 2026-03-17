#!/usr/bin/env node
/**
 * Omega Sentry MCP Server
 * Transport: stdio (Claude Code) or http (claude.ai remote connector)
 * Set TRANSPORT=http and MCP_HTTP_PORT=3100 for remote access
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import "dotenv/config";

import { registerStripeTools } from "./tools/stripe.js";
import { registerContentTools } from "./tools/content.js";
import { registerProtocolTools } from "./tools/protocol.js";

function createMcpServer(): McpServer {
  const s = new McpServer({ name: "omega-sentry", version: "1.0.0" });
  registerStripeTools(s);
  registerContentTools(s);
  registerProtocolTools(s);
  return s;
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : undefined); }
      catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

if (process.env.TRANSPORT === "http") {
  const PORT = parseInt(process.env.MCP_HTTP_PORT ?? "3100", 10);
  const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;

  createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // Optional bearer token auth
    if (AUTH_TOKEN) {
      const header = req.headers["authorization"] ?? "";
      if (header !== `Bearer ${AUTH_TOKEN}`) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }
    }

    if (req.url !== "/mcp" && req.url !== "/") {
      res.writeHead(404); res.end(); return;
    }

    // Stateless: fresh server + transport per request
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    const mcpServer = createMcpServer();
    await mcpServer.connect(transport);

    try {
      const body = req.method === "POST" ? await readBody(req) : undefined;
      await transport.handleRequest(req, res, body);
    } catch {
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    }
  }).listen(PORT, "127.0.0.1", () => {
    process.stderr.write(`omega-sentry MCP HTTP server on port ${PORT}\n`);
  });
} else {
  // Default: stdio for Claude Code
  const transport = new StdioServerTransport();
  await createMcpServer().connect(transport);
}
