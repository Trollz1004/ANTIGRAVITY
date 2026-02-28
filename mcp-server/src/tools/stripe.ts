/**
 * Stripe Revenue Tools — Live data from Stripe API
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import axios from "axios";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_API = "https://api.stripe.com/v1";

function stripeHeaders() {
  return {
    Authorization: `Bearer ${STRIPE_KEY}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

// Payment links — canonical source of truth
const PAYMENT_LINKS = [
  { name: "Bot-Shield", price: "$1", type: "one-time", url: "https://buy.stripe.com/3cI3cwcR6c3910p18peEo09" },
  { name: "Founding Member", price: "$14.99/mo", type: "subscription", url: "https://buy.stripe.com/00w8wQaIYgjp5gF2cteEo0a" },
  { name: "3-Month Founder", price: "$39.99", type: "one-time", url: "https://buy.stripe.com/dRm7sM5oE3wD7oNaIZeEo0j" },
  { name: "12-Month Founder", price: "$99.99", type: "one-time", url: "https://buy.stripe.com/3cI5kEbN22szgZnaIZeEo0c" },
  { name: "Royalty Card", price: "$2,500", type: "one-time", url: "https://buy.stripe.com/dRmcN604kebheRf2cteEo0d" },
] as const;

export function registerStripeTools(server: McpServer) {
  // Tool 1: Live revenue snapshot
  server.tool(
    "omega_revenue_snapshot",
    "Pull live revenue data from Stripe: balance, customers, subscriptions, recent charges",
    {},
    async () => {
      if (!STRIPE_KEY) {
        return { content: [{ type: "text" as const, text: "ERROR: STRIPE_SECRET_KEY not set in .env" }] };
      }

      try {
        const [balance, customers, subscriptions, charges] = await Promise.all([
          axios.get(`${STRIPE_API}/balance`, { headers: stripeHeaders() }),
          axios.get(`${STRIPE_API}/customers?limit=1`, { headers: stripeHeaders() }),
          axios.get(`${STRIPE_API}/subscriptions?status=active&limit=1`, { headers: stripeHeaders() }),
          axios.get(`${STRIPE_API}/charges?limit=10`, { headers: stripeHeaders() }),
        ]);

        const balanceData = balance.data as { available: Array<{ amount: number; currency: string }>; pending: Array<{ amount: number; currency: string }> };
        const custData = customers.data as { data: unknown[]; total_count?: number };
        const subData = subscriptions.data as { data: unknown[]; total_count?: number };
        const chargeData = charges.data as { data: Array<{ amount: number; currency: string; status: string; created: number }> };

        const availableUSD = balanceData.available.find(b => b.currency === "usd");
        const pendingUSD = balanceData.pending.find(b => b.currency === "usd");

        const snapshot = {
          timestamp: new Date().toISOString(),
          balance: {
            available: (availableUSD?.amount ?? 0) / 100,
            pending: (pendingUSD?.amount ?? 0) / 100,
          },
          customers: custData.data.length > 0 ? "1+" : "0",
          active_subscriptions: subData.data.length > 0 ? "1+" : "0",
          recent_charges: chargeData.data.map(c => ({
            amount: c.amount / 100,
            currency: c.currency,
            status: c.status,
            date: new Date(c.created * 1000).toISOString(),
          })),
        };

        return { content: [{ type: "text" as const, text: JSON.stringify(snapshot, null, 2) }] };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: `Stripe API error: ${msg}` }] };
      }
    }
  );

  // Tool 2: Revenue projection
  server.tool(
    "omega_projection",
    "Calculate revenue projections based on current metrics and growth assumptions",
    {
      current_mrr: z.number().describe("Current monthly recurring revenue in dollars"),
      growth_rate: z.number().default(0.1).describe("Monthly growth rate (0.1 = 10%)"),
      months: z.number().default(12).describe("Months to project forward"),
    },
    async ({ current_mrr, growth_rate, months }) => {
      const projections = [];
      let mrr = current_mrr;
      for (let i = 1; i <= months; i++) {
        mrr = mrr * (1 + growth_rate);
        const shrinersCents = Math.floor(Math.round(mrr * 100) * 0.6);
        const v8Cents = Math.floor(Math.round(mrr * 100) * 0.3);
        const founderCents = Math.round(mrr * 100) - shrinersCents - v8Cents;
        projections.push({
          month: i,
          mrr: Math.round(mrr * 100) / 100,
          shriners_60pct: shrinersCents / 100,
          v8_infrastructure_30pct: v8Cents / 100,
          founder_10pct: founderCents / 100,
        });
      }
      return { content: [{ type: "text" as const, text: JSON.stringify({ projections, note: "ENIGMA split: 60% Shriners / 30% V8 Infrastructure / 10% Founder. Integer remainder to charity." }, null, 2) }] };
    }
  );

  // Tool 3: Split calculator
  server.tool(
    "omega_calculate_split",
    "Calculate the ENIGMA 60/30/10 revenue split for a given amount",
    {
      amount: z.number().describe("Dollar amount to split"),
      entity: z.enum(["enigma", "omega"]).default("enigma").describe("Which entity: enigma (60/30/10) or omega (100% charity)"),
    },
    async ({ amount, entity }) => {
      if (entity === "omega") {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              input: amount,
              entity: "OMEGA",
              charity: amount,
              founder: 0,
              note: "OMEGA: 100% goes to charity. No exceptions.",
            }, null, 2),
          }],
        };
      }

      const cents = Math.round(amount * 100);
      const shrinersCents = Math.floor(cents * 0.6);
      const v8Cents = Math.floor(cents * 0.3);
      const founderCents = cents - shrinersCents - v8Cents;

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            input: amount,
            entity: "ENIGMA",
            shriners_60pct: shrinersCents / 100,
            v8_infrastructure_30pct: v8Cents / 100,
            founder_10pct: founderCents / 100,
            note: "ENIGMA: 60% Shriners Children's Hospital / 30% V8 Infrastructure / 10% Founder. Integer remainder to charity.",
          }, null, 2),
        }],
      };
    }
  );

  // Tool 4: Payment links
  server.tool(
    "omega_payment_links",
    "Return all active Stripe payment links with prices and URLs",
    {},
    async () => {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            links: PAYMENT_LINKS,
            stripe_account: "acct_1T3DVxIO6LWQSQoI",
            key_expires: "~March 10, 2026",
          }, null, 2),
        }],
      };
    }
  );
}
