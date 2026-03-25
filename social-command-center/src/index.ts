#!/usr/bin/env node

/**
 * Social Command Center MCP — Entry Point
 * 
 * Stdio transport only (same as brain-mcp default).
 * Any AI can connect via .mcp.json config.
 * Zero secrets. Zero auth required. Pure visibility.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createSocialCommandServer } from "./server.js";

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  const server = createSocialCommandServer();
  await server.connect(transport);
  process.stderr.write("social-command-center MCP server running on stdio\n");
}

await main();
