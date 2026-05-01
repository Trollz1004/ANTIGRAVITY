import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  { name: "square-status", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

const SQUARE_BASE = process.env.SQUARE_ENV === "production" 
  ? "https://connect.squareup.com" 
  : "https://connect.squareupsandbox.com";
const SQUARE_TOKEN = process.env.SQUARE_ACCESS_TOKEN || "";

async function squareRequest(path: string, method = "GET", body?: any) {
  const res = await fetch(`${SQUARE_BASE}${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${SQUARE_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

server.setRequestHandler("tools/list" as any, async () => ({
  tools: [
    {
      name: "square_get_payment_status",
      description: "Get status of a Square payment by ID",
      inputSchema: { type: "object", properties: { paymentId: { type: "string" } }, required: ["paymentId"] }
    },
    {
      name: "square_list_transactions",
      description: "List recent Square payments (Payments API)",
      inputSchema: { type: "object", properties: { locationId: { type: "string" }, limit: { type: "number", default: 10 } }, required: ["locationId"] }
    }
  ]
}));

server.setRequestHandler("tools/call" as any, async (request: any) => {
  const { name, arguments: args } = request.params;
  try {
    if (name === "square_get_payment_status") {
      const result = await squareRequest(`/v2/payments/${args.paymentId}`);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } else if (name === "square_list_transactions") {
      const result = await squareRequest(`/v2/payments?location_id=${args.locationId}&limit=${args.limit || 10}`);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
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
