import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as fs from "fs";
import * as path from "path";
import yaml from "js-yaml";

const server = new Server(
  { name: "policy-boundary", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

const POLICY_FILE = process.env.POLICY_FILE || "/mnt/c/ANTIGRAVITY/AGENTS.md";

server.setRequestHandler("tools/list" as any, async () => ({
  tools: [
    {
      name: "policy_check_file_edit",
      description: "Check if a file edit is allowed per mission policy (e.g., protected files)",
      inputSchema: { type: "object", properties: { filePath: { type: "string" } }, required: ["filePath"] }
    },
    {
      name: "policy_check_agent_authority",
      description: "Check if an agent has authority to perform an action",
      inputSchema: { type: "object", properties: { agentId: { type: "string" }, action: { type: "string" } }, required: ["agentId", "action"] }
    },
    {
      name: "policy_read_mission_statement",
      description: "Read the current mission statement from AGENTS.md",
      inputSchema: { type: "object", properties: {} }
    }
  ]
}));

server.setRequestHandler("tools/call" as any, async (request: any) => {
  const { name, arguments: args } = request.params;
  try {
    if (name === "policy_check_file_edit") {
      const protectedFiles = [".claude/", "CLAUDE.md", "AGENTS.md", ".mcp.json"];
      const isProtected = protectedFiles.some(f => args.filePath.startsWith(f));
      return { content: [{ type: "text", text: JSON.stringify({ allowed: !isProtected, reason: isProtected ? "Protected file per AGENTS.md" : "Allowed" }) }] };
    } else if (name === "policy_check_agent_authority") {
      const trustedAgents = ["3ff8bba5-b2dd-4c1b-9516-43d2f9e801b7", "claude-code", "gemini", "codex"];
      const hasAuthority = trustedAgents.includes(args.agentId) || args.agentId === "joshlcoleman";
      return { content: [{ type: "text", text: JSON.stringify({ hasAuthority, reason: hasAuthority ? "Trusted agent" : "Untrusted agent" }) }] };
    } else if (name === "policy_read_mission_statement") {
      const content = fs.readFileSync(POLICY_FILE, "utf-8");
      const missionMatch = content.match(/PERPETUAL MISSION GUARANTEE[\s\S]*?(?=\n---)/);
      return { content: [{ type: "text", text: missionMatch ? missionMatch[0] : "Mission statement not found" }] };
    }
    throw new Error(`Unknown tool: ${name}`);
  } catch (error: any) {
    return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
