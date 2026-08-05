import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { openDb } from "./db.js";
import { TOOLS } from "./tools/index.js";

const NAME = "mission-mcp";
const VERSION = "0.1.0";

async function createMcpServer() {
  const db = openDb();

  const server = new Server(
    { name: NAME, version: VERSION },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = TOOLS.find((t) => t.name === request.params.name);
    if (!tool) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Unknown tool: ${request.params.name}`,
          },
        ],
        isError: true,
      };
    }

    try {
      const result = tool.handler({ db }, request.params.arguments ?? {});
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  });

  return { server, db };
}

async function startStdio() {
  const { server } = await createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`[mission-mcp] ready on stdio\n`);
}

async function startHttp() {
  const { createServer } = await import("http");
  const express = (await import("express")).default;
  const {
    StreamableHTTPServerTransport,
  } = await import("@modelcontextprotocol/sdk/server/streamableHttp.js");

  const port = parseInt(process.env.MISSION_MCP_PORT ?? "3901", 10);
  const app = express();
  app.use(express.json());

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ ok: true, name: NAME, version: VERSION });
  });

  // MCP endpoint
  app.post("/mcp", async (req, res) => {
    const { server } = await createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const httpServer = createServer(app);
  httpServer.listen(port, "127.0.0.1", () => {
    process.stderr.write(
      `[mission-mcp] ready on http://127.0.0.1:${port}\n`
    );
  });
}

const transport = process.env.MISSION_MCP_TRANSPORT;

if (transport === "http") {
  startHttp().catch((err) => {
    process.stderr.write(`[mission-mcp] fatal: ${err.message}\n`);
    process.exit(1);
  });
} else {
  startStdio().catch((err) => {
    process.stderr.write(`[mission-mcp] fatal: ${err.message}\n`);
    process.exit(1);
  });
}
