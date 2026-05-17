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
  if (!SQUARE_TOKEN) {
    throw new Error("SQUARE_ACCESS_TOKEN is not configured. Returning mock data.");
  }
  const res = await fetch(`${SQUARE_BASE}${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${SQUARE_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Square API error: ${res.status} - ${errorText}`);
  }
  return res.json();
}

server.setRequestHandler("tools/list" as any, async () => ({
  tools: [
    {
      name: "square_check_status",
      description: "Check Square payment infrastructure status. Returns 'OK' if API is reachable.",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "square_list_locations",
      description: "List Square locations associated with the account.",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "square_get_transactions",
      description: "List recent Square transactions (Payments API).",
      inputSchema: { 
        type: "object", 
        properties: { 
          locationId: { type: "string", description: "Optional: Filter by location ID." }, 
          limit: { type: "number", default: 10, description: "Optional: Maximum number of transactions to retrieve (default: 10, max: 100)." } 
        } 
      }
    }
  ]
}));

server.setRequestHandler("tools/call" as any, async (request: any) => {
  const { name, arguments: args } = request.params;
  try {
    if (!SQUARE_TOKEN && name !== "square_check_status") { // Allow check_status to return mock for not configured
        if (name === "square_list_locations") {
            return { content: [{ type: "text", text: JSON.stringify({ mock: true, locations: [{ id: "mock_location_1", name: "Mock Location A" }] }) }] };
        }
        if (name === "square_get_transactions") {
            return { content: [{ type: "text", text: JSON.stringify({ mock: true, transactions: [{ id: "mock_transaction_1", amount: 1000, currency: "USD" }] }) }] };
        }
        throw new Error("SQUARE_ACCESS_TOKEN is not configured. Returning mock data or failing if not configured.");
    }

    if (name === "square_check_status") {
      if (!SQUARE_TOKEN) {
        return { content: [{ type: "text", text: JSON.stringify({ status: "WARNING", message: "Square API token not configured. Cannot verify real-time status." }) }] };
      }
      // Attempt a lightweight API call to check connectivity
      await squareRequest("/v2/locations", "HEAD"); // HEAD request is lighter than GET
      return { content: [{ type: "text", text: JSON.stringify({ status: "OK", message: "Square API is reachable." }) }] };
    } else if (name === "square_list_locations") {
      const result = await squareRequest("/v2/locations");
      return { content: [{ type: "text", text: JSON.stringify(result.locations) }] };
    } else if (name === "square_get_transactions") {
      const limit = Math.min(args.limit || 10, 100); // Max limit of 100 for payments API
      let url = `/v2/payments?limit=${limit}`;
      if (args.locationId) {
        url += `&location_id=${args.locationId}`;
      }
      const result = await squareRequest(url);
      return { content: [{ type: "text", text: JSON.stringify(result.payments) }] };
    }
    throw new Error(`Unknown tool: ${name}`);
  } catch (error: any) {
    if (error.message.includes("SQUARE_ACCESS_TOKEN is not configured")) {
        return { content: [{ type: "text", text: JSON.stringify({ status: "WARNING", message: error.message }) }] };
    }
    return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
