#!/usr/bin/env node
/**
 * Omega Sentry MCP Server
 * Provides Stripe revenue, content generation, and protocol tools
 * Transport: stdio (Claude Code subprocess)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import "dotenv/config";

import { registerStripeTools } from "./tools/stripe.js";
import { registerContentTools } from "./tools/content.js";
import { registerProtocolTools } from "./tools/protocol.js";

const server = new McpServer({
  name: "omega-sentry",
  version: "1.0.0",
});

// Register all tool groups
registerStripeTools(server);
registerContentTools(server);
registerProtocolTools(server);

// Start stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
