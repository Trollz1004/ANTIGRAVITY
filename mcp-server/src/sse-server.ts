#!/usr/bin/env node
/**
 * ANTIGRAVITY Sentry MCP Server — SSE Transport
 * Runs on port 3100, exposed via Cloudflare tunnel.
 * Connect from claude.ai or any MCP client via SSE.
 */

import http from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import 'dotenv/config';

import { registerContentTools } from './tools/content.js';
import { registerProtocolTools } from './tools/protocol.js';

const PORT = parseInt(process.env.MCP_PORT || '3100', 10);

// Track active transports by session ID
const transports = new Map<string, SSEServerTransport>();

const httpServer = http.createServer(async (req, res) => {
  // CORS headers for tunnel access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', server: 'antigravity-sentry', transport: 'sse' }));
    return;
  }

  // SSE endpoint — client connects here
  if (url.pathname === '/sse' && req.method === 'GET') {
    console.log(`[MCP] New SSE connection from ${req.socket.remoteAddress}`);

    const server = new McpServer({ name: 'antigravity-sentry', version: '1.0.1' });
    registerContentTools(server);
    registerProtocolTools(server);

    const transport = new SSEServerTransport('/messages', res);
    transports.set(transport.sessionId, transport);

    transport.onclose = () => {
      console.log(`[MCP] SSE session closed: ${transport.sessionId}`);
      transports.delete(transport.sessionId);
    };

    await server.connect(transport);
    return;
  }

  // Message endpoint — client POSTs messages here
  if (url.pathname === '/messages' && req.method === 'POST') {
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId || !transports.has(sessionId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid or missing sessionId' }));
      return;
    }

    const transport = transports.get(sessionId)!;
    await transport.handlePostMessage(req, res);
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

httpServer.listen(PORT, () => {
  console.log(`[MCP] ANTIGRAVITY Sentry SSE server running on port ${PORT}`);
  console.log(`[MCP] SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`[MCP] Health: http://localhost:${PORT}/health`);
  console.log(`[MCP] Tools: content bank, protocol info`);
});
