// Paperweight MCP · sticky-note delegation engine
// Reads/writes the existing paperclip:3100 API. No secrets baked in.
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import "dotenv/config";

const API = process.env.PAPERWEIGHT_API ?? "http://localhost:3100/api/paperweight";

const CreateIn = z.object({
  agent: z.enum(["opus-ceo","gemini-ceo","hermes-001","codex","gemma4","pi","cupid","perplexity"]),
  brief: z.string().min(4).max(2000),
});
const CompleteIn = z.object({ id: z.string().min(1), result: z.string().optional() });

const server = new Server({ name: "paperweight-mcp", version: "0.1.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: "paperweight.list",     description: "List delegated tasks (optional status filter)", inputSchema: { type: "object", properties: { status: { type: "string", enum: ["pending","progress","done","all"] } } } },
    { name: "paperweight.create",   description: "Create a new sticky note · dispatch to an agent", inputSchema: { type: "object", properties: { agent: { type: "string" }, brief: { type: "string" } }, required: ["agent","brief"] } },
    { name: "paperweight.complete", description: "Mark a sticky complete (idempotent)", inputSchema: { type: "object", properties: { id: { type: "string" }, result: { type: "string" } }, required: ["id"] } },
    { name: "paperweight.audit",    description: "Audit trail since a timestamp", inputSchema: { type: "object", properties: { since: { type: "string" } } } },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  if (name === "paperweight.list") {
    const status = (args as { status?: string })?.status ?? "all";
    const r = await fetch(`${API}?status=${encodeURIComponent(status)}`);
    return { content: [{ type: "text", text: await r.text() }] };
  }
  if (name === "paperweight.create") {
    const p = CreateIn.parse(args);
    const r = await fetch(API, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agentId: p.agent, taskDescription: p.brief }),
    });
    return { content: [{ type: "text", text: await r.text() }] };
  }
  if (name === "paperweight.complete") {
    const p = CompleteIn.parse(args);
    const r = await fetch(`${API}/${encodeURIComponent(p.id)}/complete`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ result: p.result ?? null }),
    });
    return { content: [{ type: "text", text: await r.text() }] };
  }
  if (name === "paperweight.audit") {
    const since = (args as { since?: string })?.since ?? "";
    const r = await fetch(`${API}/audit?since=${encodeURIComponent(since)}`);
    return { content: [{ type: "text", text: await r.text() }] };
  }
  throw new Error(`unknown tool: ${name}`);
});

await server.connect(new StdioServerTransport());
