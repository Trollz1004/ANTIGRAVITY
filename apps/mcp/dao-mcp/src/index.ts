// DAO MCP · READ-ONLY reflection of the Perpetual Mission DAO spec.
// Cannot mutate state. Refuses any tool call that would alter Layer 1.
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// IMMUTABLE LAYER-1 CONSTANTS — match the public spec.
const SPEC = Object.freeze({
  CHARITABLE_FLOOR_PER_BUCKET: 0.10,          // IRS max deductible per qualifying bucket
  TAX_RESERVE_RATE_RANGE: [0.27, 0.40] as const,
  OPS_BUDGET_CAP_RATE: 0.62,
  GATEWAYS: [
    "SQUARE_YOUANDINOTAI","STRIPE_MAIN","PAYPAL_LEGACY","COINBASE_COMMERCE",
    "AUTHORIZE_NET","BRAINTREE","BITPAY","VENMO_BUSINESS","CASHAPP_BUSINESS",
  ] as const,
  INVESTOR_SEATS_MAX: 10,
  PERPETUAL_MOTION_SEATS_MAX: 3,
  REVENUE_BUCKETS: [
    "YouAndINotAI","OnlineRecycle","AI-Solutions","AIDoesItAll",
  ] as const,
});

const WaterfallIn = z.object({ gross: z.number().nonnegative() });

const server = new Server({ name: "dao-mcp", version: "0.1.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: "dao.waterfall_dry_run", description: "Compute the spec's waterfall for a hypothetical gross. READ-ONLY.", inputSchema: { type: "object", properties: { gross: { type: "number" } }, required: ["gross"] } },
    { name: "dao.seats_status",      description: "Return investor + perpetual-motion seat occupancy. Real-or-zero.", inputSchema: { type: "object", properties: {} } },
    { name: "dao.gateway_status",    description: "Return the 9 authorized gateways and their isolation rules.",     inputSchema: { type: "object", properties: {} } },
    { name: "dao.compliance_check",  description: "Surface FL §496.405 framing rules and securities posture.",       inputSchema: { type: "object", properties: {} } },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  if (name === "dao.waterfall_dry_run") {
    const { gross } = WaterfallIn.parse(args);
    const tax_low  = +(gross * SPEC.TAX_RESERVE_RATE_RANGE[0]).toFixed(2);
    const tax_high = +(gross * SPEC.TAX_RESERVE_RATE_RANGE[1]).toFixed(2);
    const charity_per_bucket = +(gross * SPEC.CHARITABLE_FLOOR_PER_BUCKET).toFixed(2);
    const ops_cap  = +(gross * SPEC.OPS_BUDGET_CAP_RATE).toFixed(2);
    return { content: [{ type: "text", text: JSON.stringify({
      illustrative: true, gross,
      tax_reserve: { low: tax_low, high: tax_high, note: "27% sales · up to 40% luxury/commission" },
      charity_per_bucket, charity_max_stacked: +(charity_per_bucket * SPEC.REVENUE_BUCKETS.length).toFixed(2),
      ops_budget_cap: ops_cap,
      remainder_for_investors_and_founder: +(gross - tax_high - charity_per_bucket - ops_cap).toFixed(2),
    }, null, 2) }] };
  }
  if (name === "dao.seats_status") {
    return { content: [{ type: "text", text: JSON.stringify({
      illustrative: true,
      investor_seats: { max: SPEC.INVESTOR_SEATS_MAX, filled: 0, status: "CLOSED · PRE-COUNSEL" },
      perpetual_motion: { max: SPEC.PERPETUAL_MOTION_SEATS_MAX, filled: 0 },
    }, null, 2) }] };
  }
  if (name === "dao.gateway_status") {
    return { content: [{ type: "text", text: JSON.stringify({
      gateways: SPEC.GATEWAYS,
      isolation: { SQUARE_YOUANDINOTAI: "ENIGMA node only · cross-node access rejected by aggregator" },
    }, null, 2) }] };
  }
  if (name === "dao.compliance_check") {
    return { content: [{ type: "text", text: JSON.stringify({
      framing: "FL §496.405 · use 'contractual revenue disbursement' · never 'donation' or 'solicitation'",
      securities: "Investor seats CLOSED until FL-licensed securities counsel clears Reg D 506(b)/506(c) or Reg CF.",
      forced_association: "No AI provider partnership/endorsement is to be claimed publicly. Collaboration on work product only.",
      fabricated_proof: "Disallowed. Every public figure must be real or zero.",
    }, null, 2) }] };
  }
  // Catch-all: refuse any tool that smells like a mutation attempt.
  if (/^dao\.(set|update|delete|create|adjust|override|patch|mutate)/i.test(name)) {
    return { content: [{ type: "text", text: `REFUSED · dao-mcp is read-only · Layer 1 cannot be mutated via MCP.` }] };
  }
  throw new Error(`unknown tool: ${name}`);
});

await server.connect(new StdioServerTransport());
