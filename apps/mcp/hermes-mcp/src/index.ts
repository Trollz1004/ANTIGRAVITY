// Hermes MCP server · routes prompts via the local Hermes router (11435).
// Anthropic MCP pattern: stdio transport · zod-validated tools · no secrets.
// Doctrine: Hermes routes to any provider EXCEPT Anthropic (joshua's cost rule).
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import "dotenv/config";

const ROUTER = process.env.HERMES_ROUTER_URL ?? "http://localhost:11435";
const HEALTH = process.env.HERMES_HEALTH_URL ?? "http://localhost:8000/healthz";

const RouteIn = z.object({
  model:  z.string().min(1),
  prompt: z.string().min(1),
  ctx:    z.string().optional(),
});

const server = new Server(
  { name: "hermes-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: "hermes.route",  description: "Route a prompt through the local Hermes router. Returns the model response.", inputSchema: { type: "object", properties: { model: { type: "string" }, prompt: { type: "string" }, ctx: { type: "string" } }, required: ["model", "prompt"] } },
    { name: "hermes.health", description: "Check Hermes router liveness. Returns ok/down + latency.", inputSchema: { type: "object", properties: {} } },
    { name: "hermes.list_models", description: "List models reachable via Hermes.", inputSchema: { type: "object", properties: {} } },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  if (name === "hermes.route") {
    const p = RouteIn.parse(args);
    const t0 = Date.now();
    const r = await fetch(`${ROUTER}/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: p.model, messages: [{ role: "user", content: p.prompt }] }),
    });
    const body = await r.text();
    return { content: [{ type: "text", text: `route ${p.model} ${r.status} ${Date.now() - t0}ms\n\n${body}` }] };
  }

  if (name === "hermes.health") {
    const t0 = Date.now();
    try {
      const r = await fetch(HEALTH, { signal: AbortSignal.timeout(2000) });
      return { content: [{ type: "text", text: `health ${r.status} ${Date.now() - t0}ms` }] };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { content: [{ type: "text", text: `health down · ${msg}` }] };
    }
  }

  if (name === "hermes.list_models") {
    try {
      const r = await fetch(`${ROUTER}/v1/models`, { signal: AbortSignal.timeout(2000) });
      const t = await r.text();
      return { content: [{ type: "text", text: t }] };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { content: [{ type: "text", text: `list_models error · ${msg}` }] };
    }
  }

  throw new Error(`unknown tool: ${name}`);
});

await server.connect(new StdioServerTransport());
