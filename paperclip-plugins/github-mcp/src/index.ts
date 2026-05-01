import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Octokit } from "@octokit/rest";

const server = new Server(
  { name: "github-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

server.setRequestHandler("tools/list" as any, async () => ({
  tools: [
    {
      name: "github_list_repos",
      description: "List GitHub repositories for a user",
      inputSchema: { type: "object", properties: { username: { type: "string" } }, required: ["username"] }
    },
    {
      name: "github_list_issues",
      description: "List issues for a GitHub repository",
      inputSchema: { type: "object", properties: { owner: { type: "string" }, repo: { type: "string" }, state: { type: "string", enum: ["open", "closed", "all"] } }, required: ["owner", "repo"] }
    }
  ]
}));

server.setRequestHandler("tools/call" as any, async (request: any) => {
  const { name, arguments: args } = request.params;
  try {
    if (name === "github_list_repos") {
      const { data } = await octokit.repos.listForUser({ username: args.username });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    } else if (name === "github_list_issues") {
      const { data } = await octokit.issues.listForRepo({ owner: args.owner, repo: args.repo, state: args.state || "open" });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
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
